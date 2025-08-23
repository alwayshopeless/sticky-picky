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

        <div class="view">
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
                                    background: themes[themeKey ?? "dark"].bgSecondary,
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
                                ? themes[theme ?? 'dark']?.bgThird
                                : themes[theme ?? 'dark']?.bgSecondary,
                        }}
                    />
                </label>

                <ImportRepositoryForm/>

            </div>
        </div>

    );
}
