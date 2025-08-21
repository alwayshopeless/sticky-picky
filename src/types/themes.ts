import type {themes} from "../config/themes.ts";

export type ThemeName = keyof typeof themes;

export interface Theme {
    bgMain: string;
    bgSecondary: string;
    bgThird: string;
    textMain: string;
    iconColor: string;
    success: string;
    loadingGradient1: string;
    loadingGradient2: string;
    loadingGradient3: string;
    stickersPerRow?: number;
}