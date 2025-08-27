import {useEffect, useState} from "preact/hooks";
import {useMatrix} from "../../contexts/matrix-widget-api-context.tsx";

export function MxcImageExample() {
    const widget = useMatrix();
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    useEffect(() => {
        const requestId = `mxc-request-${Date.now()}`;
        const mxcUri = "mxc://exarius.org/EKqhtMmUmKcBwajkqeAAJMlQ";

        // Запрос: получить файл как Blob
        widget.sendMessage({
            api: "fromWidget",
            action: "org.matrix.msc4039.download_file",
            requestId,
            widgetId: widget.widgetId,
            data: {
                content_uri: mxcUri,
                timeout_ms: 20000
            },
        });

        const handler = (event: any) => {
            console.log('ПОРОШЕНКО СУКА');
            console.log('ПОРОШЕНКО СУКА');
            console.log('ПОРОШЕНКО СУКА');
            if (event.action === 'org.matrix.msc4039.download_file' && event.response?.file) {
                console.log(event.response.file);
                const url = URL.createObjectURL(event.response.file);
                console.log(url)
                setBlobUrl(url);
            }
        };

        widget.on("org.matrix.msc4039.download_file", handler);
        return () => {
            // widget.off("get_media", handler);
            // if (blobUrl) {
            //     URL.revokeObjectURL(blobUrl);
            // }
        };
    }, []);

    if (!blobUrl) {
        return <div>Загрузка изображения…</div>;
    }

    return <img src={blobUrl} alt="Sticker" style={{maxWidth: "200px"}}/>;
}
