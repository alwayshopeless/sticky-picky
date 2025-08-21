export function buildThumbnailUrl(repository: string, sticker: any) {
    return `${repository}/packs/thumbnails/${sticker.url.split("/").slice(-1)[0]}`;
}