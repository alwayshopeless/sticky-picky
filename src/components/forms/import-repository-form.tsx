import {useState} from "preact/hooks";
import {Button} from "../ui/button.tsx";
import {apiRequest} from "../../api/backend-api.ts";

export function ImportRepositoryForm() {
    const [repoUrl, setRepoUrl] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const submit = (e: any) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        apiRequest('stickerpacks/import', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                repository: repoUrl,
                type: "maunium",
            }),
        })
            .then(async (response: Response) => {
                if (response.status == 200) {
                    let data = await response.json();
                    let successCount = data.imported.filter((item: any) => item.status === "success").length;
                    let alreadyExistsCount = data.imported.filter((item: any) => item.status === "already_exists").length;
                    setSuccess(`Handled ${data.imported.length} stickerpacks.
                     Success: ${successCount}. 
                     Already exists: ${alreadyExistsCount}.`);
                    setRepoUrl('');
                } else {
                    setError("Error while import maunium repo.");
                }
            })
            .catch((err: Error) => {
                setError("Error while network request import maunium repo.");
                console.log(err);
            })
            .finally(() => {
                setLoading(false);
            })
    };

    return <form onSubmit={submit}>
        <h4>Import repository with stickers</h4>
        <div className="field mb-1">
            <input
                required
                className="field__input"
                placeholder="Repository link"
                value={repoUrl}
                onInput={(e: any) => setRepoUrl(e.target.value)}
            />
        </div>
        {success ? <div style={"color: var(--success); padding: 5px;"}>{success}</div> : null}
        {error ? <div style={"color: var(--danger); padding: 5px;"}>{error}</div> : null}
        <Button style={"min-width: 200px;"} loading={loading}>Import</Button>
    </form>
}