import {themes} from "../config/themes.ts";
import type {ThemeName} from "../types/themes.ts";

export function applyTheme(themeName: ThemeName | string | null) {
    //@ts-ignore
    const theme = themes[themeName] ?? themes.dark;
    if (!theme) {
        console.warn(`Тема "${themeName}" не найдена`);
        return;
    }

    const root = document.documentElement;

    Object.entries(theme).forEach(([key, value]: any) => {
        const cssVar = "--" + key.replace(/[A-Z0-9]/g, (m: string) => "-" + m.toLowerCase());
        root.style.setProperty(cssVar, value);
    });
}