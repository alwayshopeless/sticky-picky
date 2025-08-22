import {themes} from "../../config/themes.ts";
import type {ThemeName} from "../../types/themes.ts";
import {ImportRepositoryForm} from "../forms/import-repository-form.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";

export function SettingsView() {
    const stickerPicker = useStickerPicker();
    const {theme, setTheme} = stickerPicker;
    const {stickersPerRow, setStickersPerRow} = stickerPicker;
    const {sentStickerSize, setSentStickerSize} = stickerPicker;
    const {compactViewInExplore, setCompactViewInExplore} = stickerPicker;

    const handleThemeChange = (value: ThemeName) => {
        setTheme(value);
    };

    return (
        <div className="settings-view">
            <h4>Theme: <span class={"capitalize"}>{theme}</span></h4>
            <div className="theme-selector">
                {Object.keys(themes).map((themeKey: ThemeName) => (
                    <div
                        key={themeKey}
                        className={`theme-circle-wrapper ${theme === themeKey ? 'active' : ''}`}
                        style={{
                            borderRadius: '50%',
                            overflow: 'hidden',
                            width: '30px',
                            height: '30px',
                            cursor: 'pointer',
                            display: 'inline-block'
                        }}
                        onClick={() => handleThemeChange(themeKey)}
                    >
                        <div
                            style={{
                                background: themes[themeKey].bgSecondary,
                                width: '100%',
                                height: '100%'
                            }}
                        />
                        <div
                            style={{
                                background: `${themes[themeKey].textMain}`,
                                width: '100%',
                                height: '100%'
                            }}
                        />
                    </div>
                ))}
            </div>

            <h4>Sent stickers size: <span>{sentStickerSize}</span></h4>
            <div className="input-slider-cont">
                <div className={'input-slider-cont__label'}>
                    64
                </div>
                <input
                    className={"input-slider"}
                    type="range"
                    min={64}
                    max={256}
                    step={8}
                    value={sentStickerSize}
                    onInput={(e: any) => setSentStickerSize(parseInt(e.target.value))}
                />
                <div className={'input-slider-cont__label'}>
                    255
                </div>
            </div>

            <h4>Stickers per row: <span>{stickersPerRow}</span></h4>
            <div className={"input-slider-cont"}>
                <div className={'input-slider-cont__label'}>
                    1
                </div>
                <input
                    className={"input-slider"}
                    type="range"
                    min={1}
                    max={16}
                    step={1}
                    value={stickersPerRow}
                    onInput={(e: any) => setStickersPerRow(parseInt(e.target.value))}
                />
                <div className={'input-slider-cont__label'}>
                    16
                </div>
            </div>

            <h4>Compact view in explore</h4>
            <label className="switch">
                <input
                    type="checkbox"
                    checked={compactViewInExplore}
                    onChange={(e: any) => setCompactViewInExplore(e.target.checked)}
                />
                <span
                    className="slider"
                    style={{
                        background: compactViewInExplore
                            ? themes[theme ?? 'dark'].bgThird
                            : themes[theme ?? 'dark'].bgSecondary,
                    }}
                />
            </label>

            <ImportRepositoryForm/>

            <style>
                {`
                .theme-selector {
                    display: flex;
                    gap: 10px;
                    margin-bottom: 20px;
                }
                .theme-circle {
                    width: 30px;
                    height: 30px;
                    border-radius: 50%;
                    cursor: pointer;
                }
                .theme-circle.active {
                    border: 3px solid #007bff;
                }

                .switch {
                    position: relative;
                    display: inline-block;
                    width: 50px;
                    height: 28px;
                }
                .switch input {
                    opacity: 0;
                    width: 0;
                    height: 0;
                }
                .slider {
                    position: absolute;
                    cursor: pointer;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 34px;
                    transition: .3s;
                }
                .slider:before {
                    position: absolute;
                    content: "";
                    height: 20px;
                    width: 20px;
                    left: 4px;
                    bottom: 4px;
                    background: ${themes[theme ?? "dark"].bgMain};
                    transition: .3s;
                    border-radius: 50%;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                }
                input:checked + .slider:before {
                    transform: translateX(22px);
                }
                `}
            </style>
        </div>
    );
}
