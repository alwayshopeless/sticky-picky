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
};

export type StickerPickerContextValue = Omit<StickerPickerSettings, 'userData'> & {
    userData: BackendAuthData | null;
    setUserData: (data: BackendAuthData | null) => void;
    setStickersPerRow: (n: number) => void;
    setTheme: (t: StickerPickerTheme) => void;
    savedStickerpacks: number[],
    setSavedStickerpacks: (val: number[]) => void,
};

const DEFAULT_VALUE: StickerPickerContextValue = {
    stickersPerRow: 6,
    theme: 'light',
    userData: null,
    setStickersPerRow: () => {
    },
    setTheme: () => {
    },
    setUserData: () => {
    },
    savedStickerpacks: [],
    setSavedStickerpacks: () => {
    },
};

export const StickerPickerContext = createContext<StickerPickerContextValue>(DEFAULT_VALUE);

export type StickerPickerProviderProps = {
    children: ComponentChildren;
    initialStickersPerRow?: number;
    initialTheme?: StickerPickerTheme;
    minPerRow?: number;
    maxPerRow?: number;
    storageKey?: string;
};

export function StickerPickerProvider({
                                          children,
                                          initialStickersPerRow = 6,
                                          initialTheme = 'light',
                                          minPerRow = 3,
                                          maxPerRow = 12,
                                          storageKey = 'stickerPickerSettings',
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
    const [theme, _setTheme] = useState<StickerPickerTheme>(stored?.theme || initialTheme);
    const [userData, setUserData] = useState<BackendAuthData | null>(stored?.userData || null);
    const [savedStickerpacks, setSavedStickerpacks] = useState<number[]>([]);

    const setStickersPerRow = (n: number) => _setStickersPerRow(clamp(n));
    const setTheme = (t: StickerPickerTheme) => _setTheme(t);

    useEffect(() => {
        try {
            const data: StickerPickerSettings = {stickersPerRow, theme, userData, savedStickerpacks};
            localStorage.setItem(storageKey, JSON.stringify(data));
        } catch {
        }
    }, [stickersPerRow, theme, userData, savedStickerpacks, storageKey]);

    const value = useMemo<StickerPickerContextValue>(
        () => ({
            stickersPerRow, setStickersPerRow,
            theme, setTheme,
            userData, setUserData,
            savedStickerpacks, setSavedStickerpacks
        }),
        [stickersPerRow, theme, userData, savedStickerpacks]
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
