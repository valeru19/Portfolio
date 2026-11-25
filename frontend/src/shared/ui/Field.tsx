import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";

import { cn } from "@/shared/lib";

import styles from "./Field.module.css";

type BaseProps = {
  label: string;
  htmlFor: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, error, className, children }: BaseProps) {
  return (
    <div className={cn(styles.field, className)}>
      <label htmlFor={htmlFor}>{label}</label>
      {children}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  hasError?: boolean;
};

export const TextInput = forwardRef<HTMLInputElement, InputProps>(function TextInput(
  { hasError, className, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(styles.control, hasError && styles.invalid, className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
});

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  hasError?: boolean;
};

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { hasError, className, ...props },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(styles.control, styles.textarea, hasError && styles.invalid, className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
});

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  hasError?: boolean;
};

export const SelectInput = forwardRef<HTMLSelectElement, SelectProps>(function SelectInput(
  { hasError, className, ...props },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(styles.control, hasError && styles.invalid, className)}
      aria-invalid={hasError || undefined}
      {...props}
    />
  );
});
