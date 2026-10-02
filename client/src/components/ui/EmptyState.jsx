export default function EmptyState({ title, message, action }) {
  return (
    <div className="text-center border rounded-3 p-5 bg-body-tertiary">
      <h2 className="h5">{title}</h2>
      <p className="text-body-secondary mb-3">{message}</p>
      {action}
    </div>
  );
}
