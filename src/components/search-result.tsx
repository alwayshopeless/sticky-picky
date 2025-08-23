import {useEffect, useState} from "preact/hooks";
import type {IStickerpack} from "../types/stickerpack.ts";
import {Stickerpack} from "./stickerpack.tsx";
import emojiFromWord from "emoji-from-word";
import {Sticker} from "./sticker.tsx";
import {emojisDict} from "../data/emojis-dict.ts";

interface SearchResultProps {
    searchText: string;
    stickerpacks: Record<number, IStickerpack>;
    stickerpacksData: any[];
    setEmoji: (s: string) => void;
}

function isEmoji(char: string): boolean {
    return /\p{Extended_Pictographic}/u.test(char);
}

export function SearchResult({
                                 searchText, stickerpacks, stickerpacksData, setEmoji = () => {
    }
                             }: SearchResultProps) {

    const [foundedStickerpacks, setFoundedStickerpacks] = useState<IStickerpack[]>([]);
    const [foundStickers, setFoundStickers] = useState<any[]>([]);

    const searchStickerpacks = () => {
        const text = searchText.toLowerCase();
        const tmpStickerpacks: IStickerpack[] = Object.values(stickerpacks).filter(item =>
            item.name.toLowerCase().includes(text)
        );
        setFoundedStickerpacks(tmpStickerpacks);
    };

    const searchStickers = () => {
        const text = searchText.toLowerCase();
        let emojisToSearch: string[] = [];

        if (emojisDict[text]) {
            emojisToSearch = emojisDict[text];
        } else {
            const singleEmoji = emojiFromWord(searchText)?.emoji?.char;
            if (singleEmoji) {
                emojisToSearch = [singleEmoji];
            } else if (isEmoji(searchText)) {
                emojisToSearch = [searchText];
            } else {
                setFoundStickers([]);
                setEmoji("");
                return;
            }
        }
        setEmoji(emojisToSearch.join(" "));

        const stickersList: any[] = [];

        Object.values(stickerpacks).forEach(stickerpack => {
            const stickers = stickerpacksData[stickerpack.id] || [];
            stickers.forEach((sticker: any) => {
                const stickerEmojis = sticker["net.maunium.telegram.sticker"]?.emoticons || [];
                if (emojisToSearch.some(e => sticker.body?.includes(e) || stickerEmojis.includes(e))) {
                    stickersList.push({...sticker, stickerpack});
                }
            });
        });

        setFoundStickers(stickersList);
    };

    useEffect(() => {
        searchStickerpacks();
        searchStickers();
    }, [searchText, stickerpacks, stickerpacksData]);

    return <div>
        <div></div>
        <div class="stickerpack">
            <div class="stickerpack__header">Found</div>
            <div class={"stickerpack__body"}>
                {foundStickers.map(sticker => (
                    <Sticker sticker={sticker} repository={sticker.stickerpack.repository}/>
                ))}
            </div>
        </div>
        <div>
            {foundedStickerpacks.map(sp => (
                <Stickerpack
                    key={sp.id}
                    stickerpack={sp}
                    stickers={stickerpacksData[sp.id]}
                />
            ))}
        </div>
    </div>
}
