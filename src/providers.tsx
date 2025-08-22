import {App} from "./app.tsx";
import {MatrixProvider} from "./contexts/matrix-widget-api-context.tsx";
import {StickerPickerProvider} from "./contexts/sticker-picker-context.tsx";
import {StickerCollectionsProvider} from "./contexts/sticker-collections-context.tsx";

export function Providers() {
    return <MatrixProvider>
        <StickerPickerProvider>
            <StickerCollectionsProvider>
                <App/>
            </StickerCollectionsProvider>
        </StickerPickerProvider>
    </MatrixProvider>
}