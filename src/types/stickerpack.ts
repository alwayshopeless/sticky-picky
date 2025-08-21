export interface IStickerpack {
    id: number;
    repository: string;
    homeserver: string;
    name: string;
    internal_name: string;
    type: "maunium" | string
    stickerpack_id: number;
}