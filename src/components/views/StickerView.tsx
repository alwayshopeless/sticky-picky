import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useState} from "preact/hooks";
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";

export function StickerView({explore}: { explore: any }) {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const [stickerpacks, setStickerpacks] = useState<any>([]);
    //@ts-ignore
    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);

    // const [userData, setUserData] = useState<any>(null);
    // useEffect(() => {
    //
    //
    // }, [])

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
                        stickerPicker.setSavedStickerpacks(savedStickpacks);
                    }
                    console.log("Стикеры загружены, или чё?")
                    console.log(response)
                })
            }
        }
    }, []);

    return <>
        <div>
            Stickerpacks nav
        </div>
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
                <Stickerpack key={stickerpack.name} saved={true} stickerpack={stickerpack}/>))}
        </>
    </>
}