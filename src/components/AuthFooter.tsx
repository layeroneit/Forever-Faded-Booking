export default function AuthFooter() {
  const baseUrl = `${import.meta.env.BASE_URL || '/'}powered-by/`.replace(/\/+/g, '/');
  return (
    <footer className="auth-powered-by" aria-label="Powered by">
      <span className="auth-powered-by-label">Powered by</span>
      <span className="auth-powered-by-logos">
        <img src={`${baseUrl}ghostweave.png`} alt="Ghostweave Labs" />
        <img src={`${baseUrl}layerone.png`} alt="Layer One" />
      </span>
    </footer>
  );
}
