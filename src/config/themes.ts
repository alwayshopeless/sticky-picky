import type {Theme} from "../types/themes.ts";

export const themes: Record<string, Theme> = {
    root: {
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
        success: "#364833",
        loadingGradient1: "#1c242b",
        loadingGradient2: "#7745cd",
        loadingGradient3: "rgba(26, 26, 26, 0.85)"
    },
    cyberpunk: {
        bgMain: "linear-gradient(135deg, #0a0a0f 0%, #0d0d14 50%, #111118 100%)",
        bgSecondary: "linear-gradient(135deg, #1a1a26 0%, #242438 100%)",
        bgThird: "linear-gradient(135deg, #ff00ff 0%, #cc00cc 50%, #e600e6 100%)",
        textMain: "#00fff7",
        iconColor: "#00fff750",
        success: "linear-gradient(135deg, #1aff66 0%, #00e553 100%)",
        loadingGradient1: "#0a0a0f",
        loadingGradient2: "#ff00ff",
        loadingGradient3: "#00fff7"
    },
    sunrise: {
        bgMain: "linear-gradient(135deg, #fff8f0 0%, #ffeaa7 20%, #fdcb6e 100%)",
        bgSecondary: "linear-gradient(135deg, #ffe0b2 0%, #ffb74d 100%)",
        bgThird: "linear-gradient(135deg, #ff9500 0%, #ff6b35 100%)",
        textMain: "#3e2723",
        iconColor: "#3e272350",
        success: "linear-gradient(135deg, #c8e6c9 0%, #a5d6a7 100%)",
        loadingGradient1: "#fff8f0",
        loadingGradient2: "#ff9500",
        loadingGradient3: "#ffb74d"
    },
    mint: {
        bgMain: "linear-gradient(135deg, #f0fff7 0%, #e8f5e8 50%, #d5f5d5 100%)",
        bgSecondary: "linear-gradient(135deg, #d0f5e3 0%, #a7e6c7 100%)",
        bgThird: "linear-gradient(135deg, #00b894 0%, #00a085 100%)",
        textMain: "#1b5e20",
        iconColor: "#1b5e2050",
        success: "linear-gradient(135deg, #a7ffeb 0%, #80cbc4 100%)",
        loadingGradient1: "#f0fff7",
        loadingGradient2: "#00b894",
        loadingGradient3: "#26de81"
    },
    retro: {
        bgMain: "linear-gradient(135deg, #fff0f6 0%, #fce4ec 50%, #f8bbd9 100%)",
        bgSecondary: "linear-gradient(135deg, #ffdeeb 0%, #f48fb1 100%)",
        bgThird: "linear-gradient(135deg, #ff6ec7 0%, #e91e63 100%)",
        textMain: "#4a148c",
        iconColor: "#4a148c50",
        success: "linear-gradient(135deg, #ffd6ff 0%, #e1bee7 100%)",
        loadingGradient1: "#fff0f6",
        loadingGradient2: "#ff6ec7",
        loadingGradient3: "#ba68c8"
    },
    autumn: {
        bgMain: "linear-gradient(135deg, #fffaf0 0%, #fff3e0 50%, #ffcc80 100%)",
        bgSecondary: "linear-gradient(135deg, #f5deb3 0%, #deb887 100%)",
        bgThird: "linear-gradient(135deg, #d2691e 0%, #bf360c 100%)",
        textMain: "#3e2723",
        iconColor: "#3e272350",
        success: "linear-gradient(135deg, #c5e1a5 0%, #aed581 100%)",
        loadingGradient1: "#fffaf0",
        loadingGradient2: "#d2691e",
        loadingGradient3: "#ff8a65"
    },
    neon: {
        bgMain: "linear-gradient(135deg, #0d1117 0%, #161b22 50%, #21262d 100%)",
        bgSecondary: "linear-gradient(135deg, #161b22 0%, #30363d 100%)",
        bgThird: "linear-gradient(135deg, #39ff14 0%, #00ff41 100%)",
        textMain: "#39ff14",
        iconColor: "#39ff1450",
        success: "linear-gradient(135deg, #39ff14 0%, #00ff88 100%)",
        loadingGradient1: "#0d1117",
        loadingGradient2: "#39ff14",
        loadingGradient3: "#00ff88"
    },
    ocean: {
        bgMain: "linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)",
        bgSecondary: "linear-gradient(135deg, #b3d9ff 0%, #64b5f6 100%)",
        bgThird: "linear-gradient(135deg, #0277bd 0%, #01579b 100%)",
        textMain: "#0d47a1",
        iconColor: "#0d47a150",
        success: "linear-gradient(135deg, #4dd0e1 0%, #26c6da 100%)",
        loadingGradient1: "#e3f2fd",
        loadingGradient2: "#0277bd",
        loadingGradient3: "#42a5f5"
    },
    vampire: {
        bgMain: "linear-gradient(135deg, #1a0000 0%, #2d0a0a 50%, #400a0a 100%)",
        bgSecondary: "linear-gradient(135deg, #330a0a 0%, #4d1414 100%)",
        bgThird: "linear-gradient(135deg, #ff1744 0%, #d50000 100%)",
        textMain: "#ffcdd2",
        iconColor: "#ffcdd250",
        success: "linear-gradient(135deg, #ff5252 0%, #ef5350 100%)",
        loadingGradient1: "#1a0000",
        loadingGradient2: "#ff1744",
        loadingGradient3: "#c62828"
    },
    space: {
        bgMain: "linear-gradient(135deg, #0a0a1a 0%, #1a1a3a 50%, #2a2a5a 100%)",
        bgSecondary: "linear-gradient(135deg, #1a1a3a 0%, #3949ab 100%)",
        bgThird: "linear-gradient(135deg, #7986cb 0%, #5c6bc0 100%)",
        textMain: "#e8eaf6",
        iconColor: "#e8eaf650",
        success: "linear-gradient(135deg, #9fa8da 0%, #7986cb 100%)",
        loadingGradient1: "#0a0a1a",
        loadingGradient2: "#7986cb",
        loadingGradient3: "#3f51b5"
    },
    forest: {
        bgMain: "linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 50%, #a5d6a7 100%)",
        bgSecondary: "linear-gradient(135deg, #c8e6c8 0%, #81c784 100%)",
        bgThird: "linear-gradient(135deg, #388e3c 0%, #2e7d32 100%)",
        textMain: "#1b5e20",
        iconColor: "#1b5e2050",
        success: "linear-gradient(135deg, #a5d6a7 0%, #81c784 100%)",
        loadingGradient1: "#e8f5e8",
        loadingGradient2: "#388e3c",
        loadingGradient3: "#66bb6a"
    },
    sunset: {
        bgMain: "linear-gradient(135deg, #fff3e0 0%, #ffcc80 50%, #ffb74d 100%)",
        bgSecondary: "linear-gradient(135deg, #ffcab0 0%, #ff8a65 100%)",
        bgThird: "linear-gradient(135deg, #ff5722 0%, #e64a19 100%)",
        textMain: "#bf360c",
        iconColor: "#bf360c50",
        success: "linear-gradient(135deg, #ffcc80 0%, #ffb74d 100%)",
        loadingGradient1: "#fff3e0",
        loadingGradient2: "#ff5722",
        loadingGradient3: "#ff7043"
    },
    arctic: {
        bgMain: "linear-gradient(135deg, #f0f8ff 0%, #e1f5fe 50%, #b3e5fc 100%)",
        bgSecondary: "linear-gradient(135deg, #e0f0ff 0%, #81d4fa 100%)",
        bgThird: "linear-gradient(135deg, #0288d1 0%, #0277bd 100%)",
        textMain: "#01579b",
        iconColor: "#01579b50",
        success: "linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%)",
        loadingGradient1: "#f0f8ff",
        loadingGradient2: "#0288d1",
        loadingGradient3: "#29b6f6"
    },
    matrix: {
        bgMain: "linear-gradient(135deg, #000000 0%, #001100 50%, #002200 100%)",
        bgSecondary: "linear-gradient(135deg, #001100 0%, #003300 100%)",
        bgThird: "linear-gradient(135deg, #00ff41 0%, #00cc33 100%)",
        textMain: "#00ff41",
        iconColor: "#00ff4150",
        success: "linear-gradient(135deg, #00ff41 0%, #00e53d 100%)",
        loadingGradient1: "#000000",
        loadingGradient2: "#00ff41",
        loadingGradient3: "#00b330"
    },
    lavender: {
        bgMain: "linear-gradient(135deg, #f8f5ff 0%, #ede7f6 50%, #d1c4e9 100%)",
        bgSecondary: "linear-gradient(135deg, #e6e0ff 0%, #b39ddb 100%)",
        bgThird: "linear-gradient(135deg, #7e57c2 0%, #673ab7 100%)",
        textMain: "#4527a0",
        iconColor: "#4527a050",
        success: "linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)",
        loadingGradient1: "#f8f5ff",
        loadingGradient2: "#7e57c2",
        loadingGradient3: "#9c27b0"
    },
    volcano: {
        bgMain: "linear-gradient(135deg, #1a0f0a 0%, #3d1f0a 50%, #5d2f0a 100%)",
        bgSecondary: "linear-gradient(135deg, #3d1f0a 0%, #6d3f0a 100%)",
        bgThird: "linear-gradient(135deg, #ff4500 0%, #ff6347 100%)",
        textMain: "#ffab91",
        iconColor: "#ffab9150",
        success: "linear-gradient(135deg, #ff8a65 0%, #ff7043 100%)",
        loadingGradient1: "#1a0f0a",
        loadingGradient2: "#ff4500",
        loadingGradient3: "#ff5722"
    },
    midnight: {
        bgMain: "linear-gradient(135deg, #0f0f23 0%, #1a1a3a 50%, #252550 100%)",
        bgSecondary: "linear-gradient(135deg, #1a1a3a 0%, #303f9f 100%)",
        bgThird: "linear-gradient(135deg, #3f51b5 0%, #303f9f 100%)",
        textMain: "#c5cae9",
        iconColor: "#c5cae950",
        success: "linear-gradient(135deg, #9fa8da 0%, #7986cb 100%)",
        loadingGradient1: "#0f0f23",
        loadingGradient2: "#3f51b5",
        loadingGradient3: "#5c6bc0"
    },
    cherry: {
        bgMain: "linear-gradient(135deg, #fff5f8 0%, #fce4ec 50%, #f8bbd9 100%)",
        bgSecondary: "linear-gradient(135deg, #ffb3d1 0%, #f48fb1 100%)",
        bgThird: "linear-gradient(135deg, #e91e63 0%, #c2185b 100%)",
        textMain: "#880e4f",
        iconColor: "#880e4f50",
        success: "linear-gradient(135deg, #f8bbd9 0%, #f48fb1 100%)",
        loadingGradient1: "#fff5f8",
        loadingGradient2: "#e91e63",
        loadingGradient3: "#ec407a"
    },
    gold: {
        bgMain: "linear-gradient(135deg, #fefcf3 0%, #faf6e6 50%, #f7dc6f 100%)",
        bgSecondary: "linear-gradient(135deg, #f4d03f 0%, #f1c40f 100%)",
        bgThird: "linear-gradient(135deg, #b7950b 0%, #9a7d0a 100%)",
        textMain: "#7d6608",
        iconColor: "#7d660850",
        success: "linear-gradient(135deg, #f9e79f 0%, #f7dc6f 100%)",
        loadingGradient1: "#fefcf3",
        loadingGradient2: "#b7950b",
        loadingGradient3: "#d4af37"
    },
    toxic: {
        bgMain: "linear-gradient(135deg, #0a1a0a 0%, #1a331a 50%, #2a4d2a 100%)",
        bgSecondary: "linear-gradient(135deg, #1a331a 0%, #4d6b4d 100%)",
        bgThird: "linear-gradient(135deg, #76ff03 0%, #64dd17 100%)",
        textMain: "#c6ff00",
        iconColor: "#c6ff0050",
        success: "linear-gradient(135deg, #b2ff59 0%, #8bc34a 100%)",
        loadingGradient1: "#0a1a0a",
        loadingGradient2: "#76ff03",
        loadingGradient3: "#689f38"
    },
    royal: {
        bgMain: "linear-gradient(135deg, #f8f8ff 0%, #ede7f6 50%, #d1c4e9 100%)",
        bgSecondary: "linear-gradient(135deg, #e6e6fa 0%, #b39ddb 100%)",
        bgThird: "linear-gradient(135deg, #512da8 0%, #4527a0 100%)",
        textMain: "#311b92",
        iconColor: "#311b9250",
        success: "linear-gradient(135deg, #e1bee7 0%, #ce93d8 100%)",
        loadingGradient1: "#f8f8ff",
        loadingGradient2: "#512da8",
        loadingGradient3: "#673ab7"
    }
};