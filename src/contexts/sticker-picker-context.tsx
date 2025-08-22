import {type ComponentChildren, createContext} from 'preact';
import {useContext, useEffect, useMemo, useState} from 'preact/hooks';
import {applyTheme} from "../utils/themes.ts";
import type {ThemeName} from "../types/themes.ts";

export type BackendAuthData = {
    matrixUserId: string;
    token: string;
};

export type StickerPickerSettings = {
    stickersPerRow: number;
    theme: ThemeName | string | null;
    userData: BackendAuthData | null;
    sentStickerSize: number;
    compactViewInExplore: boolean;
};

export type StickerPickerContextValue = Omit<StickerPickerSettings, 'userData'> & {
    userData: BackendAuthData | null;
    setUserData: (data: BackendAuthData | null) => void;
    setStickersPerRow: (n: number) => void;
    setTheme: (t: ThemeName | string | null) => void;
    setSentStickerSize: (size: number) => void;
    setCompactViewInExplore: (val: boolean) => void;
};

const DEFAULT_VALUE: StickerPickerContextValue = {
    stickersPerRow: 6,
    theme: 'light',
    userData: null,
    sentStickerSize: 128,
    compactViewInExplore: false,
    setStickersPerRow: () => {
    },
    setTheme: () => {
    },
    setUserData: () => {
    },
    setSentStickerSize: () => {
    },
    setCompactViewInExplore: () => {
    },
};

export const StickerPickerContext = createContext<StickerPickerContextValue>(DEFAULT_VALUE);

export type StickerPickerProviderProps = {
    children: ComponentChildren;
    initialStickersPerRow?: number;
    initialTheme?: ThemeName | string | null;
    minPerRow?: number;
    maxPerRow?: number;
    storageKey?: string;
    initialSentStickerSize?: number;
    initialCompactViewInExplore?: boolean;
};

export function StickerPickerProvider({
                                          children,
                                          initialStickersPerRow = 6,
                                          initialTheme = 'light',
                                          minPerRow = 1,
                                          maxPerRow = 16,
                                          storageKey = 'stickerPickerSettings',
                                          initialSentStickerSize = 128,
                                          initialCompactViewInExplore = false,
                                      }: StickerPickerProviderProps) {
    const clamp = (n: number) => Math.max(minPerRow, Math.min(maxPerRow, Math.floor(n)));

    const loadFromStorage = (): StickerPickerSettings | null => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) return JSON.parse(raw);
        } catch {
        }
        return null;
    };

    const stored = loadFromStorage();

    const [stickersPerRow, _setStickersPerRow] = useState<number>(
        stored ? clamp(stored.stickersPerRow) : clamp(initialStickersPerRow)
    );
    const [theme, _setTheme] = useState<ThemeName | string | null>(stored?.theme || initialTheme);
    const [userData, setUserData] = useState<BackendAuthData | null>(stored?.userData || null);
    const [sentStickerSize, setSentStickerSize] = useState<number>(stored?.sentStickerSize || initialSentStickerSize);
    const [compactViewInExplore, setCompactViewInExplore] = useState<boolean>(
        stored?.compactViewInExplore ?? initialCompactViewInExplore
    );

    const setStickersPerRow = (n: number) => _setStickersPerRow(clamp(n));
    const setTheme = (t: ThemeName | string | null) => _setTheme(t);

    useEffect(() => {
        try {
            const data: StickerPickerSettings = {
                stickersPerRow,
                theme,
                userData,
                sentStickerSize,
                compactViewInExplore,
            };
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
        }
    }, [stickersPerRow, theme, userData, sentStickerSize, compactViewInExplore, storageKey]);

    useEffect(() => {
        applyTheme(theme);
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty("--stickers-per-row", stickersPerRow.toString());
    }, [stickersPerRow]);

    const value = useMemo<StickerPickerContextValue>(
        () => {
            return {
                stickersPerRow, setStickersPerRow,
                theme, setTheme,
                userData, setUserData,
                sentStickerSize, setSentStickerSize,
                compactViewInExplore, setCompactViewInExplore,
            };
        },
        [stickersPerRow, theme, userData, sentStickerSize, compactViewInExplore]
    );

    return (
        <StickerPickerContext.Provider value={value}>
            {children}
        </StickerPickerContext.Provider>
    );
}

export function useStickerPicker() {
    return useContext(StickerPickerContext);
}