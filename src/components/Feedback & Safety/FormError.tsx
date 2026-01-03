// src/components/FormError.tsx

type Props = {
  message?: string;
  id?: string; // optional id so inputs can reference this error
};

export default function FormError({ message, id }: Props) {
  if (!message) return null;
  return (
    <small
      id={id}
      role="alert"
      style={{ color: 'red', display: 'block', marginTop: '2px' }}
    >
      {message}
    </small>
  );
}
