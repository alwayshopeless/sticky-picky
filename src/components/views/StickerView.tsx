import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";
import {useEffect, useState} from "preact/hooks";
import {useStickerPicker} from "../../contexts/sticker-picker-context.tsx";
import {apiRequest} from "../../api/backend-api.ts";
import {Stickerpack} from "../stickerpack.tsx";
import type {IStickerpack} from "../../types/stickerpack.ts";
import {buildThumbnailUrl} from "../../utils/stickers.ts";
import {Clock, Heart} from "lucide-preact";
import {StickerPreviewProvider} from "../../contexts/sticker-preview-context.tsx";
import {Loader} from "../loader.tsx";
import {useStickerCollections} from "../../contexts/sticker-collections-context.tsx";


interface StickerViewNavProps {
    stickerpacks: IStickerpack[],
    stickerpacksData: any
}

export function StickerViewNav({stickerpacks, stickerpacksData}: StickerViewNavProps) {


    return <div class={"stickerpacks-nav"}>
        <a className={"pack-preview ico"} href={"#spack-favorites"}>
            <Heart/>
        </a>
        <a className={"pack-preview ico"} href={"#spack-recent"}>
            <Clock/>
        </a>
        {stickerpacks.map((pack: IStickerpack) => (<a href={`#spack-${pack.id}`} className={"pack-preview"}>
            {stickerpacksData[pack?.id] != undefined ?
                <img src={buildThumbnailUrl(pack.repository, stickerpacksData[pack?.id][0])} alt=""/> : null}
        </a>))}
    </div>;
}

export function StickerView({explore}: { explore: any }) {
    //@ts-ignore
    const widget = useMatrix();
    const stickerPicker = useStickerPicker();
    const stickerCollections = useStickerCollections();
    const [stickerpacks, setStickerpacks] = useState<IStickerpack[]>([]);
    const [stickerpacksData, setStickerpacksData] = useState<any>({});
    //@ts-ignore
    const [stickersLoaded, setStickersLoaded] = useState<boolean>(false);


    const loadStickerpack = async (stickerpack: IStickerpack, useProxy: boolean = false) => {
        let stickerpackUrl = "";
        if (stickerpack.type == 'maunium') {
            stickerpackUrl = stickerpack.repository + "/packs/" + stickerpack.internal_name;
        }

        const CORS_PROXY = "https://corsproxy.io/?url=";

        if (useProxy) {
            stickerpackUrl = CORS_PROXY + stickerpackUrl;
        }

        fetch(stickerpackUrl).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                setStickerpacksData((prev: any) => ({
                    ...prev,
                    [stickerpack.id]: data.stickers,
                }));
            }
        })
            .catch((_err: Error) => {
                if (!useProxy) {
                    loadStickerpack(stickerpack, true);
                }
            });
    };

    const loadStickerpacks = () => {
        apiRequest('user/stickerpacks', {
            method: "POST",
            headers: {
                Authorization: `Bearer ${stickerPicker.userData.token}`
            },
        }).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                setStickersLoaded(true);
                setStickerpacks(data.stickerpacks);
                let savedStickpacks = data.stickerpacks.map((item: any) => item.stickerpack_id);
                data.stickerpacks.forEach((item: IStickerpack) => {
                    loadStickerpack(item);
                });
                stickerCollections.setSavedStickerpacks(savedStickpacks);
            } else {
                console.log("Errror: Cant load stickerpacks");
            }
        })
    }

    const loadRecentAndFavorite = () => {
        apiRequest('user/stickers', {
            method: "GET",
            headers: {
                Authorization: `Bearer ${stickerPicker.userData.token}`
            },
        }).then(async (response: Response) => {
            if (response.status == 200) {
                let data = await response.json();
                stickerCollections.setFavoriteStickers(data.favorites);
                stickerCollections.setRecentStickers(data.recent);
            } else {
                console.log("Errror: Cant load favorites and recent stickers");
            }
        })
    }

    useEffect(() => {
        if (!stickersLoaded) {
            if (stickerPicker.userData != null) {
                loadStickerpacks();
                loadRecentAndFavorite();
            }
        }
    }, []);


    // }
    useEffect(() => {
        setStickerpacks((prevState: IStickerpack[]) => {
            return prevState.filter((item: IStickerpack) => stickerCollections.savedStickerpacks.includes(item.id));
        });
    }, [stickerCollections.savedStickerpacks]);

    return <>
        <StickerPreviewProvider>
            <StickerViewNav stickerpacks={stickerpacks} stickerpacksData={stickerpacksData}/>
            <div>
                <div class={"field"}>
                    <input class={'field__input'} type="text"/>
                </div>
            </div>
            <>
                {!stickersLoaded ? <Loader/> : null}
                {stickerCollections.favoriteStickers.length > 0 ? <Stickerpack
                        stickerpack={{
                            name: 'Favorites',
                            spType: 'favorites',
                            id: 'favorites',
                        }}
                        stickers={stickerCollections.favoriteStickers}
                    />
                    : null}
                {stickerCollections.recentStickers.length > 0 ?
                    <Stickerpack
                        stickerpack={{
                            id: 'recent',
                            name: 'Recent',
                            spType: 'recent',
                        }}
                        stickers={stickerCollections.recentStickers}
                    />
                    : null}


                {stickerpacks.length == 0 && stickersLoaded ? <div class={"center"}>
                    <div style={{
                        marginBottom: "1rem",
                    }}>
                        You have not stickers yet...
                    </div>
                    <button onClick={explore} class={'btn'}>
                        Explore!
                    </button>
                </div> : null}
                {stickersLoaded && stickerpacks.map((stickerpack: any) => (
                    <Stickerpack key={stickerpack.name} stickerpack={stickerpack}
                                 stickers={stickerpacksData[stickerpack.id]}/>))}
            </>
        </StickerPreviewProvider>
    </>
}