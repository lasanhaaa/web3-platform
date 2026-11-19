import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="page">
      <div className="fade" style={{ marginTop: 28 }}>
        <p className="mono lt-eyebrow">404</p>
        <h1 className="lt">This page doesn’t exist</h1>
        <p className="lt-sub">The lesson or zone in the link isn’t part of the course.</p>
        <Link className="btn primary" href="/academy" style={{ marginTop: 24 }}>
          Back to the Academy
        </Link>
      </div>
    </div>
  );
}
