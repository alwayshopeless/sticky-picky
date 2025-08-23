import {useEffect, useRef} from "preact/hooks";
import {Clock, Heart} from "lucide-preact";
import type {IStickerpack} from "../../../types/stickerpack.ts";
import {buildThumbnailUrl} from "../../../utils/stickers.ts";

interface StickerViewNavProps {
    stickerpacks: IStickerpack[],
    stickerpacksData: any
}

export function StickerViewNav({stickerpacks, stickerpacksData}: StickerViewNavProps) {
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // колесо → горизонтальный скролл
        const onWheel = (e: WheelEvent) => {
            if (e.deltaY !== 0) {
                e.preventDefault();
                el.scrollLeft += e.deltaY;
            }
        };

        // drag-scroll
        let isDown = false;
        let startX: number;
        let scrollLeft: number;

        const onMouseDown = (e: MouseEvent) => {
            isDown = true;
            startX = e.pageX - el.offsetLeft;
            scrollLeft = el.scrollLeft;
            el.style.cursor = "grabbing";
        };

        const onMouseLeave = () => {
            isDown = false;
            el.style.cursor = "grab";
        };
        const onMouseUp = () => {
            isDown = false;
            el.style.cursor = "grab";
        };

        const onMouseMove = (e: MouseEvent) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const walk = (x - startX);
            el.scrollLeft = scrollLeft - walk;
        };

        el.addEventListener("wheel", onWheel, {passive: false});
        el.addEventListener("mousedown", onMouseDown);
        el.addEventListener("mouseleave", onMouseLeave);
        el.addEventListener("mouseup", onMouseUp);
        el.addEventListener("mousemove", onMouseMove);

        return () => {
            el.removeEventListener("wheel", onWheel);
            el.removeEventListener("mousedown", onMouseDown);
            el.removeEventListener("mouseleave", onMouseLeave);
            el.removeEventListener("mouseup", onMouseUp);
            el.removeEventListener("mousemove", onMouseMove);
        };
    }, []);

    return (
        <div
            ref={ref}
            class="stickerpacks-nav"
            style={{
                display: "flex",
                flexFlow: "row nowrap",
                gap: "10px",
                overflowX: "auto",
                overflowY: "hidden",
                userSelect: "none",
                cursor: "grab",
                padding: "10px 0",
                scrollBehavior: "smooth",
                WebkitOverflowScrolling: "touch",
            }}
        >
            <a class="pack-preview ico" href="#spack-favorites">
                <Heart/>
            </a>
            <a class="pack-preview ico" href="#spack-recent">
                <Clock/>
            </a>
            {stickerpacks.map((pack: IStickerpack) => (
                <a href={`#spack-${pack.id}`} class="pack-preview dedrag" draggable={false}>
                    {stickerpacksData[pack?.id] !== undefined ? (
                        <img
                            draggable={false}
                            class={"dedrag"}
                            src={buildThumbnailUrl(pack.repository, stickerpacksData[pack.id][0])}
                            alt=""
                        />
                    ) : null}
                </a>
            ))}
        </div>
    );
}
