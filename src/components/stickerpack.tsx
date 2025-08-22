import {useEffect, useMemo} from "preact/hooks";
import {Sticker} from "./sticker.tsx";
import {X} from "lucide-preact";
import {apiRequest} from "../api/backend-api.ts";
import {useStickerPicker} from "../stores/sticker-picker.tsx";
import {useStickerCollections} from "../stores/sticker-collections.tsx";

interface StickerpackProps {
    stickerpack: any,
    stickers: any[]
    compact?: boolean,
}

export function Stickerpack({stickerpack, stickers = [], compact = false}: StickerpackProps) {

    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();

    useEffect(() => {

    }, []);

    const isInternalType = useMemo(() => {
        return stickerpack.spType == 'favorites' || stickerpack.spType == 'recent';
    }, [stickerpack.spType]);

    const removeStickerpack = () => {
        let tmpSaved = stickerCollections.savedStickerpacks.filter((item: any) => item != stickerpack.id);
        stickerCollections.setSavedStickerpacks([...tmpSaved]);
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
                let tmpSaved = stickerCollections.savedStickerpacks.filter((item: any) => item != stickerpack.id);
                stickerCollections.setSavedStickerpacks([...tmpSaved]);
            }
        }).catch(_e => {
            let tmpPacks = new Set([...stickerCollections.savedStickerpacks]);
            tmpPacks.add(stickerpack.id);
            stickerCollections.setSavedStickerpacks([...tmpPacks]);
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
                stickerCollections.setSavedStickerpacks([...stickerCollections.savedStickerpacks, stickerpack.id])
            }
        })
    }
    stickerPicker.stickersPerRow
    const isSaved = () => {
        return stickerCollections.savedStickerpacks.includes(stickerpack.id);
    };

    return <div className={"stickerpack"} id={`spack-${stickerpack.id}`}>
        <div className={"stickerpack__header"}>
            <div>
                {stickerpack.name}
            </div>
            {isSaved() && !isInternalType ? <X onClick={removeStickerpack} class={'ico stickerpack__x'}/> : null}
            {!isSaved() && !isInternalType ?
                <button onClick={addStickerpack} class={"btn btn--add-stick"}>Save</button> : null}

        </div>
        <div className={"stickerpack__body"}>
            {(compact ? stickers.slice(0, stickerPicker.stickersPerRow) : stickers).map(
                (sticker: any) => (
                    <Sticker
                        key={sticker.url}
                        repository={isInternalType ? sticker.repository : stickerpack.repository}
                        sticker={sticker}
                    />
                )
            )}
        </div>
    </div>;
}