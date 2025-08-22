import {create} from "zustand";
import {persist} from "zustand/middleware";
import {apiRequest} from "../api/backend-api.ts";
import type {IStickerpack} from "../types/stickerpack.ts";

export type StickerCollectionsData = {
    savedStickerpacks: number[];
    favoriteStickers: any[];
    recentStickers: any[];
    stickerpacks: IStickerpack[];
};

export type StickerCollectionsStore = StickerCollectionsData & {
    setSavedStickerpacks: (val: number[]) => void;
    setFavoriteStickers: (stickers: any[]) => void;
    setRecentStickers: (stickers: any[]) => void;
    setStickerpacks: (stickerpacks: IStickerpack[]) => void;

    addToRecent: (sticker: any, token?: string) => Promise<void>;
    addToFavorites: (sticker: any, token?: string) => Promise<void>;
    removeFromFavorites: (sticker: any, token?: string) => Promise<void>;
    removeFromRecent: (sticker: any, token?: string) => Promise<void>;
};

export const useStickerCollections = create<StickerCollectionsStore>()(
    persist(
        (set) => ({
            savedStickerpacks: [],
            favoriteStickers: [],
            recentStickers: [],
            stickerpacks: [],

            setSavedStickerpacks: (val) => set({savedStickerpacks: val}),
            setFavoriteStickers: (stickers) => set({favoriteStickers: stickers}),
            setRecentStickers: (stickers) => set({recentStickers: stickers}),
            setStickerpacks: (packs) => set({stickerpacks: packs}),

            addToRecent: async (sticker, token) => {
                try {
                    const response = await apiRequest("user/stickers/recent/add", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(sticker),
                    });
                    if (response.status === 200) {
                        const data = await response.json();
                        set((state) => {
                            let temp = state.recentStickers.filter((i) => i.url !== data.sticker.url);
                            let newRecents = [data.sticker, ...temp].slice(0, 20);
                            return {recentStickers: newRecents};
                        });
                    } else {
                        console.log("Error: Cant add sticker to recent");
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            addToFavorites: async (sticker, token) => {
                try {
                    const response = await apiRequest("user/stickers/favorites/add", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify(sticker),
                    });
                    if (response.status === 200) {
                        const data = await response.json();
                        set((state) => {
                            let temp = state.favoriteStickers.filter((i) => i.url !== data.sticker.url);
                            let newFavs = [data.sticker, ...temp].slice(0, 20);
                            return {favoriteStickers: newFavs};
                        });
                    } else {
                        console.log("Error: Cant add sticker to favorites");
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            removeFromFavorites: async (sticker, token) => {
                try {
                    const response = await apiRequest("user/stickers/favorites/remove", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({spUid: sticker.spUid}),
                    });
                    if (response.status === 200) {
                        set((state) => {
                            let temp = state.favoriteStickers.filter((i) => i.url !== sticker.url);
                            return {favoriteStickers: temp.slice(0, 20)};
                        });
                    } else {
                        console.log("Error: Cant remove sticker from favorites");
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            removeFromRecent: async (sticker, token) => {
                try {
                    const response = await apiRequest("user/stickers/recent/remove", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({spUid: sticker.spUid}),
                    });
                    if (response.status === 200) {
                        set((state) => {
                            let temp = state.recentStickers.filter((i) => i.url !== sticker.url);
                            return {recentStickers: temp.slice(0, 20)};
                        });
                    } else {
                        console.log("Error: Cant remove sticker from recents");
                    }
                } catch (e) {
                    console.error(e);
                }
            },
        }),
        {
            name: "stickerCollections",
        }
    )
);
