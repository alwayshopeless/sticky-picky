import {App} from "./app.tsx";
import {MatrixProvider} from "./contexts/matrix-widget-api-context.tsx";
import {StickerPickerProvider} from "./contexts/sticker-picker-context.tsx";

export function Providers() {
    return <MatrixProvider>
        <StickerPickerProvider>
            <App/>
        </StickerPickerProvider>
    </MatrixProvider>
}