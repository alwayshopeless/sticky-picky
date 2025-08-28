import {create} from "zustand";

export type View =
    "stickers"
    | "explore"
    | "settings"
    | "gifs"
    | "profile"
    | "about"
    | "manage-stickerpacks"
    | "create-stickerpack";

interface RouterState {
    currentView: View;
    showTopNav: boolean;
    setView: (view: View) => void;
    setShowTopNav: (show: boolean) => void;
}

export const useSimpleRouter = create<RouterState>((set) => ({
    currentView: "stickers",
    showTopNav: false,
    setShowTopNav: (show: boolean) => set({showTopNav: show}),
    setView: (view) => set({currentView: view}),
}));
