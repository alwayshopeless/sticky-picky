import {BACKEND_URL} from "@/config/main.ts";

export interface ParsedStickerpackShareRef {
    host: string | null;
    shareId: string;
    isRemote: boolean;
}

const SHARE_ID_PATTERN = /^[a-zA-Z0-9_-]{16,64}$/;
const STICKERPACK_SHARE_PROTOCOL = "stpk://";

function getAggregatorHost() {
    try {
        return new URL(BACKEND_URL).host || window.location.host;
    } catch {
        return window.location.host;
    }
}

export function buildStickerpackShareRef(shareId: string, host = getAggregatorHost()) {
    return `${STICKERPACK_SHARE_PROTOCOL}${host}/${shareId}`;
}

export function buildStickerpackShareLink(shareId: string, host = getAggregatorHost()) {
    return buildStickerpackShareRef(shareId, host);
}

export function parseStickerpackShareInput(input: string, currentHost = getAggregatorHost()): ParsedStickerpackShareRef | null {
    const trimmed = input.trim();
    if (!trimmed) {
        return null;
    }

    if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
        try {
            const url = new URL(trimmed);
            const queryRef = url.searchParams.get("addStickerpack");
            if (queryRef) {
                return parseStickerpackShareInput(queryRef, currentHost);
            }

            if (url.hash) {
                return parseStickerpackShareInput(url.hash.slice(1), currentHost);
            }
        } catch {
            return null;
        }
    }

    if (trimmed.startsWith("#")) {
        return parseStickerpackShareInput(trimmed.slice(1), currentHost);
    }

    if (trimmed.startsWith(STICKERPACK_SHARE_PROTOCOL)) {
        try {
            const shareUrl = new URL(trimmed);
            const shareId = shareUrl.pathname.replace(/^\/+/, "");
            if (!SHARE_ID_PATTERN.test(shareId)) {
                return null;
            }

            return {
                host: shareUrl.host || null,
                shareId,
                isRemote: Boolean(shareUrl.host && shareUrl.host !== currentHost),
            };
        } catch {
            return null;
        }
    }

    const lastColonIndex = trimmed.lastIndexOf(":");
    if (lastColonIndex > 0 && lastColonIndex < trimmed.length - 1) {
        const host = trimmed.slice(0, lastColonIndex);
        const shareId = trimmed.slice(lastColonIndex + 1);
        if (SHARE_ID_PATTERN.test(shareId)) {
            return {
                host,
                shareId,
                isRemote: host !== currentHost,
            };
        }
    }

    if (!SHARE_ID_PATTERN.test(trimmed)) {
        return null;
    }

    return {
        host: null,
        shareId: trimmed,
        isRemote: false,
    };
}
