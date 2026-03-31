import {useEffect} from "preact/hooks";
import {Button} from "@/components/ui/button.tsx";

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    cancelLabel?: string;
    loading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title,
    description,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    loading = false,
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onCancel();
            }
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onCancel]);

    if (!open) {
        return null;
    }

    return (
        <div class="confirm-dialog-backdrop" onClick={onCancel}>
            <div
                class="confirm-dialog"
                onClick={(event) => event.stopPropagation()}
            >
                <h3 class="confirm-dialog__title">{title}</h3>
                {description ? <p class="confirm-dialog__description">{description}</p> : null}
                <div class="confirm-dialog__actions">
                    <Button onClick={onCancel} class="btn--flat" disabled={loading}>
                        {cancelLabel}
                    </Button>
                    <Button onClick={onConfirm} loading={loading}>
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </div>
    );
}
