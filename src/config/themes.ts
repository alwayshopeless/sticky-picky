import type {Theme} from "../types/themes.ts";

export const themes: Record<string, Theme> = {
    root: {
        bgMain: "#f5f5f7",
        bgSecondary: "#e0e0e5",
        bgThird: "#4a6fff",
        textMain: "#1a1a1a",
        iconColor: "#1a1a1a50",
        success: "#b0ffb4",
        loadingGradient1: "#f0f0f3",
        loadingGradient2: "#a175f5",
        loadingGradient3: "#e9e9f1",
        stickersPerRow: 4
    },
    dark: {
        bgMain: "#101317",
        bgSecondary: "#303242",
        bgThird: "#3656ff",
        textMain: "#ffffff",
        iconColor: "#ffffff50",
        success: "#364833",
        loadingGradient1: "#1c242b",
        loadingGradient2: "#7745cd",
        loadingGradient3: "rgba(26, 26, 26, 0.85)"
    },
    cyberpunk: {
        bgMain: "#0a0a0f",
        bgSecondary: "#1a1a26",
        bgThird: "#ff00ff",
        textMain: "#00fff7",
        iconColor: "#00fff750",
        success: "#1aff66",
        loadingGradient1: "#111122",
        loadingGradient2: "#ff0080",
        loadingGradient3: "#00e5ff"
    },
    sunrise: {
        bgMain: "#fff8f0",
        bgSecondary: "#ffe0b2",
        bgThird: "#ff9800",
        textMain: "#3e2723",
        iconColor: "#3e272350",
        success: "#c8e6c9",
        loadingGradient1: "#fff3e0",
        loadingGradient2: "#ffb74d",
        loadingGradient3: "#ffe0b2"
    },
    mint: {
        bgMain: "#f0fff7",
        bgSecondary: "#d0f5e3",
        bgThird: "#00b894",
        textMain: "#004d40",
        iconColor: "#004d4050",
        success: "#a7ffeb",
        loadingGradient1: "#e0fff7",
        loadingGradient2: "#1de9b6",
        loadingGradient3: "#b2fef7"
    },
    retro: {
        bgMain: "#fff0f6",
        bgSecondary: "#ffdeeb",
        bgThird: "#ff6ec7",
        textMain: "#2e003e",
        iconColor: "#2e003e50",
        success: "#ffd6ff",
        loadingGradient1: "#ffe0f7",
        loadingGradient2: "#ff85a2",
        loadingGradient3: "#ffdeeb"
    },
    autumn: {
        bgMain: "#fffaf0",
        bgSecondary: "#f5deb3",
        bgThird: "#d2691e",
        textMain: "#4e342e",
        iconColor: "#4e342e50",
        success: "#c5e1a5",
        loadingGradient1: "#ffebcd",
        loadingGradient2: "#ffb74d",
        loadingGradient3: "#d7ccc8"
    },
    // Новые темы
    neon: {
        bgMain: "#0d1117",
        bgSecondary: "#161b22",
        bgThird: "#39ff14",
        textMain: "#39ff14",
        iconColor: "#39ff1450",
        success: "#39ff14",
        loadingGradient1: "#0d1117",
        loadingGradient2: "#39ff14",
        loadingGradient3: "#ff073a"
    },
    ocean: {
        bgMain: "#e6f3ff",
        bgSecondary: "#b3d9ff",
        bgThird: "#0066cc",
        textMain: "#003d7a",
        iconColor: "#003d7a50",
        success: "#4dd0e1",
        loadingGradient1: "#e1f5fe",
        loadingGradient2: "#29b6f6",
        loadingGradient3: "#81d4fa"
    },
    vampire: {
        bgMain: "#1a0000",
        bgSecondary: "#330a0a",
        bgThird: "#ff0a00",
        textMain: "#ffcccc",
        iconColor: "#ffcccc50",
        success: "#ff6b6b",
        loadingGradient1: "#2d0a0a",
        loadingGradient2: "#cc0000",
        loadingGradient3: "#4d0000"
    },
    space: {
        bgMain: "#0a0a1a",
        bgSecondary: "#1a1a3a",
        bgThird: "#6a5acd",
        textMain: "#e6e6fa",
        iconColor: "#e6e6fa50",
        success: "#98fb98",
        loadingGradient1: "#191970",
        loadingGradient2: "#9370db",
        loadingGradient3: "#483d8b"
    },
    forest: {
        bgMain: "#f0f8f0",
        bgSecondary: "#c8e6c8",
        bgThird: "#228b22",
        textMain: "#2f4f2f",
        iconColor: "#2f4f2f50",
        success: "#98fb98",
        loadingGradient1: "#e8f5e8",
        loadingGradient2: "#32cd32",
        loadingGradient3: "#90ee90"
    },
    sunset: {
        bgMain: "#fff5f0",
        bgSecondary: "#ffcab0",
        bgThird: "#ff4500",
        textMain: "#8b0000",
        iconColor: "#8b000050",
        success: "#ffa07a",
        loadingGradient1: "#ffe4e1",
        loadingGradient2: "#ff6347",
        loadingGradient3: "#ff7f50"
    },
    arctic: {
        bgMain: "#f0f8ff",
        bgSecondary: "#e0f0ff",
        bgThird: "#4682b4",
        textMain: "#2f4f4f",
        iconColor: "#2f4f4f50",
        success: "#b0e0e6",
        loadingGradient1: "#f0f8ff",
        loadingGradient2: "#87ceeb",
        loadingGradient3: "#add8e6"
    },
    matrix: {
        bgMain: "#000000",
        bgSecondary: "#001100",
        bgThird: "#00ff41",
        textMain: "#00ff41",
        iconColor: "#00ff4150",
        success: "#00ff41",
        loadingGradient1: "#001a00",
        loadingGradient2: "#00ff41",
        loadingGradient3: "#003300"
    },
    lavender: {
        bgMain: "#f8f5ff",
        bgSecondary: "#e6e0ff",
        bgThird: "#9370db",
        textMain: "#4b0082",
        iconColor: "#4b008250",
        success: "#dda0dd",
        loadingGradient1: "#f0e8ff",
        loadingGradient2: "#ba55d3",
        loadingGradient3: "#d8bfd8"
    },
    volcano: {
        bgMain: "#1a0f0a",
        bgSecondary: "#3d1f0a",
        bgThird: "#ff4500",
        textMain: "#ffb366",
        iconColor: "#ffb36650",
        success: "#ff6b47",
        loadingGradient1: "#2d1b0f",
        loadingGradient2: "#ff4500",
        loadingGradient3: "#ff6347"
    },
    midnight: {
        bgMain: "#0f0f23",
        bgSecondary: "#1a1a3a",
        bgThird: "#4169e1",
        textMain: "#b8c5d6",
        iconColor: "#b8c5d650",
        success: "#5f9ea0",
        loadingGradient1: "#191970",
        loadingGradient2: "#4169e1",
        loadingGradient3: "#2e2e54"
    },
    cherry: {
        bgMain: "#fff5f8",
        bgSecondary: "#ffb3d1",
        bgThird: "#ff1493",
        textMain: "#8b0045",
        iconColor: "#8b004550",
        success: "#ffb6c1",
        loadingGradient1: "#ffe4e9",
        loadingGradient2: "#ff69b4",
        loadingGradient3: "#ffc0cb"
    },
    gold: {
        bgMain: "#fffdf0",
        bgSecondary: "#fff8dc",
        bgThird: "#ffd700",
        textMain: "#b8860b",
        iconColor: "#b8860b50",
        success: "#f0e68c",
        loadingGradient1: "#fffff0",
        loadingGradient2: "#ffd700",
        loadingGradient3: "#ffebcd"
    },
    toxic: {
        bgMain: "#0a1a0a",
        bgSecondary: "#1a331a",
        bgThird: "#adff2f",
        textMain: "#7fff00",
        iconColor: "#7fff0050",
        success: "#32cd32",
        loadingGradient1: "#0f2f0f",
        loadingGradient2: "#adff2f",
        loadingGradient3: "#228b22"
    },
    royal: {
        bgMain: "#f8f8ff",
        bgSecondary: "#e6e6fa",
        bgThird: "#4b0082",
        textMain: "#2f1b69",
        iconColor: "#2f1b6950",
        success: "#dda0dd",
        loadingGradient1: "#f5f5ff",
        loadingGradient2: "#6a5acd",
        loadingGradient3: "#9370db"
    }
};