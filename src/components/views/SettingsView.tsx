import {useState} from 'preact/hooks';
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";
import {themes} from "../../config/themes.ts";
import type {ThemeName} from "../../types/themes.ts";

export function SettingsView() {
    const [repoName, setRepoName] = useState('');
    const [stickerUrl, setStickerUrl] = useState('');

    const stickerPicker = useStickerPicker();
    const {theme, setTheme} = stickerPicker;
    const {stickersPerRow, setStickersPerRow} = stickerPicker;
    const {sentStickerSize, setSentStickerSize} = stickerPicker;

    const handleThemeChange = (value: ThemeName) => {
        setTheme(value);
    };

    const handleAddRepo = () => {
        console.log('Добавляем репозиторий:', {repoName, stickerUrl});
        setRepoName('');
        setStickerUrl('');
    };

    return (
        <div className="settings-view">
            <h4>Themes</h4>
            <div className="theme-selector">
                {Object.keys(themes).map((themeKey: ThemeName) => (
                    <div
                        key={themeKey}
                        className={`theme-circle ${theme === themeKey ? 'active' : ''}`}
                        style={{
                            background: `linear-gradient(135deg, ${themes[themeKey].bgMain} 50%, ${themes[themeKey].textMain} 50%)`,
                            border: `3px solid ${themes[themeKey].bgSecondary}`
                        }}
                        onClick={() => handleThemeChange(themeKey)}
                    />
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

            <h4>Import repository with stickers</h4>

            <div className="field">
                <input
                    className="field__input"
                    placeholder="Repository link"
                    value={stickerUrl}
                    onInput={(e: any) => setStickerUrl(e.target.value)}
                />
            </div>
            <button class="btn" onClick={handleAddRepo}>Добавить</button>

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

                `}
            </style>
        </div>
    );
}
