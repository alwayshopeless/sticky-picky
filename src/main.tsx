import { render } from 'preact'
import './style/app.scss'
import {Providers} from "./providers.tsx";

render(<Providers/>, document.getElementById('app')!)
