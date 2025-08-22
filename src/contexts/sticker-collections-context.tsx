import {type ComponentChildren, createContext} from 'preact';
import {useContext, useEffect, useMemo, useState} from 'preact/hooks';
import {apiRequest} from "../api/backend-api.ts";
import {useStickerPicker} from "./sticker-picker-context.tsx";

export type StickerCollectionsData = {
    savedStickerpacks: number[];
    favoriteStickers: any[];
    recentStickers: any[];
};

export type StickerCollectionsContextValue = StickerCollectionsData & {
    setSavedStickerpacks: (val: number[]) => void;
    setFavoriteStickers: (stickers: any[]) => void;
    setRecentStickers: (stickers: any[]) => void;
    addToRecent: (sticker: any) => void;
    addToFavorites: (sticker: any) => void;
};

const DEFAULT_VALUE: StickerCollectionsContextValue = {
    savedStickerpacks: [],
    favoriteStickers: [],
    recentStickers: [],
    setSavedStickerpacks: () => {
    },
    setFavoriteStickers: () => {
    },
    setRecentStickers: () => {
    },
};

export const StickerCollectionsContext = createContext<StickerCollectionsContextValue>(DEFAULT_VALUE);

export type StickerCollectionsProviderProps = {
    children: ComponentChildren;
    storageKey?: string;
};

export function StickerCollectionsProvider({
                                               children,
                                               storageKey = 'stickerCollections',
                                           }: StickerCollectionsProviderProps) {

    const loadFromStorage = (): StickerCollectionsData | null => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) return JSON.parse(raw);
        } catch {
        }
        return null;
    };

    const stored = loadFromStorage();

    const [savedStickerpacks, setSavedStickerpacks] = useState<number[]>(stored?.savedStickerpacks || []);
    const [favoriteStickers, setFavoriteStickers] = useState<any[]>(stored?.favoriteStickers || []);
    const [recentStickers, setRecentStickers] = useState<any[]>(stored?.recentStickers || []);
    const stickerPicker = useStickerPicker();

    useEffect(() => {
        try {
            const data: StickerCollectionsData = {
                savedStickerpacks,
                favoriteStickers,
                recentStickers,
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
        }
    }, [savedStickerpacks, favoriteStickers, recentStickers, storageKey]);

    const addToRecent = (sticker: any) => {
        apiRequest('user/stickers/recent/add', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${stickerPicker.userData.token}`
            },
            body: JSON.stringify(sticker),

        }).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                setRecentStickers((prev: any[]) => {
                    let tempRecents = prev.filter((item: any) => item.url != data.sticker.url);
                    let newRecents = [
                        data.sticker,
                        ...tempRecents,
                    ];
                    newRecents = newRecents.slice(0, 20);
                    return newRecents
                });
            } else {
                console.log("Errror: Cant add sticker to recent");
            }
        })

    };

    const addToFavorites = (sticker: any) => {
        apiRequest('user/stickers/favorites/add', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${stickerPicker.userData.token}`
            },
            body: JSON.stringify(sticker),

        }).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                setFavoriteStickers((prev: any[]) => {
                    let tempFavs = prev.filter((item: any) => item.url != data.sticker.url);
                    let newFavs = [
                        data.sticker,
                        ...tempFavs,
                    ];
                    newFavs = newFavs.slice(0, 20);
                    return newFavs
                });
            } else {
                console.log("Errror: Cant add sticker to favorites");
            }
        })

    };


    const value = useMemo<StickerCollectionsContextValue>(
        () => ({
            savedStickerpacks,
            favoriteStickers,
            recentStickers,
            setSavedStickerpacks,
            setFavoriteStickers,
            setRecentStickers,
            addToRecent,
            addToFavorites,
        }),
        [savedStickerpacks, favoriteStickers, recentStickers]
    );

    return (
        <StickerCollectionsContext.Provider value={value}>
            {children}
        </StickerCollectionsContext.Provider>
    );
}

export function useStickerCollections() {
    return useContext(StickerCollectionsContext);
}