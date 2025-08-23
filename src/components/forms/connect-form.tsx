import {KeyRound, SendHorizonal} from "lucide-preact";
import {useState} from "preact/hooks";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";

export function ConnectForm({sendAuthRequest}: { sendAuthRequest: () => void }) {
    const [showImport, setShowImport] = useState<boolean>(false);
    const [importedKeys, setImportedKeys] = useState<string>("");
    const [error, setError] = useState<string>("");
    const stickerPicker = useStickerPicker();
    const importKeys = () => {
        try {
            let data = JSON.parse(importedKeys);
            if (typeof data == 'object' && data.hasOwnProperty('matrixUserId') && data.hasOwnProperty('token')) {
                stickerPicker.setUserData(data);
            } else {
                setError("Wrong format");
            }
        } catch (e) {
            setError("Cant parse your keys");
        }
    }

    return <>
        <div className={"connect-btns"} style={"padding: 0.1rem;"}>
            <button className={'btn flex-1'} onClick={sendAuthRequest}>Connect</button>
            <button className={"btn"}
                    style={"padding: 10px;"}
                    onClick={() => {
                        setShowImport(!showImport)
                    }}
            ><KeyRound style={`color: ${showImport ? 'var(--success)' : 'var(--icon-color)'}`}/>
            </button>
        </div>
        <div className={"inline-send"}
             style={`display: ${showImport ? "flex" : "none"}; margin-top: 10px; padding: 0 0.1rem;`}>

            <div className="field flex-1">
                <input value={importedKeys} onChange={(e) => {
                    setImportedKeys(e.currentTarget.value);
                }} placeholder={'Paste imported keys here...'} type="text" class="field__input"/>
            </div>


            <button
                onClick={importKeys}
                class="btn" style={"padding: 10px;"}
            ><SendHorizonal class={"ico"}/></button>
        </div>
        {error.length > 0 ? <div>{error}</div> : null}
    </>;
}