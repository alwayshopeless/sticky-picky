import {type ComponentChildren, createContext} from 'preact';
import {useContext, useEffect, useMemo, useState} from 'preact/hooks';

export type StickerPickerTheme = 'light' | 'dark' | 'system';

export type BackendAuthData = {
    matrixUserId: string;
    token: string;
};

export type StickerPickerSettings = {
    stickersPerRow: number;
    theme: StickerPickerTheme;
    userData: BackendAuthData | null;
    savedStickerpacks: number[];
    sentStickerSize: number; // новое поле
};

export type StickerPickerContextValue = Omit<StickerPickerSettings, 'userData'> & {
    userData: BackendAuthData | null;
    setUserData: (data: BackendAuthData | null) => void;
    setStickersPerRow: (n: number) => void;
    setTheme: (t: StickerPickerTheme) => void;
    setSavedStickerpacks: (val: number[]) => void;
    setSentStickerSize: (size: number) => void; // новая функция
};

const DEFAULT_VALUE: StickerPickerContextValue = {
    stickersPerRow: 6,
    theme: 'light',
    userData: null,
    savedStickerpacks: [],
    sentStickerSize: 128, // дефолтный размер
    setStickersPerRow: () => {},
    setTheme: () => {},
    setUserData: () => {},
    setSavedStickerpacks: () => {},
    setSentStickerSize: () => {},
};

export const StickerPickerContext = createContext<StickerPickerContextValue>(DEFAULT_VALUE);

export type StickerPickerProviderProps = {
    children: ComponentChildren;
    initialStickersPerRow?: number;
    initialTheme?: StickerPickerTheme;
    minPerRow?: number;
    maxPerRow?: number;
    storageKey?: string;
    initialSentStickerSize?: number; // новый проп
};

export function StickerPickerProvider({
    children,
    initialStickersPerRow = 6,
    initialTheme = 'light',
    minPerRow = 3,
    maxPerRow = 12,
    storageKey = 'stickerPickerSettings',
    initialSentStickerSize = 128, // дефолтный размер
}: StickerPickerProviderProps) {
    const clamp = (n: number) => Math.max(minPerRow, Math.min(maxPerRow, Math.floor(n)));

    const loadFromStorage = (): StickerPickerSettings | null => {
        try {
            const raw = localStorage.getItem(storageKey);
            if (raw) return JSON.parse(raw);
        } catch {}
        return null;
    };

    const stored = loadFromStorage();

    const [stickersPerRow, _setStickersPerRow] = useState<number>(
        stored ? clamp(stored.stickersPerRow) : clamp(initialStickersPerRow)
    );
    const [theme, _setTheme] = useState<StickerPickerTheme>(stored?.theme || initialTheme);
    const [userData, setUserData] = useState<BackendAuthData | null>(stored?.userData || null);
    const [savedStickerpacks, setSavedStickerpacks] = useState<number[]>(stored?.savedStickerpacks || []);
    const [sentStickerSize, setSentStickerSize] = useState<number>(stored?.sentStickerSize || initialSentStickerSize);

    const setStickersPerRow = (n: number) => _setStickersPerRow(clamp(n));
    const setTheme = (t: StickerPickerTheme) => _setTheme(t);

    useEffect(() => {
        try {
            const data: StickerPickerSettings = {stickersPerRow, theme, userData, savedStickerpacks, sentStickerSize};
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {}
    }, [stickersPerRow, theme, userData, savedStickerpacks, sentStickerSize, storageKey]);

    useEffect(() => {
        document.body.classList.remove('light', 'dark');
        if (theme === 'light') {
            document.body.classList.add('light');
        } else if (theme === 'dark') {
            document.body.classList.add('dark');
        }
    }, [theme]);

    useEffect(() => {
        document.documentElement.style.setProperty("--stickers-per-row", stickersPerRow.toString());
    }, [stickersPerRow]);

    const value = useMemo<StickerPickerContextValue>(
        () => ({
            stickersPerRow, setStickersPerRow,
            theme, setTheme,
            userData, setUserData,
            savedStickerpacks, setSavedStickerpacks,
            sentStickerSize, setSentStickerSize
        }),
        [stickersPerRow, theme, userData, savedStickerpacks, sentStickerSize]
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
