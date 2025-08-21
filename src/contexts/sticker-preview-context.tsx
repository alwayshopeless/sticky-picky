import { createContext } from "preact";
import { useState, useRef, useEffect, useContext } from "preact/hooks";

type StickerData = {
    sticker: any;
    src: string;
    element: HTMLElement;
};

type StickerPreviewContextType = {
    registerSticker: (data: StickerData) => void;
    unregisterSticker: (element: HTMLElement) => void;
    startPress: () => void;
    cancelPress: () => void;
    currentSrc: string | null;
};

const StickerPreviewContext = createContext<StickerPreviewContextType | null>(null);

export function StickerPreviewProvider({ children }: { children: any }) {
    const [currentSrc, setCurrentSrc] = useState<string | null>(null);
    const stickers = useRef<StickerData[]>([]);
    const pressing = useRef(false);
    const timer = useRef<number | null>(null);

    const registerSticker = (data: StickerData) => {
        stickers.current.push(data);
    };

    const unregisterSticker = (element: HTMLElement) => {
        stickers.current = stickers.current.filter(s => s.element !== element);
    };

    const startPress = () => {
        pressing.current = true;
        timer.current = window.setTimeout(() => {
            if (pressing.current) setCurrentSrc(null); // показываем пустую модалку сразу
        }, 200); // задержка long press
    };

    const cancelPress = () => {
        pressing.current = false;
        if (timer.current) clearTimeout(timer.current);
        timer.current = null;
        setCurrentSrc(null);
    };

    useEffect(() => {
        const handlePointerUp = () => cancelPress();

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
                    }
                    break;
                }
            }
        };

        document.addEventListener("pointerup", handlePointerUp);
        document.addEventListener("pointermove", handlePointerMove);

        return () => {
            document.removeEventListener("pointerup", handlePointerUp);
            document.removeEventListener("pointermove", handlePointerMove);
        };
    }, [currentSrc]);

    return (
        <StickerPreviewContext.Provider
            value={{ registerSticker, unregisterSticker, startPress, cancelPress, currentSrc }}
        >
            {children}
            {currentSrc && (
                <div className="sticker-preview-modal">
                    <img src={currentSrc} alt="" className="sticker-preview-img" />
                    <style>
                        {`
                        .sticker-preview-modal {
                            position: fixed;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            display: flex;
                            justify-content: center;
                            align-items: center;
                            background: rgba(0,0,0,0.5);
                            z-index: 9999;
                        }
                        .sticker-preview-img {
                            max-width: 90%;
                            max-height: 90%;
                        }
                        `}
                    </style>
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
