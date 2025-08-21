import {BACKEND_URL} from "../config/main.ts";

export async function apiRequest(method: string, init?: RequestInit | undefined) {
    return fetch(BACKEND_URL + method, init);
}