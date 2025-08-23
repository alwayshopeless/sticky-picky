import {create} from "zustand";
import {persist} from "zustand/middleware";
import {apiRequest} from "../api/backend-api.ts";
import type {IStickerpack} from "../types/stickerpack.ts";

export type StickerpacksDataType = Record<string, any>;

// TODO: So large store, need refactor
export type StickerCollectionsData = {
    // saved by user stickerpacks map
    savedStickerpacks: Record<number, boolean>;
    favoriteStickers: any[];
    recentStickers: any[];

    // Sticker storage for Stickers section(saved by user)
    stickerpacks: Record<number, IStickerpack>;

    // Common stickerpacks data, contains all stickers {stickerId: {...stickerData}}
    stickerpacksData: StickerpacksDataType;


    // Sticker storage for Explore section
    exploreStickerpacks: Record<number, IStickerpack>;
    lastExploreLoad: number | null;


    // Last stickers updates for cache control
    lastStickerpacksLoad: number | null;
    lastFavoritesLoad: number | null;
    lastRecentLoad: number | null;

    // Cache expires timeout
    cacheTimeout: number;
    exploreCacheTimeout: number;
};

export type StickerCollectionsStore = StickerCollectionsData & {
    setSavedStickerpacks: (val: number[]) => void;
    setFavoriteStickers: (stickers: any[]) => void;
    setRecentStickers: (stickers: any[]) => void;
    setStickerpacks: (stickerpacks: IStickerpack[]) => void;
    setStickerpacksData: (stickerpacks: any) => void;
    isStickerpackDataCached: (id: number) => boolean;

    setExploreStickerpacks: (stickerpacks: IStickerpack[]) => void;
    isExploreCacheValid: () => boolean;
    updateExploreLoadTime: () => void;
    getExploreStickerpacks: () => IStickerpack[];

    isStickerpacksCacheValid: () => boolean;
    isFavoritesCacheValid: () => boolean;
    isRecentCacheValid: () => boolean;

    updateStickerpacksLoadTime: () => void;
    updateFavoritesLoadTime: () => void;
    updateRecentLoadTime: () => void;

    getStickerpacksArray: () => IStickerpack[];
    getSavedStickerpacksArray: () => number[];

    addStickerpack: (stickerpack: IStickerpack) => void;
    removeStickerpack: (id: number) => void;

    addToRecent: (sticker: any) => Promise<void>;
    addToFavorites: (sticker: any) => Promise<void>;
    removeFromFavorites: (sticker: any) => Promise<void>;
    removeFromRecent: (sticker: any) => Promise<void>;
};


export const useStickerCollections = create<StickerCollectionsStore>()(
    persist(
        (set, getState) => ({
            savedStickerpacks: {},
            favoriteStickers: [],
            recentStickers: [],
            stickerpacks: {},
            stickerpacksData: {},

            exploreStickerpacks: {},
            lastExploreLoad: null,

            lastStickerpacksLoad: null,
            lastFavoritesLoad: null,
            lastRecentLoad: null,
            cacheTimeout: 5 * 60 * 1000,
            exploreCacheTimeout: 10 * 60 * 1000,

            setSavedStickerpacks: (val) => {
                const savedObj: Record<number, boolean> = {};
                val.forEach(id => savedObj[id] = true);
                set({savedStickerpacks: savedObj, lastStickerpacksLoad: Date.now()});
            },

            setFavoriteStickers: (stickers) => set({favoriteStickers: stickers, lastFavoritesLoad: Date.now()}),
            setRecentStickers: (stickers) => set({recentStickers: stickers, lastRecentLoad: Date.now()}),

            setStickerpacks: (packs) => {
                const packsObj: Record<number, IStickerpack> = {};
                packs.forEach(pack => packsObj[pack.id] = pack);
                set({stickerpacks: packsObj, lastStickerpacksLoad: Date.now()});
            },

            setStickerpacksData: (data) => set({stickerpacksData: data, lastStickerpacksLoad: Date.now()}),

            isStickerpackDataCached: (id: number) => {
                const {stickerpacksData} = getState();
                return stickerpacksData[id] !== undefined;
            },

            setExploreStickerpacks: (packs) => {
                const packsObj: Record<number, IStickerpack> = {};
                packs.forEach(pack => packsObj[pack.id] = pack);
                set({exploreStickerpacks: packsObj, lastExploreLoad: Date.now()});
            },

            isExploreCacheValid: () => {
                const {lastExploreLoad, exploreCacheTimeout} = getState();
                if (!lastExploreLoad) return false;
                return Date.now() - lastExploreLoad < exploreCacheTimeout;
            },

            updateExploreLoadTime: () => set({lastExploreLoad: Date.now()}),

            getExploreStickerpacks: () => {
                const {exploreStickerpacks} = getState();
                return Object.values(exploreStickerpacks);
            },

            isStickerpacksCacheValid: () => {
                const {lastStickerpacksLoad, cacheTimeout} = getState();
                if (!lastStickerpacksLoad) return false;
                return Date.now() - lastStickerpacksLoad < cacheTimeout;
            },

            isFavoritesCacheValid: () => {
                const {lastFavoritesLoad, cacheTimeout} = getState();
                if (!lastFavoritesLoad) return false;
                return Date.now() - lastFavoritesLoad < cacheTimeout;
            },

            isRecentCacheValid: () => {
                const {lastRecentLoad, cacheTimeout} = getState();
                if (!lastRecentLoad) return false;
                return Date.now() - lastRecentLoad < cacheTimeout;
            },

            updateStickerpacksLoadTime: () => set({lastStickerpacksLoad: Date.now()}),
            updateFavoritesLoadTime: () => set({lastFavoritesLoad: Date.now()}),
            updateRecentLoadTime: () => set({lastRecentLoad: Date.now()}),

            getStickerpacksArray: () => {
                const {stickerpacks, savedStickerpacks} = getState();
                return Object.values(stickerpacks).filter(pack => savedStickerpacks[pack.id]);
            },

            getSavedStickerpacksArray: () => {
                const {savedStickerpacks} = getState();
                return Object.keys(savedStickerpacks).filter(key => savedStickerpacks[Number(key)]).map(Number);
            },

            addStickerpack: (stickerpack) => {
                set(state => ({
                    stickerpacks: {
                        ...state.stickerpacks,
                        [stickerpack.id]: stickerpack
                    },
                    savedStickerpacks: {
                        ...state.savedStickerpacks,
                        [stickerpack.id]: true
                    },
                    lastStickerpacksLoad: Date.now()
                }));
            },

            removeStickerpack: (id) => {
                set(state => {
                    const newStickerpacks = {...state.stickerpacks};
                    const newSavedStickerpacks = {...state.savedStickerpacks};
                    delete newStickerpacks[id];
                    delete newSavedStickerpacks[id];

                    return {
                        stickerpacks: newStickerpacks,
                        savedStickerpacks: newSavedStickerpacks,
                        lastStickerpacksLoad: Date.now()
                    };
                });
            },

            addToRecent: async (sticker) => {
                try {
                    const response = await apiRequest("user/stickers/recent/add", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",

                        },
                        body: JSON.stringify(sticker),
                    });
                    if (response.status === 200) {
                        const data = await response.json();
                        set((state) => {
                            let temp = state.recentStickers.filter((i) => i.url !== data.sticker.url);
                            let newRecents = [data.sticker, ...temp].slice(0, 20);
                            return {
                                recentStickers: newRecents,
                                lastRecentLoad: Date.now()
                            };
                        });
                    } else {
                        console.log("Error: Cant add sticker to recent");
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            addToFavorites: async (sticker) => {
                try {
                    const response = await apiRequest("user/stickers/favorites/add", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",

                        },
                        body: JSON.stringify(sticker),
                    });
                    if (response.status === 200) {
                        const data = await response.json();
                        set((state) => {
                            let temp = state.favoriteStickers.filter((i) => i.url !== data.sticker.url);
                            let newFavs = [data.sticker, ...temp].slice(0, 20);
                            return {
                                favoriteStickers: newFavs,
                                lastFavoritesLoad: Date.now()
                            };
                        });
                    } else {
                        console.log("Error: Cant add sticker to favorites");
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            removeFromFavorites: async (sticker) => {
                try {
                    const response = await apiRequest("user/stickers/favorites/remove", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",

                        },
                        body: JSON.stringify({spUid: sticker.spUid}),
                    });
                    if (response.status === 200) {
                        set((state) => {
                            let temp = state.favoriteStickers.filter((i) => i.url !== sticker.url);
                            return {
                                favoriteStickers: temp.slice(0, 20),
                                lastFavoritesLoad: Date.now()
                            };
                        });
                    } else {
                        console.log("Error: Cant remove sticker from favorites");
                    }
                } catch (e) {
                    console.error(e);
                }
            },

            removeFromRecent: async (sticker) => {
                try {
                    const response = await apiRequest("user/stickers/recent/remove", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",

                        },
                        body: JSON.stringify({spUid: sticker.spUid}),
                    });
                    if (response.status === 200) {
                        set((state) => {
                            let temp = state.recentStickers.filter((i) => i.url !== sticker.url);
                            return {
                                recentStickers: temp.slice(0, 20),
                                lastRecentLoad: Date.now()
                            };
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
