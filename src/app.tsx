import {useEffect} from "preact/hooks";
import {StickerView} from "./components/views/StickerView.tsx";
import {useMatrix} from "./contexts/matrix-widget-api-context.tsx";
import {apiRequest} from "./api/backend-api.ts";
import {ExploreStickersView} from "./components/views/ExploreStickersView.tsx";
import {SettingsView} from "./components/views/SettingsView.tsx";
import {useStickerPicker} from "./stores/sticker-picker.tsx";
import {TopNav} from "./components/top-nav.tsx";
import {ConnectForm} from "./components/forms/connect-form.tsx";
import {useSimpleRouter} from "./stores/simple-router.tsx";
import {ManageStickerpacks} from "@/components/views/manage-stickerpacks/manage-stickerpacks.tsx";
import {CreateStickerpackView} from "@/components/views/manage-stickerpacks/create-stickerpack-view.tsx";

export function App() {
    const {currentView, setView} = useSimpleRouter();
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
            window.parent.postMessage({
                ...data, response: {
                    capabilities: [
                        "m.sticker",
                        "m.download_file",
                        "org.matrix.msc4039.download_file",

                    ]
                }
            }, "*");
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
        {stickerPicker.userData == null ? <ConnectForm sendAuthRequest={sendAuthRequest}/> : null}

        {/*{isDebug ? <button onClick={() => {*/}
        {/*    localStorage.setItem('stickerCollections', '');*/}
        {/*}}>*/}
        {/*    Clear cache*/}
        {/*</button> : null}*/}

        <div class={"main"}>
            <TopNav/>
            {currentView === "stickers" && <StickerView explore={() => setView("explore")}/>}
            {currentView === "explore" && <ExploreStickersView/>}
            {currentView === "settings" && <SettingsView/>}
            {currentView === "manage-stickerpacks" && <ManageStickerpacks/>}
            {currentView === "create-stickerpack" && <CreateStickerpackView/>}
            {currentView === "gifs" && <div class={"view center"}>Coming soon... or not</div>}
        </div>
    </>;
}