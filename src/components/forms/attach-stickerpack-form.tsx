import {useState} from "preact/hooks";
import {apiRequest} from "@/api/backend-api.ts";
import {Button} from "@/components/ui/button.tsx";
import {ConfirmDialog} from "@/components/ui/confirm-dialog.tsx";
import {useMatrix} from "@/contexts/matrix-widget-api-context.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {useStickerPicker} from "@/stores/sticker-picker.tsx";
import type {IStickerpack} from "@/types/stickerpack.ts";
import {buildStickerpackShareRef, parseStickerpackShareInput} from "@/utils/stickerpack-share.ts";
import {loadStickerpack} from "@/utils/stickers.ts";
import {useMatrixUploader} from "@/components/views/manage-stickerpacks/create-stickerpack-view.tsx";

interface ResolveStickerpackResponse {
    status: string;
    stickerpack?: IStickerpack;
    source_ref?: string;
    source_host?: string;
    source_stickerpack?: {
        name: string;
        visibility?: "private" | "public";
        share_id?: string;
        homeserver?: string;
    };
    stickers?: Array<{
        spUid?: string;
        body: string;
        url: string;
        info: any;
        repository?: string;
    }>;
}

export function AttachStickerpackForm() {
    const widget = useMatrix();
    const {uploadViaMatrix} = useMatrixUploader();
    const stickerCollections = useStickerCollections();
    const stickerPicker = useStickerPicker();
    const [shareRef, setShareRef] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [progress, setProgress] = useState<string | null>(null);
    const [pendingImport, setPendingImport] = useState<{
        responseData: ResolveStickerpackResponse;
        resolvedShareRef: string;
    } | null>(null);

    const targetHomeserver = stickerPicker.userData?.matrixUserId?.split(":").slice(1).join(":") ?? "your homeserver";

    const downloadMatrixFile = (mxcUrl: string): Promise<File> => {
        return new Promise((resolve, reject) => {
            const requestId = `mxc-download-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            let timeoutId: number | undefined;

            const cleanup = () => {
                widget.off("org.matrix.msc4039.download_file", handler);
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
            };

            const handler = (event: any) => {
                if (event.action !== "org.matrix.msc4039.download_file" || event.requestId !== requestId) {
                    return;
                }

                if (!event.response?.file) {
                    cleanup();
                    reject(new Error(`Failed to download ${mxcUrl}`));
                    return;
                }

                cleanup();
                resolve(event.response.file);
            };

            widget.on("org.matrix.msc4039.download_file", handler);
            widget.sendMessage({
                api: "fromWidget",
                action: "org.matrix.msc4039.download_file",
                requestId,
                widgetId: widget.widgetId,
                data: {content_uri: mxcUrl, timeout_ms: 20000},
            });

            timeoutId = window.setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out while downloading ${mxcUrl}`));
            }, 20_000);
        });
    };

    const finalizeResolvedStickerpack = async (responseData: ResolveStickerpackResponse) => {
        if (responseData.stickerpack) {
            stickerCollections.addStickerpack(responseData.stickerpack);
            void loadStickerpack(responseData.stickerpack, false, false);
        }

        const successMessage = responseData.status === "already_attached"
            ? "Stickerpack is already in your list"
            : "Stickerpack added";

        setSuccess(successMessage);
        setShareRef("");
    };

    const importRemoteStickerpack = async (responseData: ResolveStickerpackResponse, resolvedShareRef: string) => {
        const sourceStickerpack = responseData.source_stickerpack;
        const stickers = responseData.stickers ?? [];

        if (!sourceStickerpack || stickers.length === 0) {
            throw new Error("Remote stickerpack did not provide import data");
        }

        const uploadedStickers: Array<{ body: string; url: string; info: any }> = [];

        for (const [index, sticker] of stickers.entries()) {
            setProgress(`Downloading ${index + 1}/${stickers.length}`);
            const downloadedFile = await downloadMatrixFile(sticker.url);
            setProgress(`Uploading ${index + 1}/${stickers.length}`);
            const uploadedUrl = await uploadViaMatrix(downloadedFile);

            uploadedStickers.push({
                body: sticker.body || "😀",
                url: uploadedUrl,
                info: {
                    ...sticker.info,
                    mimetype: downloadedFile.type || sticker.info?.mimetype,
                },
            });
        }

        setProgress("Finalizing import...");

        const completeResponse = await apiRequest("user/stickerpack/import/complete", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                share_ref: responseData.source_ref ?? resolvedShareRef,
                source_stickerpack: sourceStickerpack,
                stickers: uploadedStickers,
            }),
        });

        if (completeResponse.status !== 200) {
            const data = await completeResponse.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to complete stickerpack import");
        }

        const completedData: ResolveStickerpackResponse = await completeResponse.json();
        await finalizeResolvedStickerpack(completedData);
    };

    const submit = async (event: Event) => {
        event.preventDefault();
        setError(null);
        setSuccess(null);
        setProgress(null);

        const parsed = parseStickerpackShareInput(shareRef);
        if (!parsed) {
            setError("Paste a valid stickerpack ID or share link");
            return;
        }

        setLoading(true);

        try {
            const resolvedShareRef = parsed.host
                ? buildStickerpackShareRef(parsed.shareId, parsed.host)
                : parsed.shareId;

            setProgress("Resolving stickerpack...");
            const response = await apiRequest("user/stickerpack/resolve", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    share_ref: resolvedShareRef,
                }),
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Failed to add stickerpack");
            }

            const data: ResolveStickerpackResponse = await response.json();
            if (data.status === "requires_import") {
                setPendingImport({
                    responseData: data,
                    resolvedShareRef,
                });
            } else {
                await finalizeResolvedStickerpack(data);
            }

        } catch (submitError: any) {
            setError(submitError?.message ?? "Failed to add stickerpack");
        } finally {
            setLoading(false);
            setProgress(null);
        }
    };

    const confirmImport = async () => {
        if (!pendingImport) {
            return;
        }

        setLoading(true);
        setError(null);

        try {
            await importRemoteStickerpack(pendingImport.responseData, pendingImport.resolvedShareRef);
            setPendingImport(null);
        } catch (submitError: any) {
            setError(submitError?.message ?? "Failed to add stickerpack");
        } finally {
            setLoading(false);
            setProgress(null);
        }
    };

    return (
        <>
            <form onSubmit={submit}>
                <h4>Add stickerpack by ID</h4>
                <div class="field mb-1">
                    <input
                        required
                        class="field__input"
                        placeholder="stpk://host/share-id or raw share id"
                        value={shareRef}
                        onInput={(event: any) => setShareRef(event.target.value)}
                    />
                </div>
                {success ? <div class="color-success mb-1">{success}</div> : null}
                {error ? <div class="color-danger mb-1">{error}</div> : null}
                {progress ? <div class="mb-1">{progress}</div> : null}
                <Button style={"min-width: 220px;"} loading={loading}>
                    Add Stickerpack
                </Button>
            </form>

            <ConfirmDialog
                open={Boolean(pendingImport)}
                title={`Reupload to ${targetHomeserver}?`}
                description="This stickerpack is hosted on another homeserver. To keep it available on your server, we need to download its stickers and upload them to your homeserver before attaching it."
                confirmLabel="Reupload and Add"
                cancelLabel="Cancel"
                loading={loading}
                onCancel={() => {
                    if (loading) {
                        return;
                    }

                    setPendingImport(null);
                    setProgress(null);
                }}
                onConfirm={() => void confirmImport()}
            />
        </>
    );
}
