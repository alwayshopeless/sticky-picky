import {useMatrix} from "../contexts/matrix-widget-api-context.tsx";

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

    return <div class={"sticker"} onClick={sendSticker}>
        <img class={"sticker__img"} src={buildThumbnailUrl()} alt=""/>
    </div>;
}