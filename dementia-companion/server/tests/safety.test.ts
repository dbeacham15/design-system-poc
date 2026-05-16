// server/tests/safety.test.ts
import { describe, it, expect, vi } from 'vitest'
import { classifySafetyAlert } from '../src/services/safety.service'

describe('classifySafetyAlert', () => {
  it('classifies self-harm as severe', () => {
    const result = classifySafetyAlert("I don't want to be here anymore. I want to hurt myself.")
    expect(result?.severity).toBe('severe')
    expect(result?.trigger).toBe('self-harm')
  })

  it('classifies fall mention as severe', () => {
    const result = classifySafetyAlert("I fell down and I cannot get up")
    expect(result?.severity).toBe('severe')
    expect(result?.trigger).toBe('fall')
  })

  it('classifies wandering intent as concerning', () => {
    const result = classifySafetyAlert("I need to go home right now, I have to leave")
    expect(result?.severity).toBe('concerning')
    expect(result?.trigger).toBe('wandering')
  })

  it('returns null for normal conversation', () => {
    const result = classifySafetyAlert("I would love some tea please")
    expect(result).toBeNull()
  })
})
