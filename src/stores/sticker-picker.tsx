import {create} from 'zustand';
import {persist} from 'zustand/middleware';
import {applyTheme} from '../utils/themes.ts';
import type {ThemeName} from '../types/themes.ts';

export type BackendAuthData = {
    matrixUserId: string;
    token: string;
};

export type MatrixAuthData = {
    homeserver: string;
    accessToken: string;
};

export type StickerPickerSettings = {
    stickersPerRow: number;
    theme: ThemeName | string | null;
    userData: BackendAuthData | null;
    matrixAuthData: MatrixAuthData | null;
    sentStickerSize: number;
    compactViewInExplore: boolean;
};

export type StickerPickerStore = StickerPickerSettings & {
    setStickersPerRow: (n: number) => void;
    setTheme: (t: ThemeName | string | null) => void;
    setMatrixAuthData: (data: MatrixAuthData | null) => void;
    setUserData: (data: BackendAuthData | null) => void;
    setSentStickerSize: (size: number) => void;
    setCompactViewInExplore: (val: boolean) => void;
};

type Options = {
    minPerRow?: number;
    maxPerRow?: number;
    storageKey?: string;
};

const DEFAULT_OPTIONS: Required<Options> = {
    minPerRow: 1,
    maxPerRow: 16,
    storageKey: 'stickerPickerSettings',
};

export const createStickerPickerStore = (
    initial?: Partial<StickerPickerSettings>,
    options?: Options
) => {
    const {minPerRow, maxPerRow, storageKey} = {...DEFAULT_OPTIONS, ...options};
    const clamp = (n: number) =>
        Math.max(minPerRow, Math.min(maxPerRow, Math.floor(n)));

    return create<StickerPickerStore>()(
        persist(
            (set) => ({
                stickersPerRow: clamp(initial?.stickersPerRow ?? 6),
                theme: initial?.theme ?? 'ligth',
                matrixAuthData: initial?.matrixAuthData ?? null,
                userData: initial?.userData ?? null,
                sentStickerSize: initial?.sentStickerSize ?? 128,
                compactViewInExplore: initial?.compactViewInExplore ?? false,

                setStickersPerRow: (n) => {
                    const v = clamp(n);
                    set({stickersPerRow: v});
                    document.documentElement.style.setProperty(
                        '--stickers-per-row',
                        v.toString()
                    );
                },
                setMatrixAuthData: (data) => {
                    set({matrixAuthData: data});
                },
                setTheme: (t) => {
                    set({theme: t});
                    applyTheme(t);
                },
                setUserData: (data) => set({userData: data}),
                setSentStickerSize: (size) => set({sentStickerSize: size}),
                setCompactViewInExplore: (val) =>
                    set({compactViewInExplore: val}),
            }),
            {
                name: storageKey,
                version: 1,
                onRehydrateStorage: () => (state) => {
                    if (state?.theme) {
                        applyTheme(state.theme);
                    }
                    if (state?.stickersPerRow) {
                        document.documentElement.style.setProperty(
                            '--stickers-per-row',
                            state.stickersPerRow.toString()
                        );
                    }
                },
            }
        )
    );
};

export const useStickerPicker = createStickerPickerStore();
