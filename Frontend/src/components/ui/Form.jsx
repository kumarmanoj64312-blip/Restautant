import { forwardRef, useId } from "react";

const controlClasses = (error, extra = "") =>
    [
        "w-full rounded-xl border bg-surface px-3.5 text-sm text-ink transition",
        "placeholder:text-muted/70 focus:outline-none focus:ring-4",
        error
            ? "border-danger focus:border-danger focus:ring-red-100"
            : "border-line focus:border-brand focus:ring-brand/15",
        "disabled:cursor-not-allowed disabled:bg-cream/60",
        extra,
    ].join(" ");

// Label + control + hint/error wrapper
export const Field = ({ label, htmlFor, required, error, hint, className = "", children }) => (
    <div className={`space-y-1.5 ${className}`}>
        {label && (
            <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">
                {label}
                {required && <span className="ml-0.5 text-danger">*</span>}
            </label>
        )}
        {children}
        {error ? (
            <p className="text-xs font-medium text-danger">{error}</p>
        ) : (
            hint && <p className="text-xs text-muted">{hint}</p>
        )}
    </div>
);

/**
 * <Input label="Email" name="email" value={...} onChange={...} error={errors.email} />
 * <Input icon={Search} placeholder="Search..." />
 */
export const Input = forwardRef(
    ({ label, error, hint, required, icon: Icon, className = "", id, ...props }, ref) => {
        const autoId = useId();
        const inputId = id || autoId;

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
                        ref={ref}
                        id={inputId}
                        required={required}
                        aria-invalid={!!error}
                        className={controlClasses(error, `h-11 ${Icon ? "pl-10" : ""}`)}
                        {...props}
                    />
                </div>
            </Field>
        );
    }
);
Input.displayName = "Input";

export const Textarea = forwardRef(
    ({ label, error, hint, required, className = "", id, rows = 4, ...props }, ref) => {
        const autoId = useId();
        const inputId = id || autoId;

        return (
            <Field label={label} htmlFor={inputId} required={required} error={error} hint={hint} className={className}>
                <textarea
                    ref={ref}
                    id={inputId}
                    rows={rows}
                    required={required}
                    aria-invalid={!!error}
                    className={controlClasses(error, "resize-y py-2.5")}
                    {...props}
                />
            </Field>
        );
    }
);
Textarea.displayName = "Textarea";

/**
 * <Select label="Category" options={[{ value: "1", label: "Starters" }]} placeholder="Choose..." />
 * Children <option>s are also supported.
 */
export const Select = forwardRef(
    ({ label, error, hint, required, options, placeholder, className = "", id, children, ...props }, ref) => {
        const autoId = useId();
        const inputId = id || autoId;

        return (
            <Field label={label} htmlFor={inputId} required={required} error={error} hint={hint} className={className}>
                <select
                    ref={ref}
                    id={inputId}
                    required={required}
                    aria-invalid={!!error}
                    className={controlClasses(error, "h-11 pr-8")}
                    {...props}
                >
                    {placeholder && <option value="">{placeholder}</option>}
                    {options?.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                    {children}
                </select>
            </Field>
        );
    }
);
Select.displayName = "Select";

/**
 * <Switch checked={value} onChange={(next) => ...} label="Available" />
 */
export const Switch = ({ checked, onChange, label, description, disabled = false }) => (
    <label className={`flex items-start gap-3 ${disabled ? "opacity-60" : "cursor-pointer"}`}>
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => onChange?.(!checked)}
            className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition ${
                checked ? "bg-brand" : "bg-line"
            }`}
        >
            <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    checked ? "left-[22px]" : "left-0.5"
                }`}
            />
        </button>
        {(label || description) && (
            <span>
                {label && <span className="block text-sm font-semibold text-ink">{label}</span>}
                {description && <span className="block text-xs text-muted">{description}</span>}
            </span>
        )}
    </label>
);
