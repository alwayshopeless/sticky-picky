import type {IStickerpack} from "../types/stickerpack.ts";
import {useStickerCollections} from "../stores/sticker-collections.tsx";

export function buildThumbnailUrl(repository: string, sticker: any) {
    return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
}

export function loadStickerpack(stickerpack: IStickerpack, useProxy: boolean = false, isExplore: boolean = false) {
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

    const CORS_PROXY = "https://corsproxy.io/?url=";

    if (useProxy) {
        stickerpackUrl = CORS_PROXY + stickerpackUrl;
    }

    fetch(stickerpackUrl).then(async (response: Response) => {
        if (response.status == 200) {
            let data = await response.json();


            if (isExplore) {
                console.log("Spack loading:");
                console.log(isExplore);
                console.log(stickerpack);
                stickerCollections.setState((state) => ({
                    exploreStickersData: {
                        ...state.exploreStickersData,
                        [stickerpack.id]: data.stickers,
                    },
                }));
            } else {
                stickerCollections.setState((state) => ({
                    stickerpacksData: {
                        ...state.stickerpacksData,
                        [stickerpack.id]: data.stickers,
                    },
                }));
            }

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