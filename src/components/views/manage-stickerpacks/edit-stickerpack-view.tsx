import {useEffect, useRef, useState} from 'preact/hooks';
import {type JSX} from 'preact';
import {Button} from '@/components/ui/button.tsx';
import {apiRequest} from "@/api/backend-api.ts";
import {resizeImage, useMatrixUploader} from "@/components/views/manage-stickerpacks/create-stickerpack-view.tsx";
import {useLocation, useRoute} from "preact-iso";
import {useStickerCollections} from "@/stores/sticker-collections.tsx";
import {loadStickerpack, useMatrixFile} from "@/utils/stickers.ts";
import {PlusIcon, Trash2} from "lucide-preact";

interface StickerOut {
    id: number;
    emoji: string;
    url: string;
}

interface EditStickerPreviewProps {
    stickerData: any;
    removeSticker: (stickerId: string) => Promise<void>
    changeStickerBody: (stickerId: string, body: string) => Promise<void>
}

export function EditStickerPreview({stickerData, changeStickerBody, removeSticker}: EditStickerPreviewProps) {
    const {file, loading, error} = useMatrixFile(stickerData.url);
    const [src, setSrc] = useState<string | null>(null);
    const [body, setBody] = useState<string>(stickerData?.body ?? '');
    useEffect(() => {
        if (file) {
            const url = URL.createObjectURL(file);
            setSrc(url);
        }
    }, [file]);

    const changeBody = (e: any) => {
        e.preventDefault();
        setBody(e.currentTarget.value);
    }

    return (<div className="sticker-edit-preview">
        {!loading && !error && (
            <img
                src={src ?? undefined}
                alt="sticker"
                style={{
                    width: "100px",
                    height: "100px",
                    objectFit: "cover",
                }}
            />
        )}
        <div class="field">
            <input style={"text-align: center;"} value={body} type="text" class="field__input" onChange={changeBody}/>
        </div>
        <div className="stickerpack__header-btns">
            <Button onClick={() => {
                changeStickerBody(stickerData.id, body);
            }}>Change emoji</Button>
            <Button onClick={() => {
                removeSticker(stickerData.id);
            }}>
                <Trash2 size={14} class={"ico color-danger"}/>
            </Button>
        </div>
    </div>);
}


export function EditStickerpackView(): JSX.Element {
    const [stickers, setStickers] = useState<StickerOut[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const {uploadViaMatrix} = useMatrixUploader();
    const stickerpackCollections = useStickerCollections();
    const {route} = useLocation();
    const {params} = useRoute();
    const stickerpackId: string | null = params?.stickerpackId;

    const loadPack = async () => {
        let tmpStickpack = stickerpackCollections.stickerpacks[parseInt(stickerpackId)];
        if (!tmpStickpack) {
            return;
        }
        await loadStickerpack(tmpStickpack, false, true);
        setStickers(stickerpackCollections.stickerpacksData[tmpStickpack.id]);
    };

    useEffect(() => {
        loadPack();
        setLoading(false);

    }, [stickerpackId]);

    const handleFileSelect = async (files: FileList | null) => {
        if (!files) return;
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            if (!file.type.startsWith('image/')) continue;
            const resizedFile = await resizeImage(file);
            try {
                const mxcUrl = await uploadViaMatrix(resizedFile);
                await apiRequest(`stickerpacks/${stickerpackId}/stickers/add`, {
                    method: 'POST',
                    body: JSON.stringify({body: "😀", url: mxcUrl}),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                await loadPack();
            } catch (e: any) {
                setError(e.message);
            }
        }
    };

    const removeSticker = async (stickerId: string) => {
        try {
            await apiRequest(`stickerpacks/${stickerpackId}/stickers/${stickerId}/remove`, {
                method: 'DELETE',
                headers: {},
            });
            await loadPack();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const changeStickerBody = async (stickerId: string, body: string) => {
        try {
            await apiRequest(`stickerpacks/${stickerpackId}/stickers/${stickerId}/edit`, {
                method: 'POST',
                headers: {},
                body: JSON.stringify({
                    body: body
                })
            });
            await loadPack();
        } catch (e: any) {
            setError(e.message);
        }
    };

    const deletePack = async () => {
        try {
            await apiRequest(`stickerpacks/${stickerpackId}/delete`, {
                method: 'DELETE',
                headers: {},
            });
            route('/stickerpacks');
        } catch (e: any) {
            setError(e.message);
        }
    };

    if (loading) return <div>Loading...</div>;


    return (
        <div>
            <h2>Edit Sticker Pack</h2>
            <div class={"inline-btns inline-btns--between"}>
                <div class="mb-1">
                    <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="image/*"
                        onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files)}
                        style={{display: 'none'}}
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                        <PlusIcon size={12}/>
                        Add Stickers
                    </Button>
                </div>

                <Button onClick={deletePack} class="mb-1">
                    <Trash2 class={"ico color-danger"} size={12}/>
                    Delete Sticker Pack
                </Button>
            </div>
            {error && <div class="color-danger">{error}</div>}

            <div class="grid" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))', gap: '20px'}}>
                {stickers.map(s => <EditStickerPreview
                    key={s.id}
                    stickerData={s}
                    removeSticker={removeSticker}
                    changeStickerBody={changeStickerBody}
                />)}
            </div>


        </div>
    );
}
