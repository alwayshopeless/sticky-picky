import {useEffect, useState} from "preact/hooks";
import {StickerView} from "./components/views/StickerView.tsx";
import {Globe, Settings} from "lucide-preact";
import {useMatrix} from "./contexts/matrix-widget-api-context.tsx";
import {apiRequest} from "./api/backend-api.ts";
import {ExploreStickersView} from "./components/views/ExploreStickersView.tsx";
import {SettingsView} from "./components/views/SettingsView.tsx";
import {useStickerPicker} from "./stores/sticker-picker.tsx";

export function App() {
    const [currentView, setCurrentView] = useState('stickers');
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();

    const sendAuthRequest = () => {
        const nonce = `auth-nonce-${Date.now()}`;
        const requestId = `login-request-${Date.now()}`;
        widget.sendMessage({
            api: "fromWidget",
            action: "get_openid",
            widgetId: widget.widgetId,
            data: {nonce},
            requestId,
        });
    };

    useEffect(() => {
        widget.on('capabilities', (data) => {
            window.parent.postMessage({...data, response: {capabilities: ["m.sticker"]}}, "*");
        });

        widget.on('openid_credentials', (event) => {
            console.log("access token got");
            console.log(event);
            apiRequest("auth/login", {
                method: "POST",
                body: JSON.stringify({
                    user_token: event?.data?.access_token,
                    homeserver: event?.data?.matrix_server_name,
                }),
                headers: {
                    'Content-Type': "application/json",
                }
            }).then(async (response: Response) => {
                if (response.status == 200) {
                    let data: any = await response.json();
                    stickerPicker.setUserData({
                        matrixUserId: data.matrix_id,
                        token: data.token,
                    });
                }
            })

            window.parent.postMessage({...event});
        });
    }, []);

    return <>
        {stickerPicker.userData == null ? <div style={"padding: 0.1rem;"}>
            <button className={'btn'} style={"width: 100%; text-align:center;"} onClick={sendAuthRequest}>Connect
            </button>
        </div> : null}
        <div class={"main"}>
            <div className="top-nav">
                <div
                    onClick={() => {
                        setCurrentView('gifs');
                    }}
                    data-selected={currentView == 'gifs'}
                    className={"top-nav__item"}>GIF
                </div>
                <div
                    onClick={() => {
                        setCurrentView('stickers');
                    }}
                    data-selected={currentView == 'stickers'}
                    className={"top-nav__item selected"}>Stickers
                </div>
                <div
                    onClick={() => {
                        setCurrentView('explore');
                    }}
                    data-selected={currentView == 'explore'}
                    className={"top-nav__item ico"}><Globe/></div>
                <div
                    onClick={() => {
                        setCurrentView('settings');
                    }}
                    data-selected={currentView == 'settings'}
                    className={"top-nav__item ico"}><Settings/></div>
            </div>
            <div class={"view"}>
                {currentView == 'stickers' ? <StickerView explore={() => {
                    setCurrentView('explore');
                }}/> : null}
                {currentView == 'explore' ? <ExploreStickersView/> : null}
                {currentView == 'settings' ? <SettingsView/> : null}
            </div>
        </div>
    </>
}