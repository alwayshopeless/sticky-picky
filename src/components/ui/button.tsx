import { Loader2 } from "lucide-preact";
import {type JSX } from "preact";

type ButtonProps = Omit<JSX.HTMLAttributes<HTMLButtonElement>, 'disabled'> & {
    loading?: boolean;
    disabled?: boolean;
};

export function Button({loading = false, children, disabled, class: className, ...rest}: ButtonProps) {
    const buttonClass = className;

    return (
        <button disabled={disabled || loading} class={"btn " + buttonClass} {...rest}>
            {loading ? <Loader2 class={"rotation"}/> : children}
        </button>
    );
}