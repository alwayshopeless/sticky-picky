import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useState} from "preact/hooks";
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";
import type {IStickerpack} from "../../types/stickerpack.ts";
import {StickerPreviewProvider} from "../../contexts/sticker-preview-context.tsx";

export function ExploreStickersView() {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const [stickerpacks, setStickerpacks] = useState<any>([]);
    //@ts-ignore
    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);
    const [stickerpacksData, setStickerpacksData] = useState<any>({});


    // const [userData, setUserData] = useState<any>(null);
    // useEffect(() => {
    //
    //
    // }, [])

    const loadStickerpack = async (stickerpack: IStickerpack, useProxy: boolean = false) => {
        let stickerpackUrl = "";
        if (stickerpack.type == 'maunium') {
            stickerpackUrl = stickerpack.repository + "/packs/" + stickerpack.internal_name;
        }

        const CORS_PROXY = "https://corsproxy.io/?url=";

        if (useProxy) {
            stickerpackUrl = CORS_PROXY + stickerpackUrl;
        }

        fetch(stickerpackUrl).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                setStickerpacksData((prev: any) => ({
                    ...prev,
                    [stickerpack.id]: data.stickers,
                }));
            }
        })
            .catch((_err: Error) => {
                if (!useProxy) {
                    loadStickerpack(stickerpack, true);
                }
            });
    };

    useEffect(() => {
        if (!stickersLoaded) {
            console.log(stickerPicker);
            if (stickerPicker.userData != null) {
                apiRequest('stickerpacks/all', {
                    method: "GET",
                }).then(async (response: Response) => {
                    if (response.status == 200) {
                        let data = await response.json();
                        setStickersLoaded(true);
                        setStickerpacks(data.stickerpacks);
                        data.stickerpacks.forEach((item: IStickerpack) => {
                            loadStickerpack(item);
                        });
                    }
                })
            }
        }
    }, []);

    return <StickerPreviewProvider>
        <>
            {stickerpacks.length == 0 ? <div class={"center"}>
                <div style={{
                    marginBottom: "1rem",
                }}>
                    Have not stickers yet...
                </div>
            </div> : null}

            {stickerpacks.map((stickerpack: any) => (<Stickerpack
                compact={stickerPicker.compactViewInExplore}
                key={stickerpack.name}
                stickerpack={stickerpack}
                stickers={stickerpacksData[stickerpack.id]}
            />))}
        </>
    </StickerPreviewProvider>
}