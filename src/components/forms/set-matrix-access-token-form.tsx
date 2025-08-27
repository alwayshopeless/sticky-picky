import {useState} from "preact/hooks";
import {Button} from "../ui/button.tsx";
import {useStickerPicker} from "../../stores/sticker-picker.tsx";

export function SetMatrixAccessTokenForm() {
    const [accessToken, setAccessToken] = useState<string>("");
    const [homeserver, setHomeserver] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const stickerPicker = useStickerPicker();
    const submit = (e: any) => {
        e.preventDefault();
        setLoading(true)
        // setLoading(true);
        setError(null);
        stickerPicker.setMatrixAuthData({
            homeserver,
            accessToken,
        });
        setLoading(false);
        setSuccess("Preview token installed")
    };

    return <form onSubmit={submit}>
        <h4>Set Matrix Token</h4>
        <div>
            This data needed for request sticker thumbnails inside widget, because Matrix API dont allow us load media
            from servers directly.
        </div>
        <div className="field mb-1">
            <input
                required
                className="field__input"
                placeholder="Your matrix homeserver"
                value={homeserver}
                onInput={(e: any) => setHomeserver(e.target.value)}
            />
        </div>
        <div className="field mb-1">
            <input
                required
                className="field__input"
                placeholder="Matrix Access Token"
                value={accessToken}
                onInput={(e: any) => setAccessToken(e.target.value)}
            />
        </div>
        {success ? <div style={"color: var(--success); padding: 5px;"}>{success}</div> : null}
        {error ? <div style={"color: var(--danger); padding: 5px;"}>{error}</div> : null}
        <Button style={"min-width: 200px;"} loading={loading}>Import</Button>
    </form>
}