'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import api from '../../lib/api'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await api.post(endpoint, { email, password })
      const { accessToken, refreshToken } = res.data.data
      localStorage.setItem('access_token', accessToken)
      localStorage.setItem('refresh_token', refreshToken)
      localStorage.setItem('caregiver_email', email)
      router.push(tab === 'register' ? '/onboarding' : '/dashboard')
    } catch (err: any) {
      const code = err.response?.data?.error?.code
      if (code === 'EMAIL_EXISTS') setError('That email is already registered. Try signing in.')
      else if (code === 'INVALID_CREDENTIALS') setError('Incorrect email or password.')
      else setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-sm border border-amber-100 w-full max-w-md p-8">
        <h1 className="text-3xl font-light text-amber-900 mb-2">Companion</h1>
        <p className="text-amber-600 mb-8 text-sm">Caregiver Dashboard</p>

        {/* Tabs */}
        <div className="flex border-b border-amber-100 mb-6">
          {(['login', 'register'] as const).map(t => (
            <button key={t} onClick={() => { setTab(t); setError('') }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${tab === t ? 'border-b-2 border-amber-800 text-amber-900' : 'text-amber-400 hover:text-amber-600'}`}>
              {t === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full border border-amber-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-800 mb-1">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8}
              className="w-full border border-amber-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-amber-500 focus:outline-none" />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button type="submit" disabled={loading}
            className="w-full bg-amber-800 text-white rounded-xl py-3 font-medium hover:bg-amber-900 disabled:opacity-50 transition-colors">
            {loading ? 'Please wait...' : tab === 'login' ? 'Sign In' : 'Create Account'}
          </button>
        </form>
      </div>
    </div>
  )
}
