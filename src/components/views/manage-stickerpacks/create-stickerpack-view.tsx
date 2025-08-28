import {useEffect, useRef, useState} from 'preact/hooks';
import {type JSX} from 'preact';
import {Button} from '@/components/ui/button.tsx';
import {Check, Loader, X} from 'lucide-preact';
import {useMatrix} from '@/contexts/matrix-widget-api-context.tsx';
import {apiRequest} from "@/api/backend-api.ts";


interface CreateStickerDto {
    id: number;
    file: File;
    preview: string;
    emoji: string;
    uploading: boolean;
    uploaded: boolean;
    uploadedPath: string | null; // mxc:// url after Matrix upload
}

interface StickerDataOut {
    body: string; // emoji or short text
    url: string;  // mxc:// url
}

async function resizeImage(file: File, maxSize = 512): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let {width, height} = img;
            const scale = Math.min(maxSize / width, maxSize / height, 1);
            width = Math.round(width * scale);
            height = Math.round(height * scale);

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return reject(new Error('Canvas not supported'));

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(
                (blob) => {
                    if (!blob) return reject(new Error('Canvas toBlob failed'));
                    const resizedFile = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', {
                        type: 'image/webp',
                    });
                    resolve(resizedFile);
                },
                'image/webp',
                0.9,
            );
        };
        img.onerror = (err) => reject(err);
        img.src = URL.createObjectURL(file);
    });
}

// Helper to wait for a single Matrix upload response matching requestId
function useMatrixUploader() {
    const widget = useMatrix();

    const uploadViaMatrix = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            if (!widget) return reject(new Error('Matrix widget is not available'));

            const requestId = `mxc-request-${Date.now()}-${Math.random().toString(36).slice(2)}`;
            let timeoutId: number | undefined;

            const cleanup = () => {
                // @ts-ignore – some emitters use off, some use removeListener
                if (typeof widget.off === 'function') widget.off('org.matrix.msc4039.upload_file', onResp);
                // @ts-ignore
                if (typeof widget.removeListener === 'function') widget.removeListener('org.matrix.msc4039.upload_file', onResp);
                if (timeoutId) window.clearTimeout(timeoutId);
            };

            const onResp = (event: any) => {
                try {
                    if (!event) return;
                    if (event.requestId !== requestId) return; // not our upload
                    const uri = event?.response?.content_uri;
                    if (uri && typeof uri === 'string') {
                        cleanup();
                        console.log(event);
                        console.log(`onResp triggered: ${uri}`);
                        resolve(uri);
                    } else if (event?.response?.error) {
                        cleanup();
                        reject(new Error(event.response.error));
                    }
                } catch (e) {
                    cleanup();
                    reject(e as Error);
                }
            };

            // @ts-ignore
            widget.on('org.matrix.msc4039.upload_file', onResp);

            widget.sendMessage({
                api: 'fromWidget',
                action: 'org.matrix.msc4039.upload_file',
                requestId,
                widgetId: widget.widgetId,
                data: {file},
            });

            // safety timeout
            timeoutId = window.setTimeout(() => {
                cleanup();
                reject(new Error('Matrix upload timed out'));
            }, 60_000);
        });
    };

    return {uploadViaMatrix};
}

export function CreateStickerpackView({token}: { token?: string }): JSX.Element {
    const [packName, setPackName] = useState<string>('');
    const [stickers, setStickers] = useState<CreateStickerDto[]>([]);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [uploadingFiles, setUploadingFiles] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const {uploadViaMatrix} = useMatrixUploader();

    // Revoke previews on unmount
    useEffect(() => {
        return () => {
            stickers.forEach((s) => s.preview && URL.revokeObjectURL(s.preview));
        };
    }, []);

    const handleFileSelect = async (files: FileList | null): Promise<void> => {
        if (!files) return;
        const fileArray = Array.from(files);

        for (const file of fileArray) {
            if (!file.type.startsWith('image/')) continue;

            const resizedFile = await resizeImage(file);
            const tempId = Date.now() + Math.random();
            const preview = URL.createObjectURL(resizedFile);

            const newSticker: CreateStickerDto = {
                id: tempId,
                file: resizedFile,
                preview,
                emoji: '😀',
                uploading: false, // not uploading immediately; will upload on submit
                uploaded: false,
                uploadedPath: null,
            };

            setStickers((prev) => [...prev, newSticker]);
        }
    };

    const updateStickerEmoji = (stickerId: number, emoji: string): void => {
        setStickers((prev) => prev.map((sticker) => (sticker.id === stickerId ? {...sticker, emoji} : sticker)));
    };

    const replaceSticker = async (stickerId: number, newFile: File): Promise<void> => {
        if (!newFile.type.startsWith('image/')) return;
        const resizedFile = await resizeImage(newFile);
        const preview = URL.createObjectURL(resizedFile);

        // Reset upload state because file changed
        setStickers((prev) =>
            prev.map((sticker) =>
                sticker.id === stickerId
                    ? {
                        ...sticker,
                        file: resizedFile,
                        preview,
                        uploading: false,
                        uploaded: false,
                        uploadedPath: null,
                    }
                    : sticker,
            ),
        );
    };

    const removeSticker = (stickerId: number): void => {
        setStickers((prev) => {
            const sticker = prev.find((s) => s.id === stickerId);
            if (sticker && sticker.preview) URL.revokeObjectURL(sticker.preview);
            return prev.filter((s) => s.id !== stickerId);
        });
    };

    // Upload all not-yet-uploaded stickers to Matrix and then create stickerpack via backend
    const handleSubmit = async (): Promise<void> => {
        if (!packName.trim() || stickers.length === 0) {
            // TODO: change to set error
            console.log('Please enter pack name and add at least one sticker');
            return;
        }

        setSubmitting(true);

        try {
            // 1) Upload all images to Matrix (only those not already uploaded)
            const toUpload = stickers.filter((s) => !s.uploaded);
            const uploadedResults: CreateStickerDto[] = [];

            for (const s of toUpload) {
                setUploadingFiles((prev) => new Set([...prev, s.id]));
                setStickers((prev) => prev.map((x) => (x.id === s.id ? {...x, uploading: true} : x)));

                try {
                    const mxcUrl = await uploadViaMatrix(s.file);
                    const updatedSticker = {
                        ...s,
                        uploading: false,
                        uploaded: true,
                        uploadedPath: mxcUrl,
                    };

                    uploadedResults.push(updatedSticker);
                    setStickers((prev) => prev.map((x) => (x.id === s.id ? updatedSticker : x)));
                } catch (e) {
                    console.error('Upload error:', e);
                    setStickers((prev) => prev.map((x) => (x.id === s.id ? {...x, uploading: false} : x)));
                    throw e;
                } finally {
                    setUploadingFiles((prev) => {
                        const ns = new Set(prev);
                        ns.delete(s.id);
                        return ns;
                    });
                }
            }

            const finalStickers = stickers.map(
                (s) => uploadedResults.find((u) => u.id === s.id) ?? s,
            );


            const payload = {
                name: packName.trim(),
                stickers: finalStickers.map((s) => ({body: s.emoji, url: s.uploadedPath!})),
            };

            const res = await apiRequest('stickerpacks/create', {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token ?? ''}`,
                },
            });

            if (res?.status == 200) {
                setPackName('');
                stickers.forEach((s) => s.preview && URL.revokeObjectURL(s.preview));
                setStickers([]);
                setError(null);
                setSuccess('Sticker pack created successfully');
            } else {
                const msg = res?.error || 'Error creating sticker pack';
                setError(msg);
                throw new Error(msg);
            }
        } catch (error: any) {
            console.error('Submit error:', error);
            setError(error?.message || 'Error creating sticker pack');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div>
            <h2>Create New Sticker Pack</h2>

            <label>Pack Name:</label>
            <div className="field mb-1">
                <input
                    type="text"
                    value={packName}
                    onChange={(e) => setPackName((e.target as HTMLInputElement).value)}
                    placeholder="Enter sticker pack name"
                    className="field__input"
                />
            </div>

            <div class={"mb-1"}>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files)}
                    style={{display: 'none'}}
                />
                <Button onClick={() => fileInputRef.current?.click()}>Add Stickers</Button>
            </div>

            {stickers.length > 0 && (
                <div
                    style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                        gap: '20px',
                        marginTop: '20px',
                    }}
                >
                    {stickers.map((sticker) => (
                        <div
                            key={sticker.id}
                            style={{
                                background: '1px solid var(--bg-secondary)',
                                borderRadius: '8px',
                                padding: '15px',
                                position: 'relative',
                            }}
                        >
                            <div
                                style={{
                                    position: 'absolute',
                                    top: '10px',
                                    right: '10px',
                                    fontSize: '12px',
                                }}
                            >
                                {sticker.uploaded && (
                                    <div>
                                        <Check/>
                                    </div>
                                )}
                                {sticker.uploading && !sticker.uploaded && <Loader class={"loading"}/>}
                                {!sticker.uploading && !sticker.uploaded && <X/>}
                            </div>

                            <div style={{textAlign: 'center', marginBottom: '10px'}}>
                                <img
                                    src={sticker.preview}
                                    alt="Sticker preview"
                                    style={{
                                        width: '100px',
                                        height: '100px',
                                        objectFit: 'cover',
                                        borderRadius: '4px',
                                        opacity: sticker.uploading ? 0.6 : 1,
                                    }}
                                />
                            </div>

                            <div style={{marginBottom: '1rem'}}>
                                <div className="field">
                                    <input
                                        required
                                        type="text"
                                        value={sticker.emoji}
                                        onChange={(e) =>
                                            updateStickerEmoji(sticker.id, (e.target as HTMLInputElement).value)
                                        }
                                        placeholder="😀"
                                        className="field__input"
                                        style={{textAlign: 'center'}}
                                    />
                                </div>
                            </div>

                            <div style={{display: 'flex', gap: '8px'}}>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => {
                                        const file = (e.target as HTMLInputElement).files?.[0];
                                        if (file) replaceSticker(sticker.id, file);
                                    }}
                                    style={{display: 'none'}}
                                    id={`replace-${sticker.id}`}
                                />
                                <Button onClick={() => document.getElementById(`replace-${sticker.id}`)?.click()}
                                        disabled={sticker.uploading}>
                                    Replace
                                </Button>
                                <Button onClick={() => removeSticker(sticker.id)}>Remove</Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {stickers.length > 0 && (
                <div
                    style={{
                        padding: '15px',
                        borderRadius: '4px',
                        margin: '20px 0',
                    }}
                >
                    <div>Total: {stickers.length}</div>
                    <div>Uploaded: {stickers.filter((s) => s.uploaded).length}</div>
                    <div>Uploading now: {uploadingFiles.size}</div>
                </div>
            )}

            {error && <div class={"color-danger"}>{error}</div>}
            {success && <div class={"color-success"}>{success}</div>}

            <Button onClick={handleSubmit} disabled={submitting || !packName.trim() || stickers.length === 0}>
                {submitting ? 'Creating...' : 'Create Sticker Pack'}
            </Button>
        </div>
    );
}
