import {createStore, del, get, set} from "idb-keyval";
import type {StateStorage} from "zustand/middleware";

const LEGACY_STORAGE_KEYS = [
    "sticker-collections",
    "stickerCollections",
    "zustand",
] as const;

const mediaCacheStore = createStore("sticky-picky-cache", "mxc-media");

async function migrateLegacyLocalStorageItem(name: string) {
    if (typeof window === "undefined") return null;

    const legacyKey = LEGACY_STORAGE_KEYS.find((key) => window.localStorage.getItem(key) !== null);
    if (!legacyKey) return null;

    const value = window.localStorage.getItem(legacyKey);
    if (value == null) return null;

    await set(name, value);

    if (legacyKey !== name) {
        window.localStorage.removeItem(legacyKey);
    }

    return value;
}

export function createIndexedDbStorage(): StateStorage {
    return {
        getItem: async (name) => {
            const value = await get<string>(name);
            if (value != null) {
                return value;
            }

            return migrateLegacyLocalStorageItem(name);
        },
        setItem: async (name, value) => {
            await set(name, value);
        },
        removeItem: async (name) => {
            await del(name);
            if (typeof window !== "undefined") {
                window.localStorage.removeItem(name);
            }
        },
    };
}

export async function getCachedMxcBlob(mxcUrl: string) {
    return get<Blob>(mxcUrl, mediaCacheStore);
}

export async function setCachedMxcBlob(mxcUrl: string, blob: Blob) {
    await set(mxcUrl, blob, mediaCacheStore);
}

export async function removeCachedMxcBlob(mxcUrl: string) {
    await del(mxcUrl, mediaCacheStore);
}
