import {Heart, HeartOff, SendHorizonal, Trash2, X} from "lucide-preact";
import {useStickerPreview} from "../../contexts/sticker-preview-context.tsx";
import {useMemo} from "preact/hooks";
import {useStickerCollections} from "../../stores/sticker-collections.tsx";


export function PreviewTooltips({sendSticker}: {
    sendSticker: () => void,
}) {
    const previewContext = useStickerPreview();
    const stickerCollections = useStickerCollections();
    const isFavorite = useMemo(() => {
        return stickerCollections.favoriteStickers.find((item: any) => item.url == previewContext?.currentStickerData?.sticker?.url) ? true : false;
    }, [previewContext.currentStickerData?.sticker?.id])
    const isRecently = useMemo(() => {
        return stickerCollections.recentStickers.find((item: any) => item.url == previewContext?.currentStickerData?.sticker?.url) ? true : false;
    }, [previewContext.currentStickerData?.sticker?.id])
    return <div className={'tooltip-buttons'}>
        <button className={"btn btn--flat btn--tooltip"}
                onClick={() => {
                    sendSticker();
                    previewContext.setCurrentSrc(null);
                }}
        >
            <SendHorizonal size={14}/>
            Send
        </button>
        <button className={"btn btn--flat btn--tooltip"}
                onClick={() => {
                    if (isFavorite) {
                        stickerCollections.removeFromFavorites(previewContext?.currentStickerData?.sticker);
                    } else {
                        stickerCollections.addToFavorites(previewContext?.currentStickerData?.sticker);
                    }
                    previewContext.setCurrentSrc(null);
                }}
        >
            {!isFavorite ? <Heart size={14}/> : <HeartOff size={14}/>}
            {isFavorite ? "Remove from favorites" : "Add to favorites"}
        </button>

        {isRecently ? <button className={"btn btn--flat btn--tooltip"}
                              onClick={() => {
                                  if (isRecently) {
                                      stickerCollections.removeFromRecent(previewContext?.currentStickerData?.sticker);
                                  }
                                  previewContext.setCurrentSrc(null);
                              }}
        >
            <Trash2 size={14}/>
            Remove from recent
        </button> : null}

        <button className={"btn btn--flat"} onClick={() => {
            previewContext.setCurrentSrc(null);
        }}>
            <X size={14} class={""}/>
            Close
        </button>

    </div>;
}