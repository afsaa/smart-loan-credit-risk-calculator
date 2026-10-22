interface FieldErrorProps {
  id: string;
  errors: readonly string[] | undefined;
}

export function FieldError({ id, errors }: FieldErrorProps) {
  if (errors === undefined || errors.length === 0) {
    return null;
  }

  return (
    <ul id={id} className="mt-1 space-y-1 text-sm text-red-700">
      {errors.map((message, index) => (
        <li key={index}>{message}</li>
      ))}
    </ul>
  );
}
