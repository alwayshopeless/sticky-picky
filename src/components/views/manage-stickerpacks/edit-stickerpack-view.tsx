import {type JSX} from "preact";
import {useEffect, useRef, useState} from "preact/hooks";
import {ChevronLeft, ImagePlus, Loader, Save, Trash2} from "lucide-preact";
import {useLocation, useRoute} from "preact-iso";
import {apiRequest} from "@/api/backend-api.ts";
import {Button} from "@/components/ui/button.tsx";
import {ConfirmDialog} from "@/components/ui/confirm-dialog.tsx";
import {resizeImage, useMatrixUploader} from "@/components/views/manage-stickerpacks/create-stickerpack-view.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {loadStickerpackRaw, useMatrixPreviewUrl} from "@/utils/stickers.ts";

interface StickerOut {
    id: number;
    body: string;
    url: string;
    repository?: string;
    stickerpack_type?: string;
    info?: any;
}

interface AddStickerResponse {
    sticker_id: number;
    sticker: StickerOut;
}

function EditStickerPreview({
    stickerData,
    removeSticker,
    changeStickerBody,
    pending,
}: {
    stickerData: StickerOut;
    removeSticker: (stickerId: number | string) => Promise<void>;
    changeStickerBody: (stickerId: number | string, body: string) => Promise<void>;
    pending: boolean;
}) {
    const {src, loading, error} = useMatrixPreviewUrl(stickerData.url);
    const [body, setBody] = useState<string>(stickerData?.body ?? "");

    useEffect(() => {
        setBody(stickerData?.body ?? "");
    }, [stickerData?.body]);

    return (
        <div class="sticker-editor-card">
            <div class="sticker-editor-card__preview">
                {src && !loading && !error ? (
                    <img
                        src={src ?? undefined}
                        alt="sticker"
                        style={{
                            width: "100px",
                            height: "100px",
                            objectFit: "cover",
                        }}
                    />
                ) : error ? (
                    <div class="stickerpack-manager__empty">Preview unavailable</div>
                ) : (
                    <div class="stickerpack-manager__empty">Loading preview...</div>
                )}
            </div>

            <div class="field">
                <input
                    value={body}
                    type="text"
                    class="field__input"
                    style={{textAlign: "center"}}
                    onChange={(event) => setBody((event.target as HTMLInputElement).value)}
                />
            </div>

            <div class="sticker-editor-card__actions">
                <Button
                    onClick={() => changeStickerBody(stickerData.id, body)}
                    class="btn--flat"
                    disabled={pending || body === stickerData.body}
                >
                    <Save size={14}/>
                    Save Label
                </Button>

                <Button onClick={() => removeSticker(stickerData.id)} class="btn--flat" disabled={pending}>
                    <Trash2 size={14} class="ico color-danger"/>
                    Remove
                </Button>
            </div>
        </div>
    );
}

export function EditStickerpackView(): JSX.Element {
    const stickerpackCollections = useStickerCollections();
    const {route} = useLocation();
    const {params} = useRoute();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const stickerpackId = Number(params?.stickerpackId);
    const currentPack = Number.isFinite(stickerpackId) ? stickerpackCollections.stickerpacks[stickerpackId] : null;
    const [packName, setPackName] = useState(currentPack?.name ?? "");
    const [stickers, setStickers] = useState<StickerOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [savingName, setSavingName] = useState(false);
    const [uploadingStickers, setUploadingStickers] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<string | null>(null);
    const [pendingStickerId, setPendingStickerId] = useState<number | string | null>(null);
    const [deletingPack, setDeletingPack] = useState(false);
    const [confirmDeletePack, setConfirmDeletePack] = useState(false);
    const [stickerToRemove, setStickerToRemove] = useState<StickerOut | null>(null);
    const {uploadViaMatrix} = useMatrixUploader();

    const loadPack = async () => {
        if (!currentPack) {
            setError("Stickerpack not found");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const nextStickers = await loadStickerpackRaw(currentPack, false) ?? [];
            setStickers(nextStickers);
            setPackName(currentPack.name);
        } catch (loadError: any) {
            setError(loadError?.message ?? "Failed to load stickerpack");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadPack();
    }, [stickerpackId]);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files?.length) {
            return;
        }

        setUploadingStickers(true);
        setUploadStatus("Preparing stickers...");
        setError(null);
        const imageFiles = Array.from(files).filter((file) => file.type.startsWith("image/"));

        try {
            for (const [index, file] of imageFiles.entries()) {
                setUploadStatus(`Preparing ${index + 1}/${imageFiles.length}: ${file.name}`);
                const resizedFile = await resizeImage(file);
                setUploadStatus(`Uploading ${index + 1}/${imageFiles.length}: ${file.name}`);
                const mxcUrl = await uploadViaMatrix(resizedFile);
                setUploadStatus(`Saving ${index + 1}/${imageFiles.length}: ${file.name}`);
                const response = await apiRequest(`stickerpacks/${stickerpackId}/stickers/add`, {
                    method: "POST",
                    body: JSON.stringify({
                        body: "😀",
                        url: mxcUrl,
                        info: {
                            mimetype: resizedFile.type,
                        },
                    }),
                    headers: {
                        "Content-Type": "application/json",
                    },
                });

                if (response.status !== 200) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data?.error || "Error adding sticker");
                }

                const data: AddStickerResponse = await response.json();
                setStickers((prev) => [...prev, data.sticker]);
                useStickerCollections.setState((state) => ({
                    stickerpacksData: {
                        ...state.stickerpacksData,
                        [stickerpackId]: [...(state.stickerpacksData[stickerpackId] ?? []), data.sticker],
                    },
                }));
            }

            setUploadStatus("Sticker upload finished");
        } catch (uploadError: any) {
            setError(uploadError?.message ?? "Failed to add sticker");
            setUploadStatus(null);
        } finally {
            setUploadingStickers(false);
            window.setTimeout(() => {
                setUploadStatus((currentStatus) => currentStatus === "Sticker upload finished" ? null : currentStatus);
            }, 1800);
        }
    };

    const removeSticker = async (stickerId: number | string) => {
        setPendingStickerId(stickerId);
        setError(null);

        try {
            const response = await apiRequest(`stickerpacks/${stickerpackId}/stickers/${stickerId}/remove`, {
                method: "DELETE",
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Error removing sticker");
            }

            setStickers((prev) => prev.filter((sticker) => String(sticker.id) !== String(stickerId)));
            useStickerCollections.setState((state) => ({
                stickerpacksData: {
                    ...state.stickerpacksData,
                    [stickerpackId]: (state.stickerpacksData[stickerpackId] ?? []).filter(
                        (sticker: StickerOut) => String(sticker.id) !== String(stickerId),
                    ),
                },
            }));
        } catch (removeError: any) {
            setError(removeError?.message ?? "Failed to remove sticker");
        } finally {
            setPendingStickerId(null);
            setStickerToRemove(null);
        }
    };

    const changeStickerBody = async (stickerId: number | string, body: string) => {
        setPendingStickerId(stickerId);
        setError(null);

        try {
            const response = await apiRequest(`stickerpacks/${stickerpackId}/stickers/${stickerId}/edit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({body}),
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Error updating sticker");
            }

            setStickers((prev) => prev.map((sticker) => (
                String(sticker.id) === String(stickerId) ? {...sticker, body} : sticker
            )));
            useStickerCollections.setState((state) => ({
                stickerpacksData: {
                    ...state.stickerpacksData,
                    [stickerpackId]: (state.stickerpacksData[stickerpackId] ?? []).map((sticker: StickerOut) => (
                        String(sticker.id) === String(stickerId) ? {...sticker, body} : sticker
                    )),
                },
            }));
        } catch (updateError: any) {
            setError(updateError?.message ?? "Failed to update sticker");
        } finally {
            setPendingStickerId(null);
        }
    };

    const savePackName = async () => {
        if (!currentPack) {
            return;
        }

        const trimmedName = packName.trim();
        if (!trimmedName) {
            setError("Stickerpack name cannot be empty");
            return;
        }

        setSavingName(true);
        setError(null);

        try {
            const response = await apiRequest(`stickerpacks/${stickerpackId}/edit`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({name: trimmedName}),
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Error renaming stickerpack");
            }

            stickerpackCollections.updateStickerpack(currentPack.id, {name: trimmedName});
        } catch (saveError: any) {
            setError(saveError?.message ?? "Failed to update stickerpack name");
        } finally {
            setSavingName(false);
        }
    };

    const deletePack = async () => {
        if (!currentPack) {
            return;
        }

        setDeletingPack(true);
        setError(null);

        try {
            const response = await apiRequest(`stickerpacks/${stickerpackId}/delete`, {
                method: "DELETE",
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Error deleting stickerpack");
            }

            stickerpackCollections.removeStickerpack(currentPack.id);
            route("/manage-stickerpacks");
        } catch (deleteError: any) {
            setError(deleteError?.message ?? "Failed to delete stickerpack");
        } finally {
            setDeletingPack(false);
            setConfirmDeletePack(false);
        }
    };

    if (loading) {
        return <div class="view stickerpack-manager__empty">Loading stickerpack...</div>;
    }

    if (!currentPack) {
        return <div class="view stickerpack-manager__empty">Stickerpack not found.</div>;
    }

    return (
        <div class="view stickerpack-editor">
            <ConfirmDialog
                open={confirmDeletePack}
                title={`Delete "${currentPack.name}"?`}
                description="This permanently removes the stickerpack you own."
                confirmLabel="Delete"
                loading={deletingPack}
                onCancel={() => {
                    if (!deletingPack) {
                        setConfirmDeletePack(false);
                    }
                }}
                onConfirm={() => {
                    void deletePack();
                }}
            />
            <ConfirmDialog
                open={Boolean(stickerToRemove)}
                title={stickerToRemove ? `Remove sticker${stickerToRemove.body ? ` ${stickerToRemove.body}` : ""}?` : "Remove sticker?"}
                confirmLabel="Remove"
                loading={stickerToRemove ? pendingStickerId === stickerToRemove.id : false}
                onCancel={() => {
                    if (!pendingStickerId) {
                        setStickerToRemove(null);
                    }
                }}
                onConfirm={() => {
                    if (stickerToRemove) {
                        void removeSticker(stickerToRemove.id);
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
                    <h2>Edit Sticker Pack</h2>
                </button>
            </div>

            <div class="stickerpack-editor__section">
                <label for="edit-stickerpack-name">Pack name</label>
                <div class="stickerpack-editor__name-row">
                    <div class="field flex-1">
                        <input
                            id="edit-stickerpack-name"
                            type="text"
                            value={packName}
                            onChange={(event) => setPackName((event.target as HTMLInputElement).value)}
                            class="field__input"
                        />
                    </div>

                    <Button
                        onClick={savePackName}
                        loading={savingName}
                        disabled={savingName || packName.trim() === currentPack.name}
                    >
                        <Save size={14}/>
                        Save Name
                    </Button>
                </div>
            </div>

            <div class="stickerpack-editor__toolbar">
                <div class="stickerpack-editor__toolbar-actions">
                    <button
                        type="button"
                        class="btn"
                        disabled={uploadingStickers}
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

                    {uploadStatus ? (
                        <div class="stickerpack-editor__inline-status" aria-live="polite">
                            {uploadingStickers ? <Loader size={14} class="rotation" /> : null}
                            <span>{uploadStatus}</span>
                        </div>
                    ) : null}

                    <Button onClick={() => setConfirmDeletePack(true)} loading={deletingPack} class="btn--flat">
                        <Trash2 size={14} class="ico color-danger"/>
                        Delete Pack
                    </Button>
                </div>

                <div class="stickerpack-editor__stats">
                    <div class="stickerpack-editor__stat">Total: {stickers.length}</div>
                </div>
            </div>

            {error ? <div class="color-danger">{error}</div> : null}

            {stickers.length === 0 ? (
                <div class="stickerpack-manager__empty">
                    {uploadingStickers ? "Uploading sticker..." : "This stickerpack is empty for now."}
                </div>
            ) : (
                <div class="sticker-editor-grid">
                    {stickers.map((sticker) => (
                        <EditStickerPreview
                            key={sticker.id}
                            stickerData={sticker}
                            removeSticker={async (stickerId) => {
                                const targetSticker = stickers.find((item) => String(item.id) === String(stickerId)) ?? null;
                                setStickerToRemove(targetSticker);
                            }}
                            changeStickerBody={changeStickerBody}
                            pending={pendingStickerId === sticker.id || uploadingStickers}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
