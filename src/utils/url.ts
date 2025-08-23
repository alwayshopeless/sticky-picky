export function getAllUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const result: any = {};
    for (const [key, value] of params.entries()) {
        result[key] = value;
    }
    return result;
}

export function buildHttpQuery(values: Record<string, string>) {
    return new URLSearchParams(values);
}