import {App} from "./app.tsx";
import {MatrixProvider} from "./contexts/matrix-widget-api-context.tsx";

export function Providers() {
    return <MatrixProvider>
        <App/>
    </MatrixProvider>
}