import {useEffect, useRef, useState} from "preact/hooks";
import {useMatrix} from "../contexts/matrix-widget-api-context.tsx";
import {useStickerPreview} from "../contexts/sticker-preview-context.tsx";
import {useStickerPicker} from "../stores/sticker-picker.tsx";
import {useStickerCollections} from "../stores/sticker-collections.tsx";
import {getCachedMxcBlob, setCachedMxcBlob} from "@/utils/indexeddb-storage.ts";
import type {IStickerpack} from "@/types/stickerpack.ts";
import {buildStickerpackShareRef} from "@/utils/stickerpack-share.ts";

const ALWAYS_FETCH_MXC = true;
const mxcObjectUrlCache = new Map<string, string>();
const mxcRequestCache = new Map<string, Promise<string>>();

const getFileExtensionFromMimeType = (mimeType?: string) => {
    if (!mimeType) return "webm";

    const normalizedMimeType = mimeType.toLowerCase().split(";")[0].trim();
    const extensionMap: Record<string, string> = {
        "image/apng": "apng",
        "image/avif": "avif",
        "image/gif": "gif",
        "image/jpeg": "jpg",
        "image/png": "png",
        "image/svg+xml": "svg",
        "image/webm": "webm",
        "image/webp": "webp",
        "video/webm": "webm",
    };

    return extensionMap[normalizedMimeType]
        ?? normalizedMimeType.split("/")[1]?.replace("+xml", "").replace("jpeg", "jpg")
        ?? "webm";
};

const isImageMimeType = (mimeType?: string) => {
    return mimeType?.toLowerCase().startsWith("image/") ?? false;
};

const getStickerDimensions = (sticker: any, originalSize: { w: number; h: number } | null) => {
    const width = sticker?.info?.w ?? originalSize?.w ?? null;
    const height = sticker?.info?.h ?? originalSize?.h ?? null;

    if (!width || !height) {
        return null;
    }

    return {
        width: Number(width),
        height: Number(height),
    };
};

export function Sticker({sticker, repository, stickerpack}: { sticker: any; repository: string; stickerpack?: IStickerpack | null }) {
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    const {registerSticker, unregisterSticker, startPress, cancelPress} = useStickerPreview();

    const elRef = useRef<HTMLDivElement>(null);

    const buildThumbnailUrl = () =>
        `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`.replace("http://", "https://");

    const [loaded, setLoaded] = useState(false);
    const [src, setSrc] = useState(() => (
        ALWAYS_FETCH_MXC && sticker.url.startsWith("mxc://")
            ? ""
            : buildThumbnailUrl()
    ));
    const [shouldLoad, setShouldLoad] = useState(false);
    const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);

    const cacheObjectUrl = (mxcUrl: string, blob: Blob) => {
        const existingUrl = mxcObjectUrlCache.get(mxcUrl);
        if (existingUrl) {
            return existingUrl;
        }

        const objectUrl = URL.createObjectURL(blob);
        mxcObjectUrlCache.set(mxcUrl, objectUrl);
        return objectUrl;
    };
    //@ts-ignore
    const fetchMatrixThumbnail = async (mxcUrl: string) => {
        const cachedUrl = mxcObjectUrlCache.get(mxcUrl);
        if (cachedUrl) {
            if (cachedUrl !== src) setSrc(cachedUrl);
            return cachedUrl;
        }

        const cachedBlob = await getCachedMxcBlob(mxcUrl);
        if (cachedBlob) {
            const objectUrl = cacheObjectUrl(mxcUrl, cachedBlob);
            if (objectUrl !== src) setSrc(objectUrl);
            return objectUrl;
        }

        const existingRequest = mxcRequestCache.get(mxcUrl);
        if (existingRequest) {
            const objectUrl = await existingRequest;
            if (objectUrl !== src) setSrc(objectUrl);
            return objectUrl;
        }

        try {
            const requestId = `mxc-request-${Date.now()}+${mxcUrl}`;
            const requestPromise = new Promise<string>((resolve, reject) => {
                const handler = (event: any) => {
                    if (event.action !== "org.matrix.msc4039.download_file" || event.requestId !== requestId) {
                        return;
                    }

                    widget.off("org.matrix.msc4039.download_file", handler);

                    if (!event.response?.file) {
                        reject(new Error(`No file returned for ${mxcUrl}`));
                        return;
                    }

                    void setCachedMxcBlob(mxcUrl, event.response.file).catch((error) => {
                        console.error("Failed to persist MXC blob cache", error);
                    });

                    const url = cacheObjectUrl(mxcUrl, event.response.file);
                    resolve(url);
                };

                widget.on("org.matrix.msc4039.download_file", handler);
                widget.sendMessage({
                    api: "fromWidget",
                    action: "org.matrix.msc4039.download_file",
                    requestId,
                    widgetId: widget.widgetId,
                    data: {content_uri: mxcUrl, timeout_ms: 20000},
                });
            });

            mxcRequestCache.set(mxcUrl, requestPromise);
            const objectUrl = await requestPromise;
            if (objectUrl !== src) setSrc(objectUrl);
            return objectUrl;
        } catch (err) {
            console.error("Matrix thumbnail fetch failed", err);
            return null;
        } finally {
            mxcRequestCache.delete(mxcUrl);
        }
    };

    useEffect(() => {
        const element = elRef.current;
        if (!element) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (!entry?.isIntersecting) return;
                setShouldLoad(true);
                observer.disconnect();
            },
            {rootMargin: "300px"}
        );

        observer.observe(element);

        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        const element = elRef.current;
        if (!element) return;

        registerSticker({sticker: {...sticker, repository}, sendSticker, src, element});

        return () => unregisterSticker(element);
    }, [src, sticker, repository]);

    useEffect(() => {
        if (!shouldLoad) return;

        if (ALWAYS_FETCH_MXC && sticker.url.startsWith("mxc://")) {
            fetchMatrixThumbnail(sticker.url);
            return;
        }

        const img = new Image();
        img.src = src;
        img.onload = () => {
            setOriginalSize({w: img.naturalWidth, h: img.naturalHeight});
            setLoaded(true);
        };
        img.onerror = () => {
            if (sticker.url.startsWith("mxc://")) fetchMatrixThumbnail(sticker.url);
        };

    }, [shouldLoad, sticker.url]);

    useEffect(() => {
        if (!shouldLoad || !src) return;

        const img = new Image();
        img.src = src;
        img.onload = () => {
            setOriginalSize({w: img.naturalWidth, h: img.naturalHeight});
            setLoaded(true);
        };
    }, [shouldLoad, src]);

    const addStickerToRecent = () => {
        const tmpSticker = {...sticker, repository};
        delete tmpSticker["net.maunium.telegram.sticker"];
        delete tmpSticker.id;
        stickerCollections.addToRecent(tmpSticker);
    };

    const sendSticker = () => {
        const desiredSize = stickerPicker.sentStickerSize;
        const mimeType = sticker?.info?.mimetype;
        const stickerExtension = getFileExtensionFromMimeType(mimeType);
        const stickerDimensions = getStickerDimensions(sticker, originalSize);
        let width = desiredSize;
        let height = desiredSize;

        if (stickerDimensions) {
            const sourceMaxSide = Math.max(stickerDimensions.width, stickerDimensions.height);
            const scale = sourceMaxSide > 0 ? desiredSize / sourceMaxSide : 1;

            width = Math.max(1, Math.round(stickerDimensions.width * scale));
            height = Math.max(1, Math.round(stickerDimensions.height * scale));
        } else if (originalSize) {
            height = Math.round((originalSize.h / originalSize.w) * width);
        }

        const thumbnailInfo = isImageMimeType(mimeType)
            ? {
                w: sticker?.info?.thumbnail_info?.w ?? stickerDimensions?.width ?? width,
                h: sticker?.info?.thumbnail_info?.h ?? stickerDimensions?.height ?? height,
                size: sticker?.info?.thumbnail_info?.size ?? sticker?.info?.size,
                mimetype: sticker?.info?.thumbnail_info?.mimetype ?? mimeType,
            }
            : null;
        const resolvedStickerpack = stickerpack ?? sticker?.stickerpack ?? null;
        const stickerpackShareRef = resolvedStickerpack?.share_id
            ? buildStickerpackShareRef(resolvedStickerpack.share_id)
            : undefined;

        widget.sendMessage({
            widgetId: widget.widgetId,
            api: "fromWidget",
            action: "m.sticker",
            requestId: `sticker-${Date.now()}`,
            data: {
                content: {
                    ...sticker,
                    info: {
                        ...sticker.info,
                        w: width,
                        h: height,
                        ...(stickerpackShareRef ? {
                            stpk_ref: stickerpackShareRef,
                        } : {}),
                        ...(thumbnailInfo ? {
                            thumbnail_url: sticker?.info?.thumbnail_url ?? sticker.url,
                            thumbnail_info: thumbnailInfo,
                        } : {}),
                    },
                },
                name: `${sticker.body}.${stickerExtension}`,
            },
        });
        addStickerToRecent();
    };

    return (
        <div
            ref={elRef}
            class={"sticker " + (!loaded ? " loading" : "")}
            onPointerDown={(e) => startPress(e)}
            onPointerUp={cancelPress}
            onPointerLeave={cancelPress}
            onClick={sendSticker}
        >
            {loaded && <img className="sticker__img" src={src} alt=""/>}
        </div>
    );
}
