import {X} from "lucide-preact";
import {useStickerPicker} from "@/stores/sticker-picker.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {apiRequest} from "@/api/backend-api.ts";
import {Button} from "@/components/ui/button.tsx";
import {useSimpleRouter} from "@/stores/simple-router.tsx";
import {ExtraLayout} from "@/layouts/extra-layout.tsx";

interface StickerpacksListProps {
    onEdit: (id: string) => void,
}

export function StickerpacksList({onEdit}: StickerpacksListProps) {
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    const {setView} = useSimpleRouter();

    const removeStickerpack = async (stickerpack: any) => {
        stickerCollections.removeStickerpack(stickerpack.id);

        try {
            const response = await apiRequest('user/stickerpacks/remove', {
                method: "POST",
                body: JSON.stringify({stickerpack_id: stickerpack.id}),
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${stickerPicker?.userData?.token ?? ""}`
                },
            });

            if (response.status !== 200) {
                stickerCollections.addStickerpack(stickerpack);
                console.error("Failed to remove stickerpack from server");
            }
        } catch (error) {
            stickerCollections.addStickerpack(stickerpack);
            console.error("Error removing stickerpack:", error);
        }
    };
    const currentStickerpacks = stickerCollections.getStickerpacksArray();

    return (
        <div class="stickerpacks-list">
            {currentStickerpacks.map((stickerpack: any) => (
                <div key={stickerpack.id} class="stickerpack">
                    <div class={"stickerpack__header"}>
                        <span>{stickerpack.name}</span>
                        <div class="stickerpack__header-btns">
                            {stickerpack.type === "user_owned" ? (
                                <button onClick={() => onEdit(stickerpack.id)} class="btn btn--edit">
                                    Edit
                                </button>
                            ) : (
                                <X onClick={() => removeStickerpack(stickerpack)} class="ico stickerpack__x"/>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            <div>
                <Button onClick={() => {
                    setView("create-stickerpack");
                }}>
                    Create stickerpack!
                </Button>
            </div>
        </div>
    );
}


export function ManageStickerpacks() {
    return <ExtraLayout>
        <StickerpacksList onEdit={() => {

        }}/>
    </ExtraLayout>
}