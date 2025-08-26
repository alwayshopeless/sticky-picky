import {createContext} from "preact";
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
    startPress: (e: PointerEvent) => void;
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
    const pressTimeout = useRef<number | null>(null);
    const longPressReady = useRef(false);


    const tooltipsRef = useRef<any>(null);

    const registerSticker = (data: StickerData) => {
        stickers.current.push(data);
    };

    const unregisterSticker = (element: HTMLElement) => {
        stickers.current = stickers.current.filter(s => s.element !== element);
    };


    const startPress = (e: PointerEvent) => {
        if (e.button === 2) return;

        pressing.current = true;
        longPressReady.current = false;

        const handlePointerMove = (moveEvent: PointerEvent) => {
            if (!pressing.current || !longPressReady.current) return;

            for (const s of stickers.current) {
                const rect = s.element.getBoundingClientRect();
                if (
                    moveEvent.clientX >= rect.left &&
                    moveEvent.clientX <= rect.right &&
                    moveEvent.clientY >= rect.top &&
                    moveEvent.clientY <= rect.bottom
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
            longPressReady.current = false;

            if (pressTimeout.current !== null) {
                clearTimeout(pressTimeout.current);
                pressTimeout.current = null;
            }

            document.removeEventListener("pointermove", handlePointerMove);
            document.removeEventListener("pointerup", handlePointerUp);

            // setCurrentSrc(null);
            // setCurrentStickerData(null);
        };

        document.addEventListener("pointermove", handlePointerMove, {passive: true});
        document.addEventListener("pointerup", handlePointerUp);

        // Таймер для долгого нажатия
        pressTimeout.current = window.setTimeout(() => {
            if (!pressing.current) return;
            longPressReady.current = true;
            pressTimeout.current = null;
        }, 300);
    };

    const cancelPress = () => {
        pressing.current = false;
        longPressReady.current = false;

        if (pressTimeout.current !== null) {
            clearTimeout(pressTimeout.current);
            pressTimeout.current = null;
        }


        // setCurrentSrc(null);
        // setCurrentStickerData(null);
    };

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                currentSrc
                && tooltipsRef.current
                && !tooltipsRef.current.contains(e.target as Node)
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
