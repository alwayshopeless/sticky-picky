import {useEffect, useMemo, useRef, useState} from "preact/hooks";
import {useMatrix} from "../contexts/matrix-widget-api-context.tsx";
import {useStickerPreview} from "../contexts/sticker-preview-context.tsx";
import {useStickerPicker} from "../contexts/sticker-picker-context.tsx";

export function Sticker({sticker, repository}: { sticker: any; repository: string }) {
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const buildThumbnailUrl = () =>
        `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;

    const [loaded, setLoaded] = useState(false);
    const src = useMemo(() => buildThumbnailUrl(), []);
    const elRef = useRef<HTMLDivElement>(null);

    const {registerSticker, unregisterSticker, startPress} = useStickerPreview();

    useEffect(() => {
        if (!elRef.current) return;
        registerSticker({sticker, src, element: elRef.current});
        return () => {
            if (elRef.current) unregisterSticker(elRef.current);
        };
    }, [elRef.current]);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => setLoaded(true);
    }, []);

    const sendSticker = () => {
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
                        w: stickerPicker.sentStickerSize,
                        h: stickerPicker.sentStickerSize,
                    },
                },
                name: sticker.body,
            },
        });
    };

    return (
        <div
            ref={elRef}
            class={"sticker " + (!loaded ? " loading" : "")}
            onPointerDown={startPress}
            onClick={sendSticker}
        >
            {loaded && <img className="sticker__img" src={src} alt=""/>}
        </div>
    );
}
