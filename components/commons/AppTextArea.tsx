import { Textarea } from "@/components/ui/textarea";
import { FormField } from "./FormField";

// Same as AppTextInput, for longer text
export const AppTextArea = ({
  id,
  label,
  hint,
  error,
  aside,
  rows = 4,
  ...props
}: Omit<React.ComponentProps<typeof Textarea>, "id"> & {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  /** At the end of the label row: a badge, a character counter */
  aside?: React.ReactNode;
}) => (
  <FormField id={id} label={label} hint={hint} error={error} aside={aside}>
    <Textarea
      id={id}
      rows={rows}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
  </FormField>
);
