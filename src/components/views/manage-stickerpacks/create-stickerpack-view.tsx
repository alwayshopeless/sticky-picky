import {useRef, useState} from 'preact/hooks';
import {type JSX} from "preact";
import {Button} from "@/components/ui/button.tsx";
import {Check, Loader, X} from "lucide-preact";

interface CreateStickerDto {
    id: number;
    file: File;
    preview: string;
    emoji: string;
    uploading: boolean;
    uploaded: boolean;
    uploadedPath: string | null;
}

interface StickerData {
    emoji: string;
    uploadedPath: string;
}

// утилита: ресайз до 512×512
async function resizeImage(file: File, maxSize = 512): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let {width, height} = img;
            const scale = Math.min(maxSize / width, maxSize / height, 1);
            width = Math.round(width * scale);
            height = Math.round(height * scale);

            const canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext("2d");
            if (!ctx) return reject(new Error("Canvas not supported"));

            ctx.drawImage(img, 0, 0, width, height);
            canvas.toBlob(blob => {
                if (!blob) return reject(new Error("Canvas toBlob failed"));
                const resizedFile = new File([blob], file.name, { type: "image/webp" });
                resolve(resizedFile);
            }, "image/webp", 0.9);
        };
        img.onerror = (err) => reject(err);
        img.src = URL.createObjectURL(file);
    });
}

export function CreateStickerpackView(): JSX.Element {
    const [packName, setPackName] = useState<string>('');
    const [stickers, setStickers] = useState<CreateStickerDto[]>([]);
    const [uploading, setUploading] = useState<boolean>(false);
    const [uploadingFiles, setUploadingFiles] = useState<Set<number>>(new Set());
    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadFile = async (file: File): Promise<string> => {
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 300));
        return `uploaded_${Date.now()}_${file.name}`;
    };

    const submitStickerpack = async (packName: string, stickers: StickerData[]): Promise<void> => {
        console.log('Submitting sticker pack:', {packName, stickers});
    };

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
                uploading: true,
                uploaded: false,
                uploadedPath: null
            };

            setStickers(prev => [...prev, newSticker]);
            setUploadingFiles(prev => new Set([...prev, tempId]));

            try {
                const uploadedPath = await uploadFile(resizedFile);

                setStickers(prev => prev.map(sticker =>
                    sticker.id === tempId
                        ? {...sticker, uploading: false, uploaded: true, uploadedPath}
                        : sticker
                ));
            } catch (error) {
                console.error('Upload error:', error);
                setStickers(prev => prev.filter(sticker => sticker.id !== tempId));
            } finally {
                setUploadingFiles(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(tempId);
                    return newSet;
                });
            }
        }
    };

    const updateStickerEmoji = (stickerId: number, emoji: string): void => {
        setStickers(prev => prev.map(sticker =>
            sticker.id === stickerId ? {...sticker, emoji} : sticker
        ));
    };

    const replaceSticker = async (stickerId: number, newFile: File): Promise<void> => {
        if (!newFile.type.startsWith('image/')) return;

        const resizedFile = await resizeImage(newFile);
        const preview = URL.createObjectURL(resizedFile);

        setStickers(prev => prev.map(sticker =>
            sticker.id === stickerId
                ? {...sticker, file: resizedFile, preview, uploading: true, uploaded: false, uploadedPath: null}
                : sticker
        ));

        setUploadingFiles(prev => new Set([...prev, stickerId]));

        try {
            const uploadedPath = await uploadFile(resizedFile);
            setStickers(prev => prev.map(sticker =>
                sticker.id === stickerId
                    ? {...sticker, uploading: false, uploaded: true, uploadedPath}
                    : sticker
            ));
        } catch (error) {
            console.error('Replace error:', error);
            setStickers(prev => prev.filter(sticker => sticker.id !== stickerId));
        } finally {
            setUploadingFiles(prev => {
                const newSet = new Set(prev);
                newSet.delete(stickerId);
                return newSet;
            });
        }
    };

    const removeSticker = (stickerId: number): void => {
        setStickers(prev => {
            const sticker = prev.find(s => s.id === stickerId);
            if (sticker && sticker.preview) {
                URL.revokeObjectURL(sticker.preview);
            }
            return prev.filter(s => s.id !== stickerId);
        });
    };

    const handleSubmit = async (): Promise<void> => {
        if (!packName.trim() || stickers.length === 0) {
            alert('Please enter pack name and add at least one sticker');
            return;
        }

        const uploadedStickers = stickers.filter(s => s.uploaded);
        if (uploadedStickers.length === 0) {
            alert('Please wait for all stickers to finish uploading');
            return;
        }

        setUploading(true);
        try {
            await submitStickerpack(packName, uploadedStickers.map(s => ({
                emoji: s.emoji,
                uploadedPath: s.uploadedPath!
            })));

            setPackName('');
            setStickers([]);
            alert('Sticker pack created successfully!');
        } catch (error) {
            console.error('Submit error:', error);
            alert('Error creating sticker pack');
        } finally {
            setUploading(false);
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

            <div>
                <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleFileSelect((e.target as HTMLInputElement).files)}
                    style={{display: 'none'}}
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                    Add Stickers
                </Button>
            </div>

            {stickers.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                    gap: '20px',
                    marginTop: '20px'
                }}>
                    {stickers.map((sticker) => (
                        <div key={sticker.id} style={{
                            background: '1px solid var(--bg-secondary)',

                            borderRadius: '8px',
                            padding: '15px',
                            position: 'relative'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '10px',
                                right: '10px',
                                fontSize: '12px'
                            }}>
                                {sticker.uploaded && <div><Check/></div>}
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
                                        opacity: sticker.uploading ? 0.6 : 1
                                    }}
                                />
                            </div>

                            <div style={{marginBottom: "1rem"}}>
                                <div className="field">
                                    <input
                                        required
                                        type="text"
                                        value={sticker.emoji}
                                        onChange={(e) => updateStickerEmoji(sticker.id, (e.target as HTMLInputElement).value)}
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
                                <Button
                                    onClick={() => document.getElementById(`replace-${sticker.id}`)?.click()}
                                    disabled={sticker.uploading}
                                >
                                    Replace
                                </Button>
                                <Button
                                    onClick={() => removeSticker(sticker.id)}
                                >
                                    Remove
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {stickers.length > 0 && (
                <div style={{
                    padding: '15px',
                    borderRadius: '4px',
                    margin: '20px 0'
                }}>
                    <div>Total: {stickers.length}</div>
                    <div>Uploaded: {stickers.filter(s => s.uploaded).length}</div>
                    <div>Uploading: {uploadingFiles.size}</div>
                </div>
            )}

            <Button
                onClick={handleSubmit}
                disabled={uploading || uploadingFiles.size > 0 || !packName.trim() || stickers.length === 0}
            >
                {uploading ? 'Creating...' : 'Create Sticker Pack'}
            </Button>
        </div>
    );
}
