import type {Theme} from "../types/themes.ts";

export const themes: Record<string, Theme> = {
    light: {
        bgMain: "linear-gradient(135deg, #fafafa 0%, #f5f5f7 50%, #eeeeef 100%)",
        bgSecondary: "linear-gradient(135deg, #e8e8ed 0%, #dcdce1 100%)",
        bgThird: "linear-gradient(135deg, #667eea 0%, #4a6fff 100%)",
        textMain: "#1a1a1a",
        iconColor: "#1a1a1a50",
        success: "linear-gradient(135deg, #b8ffbc 0%, #a8f5ac 100%)",
        loadingGradient1: "#f5f5f7",
        loadingGradient2: "#a175f5",
        loadingGradient3: "#667eea",
        stickersPerRow: 4
    },
    dark: {
        bgMain: "#101317",
        bgSecondary: "#1d1f24",
        bgThird: "#3656ff",
        textMain: "#ffffff",
        iconColor: "#656c76",
        success: "#486c41",
        loadingGradient1: "#1c242b",
        loadingGradient2: "#7745cd",
        loadingGradient3: "rgba(26, 26, 26, 0.85)"
    }
};