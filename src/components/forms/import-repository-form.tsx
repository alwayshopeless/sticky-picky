import {useState} from "preact/hooks";
import {Button} from "../ui/button.tsx";
import {apiRequest} from "../../api/backend-api.ts";

export function ImportRepositoryForm() {
    const [packUrl, setPackUrl] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const submit = (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        apiRequest('stickerpacks/import/maunium-pack', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                pack_url: packUrl,
            }),
        })
            .then(async (response: Response) => {
                if (response.status == 200) {
                    let data = await response.json();
                    if (data.status === "already_exists") {
                        setSuccess("This Maunium stickerpack is already in the aggregator.");
                    } else {
                        setSuccess("Maunium stickerpack added.");
                    }
                    setPackUrl('');
                } else {
                    const data = await response.json().catch(() => ({}));
                    setError(data?.error || "Error while importing Maunium stickerpack.");
                }
            })
            .catch((err: Error) => {
                setError("Error while network request import Maunium stickerpack.");
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            })
    };

    return <form onSubmit={submit}>
        <h4>Add Maunium pack</h4>
        <div className="field mb-1">
            <input
                required
                className="field__input"
                placeholder="https://example.org/packs/cats.json"
                value={packUrl}
                onInput={(e: any) => setPackUrl(e.target.value)}
            />
        </div>
        {success ? <div style={"color: var(--success); padding: 5px;"}>{success}</div> : null}
        {error ? <div style={"color: var(--danger); padding: 5px;"}>{error}</div> : null}
        <Button style={"min-width: 220px;"} loading={loading}>Add Maunium pack</Button>
    </form>
}
