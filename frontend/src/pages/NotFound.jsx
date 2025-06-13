import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="not-found">
      <h1>404 - Page Not Found</h1>
      <p>Return to <Link to="/">homepage</Link></p>
    </div>
  );
}