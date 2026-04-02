const getBackendUrl = () => {
    if (typeof window === "undefined") {
        return "/api/v1/";
    }

    return new URL("/api/v1/", window.location.origin).toString();
};

export const BACKEND_URL: string = getBackendUrl();

export const isDebug = true;
