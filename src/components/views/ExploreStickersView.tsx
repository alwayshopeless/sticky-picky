import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useMemo, useRef, useState} from "preact/hooks";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";
import type {IStickerpack} from "../../types/stickerpack.ts";
import {StickerPreviewProvider} from "../../contexts/sticker-preview-context.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";
import {useStickerCollections} from "../../stores/sticker-collections.tsx";
import {Loader} from "../loader.tsx";
import {buildHttpQuery} from "../../utils/url.ts";
import {loadStickerpack} from "../../utils/stickers.ts";

//TODO: oh my god, I fucking hate this. Need refactor, but I want not it more
export function ExploreStickersView() {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();

    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [hasMoreData, setHasMoreData] = useState<boolean>(true);
    const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);

    const ITEMS_PER_PAGE = 2;

    const checkHasMoreData = async () => {
        const cachedStickerpacks = stickerCollections.getExploreStickerpacks();
        const currentOffset = cachedStickerpacks.length;

        try {
            const response = await apiRequest(`stickerpacks/all?${buildHttpQuery({
                offset: currentOffset.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            })}`);

            if (response.status === 200) {
                const data = await response.json();
                setHasMoreData(data.hasMore || Object.keys(data.stickerpacks).length > 0);
                console.log(`Checked for more data at offset ${currentOffset}: ${data.hasMore ? 'has more' : 'no more'}`);
            }
        } catch (error) {
            console.error("Error checking for more data:", error);
            setHasMoreData(true);
        }
    };

    const initializePaginationFromCache = () => {
        const cachedStickerpacks = stickerCollections.getExploreStickerpacks();
        if (cachedStickerpacks.length > 0) {
            const currentPage = Math.ceil(cachedStickerpacks.length / ITEMS_PER_PAGE);
            setPage(currentPage);
            setInitialLoadDone(true);
            setStickersLoaded(true);
            console.log(`Initialized pagination from cache: ${cachedStickerpacks.length} stickerpacks, starting from page ${currentPage}`);

            checkHasMoreData();
        }
    };

    const loadExploreStickerpacks = async () => {
        if (!hasMoreData) {
            console.log("No more data to load");
            return;
        }

        if (isLoading) {
            console.log("Already loading explore stickerpacks, skipping duplicate request");
            return;
        }

        setIsLoading(true);

        try {
            const offset = page * ITEMS_PER_PAGE;

            const response = await apiRequest(`stickerpacks/all?${buildHttpQuery({
                offset: offset.toString(),
                limit: ITEMS_PER_PAGE.toString(),
            })}`);

            if (response.status === 200) {
                const data = await response.json();
                const fetchedPacks = data.stickerpacks;

                setHasMoreData(data.hasMore);

                if (!fetchedPacks || Object.keys(fetchedPacks).length === 0) {
                    console.log("No more stickerpacks to load");
                    setHasMoreData(false);
                    setStickersLoaded(true);
                    return;
                }

                const currentExploreStickerpacks = stickerCollections.exploreStickerpacks;
                const alreadyLoadedPackIds: string[] = Object.keys(currentExploreStickerpacks);
                const fetchedPacksIds: string[] = Object.keys(fetchedPacks);
                const packsToLoadIds = fetchedPacksIds.filter(item => !alreadyLoadedPackIds.includes(item));

                console.log(`Loading ${packsToLoadIds.length} new stickerpacks for page ${page}`);

                if (packsToLoadIds.length > 0) {
                    const loadPromises = packsToLoadIds.map(async (item) => {
                        console.log(`Loading pack ${item}`);
                        await loadStickerpack(fetchedPacks[item], false, true);
                        return fetchedPacks[item];
                    });

                    const loadedPacks = await Promise.allSettled(loadPromises);
                    const successfulPacks = loadedPacks
                        .filter(result => result.status === 'fulfilled')
                        .map(result => (result as PromiseFulfilledResult<any>).value);

                    if (successfulPacks.length > 0) {
                        stickerCollections.setExploreStickerpacks([
                            ...Object.values(currentExploreStickerpacks),
                            ...successfulPacks
                        ]);
                    }
                } else {
                    console.log("All fetched packs are already loaded");
                }

                // Увеличиваем номер страницы только после успешной загрузки
                setPage(prevPage => prevPage + 1);
                stickerCollections.updateExploreLoadTime();
                setStickersLoaded(true);
                setInitialLoadDone(true);
            } else {
                console.error("Error: Can't load explore stickerpacks, status:", response.status);
                setHasMoreData(false);
            }
        } catch (error) {
            console.error("Error loading explore stickerpacks:", error);
            setHasMoreData(false);
        } finally {
            console.log(`Loading page ${page} END. Finally triggered`);
            setIsLoading(false);
            setStickersLoaded(true);
        }
    };

    // Инициализация состояния при загрузке компонента
    useEffect(() => {
        if (stickerPicker.userData != null) {
            // Проверяем кэш и инициализируем пагинацию
            const cachedStickerpacks = stickerCollections.getExploreStickerpacks();
            if (cachedStickerpacks.length > 0 && stickerCollections.isExploreCacheValid()) {
                console.log("Cache is valid, initializing from cache");
                initializePaginationFromCache();
            } else {
                console.log("Cache is empty or invalid, starting fresh load");
                loadExploreStickerpacks();
            }
        }
    }, [stickerPicker.userData]);

    const getStickerpacksArray = (): IStickerpack[] => {
        return stickerCollections.getExploreStickerpacks();
    };

    const getStickerpackData = (id: number) => {
        return stickerCollections.exploreStickersData[id] || stickerCollections.stickerpacksData[id];
    };

    const currentStickerpacks = getStickerpacksArray();

    const [searchText, setSearchText] = useState<string>("");
    const [searchResults, setSearchResults] = useState<IStickerpack[]>([]);
    const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);
    const [searchError, setSearchError] = useState<string>("");

    const isSearch = useMemo(() => {
        return searchText.trim() !== "";
    }, [searchText]);

    const [emoji, setEmoji] = useState<string>("");
    const _setEmoji = (s: string) => {
        setEmoji(s);
    };

    const searchStickerpacks = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearchLoading(true);
        setSearchError("");

        try {
            const response = await apiRequest(`stickerpacks/all?${buildHttpQuery({
                search: query.trim(),
                limit: '50',
                offset: '0'
            })}`);

            if (response.status === 200) {
                const data = await response.json();
                const fetchedPacks = data.stickerpacks;

                if (fetchedPacks) {
                    const searchResultsArray = Object.values(fetchedPacks) as IStickerpack[];
                    setSearchResults(searchResultsArray);

                    const loadPromises = searchResultsArray.map(async (pack) => {
                        const existingData = getStickerpackData(pack.id);
                        if (!existingData) {
                            await loadStickerpack(pack, false, true);
                        }
                    });

                    await Promise.allSettled(loadPromises);
                } else {
                    setSearchResults([]);
                }
            } else {
                console.error("Error searching stickerpacks, status:", response.status);
                setSearchError("Error searching stickerpacks");
            }
        } catch (error) {
            console.error("Error searching stickerpacks:", error);
            setSearchError("Error searching stickerpacks");
        } finally {
            setIsSearchLoading(false);
        }
    };

    // Debounced поиск
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchText.trim()) {
                searchStickerpacks(searchText);
            } else {
                setSearchResults([]);
            }
        }, 300); // Задержка 300ms

        return () => clearTimeout(timeoutId);
    }, [searchText]);

    const sentinelRef = useRef(null);
    const rootRef = useRef(null);

    // Настройка IntersectionObserver
    useEffect(() => {
        if (!sentinelRef.current || isSearch) return;

        const observer = new IntersectionObserver(
            (entries) => {
                const entry = entries[0];
                // Проверяем что элемент действительно пересекается И мы не в режиме поиска
                if (entry.isIntersecting && hasMoreData && !isLoading && initialLoadDone) {
                    console.log("Sentinel intersecting - loading more data");
                    loadExploreStickerpacks();
                }
            },
            {
                rootMargin: '100px',
                threshold: 0.1
            }
        );

        observer.observe(sentinelRef.current);

        return () => {
            if (sentinelRef.current) {
                observer.unobserve(sentinelRef.current);
            }
        };
    }, [hasMoreData, isLoading, isSearch, initialLoadDone]);

    return (
        <div class="view" ref={rootRef} style={'position:relative;'}>
            <StickerPreviewProvider>
                <>
                    {isLoading && !initialLoadDone && <Loader/>}

                    <div>
                        <div className={"field"}>
                            <div className="field__emoji">{emoji}</div>
                            <input onInput={(e) => {
                                setSearchText(e.currentTarget.value)
                            }}
                                   value={searchText}
                                   placeholder={'Search stickerpacks...'}
                                   className={'field__input'}
                                   type="text"/>
                        </div>
                    </div>

                    {isSearch && (
                        <div>
                            {isSearchLoading && <Loader/>}

                            {searchError && (
                                <div className="center" style="padding: 1rem; color: #f44336;">
                                    {searchError}
                                </div>
                            )}

                            {!isSearchLoading && !searchError && searchResults.length === 0 && searchText.trim() && (
                                <div className="center" style="padding: 1rem; color: #666;">
                                    No stickerpacks found for "{searchText}"
                                </div>
                            )}

                            {!isSearchLoading && searchResults.length > 0 && (
                                <div>
                                    <div style="padding: 0.5rem 1rem; color: #666; font-size: 0.9rem;">
                                        Found {searchResults.length} stickerpack{searchResults.length !== 1 ? 's' : ''}
                                    </div>
                                    {searchResults.map((stickerpack: IStickerpack) => {
                                        const stickerData = getStickerpackData(stickerpack.id);

                                        if (!stickerData) return (
                                            <div key={stickerpack.id} style="padding: 1rem;">
                                                <Loader/>
                                            </div>
                                        );

                                        return (
                                            <Stickerpack
                                                compact={stickerPicker.compactViewInExplore}
                                                key={stickerpack.id}
                                                stickerpack={stickerpack}
                                                stickers={stickerData}
                                            />
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {!isSearch && currentStickerpacks.length === 0 && stickersLoaded && !isLoading && (
                        <div className={"center"}>
                            <div style={{
                                marginBottom: "1rem",
                            }}>
                                No stickers available for exploration...
                            </div>
                        </div>
                    )}

                    {!isSearch && currentStickerpacks.map((stickerpack: IStickerpack) => {
                        const stickerData = getStickerpackData(stickerpack.id);

                        if (!stickerData) return <div key={stickerpack.id}>
                            Cant load stickerpack data
                        </div>;

                        return (
                            <Stickerpack
                                compact={stickerPicker.compactViewInExplore}
                                key={stickerpack.id}
                                stickerpack={stickerpack}
                                stickers={stickerData}
                            />
                        );
                    })}

                    {!isSearch && hasMoreData && (
                        <div
                            class={"rel"}
                            style={"display: block; height: 10px; position: relative;"}
                            ref={sentinelRef}
                        >
                            {isLoading && initialLoadDone ? <Loader/> : null}
                        </div>
                    )}

                    {!isSearch && !hasMoreData && currentStickerpacks.length > 0 && (
                        <div className={"center"} style="padding: 2rem;">
                            <div style="color: #666; font-size: 0.9rem;">
                                All stickerpacks loaded
                            </div>
                        </div>
                    )}

                    <style>
                        {`
                .rel::before{
                    // content: "";
                    z-index: 12;
                    position: absolute;
                    bottom: 0;
                    height: 300px;
                    width: 100%;
                    background: rgba(255, 0,0,0.1);
                    transition: 1.3s;
                }
                `}
                    </style>
                </>
            </StickerPreviewProvider>
        </div>
    );
}