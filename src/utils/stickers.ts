import type { IStickerpack } from "../types/stickerpack.ts";
import { useStickerCollections } from "../stores/sticker-collections.tsx";
import { BACKEND_URL } from "../config/main.ts";
import { apiRequest } from "@/api/backend-api.ts";
import { useEffect, useState } from "preact/hooks";
import { useMatrix } from "../contexts/matrix-widget-api-context.tsx";
import { getCachedMxcBlob, setCachedMxcBlob } from "@/utils/indexeddb-storage.ts";

const parsedUrl = new URL(BACKEND_URL);
let CORS_PROXY = `https://${parsedUrl.hostname}/cors/`;
const mxcObjectUrlCache = new Map<string, string>();
const mxcRequestCache = new Map<string, Promise<string>>();

const cacheMxcObjectUrl = (mxcUrl: string, blob: Blob) => {
    const existingUrl = mxcObjectUrlCache.get(mxcUrl);
    if (existingUrl) {
        return existingUrl;
    }

    const objectUrl = URL.createObjectURL(blob);
    mxcObjectUrlCache.set(mxcUrl, objectUrl);
    return objectUrl;
};

export function buildThumbnailUrl(repository: string, sticker: any) {
    if (!sticker?.url?.split || repository.startsWith("matrix-mxc://") || sticker.url.startsWith("mxc://")) {
        return "";
    }
    return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
}

export function loadStickerpack(stickerpack: IStickerpack, useProxy: boolean = false, cache = true) {
    const stickerCollections = useStickerCollections;

    if (cache && stickerCollections.getState().isStickerpackDataCached(stickerpack.id)) {
        return true;
    }
    console.log(`${stickerpack.id} loading`);

    let fetchPromise: Promise<any>;

    if (stickerpack.type === "maunium") {
        let stickerpackUrl = `${stickerpack.repository}/packs/${stickerpack.internal_name}`;
        if (useProxy) {
            stickerpackUrl = CORS_PROXY + stickerpackUrl;
        }
        fetchPromise = fetch(stickerpackUrl);
    } else if (stickerpack.type === "user_owned" || stickerpack.type === "matrix_mxc") {
        fetchPromise = apiRequest(`stickerpacks/${stickerpack.id}/stickers`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });
    } else {
        return false;
    }

    fetchPromise
        .then(async (response) => {
            let data = await response.json();
            if (!data || !data.stickers) return;
            stickerCollections.setState((state) => ({
                stickerpacksData: {
                    ...state.stickerpacksData,
                    [stickerpack.id]: data.stickers,
                },
            }));
        })
        .catch((err: Error) => {
            console.error("Stickerpack load failed:", err);
            if (stickerpack.type === "maunium" && !useProxy) {
                loadStickerpack(stickerpack, true, cache);
            }
        });
}


export async function loadStickerpackRaw(
    stickerpack: IStickerpack,
    useProxy: boolean = false,
    token?: string
): Promise<any[] | null> {
    const stickerCollectionsState = useStickerCollections.getState();

    if (stickerCollectionsState.stickerpacksData.hasOwnProperty(stickerpack.id.toString())) {
        return stickerCollectionsState.stickerpacksData[stickerpack.id.toString()];
    }
    console.log(`${stickerpack.id} loading`);

    try {
        if (stickerpack.type === "maunium") {
            let stickerpackUrl = `${stickerpack.repository}/packs/${stickerpack.internal_name}`;
            if (useProxy) {
                stickerpackUrl = CORS_PROXY + stickerpackUrl;
            }
            const response = await fetch(stickerpackUrl);
            if (response.status === 200) {
                const data = await response.json();
                return data.stickers;
            }
            return null;
        } else if (stickerpack.type === "user_owned" || stickerpack.type === "matrix_mxc") {
            const res = await apiRequest(`stickerpacks/${stickerpack.id}/stickers`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            let data = await res.json();
            return data?.stickers ?? null;
        }
        return null;
    } catch (err) {
        console.error("Stickerpack load failed:", err);
        if (stickerpack.type === "maunium" && !useProxy) {
            return loadStickerpackRaw(stickerpack, true, token);
        }
        return null;
    }
}


export function useMatrixFile(mxcUrl: string | null) {
    const widget = useMatrix();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!mxcUrl) {
            setFile(null);
            setLoading(false);
            setError(null);
            return;
        }

        let timeoutId: number | null = null;
        let cancelled = false;

        setFile(null);
        setLoading(true);
        setError(null);

        const requestId = `mxc-request-${Date.now()}-${mxcUrl}`;
        const handler = (event: any) => {
            if (cancelled) {
                return;
            }

            if (
                event.action === "org.matrix.msc4039.download_file" &&
                event.requestId === requestId
            ) {
                if (!event.response?.file) {
                    setError(new Error("Matrix widget did not return a file"));
                    setLoading(false);
                    widget.off("org.matrix.msc4039.download_file", handler);
                    if (timeoutId) {
                        window.clearTimeout(timeoutId);
                    }
                    return;
                }

                setFile(event.response.file);
                setLoading(false);
                widget.off("org.matrix.msc4039.download_file", handler);
                if (timeoutId) {
                    window.clearTimeout(timeoutId);
                }
            }
        };

        widget.on("org.matrix.msc4039.download_file", handler);
        timeoutId = window.setTimeout(() => {
            if (cancelled) {
                return;
            }

            setLoading(false);
            setError(new Error("Matrix file download timed out"));
            widget.off("org.matrix.msc4039.download_file", handler);
        }, 20_000);

        widget.sendMessage({
            api: "fromWidget",
            action: "org.matrix.msc4039.download_file",
            requestId,
            widgetId: widget.widgetId,
            data: { content_uri: mxcUrl, timeout_ms: 20000 },
        });

        return () => {
            cancelled = true;
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
            widget.off("org.matrix.msc4039.download_file", handler);
        };
    }, [mxcUrl, widget]);

    return { file, loading, error };
}

export function useMatrixPreviewUrl(mxcUrl: string | null) {
    const widget = useMatrix();
    const [src, setSrc] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        if (!mxcUrl) {
            setSrc(null);
            setLoading(false);
            setError(null);
            return;
        }

        if (!mxcUrl.startsWith("mxc://")) {
            setSrc(mxcUrl);
            setLoading(false);
            setError(null);
            return;
        }

        let cancelled = false;
        setLoading(true);
        setError(null);

        const loadPreview = async () => {
            const cachedUrl = mxcObjectUrlCache.get(mxcUrl);
            if (cachedUrl) {
                if (!cancelled) {
                    setSrc(cachedUrl);
                    setLoading(false);
                }
                return;
            }

            const cachedBlob = await getCachedMxcBlob(mxcUrl);
            if (cachedBlob) {
                const cachedObjectUrl = cacheMxcObjectUrl(mxcUrl, cachedBlob);
                if (!cancelled) {
                    setSrc(cachedObjectUrl);
                    setLoading(false);
                }
                return;
            }

            const existingRequest = mxcRequestCache.get(mxcUrl);
            if (existingRequest) {
                try {
                    const existingObjectUrl = await existingRequest;
                    if (!cancelled) {
                        setSrc(existingObjectUrl);
                        setLoading(false);
                    }
                } catch (requestError: any) {
                    if (!cancelled) {
                        setError(requestError instanceof Error ? requestError : new Error("Failed to load preview"));
                        setLoading(false);
                    }
                }
                return;
            }

            const requestId = `mxc-preview-${Date.now()}-${mxcUrl}`;
            const requestPromise = new Promise<string>((resolve, reject) => {
                let timeoutId: number | null = null;

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
                        reject(new Error("Matrix widget did not return a file"));
                        return;
                    }

                    void setCachedMxcBlob(mxcUrl, event.response.file).catch((persistError) => {
                        console.error("Failed to persist MXC blob cache", persistError);
                    });

                    const objectUrl = cacheMxcObjectUrl(mxcUrl, event.response.file);
                    cleanup();
                    resolve(objectUrl);
                };

                widget.on("org.matrix.msc4039.download_file", handler);
                widget.sendMessage({
                    api: "fromWidget",
                    action: "org.matrix.msc4039.download_file",
                    requestId,
                    widgetId: widget.widgetId,
                    data: { content_uri: mxcUrl, timeout_ms: 20000 },
                });

                timeoutId = window.setTimeout(() => {
                    cleanup();
                    reject(new Error("Matrix preview download timed out"));
                }, 20_000);
            });

            mxcRequestCache.set(mxcUrl, requestPromise);

            try {
                const objectUrl = await requestPromise;
                if (!cancelled) {
                    setSrc(objectUrl);
                    setLoading(false);
                }
            } catch (requestError: any) {
                if (!cancelled) {
                    setError(requestError instanceof Error ? requestError : new Error("Failed to load preview"));
                    setLoading(false);
                }
            } finally {
                mxcRequestCache.delete(mxcUrl);
            }
        };

        void loadPreview();

        return () => {
            cancelled = true;
        };
    }, [mxcUrl]);

    return { src, loading, error };
}
