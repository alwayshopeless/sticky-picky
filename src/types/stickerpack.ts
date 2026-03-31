export interface IStickerpack {
    id: number;
    repository: string;
    homeserver: string;
    name: string;
    internal_name: string;
    type: "maunium" | string
    owner_user_id?: number | null;
    visibility?: "private" | "public";
    share_id?: string;
    parent_ref?: string | null;
    parent_share_id?: string | null;
    parent_media_homeserver?: string | null;
    source_aggregator_host?: string | null;
    import_target_homeserver?: string | null;
    stickerpack_id: number;
}
