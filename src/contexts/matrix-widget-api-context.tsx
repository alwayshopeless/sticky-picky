import {createContext} from 'preact';
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'preact/hooks';
import {getAllUrlParams} from "../utils/url.ts";
import {isDebug} from "@/config/main.ts";

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
    off: (type: string, callback: (payload: any) => void) => void;
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
            if (isDebug) {
                console.log("[Widget API][in]", data);
            }
            setMessages((prev) => [...prev, data]);
            // TODO: refactor
            // console.log("Listeners:")
            // console.log(data.action);
            if (data.action && listeners.current[data.action]) {
                listeners.current[data.action].forEach((cb) => cb(data));
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [parentOrigin]);

    const sendMessage = useCallback((message: MatrixEvent) => {
        if (isDebug) {
            console.log("[Widget API][out]", message);
        }

        // window.parent.postMessage(message, parentOrigin);
        window.parent.postMessage({
            // widgetId,
            // api: "fromWidget",
            ...message,
        }, '*');
    }, []);

    const on = useCallback(<T = any>(type: string, callback: (payload: T) => void) => {
        if (!listeners.current[type]) listeners.current[type] = [];
        listeners.current[type].push(callback);
        return () => {
            listeners.current[type] = listeners.current[type].filter((cb) => cb !== callback);
        };
    }, []);

    const off = useCallback((type: string, callback: (payload: any) => void) => {
        if (!listeners.current[type]) return;
        listeners.current[type] = listeners.current[type].filter((cb) => cb !== callback);
        if (listeners.current[type].length === 0) {
            delete listeners.current[type];
        }
    }, []);

    const contextValue = useMemo(() => ({
        messages,
        sendMessage,
        on,
        off,
        widgetId,
        widgetParams,
    }), [messages, sendMessage, on, off, widgetId, widgetParams]);

    return (
        <MatrixContext.Provider value={contextValue}>
            {children}
        </MatrixContext.Provider>
    );
}

export function useMatrix(): MatrixContextType {
    const context = useContext(MatrixContext);
    if (!context) throw new Error('useMatrix must be used within a MatrixProvider');
    return context;
}


export function useDownloadMatrixFile() {

}
