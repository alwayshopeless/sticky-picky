import type { IStickerpack } from "../types/stickerpack.ts";
import { useStickerCollections } from "../stores/sticker-collections.tsx";
import { BACKEND_URL } from "../config/main.ts";
import { apiRequest } from "@/api/backend-api.ts";
import { useEffect, useState } from "preact/hooks";
import { useMatrix } from "../contexts/matrix-widget-api-context.tsx";

const parsedUrl = new URL(BACKEND_URL);
let CORS_PROXY = `https://${parsedUrl.hostname}/cors/`;

export function buildThumbnailUrl(repository: string, sticker: any) {
    if (!sticker?.url?.split || repository.startsWith("matrix-mxc://") || sticker.url.startsWith("mxc://")) {
        return "";
    }
    return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
}

export function loadStickerpack(stickerpack: IStickerpack, useProxy: boolean = false, cache = true) {
    const stickerCollections = useStickerCollections;

    if (cache && stickerCollections.getState().isStickerpackDataCached(stickerpack.id)) {
        console.debug(`${stickerpack.id} already cached. Request skip.`);
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
        console.debug(`${stickerpack.id} already cached. Request skip.`);
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
        if (!mxcUrl) return;
        setLoading(true);
        setError(null);

        const requestId = `mxc-request-${Date.now()}-${mxcUrl}`;
        const handler = (event: any) => {
            if (
                event.action === "org.matrix.msc4039.download_file" &&
                event.requestId === requestId &&
                event.response?.file
            ) {
                setFile(event.response.file);
                setLoading(false);
                widget.off("org.matrix.msc4039.download_file", handler);
            }
        };

        widget.on("org.matrix.msc4039.download_file", handler);

        console.log("Тут я типа отправляю сообщение");
        widget.sendMessage({
            api: "fromWidget",
            action: "org.matrix.msc4039.download_file",
            requestId,
            widgetId: widget.widgetId,
            data: { content_uri: mxcUrl, timeout_ms: 20000 },
        });

        return () => {
            widget.off("org.matrix.msc4039.download_file", handler);
        };
    }, [mxcUrl]);

    return { file, loading, error };
}
