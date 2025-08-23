import {useEffect, useMemo} from "preact/hooks";
import {Sticker} from "./sticker.tsx";
import {CircleFadingPlus, RefreshCcw, X} from "lucide-preact";
import {apiRequest} from "../api/backend-api.ts";
import {useStickerPicker} from "../stores/sticker-picker.tsx";
import {useStickerCollections} from "../stores/sticker-collections.tsx";
import {loadStickerpack} from "../utils/stickers.ts";

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

    const removeStickerpack = async () => {
        // Оптимистичное обновление UI
        stickerCollections.removeStickerpack(stickerpack.id);

        try {
            const response = await apiRequest('user/stickerpacks/remove', {
                method: "POST",
                body: JSON.stringify({
                    stickerpack_id: stickerpack.id,
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${stickerPicker?.userData?.token ?? ""}`
                },
            });

            if (response.status !== 200) {
                // Если запрос не удался, откатываем изменения
                stickerCollections.addStickerpack(stickerpack);
                console.error("Failed to remove stickerpack from server");
            }
        } catch (error) {
            // Если произошла ошибка, откатываем изменения
            stickerCollections.addStickerpack(stickerpack);
            console.error("Error removing stickerpack:", error);
        }
    };

    const addStickerpack = async () => {
        try {
            const response = await apiRequest('user/stickerpacks/add', {
                method: "POST",
                body: JSON.stringify({
                    stickerpack_id: stickerpack.id,
                }),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${stickerPicker?.userData?.token ?? ''}`
                },
            });

            if (response.status === 200) {
                stickerCollections.addStickerpack(stickerpack);
            } else {
                console.error("Failed to add stickerpack to server");
            }
        } catch (error) {
            console.error("Error adding stickerpack:", error);
        }
    };

    const isSaved = (): boolean => {
        return Boolean(stickerCollections.savedStickerpacks[stickerpack.id]);
    };

    return <div className={"stickerpack"} id={`spack-${stickerpack.id}`}>
        <div className={"stickerpack__header"}>
            <div>
                {stickerpack.name}
            </div>
            <div class={"stickerpack__header-btns"}>
                {!isInternalType ? <RefreshCcw onClick={() => {
                    loadStickerpack(stickerpack);
                }} class={'ico stickerpack__x'}/> : null}
                {isSaved() && !isInternalType ? <X onClick={removeStickerpack} class={'ico stickerpack__x'}/> : null}
                {!isSaved() && !isInternalType ?
                    <button onClick={addStickerpack} class={"btn btn--add-stick"}><CircleFadingPlus size={16}/>
                    </button> : null}
                {/*<button onClick={addStickerpack} class={"btn btn--add-stick"}><SmilePlus size={16}/></button> : null}*/}
            </div>

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