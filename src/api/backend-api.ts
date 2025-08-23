import {BACKEND_URL} from "../config/main.ts";
import {useStickerPicker} from "../stores/sticker-picker.tsx";

export async function apiRequest(method: string, init: RequestInit = {}) {
    const stickerPicker = useStickerPicker;

    return fetch(BACKEND_URL + method, {
        ...init,
        headers: {
            ...init?.headers,
            Authorization: `Bearer ${stickerPicker.getState().userData?.token}`,
        },
    });
}


