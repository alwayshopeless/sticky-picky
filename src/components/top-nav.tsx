import {useEffect, useRef, useState} from "preact/hooks";
import {Globe, Settings} from "lucide-preact";
import {useLocation} from "preact-iso";

export function TopNav({}) {
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
            {['/gifs', '/stickers', '/explore', '/settings'].map((key: string) => (
                <div
                    key={key}
                    ref={setRef(key)}
                    onClick={() => route(key)}
                    className={`top-nav__item ${key === '/explore' || key === '/settings' ? 'ico' : ''}`}
                >
                    {key === '/gifs' ? 'GIF' : key === '/stickers' ? 'Stickers' : key === '/explore' ? <Globe/> :
                        <Settings/>}
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
