import {useEffect, useState} from "preact/hooks";
import {Sticker} from "./sticker.tsx";
import {X} from "lucide-preact";
import {apiRequest} from "../api/backend-api.ts";
import {useStickerPicker} from "../contexts/sticker-picker-context.tsx";

export function Stickerpack({stickerpack}: { stickerpack: any, saved?: boolean }) {

    const stickerPicker = useStickerPicker();
    const [stickers, setStickers] = useState([]);

    useEffect(() => {
        let stickerpackUrl = "";
        if (stickerpack.type == 'maunium') {
            stickerpackUrl = stickerpack.repository + "/packs/" + stickerpack.internal_name;
        }
        fetch(stickerpackUrl).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                setStickers(data.stickers);
            }
        });
    }, []);


    const removeStickerpack = () => {
        apiRequest('user/stickerpacks/remove', {
            method: "POST",
            body: JSON.stringify({
                stickerpack_id: stickerpack.id,
            }),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${stickerPicker?.userData?.token ?? ""}`
            },
        }).then((response: Response) => {
            if (response.status == 200) {
                let tmpSaved = stickerPicker.savedStickerpacks.filter((item: any) => item != stickerpack.id);
                stickerPicker.setSavedStickerpacks([...tmpSaved]);
            }
        })
    }

    const addStickerpack = () => {

        apiRequest('user/stickerpacks/add', {
            method: "POST",
            body: JSON.stringify({
                stickerpack_id: stickerpack.id,
            }),
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${stickerPicker?.userData?.token ?? ''}`
            },
        }).then((response: Response) => {
            if (response.status == 200) {
                stickerPicker.setSavedStickerpacks([...stickerPicker.savedStickerpacks, stickerpack.id])
            }
        })
    }

    const isSaved = () => {
        return stickerPicker.savedStickerpacks.includes(stickerpack.id);
    };

    return <div className={"stickerpack"}>
        <div className={"stickerpack__header"}>
            <div>
                {stickerpack.name}
            </div>
            {isSaved() ? <X onClick={removeStickerpack} class={'ico stickerpack__x'}/> : null}
            {!isSaved() ? <button onClick={addStickerpack} class={"btn btn--add-stick"}>Save</button> : null}

        </div>
        <div className={"stickerpack__body"}>
            {stickers.map((sticker: any) =>
                (<Sticker key={sticker.url} repository={stickerpack.repository} sticker={sticker}/>)
            )}
        </div>
    </div>;
}