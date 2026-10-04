"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="empty">
      <h1>Something interrupted this chapter.</h1>
      <p>Please try again. Your stored records have not been cleared.</p>
      <button className="button primary" onClick={reset}>
        Try again
      </button>
    </div>
  );
}
