import {type JSX} from "preact";
import {useEffect, useRef, useState} from "preact/hooks";
import {Check, ChevronLeft, ImagePlus, Loader, Pencil, Trash2} from "lucide-preact";
import {useLocation} from "preact-iso";
import {apiRequest} from "@/api/backend-api.ts";
import {Button} from "@/components/ui/button.tsx";
import {ConfirmDialog} from "@/components/ui/confirm-dialog.tsx";
import {useMatrix} from "@/contexts/matrix-widget-api-context.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {useStickerPicker} from "@/stores/sticker-picker.tsx";

interface CreateStickerDto {
    id: number;
    file: File;
    preview: string;
    emoji: string;
    uploading: boolean;
    uploaded: boolean;
    uploadedPath: string | null;
}

interface CreateStickerpackResponse {
    stickerpack_id: number;
    share_id: string;
}

interface CreatedStickerResponse {
    sticker_id: number;
    sticker: any;
}

export async function resizeImage(file: File, maxSize = 512): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let {width, height} = img;
            const scale = Math.min(maxSize / width, maxSize / height, 1);
            width = Math.round(width * scale);
            height = Math.round(height * scale);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) {
                reject(new Error("Canvas not supported"));
                return;
            }

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) {
                        reject(new Error("Canvas toBlob failed"));
                        return;
                    }

                    resolve(
                        new File([blob], file.name.replace(/\.[^.]+$/, "") + ".webp", {
                            type: "image/webp",
                        }),
                    );
                },
                "image/webp",
                0.9,
            );
        };
        img.onerror = (error) => reject(error);
        img.src = URL.createObjectURL(file);
    });
}

export function useMatrixUploader() {
    const widget = useMatrix();

    const uploadViaMatrix = (file: File, timeoutMs = 60_000): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!widget) {
                reject(new Error("Matrix widget is not available"));
                return;
            }

            const requestId = `mxc-request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            let timeoutId: number | undefined;

            const cleanup = () => {
                // @ts-ignore emitter compatibility
                if (typeof widget.off === "function") widget.off("org.matrix.msc4039.upload_file", onResp);
                // @ts-ignore emitter compatibility
                if (typeof widget.removeListener === "function") widget.removeListener("org.matrix.msc4039.upload_file", onResp);
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
            };

            const onResp = (event: any) => {
                if (!event || event.requestId !== requestId) {
                    return;
                }

                const uri = event?.response?.content_uri;
                if (uri && typeof uri === "string") {
                    cleanup();
                    resolve(uri);
                    return;
                }

                if (event?.response?.error) {
                    cleanup();
                    reject(new Error(event.response.error));
                }
            };

            // @ts-ignore emitter compatibility
            widget.on("org.matrix.msc4039.upload_file", onResp);

            widget.sendMessage({
                api: "fromWidget",
                action: "org.matrix.msc4039.upload_file",
                requestId,
                widgetId: widget.widgetId,
                data: {file},
            });

            timeoutId = window.setTimeout(() => {
                cleanup();
                reject(new Error("Matrix upload timed out"));
            }, timeoutMs);
        });
    };

    return {uploadViaMatrix};
}

function StickerDraftCard({
    sticker,
    onEmojiChange,
    onReplace,
    onRemove,
}: {
    sticker: CreateStickerDto;
    onEmojiChange: (id: number, emoji: string) => void;
    onReplace: (id: number, file: File) => Promise<void>;
    onRemove: (id: number) => void;
}) {
    return (
        <div class="sticker-editor-card">
            <div class="sticker-editor-card__status">
                {sticker.uploaded ? <Check size={16} class="color-success"/> : null}
                {sticker.uploading ? <Loader size={16} class="rotation"/> : null}
            </div>

            <div class="sticker-editor-card__preview">
                <img
                    src={sticker.preview}
                    alt="Sticker preview"
                    style={{
                        width: "100px",
                        height: "100px",
                        objectFit: "cover",
                        opacity: sticker.uploading ? 0.6 : 1,
                    }}
                />
            </div>

            <div class="field">
                <input
                    type="text"
                    value={sticker.emoji}
                    onChange={(event) => onEmojiChange(sticker.id, (event.target as HTMLInputElement).value)}
                    placeholder="😀"
                    class="field__input"
                    style={{textAlign: "center"}}
                />
            </div>

            <div class="sticker-editor-card__actions">
                <label class="btn btn--flat">
                    <Pencil size={14}/>
                    Replace
                    <input
                        type="file"
                        accept="image/*"
                        style={{display: "none"}}
                        onChange={(event) => {
                            const file = (event.target as HTMLInputElement).files?.[0];
                            if (file) {
                                void onReplace(sticker.id, file);
                            }
                            (event.target as HTMLInputElement).value = "";
                        }}
                    />
                </label>

                <Button onClick={() => onRemove(sticker.id)} class="btn--flat">
                    <Trash2 size={14} class="ico color-danger"/>
                    Remove
                </Button>
            </div>
        </div>
    );
}

export function CreateStickerpackView({token}: { token?: string }): JSX.Element {
    const [packName, setPackName] = useState("");
    const [stickers, setStickers] = useState<CreateStickerDto[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [submitStage, setSubmitStage] = useState<string | null>(null);
    const [stickerToRemove, setStickerToRemove] = useState<CreateStickerDto | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stickersRef = useRef<CreateStickerDto[]>([]);
    const stickerCollections = useStickerCollections();
    const stickerPicker = useStickerPicker();
    const {route} = useLocation();
    const {uploadViaMatrix} = useMatrixUploader();

    useEffect(() => {
        stickersRef.current = stickers;
    }, [stickers]);

    useEffect(() => {
        return () => {
            stickersRef.current.forEach((sticker) => {
                URL.revokeObjectURL(sticker.preview);
            });
        };
    }, []);

    const handleFileSelect = async (files: FileList | null): Promise<void> => {
        if (!files?.length) {
            return;
        }

        setError(null);
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            if (!file.type.startsWith("image/")) {
                continue;
            }

            const resizedFile = await resizeImage(file);
            const preview = URL.createObjectURL(resizedFile);

            setStickers((prev) => [
                ...prev,
                {
                    id: Date.now() + Math.random(),
                    file: resizedFile,
                    preview,
                    emoji: "😀",
                    uploading: false,
                    uploaded: false,
                    uploadedPath: null,
                },
            ]);
        }
    };

    const updateStickerEmoji = (stickerId: number, emoji: string) => {
        setStickers((prev) => prev.map((sticker) => (
            sticker.id === stickerId ? {...sticker, emoji} : sticker
        )));
    };

    const replaceSticker = async (stickerId: number, newFile: File) => {
        if (!newFile.type.startsWith("image/")) {
            return;
        }

        const resizedFile = await resizeImage(newFile);
        const preview = URL.createObjectURL(resizedFile);

        setStickers((prev) => prev.map((sticker) => {
            if (sticker.id !== stickerId) {
                return sticker;
            }

            URL.revokeObjectURL(sticker.preview);
            return {
                ...sticker,
                file: resizedFile,
                preview,
                uploading: false,
                uploaded: false,
                uploadedPath: null,
            };
        }));
    };

    const removeSticker = (stickerId: number) => {
        setStickers((prev) => {
            const sticker = prev.find((item) => item.id === stickerId);
            if (sticker) {
                URL.revokeObjectURL(sticker.preview);
            }

            return prev.filter((item) => item.id !== stickerId);
        });
    };

    const handleSubmit = async () => {
        const trimmedPackName = packName.trim();

        if (!trimmedPackName) {
            setError("Enter a stickerpack name");
            return;
        }

        if (stickers.length === 0) {
            setError("Add at least one sticker");
            return;
        }

        setSubmitting(true);
        setError(null);
        setSuccess(null);
        setSubmitStage("Creating stickerpack...");

        try {
            if (!stickerPicker.userData?.token && !token) {
                throw new Error("Missing auth token");
            }

            const response = await apiRequest("stickerpacks/create", {
                method: "POST",
                body: JSON.stringify({
                    name: trimmedPackName,
                    type: "matrix_mxc",
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token ?? stickerPicker.userData?.token ?? ""}`,
                },
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || data?.message || "Error creating sticker pack");
            }

            const createdPackData: CreateStickerpackResponse = await response.json();
            const stickerpackId = createdPackData.stickerpack_id;
            const uploadedResults: CreateStickerDto[] = [];
            const createdStickers: any[] = [];

            try {
                setSubmitStage("Uploading stickers...");

                for (const sticker of stickers.filter((item) => !item.uploaded)) {
                    setStickers((prev) => prev.map((item) => (
                        item.id === sticker.id ? {...item, uploading: true} : item
                    )));

                    const uploadedPath = await uploadViaMatrix(sticker.file);
                    const uploadedSticker = {
                        ...sticker,
                        uploading: false,
                        uploaded: true,
                        uploadedPath,
                    };

                    uploadedResults.push(uploadedSticker);
                    setStickers((prev) => prev.map((item) => (
                        item.id === sticker.id ? uploadedSticker : item
                    )));
                }

                const finalStickers = stickers.map((sticker) => (
                    uploadedResults.find((item) => item.id === sticker.id) ?? sticker
                ));

                setSubmitStage("Saving stickers...");

                for (const sticker of finalStickers) {
                    const addResponse = await apiRequest(`stickerpacks/${stickerpackId}/stickers/add`, {
                        method: "POST",
                        body: JSON.stringify({
                            body: sticker.emoji || "😀",
                            url: sticker.uploadedPath,
                            info: {
                                mimetype: sticker.file.type,
                            },
                        }),
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token ?? stickerPicker.userData?.token ?? ""}`,
                        },
                    });

                    if (addResponse.status !== 200) {
                        const addData = await addResponse.json().catch(() => ({}));
                        throw new Error(addData?.error || "Error adding sticker to sticker pack");
                    }

                    const addData: CreatedStickerResponse = await addResponse.json();
                    createdStickers.push(addData.sticker);
                }
            } catch (uploadError) {
                await apiRequest(`stickerpacks/${stickerpackId}/delete`, {
                    method: "DELETE",
                }).catch(() => null);
                throw uploadError;
            }

            const homeserver = stickerPicker.userData?.matrixUserId?.split(":").slice(1).join(":") ?? "matrix.local";
                const createdPack = {
                    id: stickerpackId,
                    stickerpack_id: stickerpackId,
                    name: trimmedPackName,
                    internal_name: `matrix-mxc-${stickerpackId}`,
                    homeserver: `https://${homeserver}`,
                    repository: `matrix-mxc://${homeserver}/`,
                    type: "matrix_mxc",
                    owner_user_id: stickerPicker.userData?.backendUserId ?? null,
                    visibility: "private" as const,
                    share_id: createdPackData.share_id,
                };

            stickerCollections.addStickerpack(createdPack);
            useStickerCollections.setState((state) => ({
                stickerpacksData: {
                    ...state.stickerpacksData,
                    [stickerpackId]: createdStickers,
                },
                lastStickerpacksLoad: Date.now(),
            }));

            setSuccess("Sticker pack created");
            setSubmitStage(null);
            route(`/edit-stickerpack/${stickerpackId}`);
        } catch (submitError: any) {
            setError(submitError?.message || "Error creating sticker pack");
            setSubmitStage(null);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div class="view stickerpack-editor">
            <ConfirmDialog
                open={Boolean(stickerToRemove)}
                title={stickerToRemove ? `Remove sticker${stickerToRemove.emoji ? ` ${stickerToRemove.emoji}` : ""}?` : "Remove sticker?"}
                confirmLabel="Remove"
                onCancel={() => setStickerToRemove(null)}
                onConfirm={() => {
                    if (stickerToRemove) {
                        removeSticker(stickerToRemove.id);
                        setStickerToRemove(null);
                    }
                }}
            />
            <div class="stickerpack-editor__header">
                <button
                    type="button"
                    class="stickerpack-header-back"
                    onClick={() => route("/manage-stickerpacks")}
                >
                    <ChevronLeft size={18} />
                    <h2>Create Sticker Pack</h2>
                </button>
            </div>

            <div class="stickerpack-editor__section">
                <label for="stickerpack-name">Pack name</label>
                <div class="field">
                    <input
                        id="stickerpack-name"
                        type="text"
                        value={packName}
                        onChange={(event) => setPackName((event.target as HTMLInputElement).value)}
                        placeholder="My best stickers"
                        class="field__input"
                    />
                </div>
            </div>

            <div class="stickerpack-editor__toolbar">
                <div class="stickerpack-editor__toolbar-actions">
                    <button
                        type="button"
                        class="btn"
                        disabled={submitting}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <ImagePlus size={14}/>
                        Add Stickers
                    </button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        style={{display: "none"}}
                        onChange={(event) => {
                            void handleFileSelect((event.target as HTMLInputElement).files);
                            (event.target as HTMLInputElement).value = "";
                        }}
                    />

                    {submitting && submitStage ? (
                        <div class="stickerpack-editor__inline-status" aria-live="polite">
                            <Loader size={14} class="rotation" />
                            <span>{submitStage}</span>
                        </div>
                    ) : null}
                </div>

                <div class="stickerpack-editor__stats">
                    <div class="stickerpack-editor__stat">Total: {stickers.length}</div>
                </div>
            </div>

            {error ? <div class="color-danger">{error}</div> : null}
            {success ? <div class="color-success">{success}</div> : null}

            {stickers.length === 0 ? (
                <div class="stickerpack-manager__empty">Add a few sticker images to start the pack.</div>
            ) : (
                <div class="sticker-editor-grid">
                    {stickers.map((sticker) => (
                        <StickerDraftCard
                            key={sticker.id}
                            sticker={sticker}
                            onEmojiChange={updateStickerEmoji}
                            onReplace={replaceSticker}
                            onRemove={(stickerId) => {
                                const targetSticker = stickers.find((item) => item.id === stickerId) ?? null;
                                setStickerToRemove(targetSticker);
                            }}
                        />
                    ))}
                </div>
            )}

            <div class="stickerpack-editor__footer">
                <Button
                    onClick={handleSubmit}
                    loading={submitting}
                    disabled={submitting || !packName.trim() || stickers.length === 0}
                >
                    Create Sticker Pack
                </Button>
            </div>
        </div>
    );
}
