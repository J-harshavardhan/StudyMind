export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="d-flex justify-content-center align-items-center gap-2 py-5" role="status">
      <span className="spinner-border spinner-border-sm" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
