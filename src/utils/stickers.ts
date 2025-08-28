import type {IStickerpack} from "../types/stickerpack.ts";
import {useStickerCollections} from "../stores/sticker-collections.tsx";
import {BACKEND_URL} from "../config/main.ts";
import {apiRequest} from "@/api/backend-api.ts";

const parsedUrl = new URL(BACKEND_URL);
let CORS_PROXY = `https://${parsedUrl.hostname}/cors/`;

export function buildThumbnailUrl(repository: string, sticker: any) {
    return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
}

export function loadStickerpack(stickerpack: IStickerpack, useProxy: boolean = false, token?: string) {
    const stickerCollections = useStickerCollections;

    if (stickerCollections.getState().isStickerpackDataCached(stickerpack.id)) {
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
        fetchPromise = fetch(stickerpackUrl).then((res) => res.json());
    } else if (stickerpack.type === "user_owned") {
        fetchPromise = apiRequest(`stickerpacks/${stickerpack.id}/stickers`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token ?? ""}`,
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
                loadStickerpack(stickerpack, true, token);
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
        } else if (stickerpack.type === "user_owned") {
            const res = await apiRequest(`stickerpacks/${stickerpack.id}/stickers`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            });
            console.log("laoded sticks:");
            console.log(res);
            return res?.stickers ?? null;
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
