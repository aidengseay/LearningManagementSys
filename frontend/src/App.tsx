
import { useEffect, useState } from 'react'

function App() {
  const [status, setStatus] = useState('Checking...')

  useEffect(() => {
    fetch('/api/health')
      .then((response) => {
        if (!response.ok) {
          throw new Error('Health check failed')
        }
        return response.json()
      })
      .then((data) => {
        setStatus(
          `Backend: ${data.status}, Database: ${data.database}`
        )
      })
      .catch(() => {
        setStatus('Unable to connect to backend')
      })
  }, [])

  return (
    <main style={{ padding: '40px' }}>
      <h1>Learning Management System</h1>
      <h2>Development Environment</h2>
      <p>{status}</p>
    </main>
  )
}

export default App
