import { useId, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Field } from "../../components/ui";

// Password field with a show/hide toggle, styled like the shared <Input />
const PasswordInput = ({ label, error, hint, required, icon: Icon, className = "", id, ...props }) => {
    const autoId = useId();
    const inputId = id || autoId;
    const [visible, setVisible] = useState(false);

    return (
        <Field label={label} htmlFor={inputId} required={required} error={error} hint={hint} className={className}>
            <div className="relative">
                {Icon && (
                    <Icon
                        size={17}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
                    />
                )}
                <input
                    id={inputId}
                    type={visible ? "text" : "password"}
                    required={required}
                    aria-invalid={!!error}
                    className={[
                        "h-11 w-full rounded-xl border bg-surface pr-11 text-sm text-ink transition",
                        "placeholder:text-muted/70 focus:outline-none focus:ring-4",
                        Icon ? "pl-10" : "pl-3.5",
                        error
                            ? "border-danger focus:border-danger focus:ring-red-100"
                            : "border-line focus:border-brand focus:ring-brand/15",
                    ].join(" ")}
                    {...props}
                />
                <button
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    aria-label={visible ? "Hide password" : "Show password"}
                    aria-pressed={visible}
                    className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-muted transition hover:bg-cream hover:text-ink"
                >
                    {visible ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
            </div>
        </Field>
    );
};

export default PasswordInput;
