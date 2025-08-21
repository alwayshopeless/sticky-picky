import {useState} from 'preact/hooks';
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";

export function SettingsView() {
    const [repoName, setRepoName] = useState('');
    const [stickerUrl, setStickerUrl] = useState('');

    const stickerPicker = useStickerPicker();
    const {theme, setTheme} = stickerPicker;
    const {stickersPerRow, setStickersPerRow} = stickerPicker;
    const {sentStickerSize, setSentStickerSize} = stickerPicker;

    const handleThemeChange = (value: 'light' | 'dark') => {
        setTheme(value);
    };

    const handleAddRepo = () => {
        console.log('Добавляем репозиторий:', {repoName, stickerUrl});
        setRepoName('');
        setStickerUrl('');
    };

    return (
        <div className="settings-view">
            <h2>Themes</h2>
            <div className="theme-selector">
                <div
                    className={`theme-circle ${theme === 'light' ? 'active' : ''}`}
                    style={{backgroundColor: '#fff', border: '3px solid #000'}}
                    onClick={() => handleThemeChange('light')}
                />
                <div
                    className={`theme-circle ${theme === 'dark' ? 'active' : ''}`}
                    style={{backgroundColor: '#000', border: '3px solid #fff'}}
                    onClick={() => handleThemeChange('dark')}
                />
            </div>

            <h2>Sent stickers size: <span>{sentStickerSize}</span></h2>
            <div className="input-slider-cont">
                <div className={'input-slider-cont__label'}>
                    64
                </div>
                <input
                    className={"input-slider"}
                    type="range"
                    min={64}
                    max={255}
                    step={8}
                    value={sentStickerSize}
                    onInput={(e: any) => setSentStickerSize(parseInt(e.target.value))}
                />
                <div className={'input-slider-cont__label'}>
                    255
                </div>
            </div>

            <h2>Stickers per row: <span>{stickersPerRow}</span></h2>
            <div className={"input-slider-cont"}>
                <div className={'input-slider-cont__label'}>
                    1
                </div>
                <input
                    className={"input-slider"}
                    type="range"
                    min={1}
                    max={16}
                    value={stickersPerRow}
                    onInput={(e: any) => setStickersPerRow(parseInt(e.target.value))}
                />
                <div className={'input-slider-cont__label'}>
                    16
                </div>
            </div>

            <h2>Add repository</h2>
            <div className="field">
                <input
                    className="field__input"
                    placeholder="Название репозитория"
                    value={repoName}
                    onInput={(e: any) => setRepoName(e.target.value)}
                />
            </div>
            <div className="field">
                <input
                    className="field__input"
                    placeholder="Ссылка на стикер"
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
