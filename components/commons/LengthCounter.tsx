// "12/32": how much of a field's limit is used
export const LengthCounter = ({
  length,
  max,
}: {
  length: number;
  max: number;
}) => (
  <span className="text-xs text-muted-foreground">
    {length}/{max}
  </span>
);
