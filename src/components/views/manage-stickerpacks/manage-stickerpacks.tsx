import {X} from "lucide-preact";
import {useStickerPicker} from "@/stores/sticker-picker.tsx";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {apiRequest} from "@/api/backend-api.ts";
import {Button} from "@/components/ui/button.tsx";
import {ExtraLayout} from "@/layouts/extra-layout.tsx";
import {useLocation} from "preact-iso";


export function StickerpacksList() {
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    const {route} = useLocation();

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
                                <Button onClick={() => {
                                    route(`/edit-stickerpack/${stickerpack.id}`);
                                }} class="btn btn--edit">
                                    Edit
                                </Button>
                            ) : (
                                <X onClick={() => removeStickerpack(stickerpack)} class="ico stickerpack__x"/>
                            )}
                        </div>
                    </div>
                </div>
            ))}
            {/* TODO: Thank about implement stickerpack creation feature */}
            {/* <div>
                <Button onClick={() => {
                    route("/create-stickerpack");
                }}>
                    Create stickerpack!
                </Button>
            </div> */}
        </div>
    );
}


export function ManageStickerpacks() {
    return <ExtraLayout>
        <StickerpacksList/>
    </ExtraLayout>
}
