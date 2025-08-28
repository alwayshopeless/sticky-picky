import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useMemo, useState} from "preact/hooks";
import {apiRequest} from "@/api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";
import type {IStickerpack} from "@/types/stickerpack.ts";
import {loadStickerpack} from "@/utils/stickers.ts";
import {StickerPreviewProvider} from "../../contexts/sticker-preview-context.tsx";
import {Loader} from "@/components/loader.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";
import {useStickerCollections} from "../../stores/sticker-collections.tsx";
import {SearchResult} from "@/components/search-result.tsx";
import {StickerViewNav} from "@/components/views/sticker-view/StickerViewNav.tsx";


export function StickerView({explore}: { explore: any }) {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    //@ts-ignore
    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);
    const [loadingStates, setLoadingStates] = useState({
        stickerpacks: false,
        favorites: false,
        recent: false
    });

    const loadStickerpacks = async () => {
        if (stickerCollections.isStickerpacksCacheValid()) {
            console.log("Stickerpacks cache is still valid, skipping load");
            setStickersLoaded(true);
            return;
        }

        setLoadingStates(prev => ({...prev, stickerpacks: true}));

        try {
            const response = await apiRequest('user/stickerpacks', {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${stickerPicker?.userData?.token}`
                },
            });

            if (response.status === 200) {
                const data = await response.json();

                const currentStickerpacks = stickerCollections.getStickerpacksArray();
                const newStickerpackIds = data.stickerpacks.map((item: any) => item.stickerpack_id);
                const currentStickerpackIds = stickerCollections.getSavedStickerpacksArray();

                const hasChanges = newStickerpackIds.length !== currentStickerpackIds.length ||
                    !newStickerpackIds.every((id: number) => stickerCollections.savedStickerpacks[id]);

                if (hasChanges || currentStickerpacks.length === 0) {
                    console.log("Stickerpacks changed, updating...");
                    stickerCollections.setStickerpacks(data.stickerpacks);
                    stickerCollections.setSavedStickerpacks(newStickerpackIds);

                    data.stickerpacks.forEach((item: IStickerpack) => {
                        if (!stickerCollections.isStickerpackDataCached(item.id)) {
                            loadStickerpack(item);
                        }
                    });
                }

                stickerCollections.updateStickerpacksLoadTime();
            } else {
                console.log("Error: Can't load stickerpacks");
            }
        } catch (error) {
            console.error("Error loading stickerpacks:", error);
        } finally {
            setLoadingStates(prev => ({...prev, stickerpacks: false}));
            setStickersLoaded(true);
        }
    };

    const loadRecentAndFavorite = async () => {
        const needsFavorites = !stickerCollections.isFavoritesCacheValid();
        const needsRecent = !stickerCollections.isRecentCacheValid();

        if (!needsFavorites && !needsRecent) {
            console.log("Favorites and Recent cache are still valid, skipping load");
            return;
        }

        setLoadingStates(prev => ({
            ...prev,
            favorites: needsFavorites,
            recent: needsRecent
        }));

        try {
            const response = await apiRequest('user/stickers', {
                method: "GET",
                headers: {
                    Authorization: `Bearer ${stickerPicker?.userData?.token}`
                },
            });

            if (response.status === 200) {
                const data = await response.json();

                if (needsFavorites) {
                    stickerCollections.setFavoriteStickers(data.favorites || []);
                    stickerCollections.updateFavoritesLoadTime();
                }

                if (needsRecent) {
                    stickerCollections.setRecentStickers(data.recent || []);
                    stickerCollections.updateRecentLoadTime();
                }
            } else if (response.status == 401) {
                // TODO: Need refactor. Behavior
                stickerPicker.setUserData(null);
            } else {
                console.log("Error: Can't load favorites and recent stickers");
            }
        } catch (error) {
            console.error("Error loading recent and favorite stickers:", error);
        } finally {
            setLoadingStates(prev => ({
                ...prev,
                favorites: false,
                recent: false
            }));
        }
    };

    useEffect(() => {
        if (stickerPicker.userData != null) {
            Promise.all([
                loadStickerpacks(),
                loadRecentAndFavorite()
            ]).catch(error => {
                console.error("Error in parallel data loading:", error);
            });
        }
    }, [stickerPicker.userData]);

    const currentStickerpacks = stickerCollections.getStickerpacksArray();
    const isLoading = loadingStates.stickerpacks || loadingStates.favorites || loadingStates.recent;
    const [searchText, setSearchText] = useState<string>("");
    const isSearch = useMemo(() => {
        return searchText != "";
    }, [searchText]);


    const [emoji, setEmoji] = useState<string>("");
    const _setEmoji = (s: string) => {
        setEmoji(s);
    };

    return <div class={"view"}>
        <StickerPreviewProvider>
            <StickerViewNav
                stickerpacks={currentStickerpacks}
                stickerpacksData={stickerCollections.stickerpacksData}
            />
            <div class={"view"}>
                <div>
                    <div class={"field"}>
                        <div class="field__emoji">{emoji}</div>
                        <input onInput={(e) => {
                            setSearchText(e.currentTarget.value)
                        }} placeholder={'Search'} class={'field__input'} type="text"/>
                    </div>
                </div>
                <>
                    {isLoading && <Loader/>}

                    {isSearch ? <SearchResult
                        setEmoji={_setEmoji}
                        searchText={searchText}
                        stickerpacks={stickerCollections.stickerpacks}
                        stickerpacksData={stickerCollections.stickerpacksData}

                    /> : null}

                    {!isSearch && stickerCollections.favoriteStickers.length > 0 && (
                        <Stickerpack
                            stickerpack={{
                                name: 'Favorites',
                                spType: 'favorites',
                                id: 'favorites',
                            }}
                            stickers={stickerCollections.favoriteStickers}
                        />
                    )}

                    {!isSearch && stickerCollections.recentStickers.length > 0 && (
                        <Stickerpack
                            stickerpack={{
                                id: 'recent',
                                name: 'Recent',
                                spType: 'recent',
                            }}
                            stickers={stickerCollections.recentStickers}
                        />
                    )}

                    {currentStickerpacks.length === 0 && stickersLoaded && !isLoading && (
                        <div class={"center"}>
                            <div style={{marginBottom: "1rem"}}>
                                You have no stickers yet...
                            </div>
                            <button onClick={explore} class={'btn'}>
                                Explore!
                            </button>
                        </div>
                    )}


                    {stickersLoaded && !isSearch && currentStickerpacks.map((stickerpack: any) => (
                        <Stickerpack
                            compact={false}
                            key={stickerpack.id}
                            stickerpack={stickerpack}
                            stickers={stickerCollections.stickerpacksData[stickerpack.id]}
                        />
                    ))}
                </>
            </div>

        </StickerPreviewProvider>
    </div>;
}