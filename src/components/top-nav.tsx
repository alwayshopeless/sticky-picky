import {useEffect, useRef, useState} from "preact/hooks";
import {Globe, Settings} from "lucide-preact";
import {useLocation} from "preact-iso";

type NavItem = {
    path: string;
    label?: string;
    icon?: typeof Globe;
};

const NAV_ITEMS: NavItem[] = [
    // {path: "/gifs", label: "GIF"},
    {path: "/", label: "Stickers"},
    {path: "/explore", icon: Globe},
    {path: "/settings", icon: Settings},
];

export function TopNav() {
    const [underlineStyle, setUnderlineStyle] = useState({left: 0, width: 0});
    const containerRef = useRef<HTMLDivElement>(null);
    const refs = useRef<{ [key: string]: HTMLDivElement | null }>({});
    const {route, path} = useLocation();

    useEffect(() => {
        const current = refs.current[path];
        const container = containerRef.current;
        if (current && container) {
            const rect = current.getBoundingClientRect();
            const parentRect = container.getBoundingClientRect();
            setUnderlineStyle({left: rect.left - parentRect.left, width: rect.width});
        }
    }, [path]);

    const setRef = (key: string) => (el: HTMLDivElement | null) => {
        refs.current[key] = el;
    };

    return (
        <div ref={containerRef} className="top-nav" style={{position: 'relative'}}>
            {NAV_ITEMS.map(({path: itemPath, label, icon: Icon}) => (
                <div
                    key={itemPath}
                    ref={setRef(itemPath)}
                    onClick={() => route(itemPath)}
                    className={`top-nav__item ${Icon ? "ico" : ""}`}
                >
                    {Icon ? <Icon/> : label}
                </div>
            ))}

            <div
                className="top-nav__underline"
                style={{
                    width: underlineStyle.width,
                    transform: `translateX(${underlineStyle.left}px)`,
                }}
            />
        </div>
    );
}
