import {createContext, createRef} from "preact";
import {useContext, useEffect, useRef, useState} from "preact/hooks";
import {PreviewTooltips} from "../components/preview/preview-toolips.tsx";

type StickerData = {
    sticker: any;
    src: string;
    element: HTMLElement;
    sendSticker: () => void,
};

type StickerPreviewContextType = {
    registerSticker: (data: StickerData) => void;
    unregisterSticker: (element: HTMLElement) => void;
    startPress: () => void;
    cancelPress: () => void;
    currentSrc: string | null;
    setCurrentSrc: (val: string | null) => void;
    currentStickerData: StickerData | null;
};

const StickerPreviewContext = createContext<StickerPreviewContextType | null>(null);


export function StickerPreviewProvider({children}: { children: any }) {
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);
    const [currentStickerData, setCurrentStickerData] = useState<StickerData | null>(null);
    const stickers = useRef<StickerData[]>([]);
    const pressing = useRef(false);

    const tooltipsRef = createRef<HTMLDivElement>();

    const registerSticker = (data: StickerData) => {
        stickers.current.push(data);
    };

    const unregisterSticker = (element: HTMLElement) => {
        stickers.current = stickers.current.filter(s => s.element !== element);
    };

    const startPress = () => {
        pressing.current = true;

        const handlePointerMove = (e: PointerEvent) => {
            if (!pressing.current) return;

            for (const s of stickers.current) {
                const rect = s.element.getBoundingClientRect();
                if (
                    e.clientX >= rect.left &&
                    e.clientX <= rect.right &&
                    e.clientY >= rect.top &&
                    e.clientY <= rect.bottom
                ) {
                    if (currentSrc !== s.src) {
                        setCurrentSrc(s.src);
                        setCurrentStickerData(s);
                    }
                    break;
                }
            }
        };

        const handlePointerUp = () => {
            pressing.current = false;
            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);
        };

        document.addEventListener("pointermove", handlePointerMove);
        document.addEventListener("pointerup", handlePointerUp);
    };

    const cancelPress = () => {
        pressing.current = false;
    };

    // Обработчик клика вне модалки
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                currentSrc &&
                tooltipsRef.current &&
                !tooltipsRef.current.contains(e.target as Node)
            ) {
                setCurrentSrc(null);
                setCurrentStickerData(null);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [currentSrc]);

    return (
        <StickerPreviewContext.Provider
            value={{
                registerSticker,
                unregisterSticker,
                startPress,
                cancelPress,
                currentSrc,
                currentStickerData,
                setCurrentSrc
            }}
        >
            {children}
            {currentSrc && (
                <div className="sticker-preview-modal">
                    <div style={"font-size: 2rem;"}>
                        {currentStickerData?.sticker.body}
                    </div>
                    <img src={currentSrc} alt="" className="sticker-preview-img"/>
                    <div ref={tooltipsRef}>
                        <PreviewTooltips sendSticker={currentStickerData?.sendSticker ?? (() => {
                        })}/>
                    </div>
                </div>
            )}
        </StickerPreviewContext.Provider>
    );
}

export const useStickerPreview = () => {
    const context = useContext(StickerPreviewContext);
    if (!context) throw new Error("useStickerPreview must be used within StickerPreviewProvider");
    return context;
};
