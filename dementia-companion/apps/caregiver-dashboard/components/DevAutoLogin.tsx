'use client'
import { useEffect } from 'react'
import api from '../lib/api'

export function DevAutoLogin() {
  useEffect(() => {
    if (localStorage.getItem('access_token')) return
    api.post('/api/auth/login', { email: 'demo@companion.app', password: 'Demo1234!' })
      .then(res => {
        const { accessToken, refreshToken } = res.data.data
        localStorage.setItem('access_token', accessToken)
        localStorage.setItem('refresh_token', refreshToken)
        localStorage.setItem('caregiver_email', 'demo@companion.app')
      })
      .catch(() => {})
  }, [])

  return null
}
