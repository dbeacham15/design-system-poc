export const metadata = { title: 'Design System Pipeline' }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f0f0f', color: '#f0f0f0', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  )
}
