import type {IStickerpack} from "../types/stickerpack.ts";
import {useStickerCollections} from "../stores/sticker-collections.tsx";
import {BACKEND_URL} from "../config/main.ts";

// const CORS_PROXY = "https://corsproxy.io/?url=";
const parsedUrl = new URL(BACKEND_URL);
let CORS_PROXY = `https://${parsedUrl.hostname}/cors/`;

export function buildThumbnailUrl(repository: string, sticker: any) {
    return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
}

export function loadStickerpack(stickerpack: IStickerpack, useProxy: boolean = false) {
    const stickerCollections = useStickerCollections;

    if (stickerCollections.getState().isStickerpackDataCached(stickerpack.id)) {
        console.debug(`${stickerpack.id} already cached. Request skip.`)
        return true;
    }
    console.log(`${stickerpack.id} loading`);

    let stickerpackUrl = "";
    if (stickerpack.type == 'maunium') {
        stickerpackUrl = stickerpack.repository + "/packs/" + stickerpack.internal_name;
    }


    if (useProxy) {
        stickerpackUrl = CORS_PROXY + stickerpackUrl;
    }

    fetch(stickerpackUrl).then(async (response: Response) => {
        if (response.status == 200) {
            let data = await response.json();

            stickerCollections.setState((state) => ({
                stickerpacksData: {
                    ...state.stickerpacksData,
                    [stickerpack.id]: data.stickers,
                },
            }));

        }
    })
        .catch((_err: Error) => {
            // Handle CORS error request, if repository not set CORS headers
            // I use public CORS proxy, but need add other proxies or replace it to
            // self-hosted solution or smth else
            if (!useProxy) {
                loadStickerpack(stickerpack, true);
            }
        });
}


export async function loadStickerpackRaw(
    stickerpack: IStickerpack,
    useProxy: boolean = false
): Promise<any[] | null> {
    const stickerCollectionsState = useStickerCollections.getState();

    if (stickerCollectionsState.stickerpacksData.hasOwnProperty(stickerpack.id.toString())) {
        console.debug(`${stickerpack.id} already cached. Request skip.`);
        return stickerCollectionsState.stickerpacksData[stickerpack.id.toString()];
    }
    console.log(`${stickerpack.id} loading`);

    let stickerpackUrl = "";
    if (stickerpack.type === "maunium") {
        stickerpackUrl = `${stickerpack.repository}/packs/${stickerpack.internal_name}`;
    }

    if (useProxy) {
        stickerpackUrl = CORS_PROXY + stickerpackUrl;
    }

    try {
        const response = await fetch(stickerpackUrl);

        if (response.status === 200) {
            const data = await response.json();
            return data.stickers;
        } else {
            return null;
        }
    } catch (err) {
        // Handle CORS error request, if repository not set CORS headers
        // I use public CORS proxy, but need add other proxies or replace it to
        // self-hosted solution or smth else

        if (!useProxy) {
            return loadStickerpackRaw(stickerpack, true);
        }
        return null;
    }
}
