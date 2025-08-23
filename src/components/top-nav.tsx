import {useEffect, useRef, useState} from "preact/hooks";
import {Globe, Settings} from "lucide-preact";

interface TopNavProps {
    view: string;
    setView: (s: string) => void;
}

export function TopNav({view, setView}: TopNavProps) {
    const [underlineStyle, setUnderlineStyle] = useState({left: 0, width: 0});
    const containerRef = useRef<HTMLDivElement>(null);
    const refs = useRef<{ [key: string]: HTMLDivElement | null }>({});

    useEffect(() => {
        const current = refs.current[view];
        const container = containerRef.current;
        if (current && container) {
            const rect = current.getBoundingClientRect();
            const parentRect = container.getBoundingClientRect();
            setUnderlineStyle({left: rect.left - parentRect.left, width: rect.width});
        }
    }, [view]);

    const setRef = (key: string) => (el: HTMLDivElement | null) => {
        refs.current[key] = el;
    };

    return (
        <div ref={containerRef} className="top-nav" style={{position: 'relative'}}>
            {['gifs', 'stickers', 'explore', 'settings'].map((key) => (
                <div
                    key={key}
                    ref={setRef(key)}
                    onClick={() => setView(key)}
                    className={`top-nav__item ${key === 'explore' || key === 'settings' ? 'ico' : ''}`}
                >
                    {key === 'gifs' ? 'GIF' : key === 'stickers' ? 'Stickers' : key === 'explore' ? <Globe/> :
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
