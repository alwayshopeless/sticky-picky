import {useEffect, useMemo, useRef, useState} from "preact/hooks";
import {CircleFadingPlus, Loader2, X} from "lucide-preact";
import {apiRequest} from "@/api/backend-api.ts";
import type {IStickerpack} from "@/types/stickerpack.ts";
import {StickerPreviewProvider} from "../../contexts/sticker-preview-context.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {Loader} from "../loader.tsx";
import {SearchResult} from "../search-result.tsx";
import {buildHttpQuery} from "@/utils/url.ts";
import {buildThumbnailUrl, loadStickerpack, loadStickerpackRaw, useMatrixPreviewUrl} from "@/utils/stickers.ts";
import {Sticker} from "@/components/sticker.tsx";

function ExploreStickerpackPreview({
    stickerpack,
    previewSticker,
    loading,
    onOpen,
}: {
    stickerpack: IStickerpack;
    previewSticker: any | null | undefined;
    loading: boolean;
    onOpen: () => void;
}) {
    const previewUrl = previewSticker
        ? previewSticker.url?.startsWith("mxc://")
            ? previewSticker.url
            : buildThumbnailUrl(stickerpack.repository, previewSticker)
        : null;
    const {src, loading: imageLoading} = useMatrixPreviewUrl(previewUrl);

    return (
        <button
            type="button"
            class="explore-pack-card__preview"
            onClick={onOpen}
            title={`Open ${stickerpack.name}`}
        >
            {src ? (
                <img src={src} alt={stickerpack.name} class="explore-pack-card__img" />
            ) : (
                <div class="explore-pack-card__placeholder">
                    {loading || imageLoading ? <Loader2 size={18} class="rotation" /> : "No preview"}
                </div>
            )}
        </button>
    );
}

function ExploreStickerpackCard({
    stickerpack,
    previewSticker,
    previewLoading,
    onRequestPreview,
    onOpen,
}: {
    stickerpack: IStickerpack;
    previewSticker: any | null | undefined;
    previewLoading: boolean;
    onRequestPreview: (stickerpack: IStickerpack) => Promise<void>;
    onOpen: (stickerpack: IStickerpack) => void;
}) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    const isSaved = Boolean(stickerCollections.savedStickerpacks[stickerpack.id]);

    useEffect(() => {
        const element = cardRef.current;
        if (!element || previewSticker !== undefined || previewLoading) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) {
                    return;
                }

                observer.disconnect();
                void onRequestPreview(stickerpack);
            },
            {rootMargin: "240px"},
        );

        observer.observe(element);
        return () => observer.disconnect();
    }, [onRequestPreview, previewLoading, previewSticker, stickerpack]);

    const addStickerpack = async (event: Event) => {
        event.preventDefault();
        event.stopPropagation();

        try {
            const response = await apiRequest("user/stickerpack/attach", {
                method: "POST",
                body: JSON.stringify({
                    stickerpack_id: stickerpack.id,
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${stickerPicker?.userData?.token ?? ""}`,
                },
            });

            if (response.status === 200) {
                stickerCollections.addStickerpack(stickerpack);
                loadStickerpack(stickerpack, false, false);
            }
        } catch (error) {
            console.error("Error adding stickerpack:", error);
        }
    };

    return (
        <div ref={cardRef} class="explore-pack-card">
            <ExploreStickerpackPreview
                stickerpack={stickerpack}
                previewSticker={previewSticker}
                loading={previewLoading}
                onOpen={() => onOpen(stickerpack)}
            />

            <div class="explore-pack-card__content">
                <button
                    type="button"
                    class="explore-pack-card__title"
                    onClick={() => onOpen(stickerpack)}
                >
                    {stickerpack.name}
                </button>

                <div class="explore-pack-card__actions">
                    {!isSaved ? (
                        <button type="button" onClick={addStickerpack} class="btn btn--add-stick">
                            <CircleFadingPlus size={16}/>
                        </button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function ExploreStickerpackModal({
    stickerpack,
    stickers,
    loading,
    error,
    onClose,
}: {
    stickerpack: IStickerpack | null;
    stickers: any[];
    loading: boolean;
    error: string | null;
    onClose: () => void;
}) {
    const PAGE_SIZE = 8;
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
    const gridRef = useRef<HTMLDivElement | null>(null);
    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!stickerpack) {
            return;
        }

        setVisibleCount(PAGE_SIZE);
    }, [stickerpack?.id]);

    useEffect(() => {
        if (!stickerpack || loading || stickers.length <= visibleCount || !sentinelRef.current || !gridRef.current) {
            return;
        }

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) {
                    return;
                }

                setVisibleCount((current) => Math.min(current + PAGE_SIZE, stickers.length));
            },
            {root: gridRef.current, rootMargin: "80px"},
        );

        observer.observe(sentinelRef.current);
        return () => observer.disconnect();
    }, [loading, stickerpack, stickers.length, visibleCount]);

    useEffect(() => {
        if (!stickerpack) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [onClose, stickerpack]);

    if (!stickerpack) {
        return null;
    }

    const visibleStickers = stickers.slice(0, visibleCount);

    return (
        <div class="explore-pack-modal-backdrop" onClick={onClose}>
            <div class="explore-pack-modal" onClick={(event) => event.stopPropagation()}>
                <div class="explore-pack-modal__header">
                    <div class="explore-pack-modal__title-block">
                        <h3>{stickerpack.name}</h3>
                        {!loading && stickers.length > 0 ? (
                            <div class="explore-pack-modal__meta">
                                Showing {visibleStickers.length}/{stickers.length}
                            </div>
                        ) : null}
                    </div>

                    <button type="button" class="btn btn--flat" onClick={onClose} title="Close">
                        <X size={16}/>
                    </button>
                </div>

                {loading ? (
                    <div class="explore-pack-modal__state">
                        <Loader />
                    </div>
                ) : error ? (
                    <div class="explore-pack-modal__state color-danger">{error}</div>
                ) : stickers.length === 0 ? (
                    <div class="explore-pack-modal__state">No stickers in this pack.</div>
                ) : (
                    <div ref={gridRef} class="explore-pack-modal__grid">
                        <div class="stickerpack__body">
                            {visibleStickers.map((sticker: any) => (
                                <Sticker
                                    key={`${stickerpack.id}-${sticker.id ?? sticker.url}`}
                                    repository={stickerpack.repository}
                                    sticker={sticker}
                                    stickerpack={stickerpack}
                                />
                            ))}
                        </div>
                        {visibleCount < stickers.length ? (
                            <div ref={sentinelRef} class="explore-pack-modal__sentinel">
                                <Loader />
                            </div>
                        ) : null}
                    </div>
                )}
            </div>
        </div>
    );
}

export function ExploreStickersView() {
    const [exploreStickerpacks, setExploreStickerpacks] = useState<IStickerpack[]>([]);
    const [stickerpacksData, setStickerpacksData] = useState<Record<string, any[]>>({});
    const [previewStickers, setPreviewStickers] = useState<Record<number, any | null | undefined>>({});
    const [previewLoadingMap, setPreviewLoadingMap] = useState<Record<number, boolean>>({});
    const [selectedStickerpack, setSelectedStickerpack] = useState<IStickerpack | null>(null);
    const [selectedStickerpackLoading, setSelectedStickerpackLoading] = useState(false);
    const [selectedStickerpackError, setSelectedStickerpackError] = useState<string | null>(null);

    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [page, setPage] = useState<number>(0);
    const [hasMoreData, setHasMoreData] = useState<boolean>(true);
    const [initialLoadDone, setInitialLoadDone] = useState<boolean>(false);

    const [searchText, setSearchText] = useState<string>("");
    const isSearch = useMemo(() => searchText.trim() !== "", [searchText]);
    const selectedStickerpackStickers = selectedStickerpack ? (stickerpacksData[selectedStickerpack.id] ?? []) : [];

    const ITEMS_PER_PAGE = 7;

    const loadPreviewSticker = async (stickerpack: IStickerpack) => {
        if (previewLoadingMap[stickerpack.id] || previewStickers[stickerpack.id] !== undefined) {
            return;
        }

        setPreviewLoadingMap((prev) => ({...prev, [stickerpack.id]: true}));

        try {
            const stickers = await loadStickerpackRaw(stickerpack);
            setPreviewStickers((prev) => ({
                ...prev,
                [stickerpack.id]: stickers?.[0] ?? null,
            }));
        } catch (error) {
            console.error("Error loading explore stickerpack preview:", error);
            setPreviewStickers((prev) => ({
                ...prev,
                [stickerpack.id]: null,
            }));
        } finally {
            setPreviewLoadingMap((prev) => ({
                ...prev,
                [stickerpack.id]: false,
            }));
        }
    };

    const openStickerpack = async (stickerpack: IStickerpack) => {
        setSelectedStickerpack(stickerpack);
        setSelectedStickerpackError(null);

        const cachedStickers = stickerpacksData[stickerpack.id];
        if (cachedStickers) {
            return;
        }

        setSelectedStickerpackLoading(true);

        try {
            const stickers = await loadStickerpackRaw(stickerpack);
            setStickerpacksData((prev) => ({
                ...prev,
                [stickerpack.id]: stickers ?? [],
            }));
        } catch (error: any) {
            setSelectedStickerpackError(error?.message ?? "Failed to load stickerpack");
        } finally {
            setSelectedStickerpackLoading(false);
        }
    };

    const resetExploreState = () => {
        setExploreStickerpacks([]);
        setStickerpacksData({});
        setPreviewStickers({});
        setPreviewLoadingMap({});
        setPage(0);
        setHasMoreData(true);
        setInitialLoadDone(false);
        setStickersLoaded(false);
    };

    const loadExploreStickerpacks = async (requestedPage = page, searchMode = isSearch) => {
        if (!searchMode && !hasMoreData && requestedPage !== 0) return;
        if (isLoading) return;

        setIsLoading(true);

        try {
            const offset = requestedPage * ITEMS_PER_PAGE;

            const response = await apiRequest(`stickerpacks/all?${buildHttpQuery({
                offset: searchMode ? "0" : offset.toString(),
                limit: searchMode ? "100" : ITEMS_PER_PAGE.toString(),
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
                    setInitialLoadDone(true);
                    return;
                }

                const existingIds = requestedPage === 0 ? [] : exploreStickerpacks.map((pack) => pack.id.toString());
                const newIds = fetchedIds.filter((id) => !existingIds.includes(id));
                const newPacks = newIds.map((id) => fetchedPacks[id]);

                if (searchMode) {
                    const loadedData = await Promise.allSettled(
                        newPacks.map(async (pack) => {
                            const stickers = await loadStickerpackRaw(pack);
                            return {pack, stickers};
                        }),
                    );

                    const successful = loadedData.filter((result) => result.status === "fulfilled") as PromiseFulfilledResult<{
                        pack: IStickerpack;
                        stickers: any[];
                    }>[];

                    setExploreStickerpacks(successful.map((item) => item.value.pack));
                    setStickerpacksData(() => {
                        const updated: Record<string, any[]> = {};
                        successful.forEach((item) => {
                            updated[item.value.pack.id] = item.value.stickers ?? [];
                        });
                        return updated;
                    });
                } else if (newPacks.length > 0) {
                    setExploreStickerpacks((prev) => requestedPage === 0 ? newPacks : [...prev, ...newPacks]);
                }

                setPage(requestedPage + 1);
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
        resetExploreState();
        void loadExploreStickerpacks(0, isSearch);
    }, [searchText]);

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (!sentinelRef.current || isSearch) return;

        const observer = new IntersectionObserver((entries) => {
            const entry = entries[0];
            if (entry.isIntersecting && hasMoreData && !isLoading && initialLoadDone) {
                void loadExploreStickerpacks(page, false);
            }
        }, {rootMargin: "100px", threshold: 0.1});

        observer.observe(sentinelRef.current);
        return () => {
            if (sentinelRef.current) observer.unobserve(sentinelRef.current);
        };
    }, [hasMoreData, initialLoadDone, isLoading, isSearch, page]);

    const [emoji, setEmoji] = useState<string>("");
    const _setEmoji = (value: string) => {
        setEmoji(value);
    };

    return (
        <div class="view" style="position:relative;">
            <StickerPreviewProvider>
                <>
                    <ExploreStickerpackModal
                        stickerpack={selectedStickerpack}
                        stickers={selectedStickerpackStickers}
                        loading={selectedStickerpackLoading}
                        error={selectedStickerpackError}
                        onClose={() => {
                            setSelectedStickerpack(null);
                            setSelectedStickerpackError(null);
                            setSelectedStickerpackLoading(false);
                        }}
                    />

                    {isLoading && !initialLoadDone ? <Loader/> : null}

                    <div>
                        <div className="field">
                            <div className="field__emoji">{emoji}</div>
                            <input
                                onInput={(event) => setSearchText(event.currentTarget.value)}
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

                    {!isSearch && exploreStickerpacks.length === 0 && stickersLoaded && !isLoading ? (
                        <div className="center">
                            <div style={{marginBottom: "1rem"}}>No stickers available for exploration...</div>
                        </div>
                    ) : null}

                    {!isSearch ? (
                        <div class="explore-pack-grid">
                            {exploreStickerpacks.map((pack) => (
                                <ExploreStickerpackCard
                                    key={pack.id}
                                    stickerpack={pack}
                                    previewSticker={previewStickers[pack.id]}
                                    previewLoading={Boolean(previewLoadingMap[pack.id])}
                                    onRequestPreview={loadPreviewSticker}
                                    onOpen={openStickerpack}
                                />
                            ))}
                        </div>
                    ) : null}

                    {!isSearch && hasMoreData ? (
                        <div
                            class="rel"
                            style="display: block; height: 10px; position: relative;"
                            ref={sentinelRef}
                        >
                            {isLoading && initialLoadDone ? <Loader/> : null}
                        </div>
                    ) : null}

                    {!isSearch && !hasMoreData && exploreStickerpacks.length > 0 ? (
                        <div className="center" style="padding: 2rem;">
                            <div style="color: #666; font-size: 0.9rem;">All stickerpacks loaded</div>
                        </div>
                    ) : null}
                </>
            </StickerPreviewProvider>
        </div>
    );
}
