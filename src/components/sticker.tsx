import {useEffect, useRef, useState} from "preact/hooks";
import {useMatrix} from "../contexts/matrix-widget-api-context.tsx";
import {useStickerPreview} from "../contexts/sticker-preview-context.tsx";
import {useStickerPicker} from "../stores/sticker-picker.tsx";
import {useStickerCollections} from "../stores/sticker-collections.tsx";

const ALWAYS_FETCH_MXC = true;

export function Sticker({sticker, repository}: { sticker: any; repository: string }) {
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    const {registerSticker, unregisterSticker, startPress, cancelPress} = useStickerPreview();

    const elRef = useRef<HTMLDivElement>(null);

    const buildThumbnailUrl = () =>
        `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`.replace("http://", "https://");

    const [loaded, setLoaded] = useState(false);
    const [src, setSrc] = useState(buildThumbnailUrl());
    const [isLoading, setIsLoading] = useState(false);
    const [originalSize, setOriginalSize] = useState<{ w: number; h: number } | null>(null);
    //@ts-ignore
    const fetchMatrixThumbnail = async (mxcUrl: string, width = 100, height = 100) => {
        if (isLoading) return;
        setIsLoading(true);

        try {
            const requestId = `mxc-request-${Date.now()}+${mxcUrl}`;
            widget.sendMessage({
                api: "fromWidget",
                action: "org.matrix.msc4039.download_file",
                requestId,
                widgetId: widget.widgetId,
                data: {content_uri: mxcUrl, timeout_ms: 20000},
            });

            const handler = (event: any) => {
                if (event.action === 'org.matrix.msc4039.download_file' && event.requestId == requestId && event.response?.file) {
                    const url = URL.createObjectURL(event.response.file);
                    let ni = new Image();
                    ni.src = url;
                    ni.onload = () => {
                        setOriginalSize({
                            w: ni.naturalWidth,
                            h: ni.naturalHeight
                        })
                        setLoaded(true);
                    };
                    if (url !== src) setSrc(url);
                }
            };

            widget.on("org.matrix.msc4039.download_file", handler);
            return () => {
                // widget.off("org.matrix.msc4039.download_file", handler)
            };

            /*
            // Download with legacy
            const mxcMatch = mxcUrl.match(/^mxc:\/\/([^/]+)\/(.+)$/);
            if (!mxcMatch || !stickerPicker.matrixAuthData?.accessToken) return;
            const [, homeserver, mediaId] = mxcMatch;
            const matrixUrl = `https://${stickerPicker.matrixAuthData.homeserver}/_matrix/client/v1/media/thumbnail/${homeserver}/${mediaId}?width=${width}&height=${height}&method=scale&allow_redirect=true`;
            const response = await fetch(matrixUrl, {
                headers: { Authorization: `Bearer ${stickerPicker.matrixAuthData.accessToken}` },
            });
            if (!response.ok) throw new Error("Failed to fetch matrix thumbnail");
            const blob = await response.blob();
            setSrc(URL.createObjectURL(blob));
            setLoaded(true);
            */
        } catch (err) {
            console.error("Matrix thumbnail fetch failed", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const element = elRef.current;
        if (!element) return;

        registerSticker({sticker: {...sticker, repository}, sendSticker, src, element});

        return () => unregisterSticker(element);
    }, [src, sticker, repository]);

    useEffect(() => {
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

    }, [sticker.url]);

    const addStickerToRecent = () => {
        const tmpSticker = {...sticker, repository};
        delete tmpSticker["net.maunium.telegram.sticker"];
        delete tmpSticker.id;
        stickerCollections.addToRecent(tmpSticker);
    };

    const sendSticker = () => {
        let width = stickerPicker.sentStickerSize;
        let height = width;

        if (originalSize) {
            height = Math.round((originalSize.h / originalSize.w) * width);
        }
        console.log(originalSize)

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
                    },
                },
                name: sticker.body,
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
