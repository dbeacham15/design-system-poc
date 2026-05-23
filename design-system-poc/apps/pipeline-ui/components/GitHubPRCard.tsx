interface Props { prUrl: string; componentName: string }

export function GitHubPRCard({ prUrl, componentName }: Props) {
  const prNumber = prUrl.match(/\/pull\/(\d+)/)?.[1]
  const branch = `component/${componentName.toLowerCase()}`

  return (
    <div className="chat-msg" style={{ alignSelf: 'flex-start', width: '100%', maxWidth: 360 }}>
      <a href={prUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
        <div style={{
          background: '#111',
          border: '1px solid #238636',
          borderRadius: 10,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '10px 14px', borderBottom: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16 }}>✅</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#3fb950' }}>Pull request created</span>
          </div>
          <div style={{ padding: '10px 14px' }}>
            <div style={{ fontSize: 13, color: '#f0f0f0', fontWeight: 600, marginBottom: 4 }}>
              feat: {componentName} component
              {prNumber && <span style={{ color: '#555', fontWeight: 400, marginLeft: 6 }}>#{prNumber}</span>}
            </div>
            <div style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{branch} → main</div>
          </div>
        </div>
      </a>
    </div>
  )
}
