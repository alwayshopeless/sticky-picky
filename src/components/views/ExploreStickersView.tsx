import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useMemo, useRef, useState} from "preact/hooks";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";
import type {IStickerpack} from "../../types/stickerpack.ts";
import {StickerPreviewProvider} from "../../contexts/sticker-preview-context.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";
import {Loader} from "../loader.tsx";
import {SearchResult} from "../search-result.tsx";
import {buildHttpQuery} from "../../utils/url.ts";
import {loadStickerpackRaw} from "../../utils/stickers.ts";

export function ExploreStickersView() {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();

    const [exploreStickerpacks, setExploreStickerpacks] = useState<IStickerpack[]>([]);
    const [stickerpacksData, setStickerpacksData] = useState<Record<string, any[]>>({});

    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [hasMoreData, setHasMoreData] = useState<boolean>(true);
    const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);

    const [searchText, setSearchText] = useState<string>("");
    const isSearch = useMemo(() => searchText.trim() !== "", [searchText]);

    const ITEMS_PER_PAGE = 2;

    const loadExploreStickerpacks = async () => {
        if (!hasMoreData && !isSearch) return;
        if (isLoading) return;

        setIsLoading(true);

        try {
            const offset = page * ITEMS_PER_PAGE;

            const response = await apiRequest(`stickerpacks/all?${buildHttpQuery({
                offset: isSearch ? "0" : offset.toString(),
                limit: isSearch ? "100" : ITEMS_PER_PAGE.toString(),
                search: searchText,
            })}`);

            if (response.status === 200) {
                const data = await response.json();
                const fetchedPacks: Record<string, IStickerpack> = data.stickerpacks;
                setHasMoreData(data.hasMore);

                const fetchedIds = Object.keys(fetchedPacks);
                if (fetchedIds.length === 0) {
                    setHasMoreData(false);
                    setStickersLoaded(true);
                    return;
                }

                // новые пакеты
                const existingIds = exploreStickerpacks.map(p => p.id.toString());
                const newIds = fetchedIds.filter(id => !existingIds.includes(id));
                const newPacks = newIds.map(id => fetchedPacks[id]);

                // загрузка их содержимого
                const loadedData = await Promise.allSettled(
                    newPacks.map(async (pack) => {
                        const stickers = await loadStickerpackRaw(pack);
                        return {pack, stickers};
                    })
                );

                const successful = loadedData.filter(r => r.status === "fulfilled") as PromiseFulfilledResult<{pack: IStickerpack, stickers: any[]}>[];

                if (successful.length > 0) {
                    setExploreStickerpacks(prev => [...prev, ...successful.map(s => s.value.pack)]);
                    setStickerpacksData(prev => {
                        const updated = {...prev};
                        successful.forEach(s => {
                            updated[s.value.pack.id] = s.value.stickers ?? [];
                        });
                        return updated;
                    });
                }

                setPage(prev => prev + 1);
                setStickersLoaded(true);
                setInitialLoadDone(true);
            } else {
                setHasMoreData(false);
            }
        } catch (err) {
            console.error("Error loading explore stickerpacks:", err);
            setHasMoreData(false);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadExploreStickerpacks();
    }, [searchText]);

    const sentinelRef = useRef(null);
    const rootRef = useRef(null);

    useEffect(() => {
        if (!sentinelRef.current || isSearch) return;

        const observer = new IntersectionObserver(entries => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMoreData && !isLoading && initialLoadDone) {
                loadExploreStickerpacks();
            }
        }, {rootMargin: '100px', threshold: 0.1});

        observer.observe(sentinelRef.current);
        return () => {
            if (sentinelRef.current) observer.unobserve(sentinelRef.current);
        };
    }, [hasMoreData, isLoading, isSearch, initialLoadDone]);

    const [emoji, setEmoji] = useState<string>("");
    const _setEmoji = (s: string) => {
        setEmoji(s);
    };

    return (
        <div class="view" ref={rootRef} style={'position:relative;'}>
            <StickerPreviewProvider>
                <>
                    {isLoading && !initialLoadDone && <Loader/>}

                    <div>
                        <div className="field">
                            <div className="field__emoji">{emoji}</div>
                            <input
                                onInput={e => setSearchText(e.currentTarget.value)}
                                value={searchText}
                                placeholder="Search stickerpacks..."
                                className="field__input"
                                type="text"
                            />
                        </div>
                    </div>

                    {isSearch ? (
                        <SearchResult
                            setEmoji={_setEmoji}
                            searchText={searchText}
                            stickerpacks={exploreStickerpacks}
                            stickerpacksData={stickerpacksData}
                        />
                    ) : null}

                    {!isSearch && exploreStickerpacks.length === 0 && stickersLoaded && !isLoading && (
                        <div className="center">
                            <div style={{marginBottom: "1rem"}}>No stickers available for exploration...</div>
                        </div>
                    )}

                    {!isSearch && exploreStickerpacks.map(pack => (
                        <Stickerpack
                            compact={stickerPicker.compactViewInExplore}
                            key={pack.id}
                            stickerpack={pack}
                            stickers={stickerpacksData[pack.id] ?? []}
                        />
                    ))}

                    {!isSearch && hasMoreData && (
                        <div
                            class="rel"
                            style="display: block; height: 10px; position: relative;"
                            ref={sentinelRef}
                        >
                            {isLoading && initialLoadDone ? <Loader/> : null}
                        </div>
                    )}

                    {!isSearch && !hasMoreData && exploreStickerpacks.length > 0 && (
                        <div className="center" style="padding: 2rem;">
                            <div style="color: #666; font-size: 0.9rem;">All stickerpacks loaded</div>
                        </div>
                    )}
                </>
            </StickerPreviewProvider>
        </div>
    );
}
