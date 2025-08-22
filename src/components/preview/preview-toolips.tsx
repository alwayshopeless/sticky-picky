import {Heart, SendHorizonal, X} from "lucide-preact";
import {useStickerPreview} from "../../contexts/sticker-preview-context.tsx";
import {useStickerCollections} from "../../contexts/sticker-collections-context.tsx";

interface PreviewTooltips {

}

export function PreviewTooltips({}) {
    const previewContext = useStickerPreview();
    const stickerCollections = useStickerCollections();
    return <div className={'tooltip-buttons'}>
        <button className={"btn btn--flat btn--tooltip"}
        >
            <SendHorizonal size={14}/>
            Send
        </button>
        <button className={"btn btn--flat btn--tooltip"}
                onClick={() => {
                    stickerCollections.addToFavorites(previewContext.currentStickerData.sticker);
                }}
        >
            <Heart size={14}/>
            Add to favorites
        </button>
        <button className={"btn btn--flat"} onClick={() => {
            previewContext.setCurrentSrc(null);
        }}>
            <X size={14} class={""}/>
            Close
        </button>

    </div>;
}