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
    body: string;
    url: string;
    repository?: string;
    stickerpack_type?: string;
    info?: any;
}

interface AddStickerResponse {
    sticker_id: number;
    sticker: StickerOut;
}

interface EditStickerPreviewProps {
    stickerData: any;
    removeSticker: (stickerId: number | string) => Promise<void>
    changeStickerBody: (stickerId: number | string, body: string) => Promise<void>
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
        await loadStickerpack(tmpStickpack, false, false);
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
                const response = await apiRequest(`stickerpacks/${stickerpackId}/stickers/add`, {
                    method: 'POST',
                    body: JSON.stringify({
                        body: "😀",
                        url: mxcUrl,
                        info: {
                            mimetype: resizedFile.type,
                        },
                    }),
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });

                if (response.status !== 200) {
                    const data = await response.json().catch(() => ({}));
                    throw new Error(data?.error || 'Error adding sticker');
                }

                const data: AddStickerResponse = await response.json();
                setStickers((prev) => [...prev, data.sticker]);
            } catch (e: any) {
                setError(e.message);
            }
        }
    };

    const removeSticker = async (stickerId: number | string) => {
        try {
            const requestPath = `stickerpacks/${stickerpackId}/stickers/${stickerId}/remove`;
            console.log('[removeSticker] starting request', {
                stickerpackId,
                stickerId,
                requestPath,
            });

            const response = await apiRequest(requestPath, {
                method: 'DELETE',
                headers: {},
            });

            console.log('[removeSticker] response received', {
                stickerpackId,
                stickerId,
                status: response.status,
                ok: response.ok,
                type: response.type,
                url: response.url,
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                console.error('[removeSticker] non-200 response body', data);
                throw new Error(data?.error || 'Error removing sticker');
            }

            setStickers((prev) => prev.filter((sticker) => String(sticker.id) !== String(stickerId)));
        } catch (e: any) {
            console.error('[removeSticker] request failed', {
                stickerpackId,
                stickerId,
                message: e?.message,
                name: e?.name,
                stack: e?.stack,
            });
            setError(e.message);
        }
    };

    const changeStickerBody = async (stickerId: number | string, body: string) => {
        try {
            const response = await apiRequest(`stickerpacks/${stickerpackId}/stickers/${stickerId}/edit`, {
                method: 'POST',
                headers: {},
                body: JSON.stringify({
                    body: body
                })
            });

            if (response.status !== 200) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data?.error || 'Error updating sticker');
            }

            setStickers((prev) => prev.map((sticker) => (
                String(sticker.id) === String(stickerId)
                    ? {...sticker, body}
                    : sticker
            )));
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
        <div class="view">
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
