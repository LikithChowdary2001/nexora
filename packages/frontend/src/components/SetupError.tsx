export function SetupError({ missing }: { missing: string[] }) {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        fontFamily: 'Inter, system-ui, sans-serif',
        background: '#020617',
        color: '#e2e8f0',
      }}
    >
      <div style={{ maxWidth: 560 }}>
        <h1 style={{ fontSize: '1.75rem', marginBottom: '0.75rem' }}>Nexora setup required</h1>
        <p style={{ color: '#94a3b8', lineHeight: 1.6, marginBottom: '1rem' }}>
          The app was built without required environment variables. Add them to{' '}
          <code style={{ color: '#cbd5e1' }}>packages/frontend/.env.production</code> and rebuild:
        </p>
        <ul style={{ color: '#f87171', marginBottom: '1rem' }}>
          {missing.map((key) => (
            <li key={key}>
              <code>{key}</code>
            </li>
          ))}
        </ul>
        <pre
          style={{
            background: 'rgba(255,255,255,0.05)',
            padding: '1rem',
            borderRadius: '0.75rem',
            overflow: 'auto',
            fontSize: '0.85rem',
            color: '#cbd5e1',
          }}
        >
          {`npm run build:hosting\nfirebase deploy --only hosting`}
        </pre>
      </div>
    </div>
  );
}
