import Link from "next/link";
export default function NotFound() {
  return (
    <div className="empty">
      <h1>This page is between chapters.</h1>
      <p>We couldn’t find what you were looking for.</p>
      <Link className="button primary" href="/">
        Back to FIXIHUB
      </Link>
    </div>
  );
}
