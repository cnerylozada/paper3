import { Input } from "@/components/ui/input";
import { FormField } from "./FormField";

// The app's text input: a label, the shadcn Input, a hint and its error, wired
// together (ids, aria-invalid, aria-describedby). It takes whatever Input takes,
// so a react-hook-form field is just `{...register("name")}`
export const AppTextInput = ({
  id,
  label,
  hint,
  error,
  aside,
  ...props
}: Omit<React.ComponentProps<typeof Input>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** At the end of the label row: a badge, a character counter */
  aside?: React.ReactNode;
}) => (
  <FormField id={id} label={label} hint={hint} error={error} aside={aside}>
    <Input
      id={id}
      autoComplete="off"
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
  </FormField>
);
