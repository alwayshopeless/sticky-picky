import {createContext} from 'preact';
import {useContext, useEffect, useRef, useState} from 'preact/hooks';
import {getAllUrlParams} from "../utils/url.ts";

export interface MatrixEvent {
    api: string;
    widgetId: string | null;
    action: string;

    [key: string]: any;
}

interface MatrixContextType {
    messages: MatrixEvent[];
    sendMessage: (message: MatrixEvent) => void;
    on: <T = any>(type: string, callback: (payload: T) => void) => () => void;
    widgetId: string | null,
    widgetParams: any
}

const MatrixContext = createContext<MatrixContextType | undefined>(undefined);

interface MatrixProviderProps {
    children: any;
    parentOrigin?: string;
}

export function MatrixProvider({children, parentOrigin = '*'}: MatrixProviderProps) {
    const [messages, setMessages] = useState<MatrixEvent[]>([]);
    const listeners = useRef<Record<string, Array<(payload: any) => void>>>({});
    const [widgetId, setWidgetId] = useState<string | null>(null);
    const [widgetParams, setWidgetParams] = useState<any>({});

    useEffect(() => {
        const params = getAllUrlParams();
        setWidgetId(params?.widgetId ?? null);
        setWidgetParams(params);

        const handleMessage = (event: MessageEvent) => {
            if (parentOrigin !== '*' && event.origin !== parentOrigin) return;

            const data = event.data as MatrixEvent;
            setMessages((prev) => [...prev, data]);
            // TODO: refactor
            // console.log("А тут листенеры типа выполучаются, да")
            // console.log(data.action);
            if (data.action && listeners.current[data.action]) {
                listeners.current[data.action].forEach((cb) => cb(data));
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [parentOrigin]);

    const sendMessage = (message: MatrixEvent) => {
        // window.parent.postMessage(message, parentOrigin);
        window.parent.postMessage({
            // widgetId,
            // api: "fromWidget",
            ...message,
        }, '*');
    };

    const on = <T = any>(type: string, callback: (payload: T) => void) => {
        if (!listeners.current[type]) listeners.current[type] = [];
        listeners.current[type].push(callback);
        console.log('чёта пошла моча да');
        console.log(type);
        return () => {
            listeners.current[type] = listeners.current[type].filter((cb) => cb !== callback);
        };
    };

    return (
        <MatrixContext.Provider value={{
            messages,
            sendMessage,
            on,
            widgetId,
            widgetParams,
        }}>
            {children}
        </MatrixContext.Provider>
    );
}

export function useMatrix(): MatrixContextType {
    const context = useContext(MatrixContext);
    if (!context) throw new Error('useMatrix must be used within a MatrixProvider');
    return context;
}
