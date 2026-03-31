import { useEffect, useState } from "preact/hooks";
import { ChevronLeft, Copy, GitFork, Pencil, Plus, Trash2, X } from "lucide-preact";
import { useLocation } from "preact-iso";
import { apiRequest } from "@/api/backend-api.ts";
import { Button } from "@/components/ui/button.tsx";
import { ConfirmDialog } from "@/components/ui/confirm-dialog.tsx";
import { useMatrixUploader } from "@/components/views/manage-stickerpacks/create-stickerpack-view.tsx";
import { useMatrix } from "@/contexts/matrix-widget-api-context.tsx";
import { ExtraLayout } from "@/layouts/extra-layout.tsx";
import { useStickerCollections } from "@/stores/sticker-collections.tsx";
import { useStickerPicker } from "@/stores/sticker-picker.tsx";
import type { IStickerpack } from "@/types/stickerpack.ts";
import { BACKEND_URL } from "@/config/main.ts";
import { buildStickerpackShareLink } from "@/utils/stickerpack-share.ts";

const MAX_FORK_TIMEOUT_MS = 180_000;

type ForkProgressState = {
    stage: string;
    current?: number;
    total?: number;
    label?: string;
};

function isEditableStickerpack(stickerpack: IStickerpack, currentUserId?: number | null) {
    if (currentUserId == null || currentUserId <= 0) {
        return false;
    }

    const isMatrixBackedStickerpack = stickerpack.type === "user_owned" || stickerpack.type === "matrix_mxc";
    return isMatrixBackedStickerpack && stickerpack.owner_user_id === currentUserId;
}

function formatShareId(shareId?: string) {
    if (!shareId) {
        return "";
    }

    if (shareId.length <= 16) {
        return shareId;
    }

    return `${shareId.slice(0, 8)}...${shareId.slice(-4)}`;
}

function formatStickerpackKind(stickerpack: IStickerpack) {
    if (stickerpack.type === "maunium") {
        return "maunium";
    }

    if (stickerpack.type === "matrix_mxc" || stickerpack.type === "user_owned") {
        return "mxc";
    }

    return stickerpack.type;
}

function StickerpackCard({
    stickerpack,
    onDelete,
    onFork,
    onCopyShareLink,
    deleting,
    forking,
    currentUserId,
}: {
    stickerpack: IStickerpack;
    onDelete: (stickerpack: IStickerpack) => Promise<void>;
    onFork: (stickerpack: IStickerpack) => Promise<void>;
    onCopyShareLink: (stickerpack: IStickerpack) => Promise<void>;
    deleting: boolean;
    forking: boolean;
    currentUserId?: number | null;
}) {
    const { route } = useLocation();
    const editable = isEditableStickerpack(stickerpack, currentUserId);
    const forkable = !editable && (
        stickerpack.type === "matrix_mxc"
        || stickerpack.type === "user_owned"
        || stickerpack.type === "maunium"
    );
    const canShare = Boolean(stickerpack.share_id);

    const handleDeleteClick = (event: Event) => {
        event.preventDefault();
        event.stopPropagation();
        void onDelete(stickerpack);
    };

    return (
        <div class="stickerpack-manager-card">
            <div class="stickerpack-manager-card__content">
                <div class="stickerpack-manager-card__title">{stickerpack.name}</div>
                <div class="stickerpack-manager-card__meta">
                    <div>{formatStickerpackKind(stickerpack)}</div>
                    {canShare ? (
                        <>
                            <div>
                                {formatShareId(stickerpack.share_id)}
                            </div>
                            <button
                                type="button"
                                class="stickerpack-manager-card__share"
                                onClick={() => void onCopyShareLink(stickerpack)}
                                title="Copy stickerpack share link"
                            >
                                Share link <Copy size={13} />
                            </button>
                        </>
                    ) : null}
                </div>
            </div>

            <div class="stickerpack-manager-card__actions">
                {editable ? (
                    <Button
                        onClick={() => route(`/edit-stickerpack/${stickerpack.id}`)}
                        class="btn--flat"
                    >
                        <Pencil size={14} />
                        Edit
                    </Button>
                ) : null}

                {forkable ? (
                    <Button
                        onClick={() => void onFork(stickerpack)}
                        class="btn--flat"
                        loading={forking}
                    >
                        <GitFork size={14} />
                        Fork
                    </Button>
                ) : null}

                <button
                    type="button"
                    onClick={handleDeleteClick}
                    onPointerUp={handleDeleteClick}
                    class="btn btn--flat"
                    disabled={deleting}
                    title="Delete stickerpack"
                    style={{
                        padding: "10px",
                        pointerEvents: "auto",
                    }}
                >
                    <Trash2 size={14} class="ico color-danger" />
                </button>
            </div>
        </div>
    );
}

export function StickerpacksList() {
    const stickerPicker = useStickerPicker();
    const targetHomeserver = stickerPicker?.userData?.matrixUserId?.split(":").slice(1).join(":") ?? "your homeserver";
    const widget = useMatrix();
    const { uploadViaMatrix } = useMatrixUploader();
    const stickerCollections = useStickerCollections();
    const { route } = useLocation();
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [pendingStickerpackId, setPendingStickerpackId] = useState<number | null>(null);
    const [forkingStickerpackId, setForkingStickerpackId] = useState<number | null>(null);
    const [pendingForkStickerpack, setPendingForkStickerpack] = useState<IStickerpack | null>(null);
    const [forkProgress, setForkProgress] = useState<ForkProgressState | null>(null);
    const [forkTimeoutMs, setForkTimeoutMs] = useState(120_000);
    const [forkStepStartedAt, setForkStepStartedAt] = useState<number | null>(null);
    const [showExtendForkTimeout, setShowExtendForkTimeout] = useState(false);
    const [forkCancelRequested, setForkCancelRequested] = useState(false);
    const [syncingMeta, setSyncingMeta] = useState(false);
    const [confirmDeleteStickerpack, setConfirmDeleteStickerpack] = useState<IStickerpack | null>(null);

    const getCorsProxyUrl = (targetUrl: string) => {
        const parsedBackendUrl = new URL(BACKEND_URL);
        return `https://${parsedBackendUrl.hostname}/cors/${targetUrl}`;
    };

    const downloadMatrixFile = (mxcUrl: string, timeoutMs: number): Promise<File> => {
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
                data: {content_uri: mxcUrl, timeout_ms: timeoutMs},
            });

            timeoutId = window.setTimeout(() => {
                cleanup();
                reject(new Error(`Timed out while downloading ${mxcUrl}`));
            }, timeoutMs);
        });
    };

    const resolveMauniumStickerUrl = (stickerpack: IStickerpack, stickerUrl?: string) => {
        if (!stickerUrl) {
            return null;
        }

        if (stickerUrl.startsWith("mxc://") || stickerUrl.startsWith("http://") || stickerUrl.startsWith("https://")) {
            return stickerUrl;
        }

        const normalizedRepository = stickerpack.repository.replace(/\/+$/, "");
        return `${normalizedRepository}/packs/${stickerUrl.replace(/^\/+/, "")}`;
    };

    const beginForkStep = (progress: ForkProgressState) => {
        setForkProgress(progress);
        setForkStepStartedAt(Date.now());
        setShowExtendForkTimeout(false);
    };

    const ensureForkNotCancelled = () => {
        if (forkCancelRequested) {
            throw new Error("Fork cancelled");
        }
    };

    const forkMauniumStickerpack = async (stickerpack: IStickerpack) => {
        beginForkStep({stage: "Loading pack"});
        const packResponse = await fetch(getCorsProxyUrl(`${stickerpack.repository.replace(/\/+$/, "")}/packs/${stickerpack.internal_name}`));
        if (!packResponse.ok) {
            throw new Error("Failed to load Maunium stickerpack");
        }

        const packJson = await packResponse.json();
        const stickers = Array.isArray(packJson?.stickers) ? packJson.stickers : [];
        if (stickers.length === 0) {
            throw new Error("Maunium stickerpack does not contain stickers");
        }

        if (stickers.length > 250) {
            throw new Error("Stickerpack is too large to fork right now. Maximum supported size is 250 stickers.");
        }

        beginForkStep({stage: "Creating fork"});
        const createResponse = await apiRequest("stickerpacks/create", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                name: `${stickerpack.name} (Fork)`,
                type: "user_owned",
                visibility: "private",
            }),
        });

        if (createResponse.status !== 200) {
            const data = await createResponse.json().catch(() => ({}));
            throw new Error(data?.error || "Failed to create fork");
        }

        const createdPackData = await createResponse.json();
        const createdPackId = Number(createdPackData?.stickerpack_id);
        if (!Number.isFinite(createdPackId) || createdPackId < 1) {
            throw new Error("Forked stickerpack was created without an id");
        }

        const createdPack: IStickerpack = {
            ...stickerpack,
            id: createdPackId,
            name: `${stickerpack.name} (Fork)`,
            type: "user_owned",
            repository: `matrix-mxc://${stickerPicker.userData?.matrixUserId?.split(":").slice(1).join(":") ?? "matrix.local"}/`,
            homeserver: `https://${stickerPicker.userData?.matrixUserId?.split(":").slice(1).join(":") ?? "matrix.local"}`,
            owner_user_id: stickerPicker.userData?.backendUserId ?? null,
            visibility: "private",
            share_id: createdPackData?.share_id,
            parent_ref: null,
            parent_share_id: null,
            parent_media_homeserver: null,
            source_aggregator_host: null,
            import_target_homeserver: null,
        };

        try {
            for (const [index, sticker] of stickers.entries()) {
                ensureForkNotCancelled();
                const sourceUrl = resolveMauniumStickerUrl(stickerpack, sticker.url);
                if (!sourceUrl) {
                    continue;
                }

                beginForkStep({
                    stage: "Downloading",
                    current: index + 1,
                    total: stickers.length,
                    label: sticker.body || "sticker",
                });
                if (!sourceUrl.startsWith("mxc://")) {
                    throw new Error("Only Maunium stickerpacks with mxc:// sticker URLs can be forked right now.");
                }

                const downloadedFile = await downloadMatrixFile(sourceUrl, forkTimeoutMs);
                ensureForkNotCancelled();

                beginForkStep({
                    stage: "Uploading",
                    current: index + 1,
                    total: stickers.length,
                    label: sticker.body || "sticker",
                });
                const uploadedUrl = await uploadViaMatrix(downloadedFile, forkTimeoutMs);
                ensureForkNotCancelled();

                beginForkStep({
                    stage: "Saving",
                    current: index + 1,
                    total: stickers.length,
                    label: sticker.body || "sticker",
                });
                const addResponse = await apiRequest(`stickerpacks/${createdPackId}/stickers/add`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        body: sticker.body || "😀",
                        url: uploadedUrl,
                        info: {
                            ...(sticker.info ?? {}),
                            mimetype: downloadedFile.type || sticker.info?.mimetype,
                        },
                    }),
                });

                if (addResponse.status !== 200) {
                    const data = await addResponse.json().catch(() => ({}));
                    throw new Error(data?.error || "Failed to add forked sticker");
                }
            }
        } catch (error) {
            await apiRequest(`stickerpacks/${createdPackId}/delete`, {
                method: "DELETE",
            }).catch(() => null);
            throw error;
        }

        setForkProgress(null);
        setForkStepStartedAt(null);
        stickerCollections.addStickerpack(createdPack);
        setSuccess(`Forked "${stickerpack.name}"`);
        route(`/edit-stickerpack/${createdPackId}`);
    };

    useEffect(() => {
        if (!stickerPicker.userData?.token) {
            return;
        }

        const syncStickerpacksMeta = async () => {
            setSyncingMeta(true);

            try {
                const response = await apiRequest("user/stickerpacks", {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${stickerPicker.userData?.token ?? ""}`,
                    },
                });

                if (response.status !== 200) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data?.error || "Failed to refresh stickerpacks");
                }

                const data = await response.json();
                const refreshedStickerpacks = data?.stickerpacks ?? [];
                const refreshedStickerpackIds = refreshedStickerpacks.map((item: IStickerpack) => item.stickerpack_id);
                const currentUserId = Number(data?.user_id);

                if (Number.isFinite(currentUserId) && currentUserId > 0 && stickerPicker.userData) {
                    stickerPicker.setUserData({
                        ...stickerPicker.userData,
                        backendUserId: currentUserId,
                    });
                }

                stickerCollections.setStickerpacks(refreshedStickerpacks);
                stickerCollections.setSavedStickerpacks(refreshedStickerpackIds);
            } catch (syncError: any) {
                setError(syncError?.message ?? "Failed to refresh stickerpacks");
            } finally {
                setSyncingMeta(false);
            }
        };

        void syncStickerpacksMeta();
    }, [stickerPicker.userData?.token]);

    useEffect(() => {
        if (!success) {
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setSuccess(null);
        }, 2200);

        return () => window.clearTimeout(timeoutId);
    }, [success]);

    useEffect(() => {
        if (!forkingStickerpackId || !forkStepStartedAt) {
            setShowExtendForkTimeout(false);
            return;
        }

        const timeoutId = window.setTimeout(() => {
            setShowExtendForkTimeout(true);
        }, Math.max(1_000, Math.floor(forkTimeoutMs / 2)));

        return () => window.clearTimeout(timeoutId);
    }, [forkingStickerpackId, forkStepStartedAt, forkTimeoutMs]);

    const removeStickerpackFromServer = async (stickerpack: IStickerpack) => {
        stickerCollections.removeStickerpack(stickerpack.id);

        try {
            const response = await apiRequest("user/stickerpack/detach", {
                method: "POST",
                body: JSON.stringify({ stickerpack_id: stickerpack.id }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${stickerPicker?.userData?.token ?? ""}`,
                },
            });

            if (response.status !== 200) {
                stickerCollections.addStickerpack(stickerpack);
                throw new Error("Failed to detach stickerpack");
            }
        } catch (removeError: any) {
            setError(removeError?.message ?? "Failed to detach stickerpack");
        }
    };

    const deleteStickerpack = async (stickerpack: IStickerpack) => {
        setError(null);
        setPendingStickerpackId(stickerpack.id);

        try {
            if (isEditableStickerpack(stickerpack, stickerPicker.userData?.backendUserId)) {
                const response = await apiRequest(`stickerpacks/${stickerpack.id}/delete`, {
                    method: "DELETE",
                });

                if (response.status !== 200) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data?.error || "Failed to remove stickerpack");
                }

                stickerCollections.removeStickerpack(stickerpack.id);
            } else {
                await removeStickerpackFromServer(stickerpack);
            }
        } catch (deleteError: any) {
            setError(deleteError?.message ?? "Failed to remove stickerpack");
        } finally {
            setPendingStickerpackId(null);
            setConfirmDeleteStickerpack(null);
        }
    };

    const copyShareLink = async (stickerpack: IStickerpack) => {
        if (!stickerpack.share_id) {
            setError("This stickerpack does not have a share ID yet");
            return;
        }

        try {
            await navigator.clipboard.writeText(buildStickerpackShareLink(stickerpack.share_id));
            setSuccess(`Copied share link for "${stickerpack.name}"`);
            setError(null);
        } catch {
            setError("Failed to copy stickerpack share link");
        }
    };

    const forkStickerpack = async (stickerpack: IStickerpack) => {
        setError(null);
        setPendingForkStickerpack(null);
        setForkCancelRequested(false);
        setForkingStickerpackId(stickerpack.id);

        try {
            if (stickerpack.type === "maunium") {
                await forkMauniumStickerpack(stickerpack);
                return;
            }

            const response = await apiRequest(`stickerpacks/${stickerpack.id}/fork`, {
                method: "POST",
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || "Failed to fork stickerpack");
            }

            const data = await response.json();
            if (data?.stickerpack) {
                stickerCollections.addStickerpack(data.stickerpack);
                setSuccess(`Forked "${stickerpack.name}"`);
                route(`/edit-stickerpack/${data.stickerpack.id}`);
            }
        } catch (forkError: any) {
            if (forkError?.message === "Fork cancelled") {
                setSuccess("Fork cancelled");
                setError(null);
            } else {
                setError(forkError?.message ?? "Failed to fork stickerpack");
            }
        } finally {
            setForkProgress(null);
            setForkStepStartedAt(null);
            setShowExtendForkTimeout(false);
            setForkCancelRequested(false);
            setForkingStickerpackId(null);
        }
    };

    const requestForkStickerpack = async (stickerpack: IStickerpack) => {
        if (stickerpack.type === "maunium") {
            setPendingForkStickerpack(stickerpack);
            return;
        }

        await forkStickerpack(stickerpack);
    };

    const currentStickerpacks = stickerCollections.getStickerpacksArray();

    return (
            <div class="view stickerpack-manager">
            <ConfirmDialog
                open={Boolean(pendingForkStickerpack)}
                title={pendingForkStickerpack ? `Fork to ${targetHomeserver}?` : "Fork stickerpack?"}
                description="This Maunium stickerpack will be downloaded and reuploaded to your homeserver, so the fork becomes local and fully editable."
                confirmLabel="Fork and Reupload"
                cancelLabel="Cancel"
                loading={Boolean(pendingForkStickerpack && forkingStickerpackId === pendingForkStickerpack.id)}
                onCancel={() => {
                    if (!forkingStickerpackId) {
                        setPendingForkStickerpack(null);
                    }
                }}
                onConfirm={() => {
                    if (pendingForkStickerpack) {
                        void forkStickerpack(pendingForkStickerpack);
                    }
                }}
            />
            <ConfirmDialog
                open={Boolean(confirmDeleteStickerpack)}
                title={confirmDeleteStickerpack ? `Remove "${confirmDeleteStickerpack.name}"?` : "Remove stickerpack?"}
                description="The stickerpack will be removed from your list. Packs you own will be deleted."
                confirmLabel="Remove"
                loading={confirmDeleteStickerpack ? pendingStickerpackId === confirmDeleteStickerpack.id : false}
                onCancel={() => {
                    if (!pendingStickerpackId) {
                        setConfirmDeleteStickerpack(null);
                    }
                }}
                onConfirm={() => {
                    if (confirmDeleteStickerpack) {
                        void deleteStickerpack(confirmDeleteStickerpack);
                    }
                }}
            />
            {forkingStickerpackId ? (
                <div class="confirm-dialog-backdrop">
                    <div class="confirm-dialog" onClick={(event) => event.stopPropagation()}>
                        <h3 class="confirm-dialog__title">Forking stickerpack</h3>
                        {forkProgress ? (
                            <>
                                <p class="confirm-dialog__description">
                                    {forkProgress.stage}
                                    {forkProgress.current && forkProgress.total
                                        ? ` ${forkProgress.current}/${forkProgress.total}`
                                        : ""}
                                </p>
                                {forkProgress.label ? (
                                    <p class="confirm-dialog__description">
                                        {forkProgress.label}
                                    </p>
                                ) : null}
                            </>
                        ) : null}
                        <p class="confirm-dialog__description">
                            Timeout per download or upload: {Math.round(forkTimeoutMs / 1000)}s
                        </p>
                        {showExtendForkTimeout ? (
                            forkTimeoutMs < MAX_FORK_TIMEOUT_MS ? (
                                <div class="confirm-dialog__actions">
                                    <Button
                                        class="btn--flat"
                                        onClick={() => setForkTimeoutMs((current) => Math.min(current + 60_000, MAX_FORK_TIMEOUT_MS))}
                                    >
                                        Increase to {Math.round(Math.min(forkTimeoutMs + 60_000, MAX_FORK_TIMEOUT_MS) / 1000)}s
                                    </Button>
                                </div>
                            ) : (
                                <p class="confirm-dialog__description color-danger">
                                    The server cannot provide sticker data fast enough. Forking is not recommended for this stickerpack.
                                </p>
                            )
                        ) : null}
                        <div class="confirm-dialog__actions">
                            <Button
                                class="btn--flat"
                                disabled={forkCancelRequested}
                                onClick={() => {
                                    setForkCancelRequested(true);
                                    setForkProgress({
                                        stage: "Cancelling",
                                        label: "Waiting for the current step to finish...",
                                    });
                                }}
                            >
                                {forkCancelRequested ? "Cancelling..." : "Cancel"}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
            <div class="stickerpack-manager__header">
                <button
                    type="button"
                    class="stickerpack-header-back"
                    onClick={() => route("/settings")}
                >
                    <ChevronLeft size={18} />
                    <h2>Manage Stickerpacks</h2>
                </button>
            </div>

            <div>
                <Button onClick={() => route("/create-stickerpack")}>
                    <Plus size={14} />
                    Create
                </Button>
            </div>

            {syncingMeta ? <div>Refreshing stickerpack info...</div> : null}
            {error ? <div class="color-danger">{error}</div> : null}
            {success ? <div class="stickerpack-manager__toast">{success}</div> : null}

            {currentStickerpacks.length === 0 ? (
                <div class="stickerpack-manager__empty">
                    <X size={16} />
                    No stickerpacks yet.
                </div>
            ) : (
                <div class="stickerpack-manager__list">
                    {currentStickerpacks.map((stickerpack) => (
                        <StickerpackCard
                            key={stickerpack.id}
                            stickerpack={stickerpack}
                            onDelete={async (pack) => {
                                setConfirmDeleteStickerpack(pack);
                            }}
                            onFork={requestForkStickerpack}
                            onCopyShareLink={copyShareLink}
                            deleting={pendingStickerpackId === stickerpack.id}
                            forking={forkingStickerpackId === stickerpack.id}
                            currentUserId={stickerPicker.userData?.backendUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export function ManageStickerpacks() {
    return (
        <ExtraLayout>
            <StickerpacksList />
        </ExtraLayout>
    );
}
