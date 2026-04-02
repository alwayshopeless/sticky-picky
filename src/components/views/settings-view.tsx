import {themes} from "../../config/themes.ts";
import type {ThemeName} from "../../types/themes.ts";
import {AttachStickerpackForm} from "../forms/attach-stickerpack-form.tsx";
import {ImportRepositoryForm} from "../forms/import-repository-form.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";
import {Button} from "../ui/button.tsx";
import {useLocation} from "preact-iso";
import {useState} from "preact/hooks";

export function SettingsView() {
    const stickerPicker = useStickerPicker();
    const {theme, setTheme} = stickerPicker;
    const {stickersPerRow, setStickersPerRow} = stickerPicker;
    const {sentStickerSize, setSentStickerSize} = stickerPicker;
    const {route} = useLocation();
    const [permissionsRequested, setPermissionsRequested] = useState(false);

    const handleThemeChange = (value: ThemeName) => {
        setTheme(value);
    };

    return (

        <div class="view">
            <div className="settings-view">
                <Button onClick={() => {
                    route('/manage-stickerpacks');
                }}>Manage stickerpacks</Button>

                <div>
                    <Button onClick={() => {
                        window.dispatchEvent(new CustomEvent("sticky-picky:refresh-widget-permissions"));
                        setPermissionsRequested(true);
                        window.setTimeout(() => {
                            setPermissionsRequested(false);
                        }, 2500);
                    }}>
                        Re-request widget permissions
                    </Button>
                    {permissionsRequested ? (
                        <div style={{marginTop: "0.5rem", opacity: 0.8}}>
                            Permission request sent. Confirm it in the client if prompted.
                        </div>
                    ) : null}
                </div>

                <AttachStickerpackForm/>
                <h4>Theme: <span className={"capitalize"}>{theme}</span></h4>
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

                <ImportRepositoryForm/>

                <h4>Export keys</h4>
                <div>
                    <button class="btn" onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(stickerPicker.userData));
                    }}>Export keys
                    </button>
                </div>

            </div>
        </div>

    );
}
