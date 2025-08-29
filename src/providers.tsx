import {App} from "./app.tsx";
import {MatrixProvider} from "./contexts/matrix-widget-api-context.tsx";
import {LocationProvider} from "preact-iso";

export function Providers() {
    return <MatrixProvider>
        <LocationProvider>
            <App/>
        </LocationProvider>
    </MatrixProvider>
}