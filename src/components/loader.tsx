import {themes} from "../config/themes.ts";
import type {Theme} from "../types/themes.ts";
import {useStickerPicker} from "../stores/sticker-picker.tsx";

export function Loader() {
    const {theme} = useStickerPicker();

    const currentTheme: Theme = themes[theme ?? 'dark'];
    const colors = {
        main: currentTheme ? currentTheme.bgThird : '#4a6fff',
        grad1: currentTheme ? currentTheme.loadingGradient1 : '#667eea',
        grad2: currentTheme ? currentTheme.loadingGradient2 : '#764ba2',
        grad3: currentTheme ? currentTheme.loadingGradient3 : '#f093fb',
        accent: currentTheme ? currentTheme.loadingGradient2 : '#a175f5',
    };

    return (
        <div className="loader">
            <div className="loader-container">
                <div className="spinner-outer">
                    <div className="spinner-inner"></div>
                </div>
                <div className="pulse-ring"></div>
                <div className="pulse-ring pulse-ring-delay"></div>
            </div>

            <style>
                {`
                .loader {
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100%;
                    height: 100%;
                    position: relative;
                }

                .loader-container {
                    position: relative;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                }

                .spinner-outer {
                    width: 60px;
                    height: 60px;
                    position: relative;
                    border-radius: 50%;
                    background: var(--bg-secondary);
                    animation: rotate 1.2s linear infinite;
                    padding: 4px;
                    box-shadow: 
                        0 0 20px ${colors.accent}40,
                        0 0 40px ${colors.grad2}20,
                        inset 0 0 15px rgba(255, 255, 255, 0.1);
                }

                .spinner-inner {
                    width: 100%;
                    height: 100%;
                    border-radius: 50%;
                    background: ${currentTheme ? currentTheme?.bgMain : '#1a1a2e'};
                    position: relative;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .spinner-inner::before {
                    content: '';
                    position: absolute;
                    width: 20px;
                    height: 20px;
                    background: linear-gradient(45deg, ${colors.grad2}, ${colors.accent});
                    border-radius: 50%;
                    box-shadow: 
                        0 0 10px ${colors.accent}40,
                        0 0 20px ${colors.accent}20;
                    animation: innerPulse 1.5s ease-in-out infinite;
                }

                .pulse-ring {
                    position: absolute;
                    border: 2px solid ${colors.accent}30;
                    border-radius: 50%;
                    width: 80px;
                    height: 80px;
                    animation: pulseRing 2s cubic-bezier(0.25, 0.46, 0.45, 0.94) infinite;
                }

                .pulse-ring-delay {
                    animation-delay: 0.5s;
                    border-color: ${colors.grad1}20;
                }

                @keyframes rotate {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }



                @keyframes innerPulse {
                    0%, 100% { 
                        transform: scale(1);
                        opacity: 1;
                    }
                    50% { 
                        transform: scale(1.3);
                        opacity: 0.7;
                    }
                }

                @keyframes pulseRing {
                    0% {
                        transform: scale(0.8);
                        opacity: 1;
                    }
                    100% {
                        transform: scale(1.4);
                        opacity: 0;
                    }
                }

                /* Hover effect for interactive feel */
                .loader-container:hover .spinner-outer {
                    animation-duration: 0.8s;
                    box-shadow: 
                        0 0 30px ${colors.accent}60,
                        0 0 60px ${colors.grad2}30,
                        inset 0 0 25px rgba(255, 255, 255, 0.2);
                }

                .loader-container:hover .pulse-ring {
                    animation-duration: 1.5s;
                }
                `}
            </style>
        </div>
    );
}