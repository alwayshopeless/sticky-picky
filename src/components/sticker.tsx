import {useMatrix} from "../contexts/matrix-widget-api-context.tsx";
import {useEffect, useMemo, useState} from "preact/hooks";

export function Sticker({sticker, repository}: { sticker: any, repository: string }) {
    const widget = useMatrix();
    const buildThumbnailUrl = () => {
        return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
    };

    const sendSticker = () => {
        widget.sendMessage({
            widgetId: widget.widgetId,
            api: "fromWidget",
            action: "m.sticker",
            requestId: `sticker-${Date.now()}`,
            data: {
                content: sticker,
                name: sticker.body,
            },
        });
        console.log(sticker);
    }

    const [loaded, setLoaded] = useState(false);

    const src = useMemo(() => {
        return buildThumbnailUrl();
    }, []);

    useEffect(() => {
        const img = new Image();
        img.src = src;
        img.onload = () => setLoaded(true);
    }, [src]);

    return <div class={"sticker" + (!loaded ? " loading" : "")} onClick={sendSticker}>
        {loaded ? <img className={"sticker__img"} src={src} alt=""/> : null}
    </div>;
}