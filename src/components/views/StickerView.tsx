import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useState} from "preact/hooks";
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";
import type {IStickerpack} from "../../types/stickerpack.ts";


export function StickerViewNav() {
    return <div>

    </div>;
}

export function StickerView({explore}: { explore: any }) {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const [stickerpacks, setStickerpacks] = useState<IStickerpack[]>([]);
    const [stickerpacksData, setStickerpacksData] = useState<any>({});
    //@ts-ignore
    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);

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

        const CORS_PROXY = "https://api.cors.lol/?url=";
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
                apiRequest('user/stickerpacks', {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${stickerPicker.userData.token}`
                    },
                }).then(async (response: Response) => {
                    if (response.status == 200) {
                        let data = await response.json();
                        setStickersLoaded(true);
                        setStickerpacks(data.stickerpacks);
                        let savedStickpacks = data.stickerpacks.map((item: any) => item.stickerpack_id);
                        data.stickerpacks.forEach((item: IStickerpack) => {
                            loadStickerpack(item);
                        });
                        stickerPicker.setSavedStickerpacks(savedStickpacks);
                    } else {
                        console.log("Errror: Cant load stickerpacks");
                    }
                })
            }
        }
    }, []);

    return <>
        <StickerViewNav/>
        <>
            {stickerpacks.length == 0 ? <div class={"center"}>
                <div style={{
                    marginBottom: "1rem",
                }}>
                    You have not stickers yet...
                </div>
                <button onClick={explore} class={'btn'}>
                    Explore!
                </button>
            </div> : null}
            {stickerpacks.map((stickerpack: any) => (
                <Stickerpack key={stickerpack.name} stickerpack={stickerpack}
                             stickers={stickerpacksData[stickerpack.id]}/>))}
        </>
    </>
}