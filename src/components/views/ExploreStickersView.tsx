import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useState} from "preact/hooks";
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";

export function ExploreStickersView() {
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
                apiRequest('stickerpacks/all', {
                    method: "GET",
                }).then(async (response: Response) => {
                    if (response.status == 200) {
                        let data = await response.json();
                        setStickersLoaded(true);
                        setStickerpacks(data.stickerpacks);
                    }
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
                <button class={'btn'}>
                    Explore!
                </button>
            </div> : null}
            {stickerpacks.map((stickerpack: any) => (<Stickerpack key={stickerpack.name} stickerpack={stickerpack}/>))}
        </>
    </>
}