import {useEffect, useRef} from "preact/hooks";
import {Route, Router} from "preact-iso/router";

import {useMatrix} from "./contexts/matrix-widget-api-context.tsx";
import {apiRequest} from "./api/backend-api.ts";

import {useStickerPicker} from "./stores/sticker-picker.tsx";
import {TopNav} from "./components/top-nav.tsx";
import {ConnectForm} from "./components/forms/connect-form.tsx";
import {ManageStickerpacks} from "@/components/views/manage-stickerpacks/manage-stickerpacks.tsx";
import {CreateStickerpackView} from "@/components/views/manage-stickerpacks/create-stickerpack-view.tsx";
import {StickerView} from "@/components/views/sticker-view.tsx";
import {ExploreStickersView} from "@/components/views/explore-stickers-view.tsx";
import {SettingsView} from "@/components/views/settings-view.tsx";
import {EditStickerpackView} from "@/components/views/manage-stickerpacks/edit-stickerpack-view.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {parseStickerpackShareInput} from "@/utils/stickerpack-share.ts";
import {loadStickerpack} from "@/utils/stickers.ts";

export function App() {
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const handledShareRef = useRef<string | null>(null);
    const authRefreshRequested = useRef(false);

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
        widget.on("capabilities", (data) => {
            window.parent.postMessage(
                {
                    ...data,
                    response: {
                        capabilities: [
                            "m.sticker",
                            "org.matrix.msc4039.download_file",
                            "org.matrix.msc4039.upload_file",
                        ],
                    },
                },
                "*"
            );
        });

        widget.on("openid_credentials", (event) => {
            console.log(event);
            apiRequest("auth/login", {
                method: "POST",
                body: JSON.stringify({
                    user_token: event?.data?.access_token,
                    homeserver: event?.data?.matrix_server_name,
                }),
                headers: {
                    "Content-Type": "application/json",
                },
            }).then(async (response: Response) => {
                if (response.status == 200) {
                    let data: any = await response.json();
                    const previousUserId = useStickerPicker.getState().userData?.matrixUserId ?? null;
                    const switchedMatrixUser = previousUserId !== null && previousUserId !== data.matrix_id;

                    if (switchedMatrixUser) {
                        const stickerCollections = useStickerCollections.getState();
                        stickerCollections.setSavedStickerpacks([]);
                        stickerCollections.setStickerpacks([]);
                        stickerCollections.setStickerpacksData({});
                        stickerCollections.setFavoriteStickers([]);
                        stickerCollections.setRecentStickers([]);
                    }

                    stickerPicker.setUserData({
                        backendUserId: data.user_id,
                        matrixUserId: data.matrix_id,
                        token: data.token,
                    });
                }
            });

            window.parent.postMessage({...event});
        });
    }, []);

    useEffect(() => {
        if (!stickerPicker.userData || authRefreshRequested.current) {
            return;
        }

        authRefreshRequested.current = true;
        sendAuthRequest();
    }, [stickerPicker.userData]);

    useEffect(() => {
        if (!stickerPicker.userData) {
            return;
        }

        const url = new URL(window.location.href);
        const sharedRef = url.searchParams.get("addStickerpack") || url.hash || null;
        if (!sharedRef || handledShareRef.current === sharedRef) {
            return;
        }

        handledShareRef.current = sharedRef;
        const parsed = parseStickerpackShareInput(sharedRef);
        if (!parsed || parsed.isRemote) {
            return;
        }

        apiRequest("user/stickerpack/attach", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                share_id: parsed.shareId,
            }),
        }).then(async (response) => {
            if (response.status !== 200) {
                return;
            }

            const data = await response.json().catch(() => null);
            if (data?.stickerpack) {
                useStickerCollections.getState().addStickerpack(data.stickerpack);
                void loadStickerpack(data.stickerpack);
            }

            const cleanUrl = new URL(window.location.href);
            cleanUrl.searchParams.delete("addStickerpack");
            cleanUrl.hash = "";
            window.history.replaceState({}, "", cleanUrl.toString());
        }).catch((error) => {
            console.error("Failed to attach shared stickerpack:", error);
        });
    }, [stickerPicker.userData]);

    return (
        <div class="main">
            {stickerPicker.userData == null ? (
                <ConnectForm sendAuthRequest={sendAuthRequest}/>
            ) : null}

            <TopNav/>
            <Router>
                <Route path="/" component={StickerView}/>
                <Route path="/explore" component={ExploreStickersView}/>
                <Route path="/settings" component={SettingsView}/>
                <Route path="/manage-stickerpacks" component={ManageStickerpacks}/>
                <Route path="/create-stickerpack" component={CreateStickerpackView}/>
                <Route path="/edit-stickerpack/:stickerpackId" component={EditStickerpackView}/>
                <Route
                    path="/gifs"
                    component={() => (<div class="view center">Coming soon... or not</div>)}
                />
            </Router>
        </div>
    );
}
