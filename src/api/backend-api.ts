import {BACKEND_URL} from "../config/main.ts";

export async function apiRequest(method: string, init: RequestInit = {}) {
    return fetch(BACKEND_URL + method, {
        ...init,
        headers: {
            ...init?.headers,
        },
    });
}


