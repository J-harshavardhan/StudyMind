import { userError } from '../../utils/userErrors';

export default function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="alert alert-danger d-flex justify-content-between align-items-center" role="alert">
      <span>{typeof message === 'string' ? userError({ response: { data: { message } } }, message) : 'Something went wrong. Please try again.'}</span>
      {onRetry && <button className="btn btn-sm btn-outline-danger" onClick={onRetry}>Retry</button>}
    </div>
  );
}
