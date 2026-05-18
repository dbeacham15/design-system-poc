// server/tests/companion-prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../src/services/companion-prompt.service'

describe('buildSystemPrompt', () => {
  it('includes companion name', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('You are Grace')
  })

  it('includes therapeutic fibbing guidance', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('emotional truth over factual correction')
  })

  it('includes memory card context for positive sentiment', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('Daughter Linda')
  })

  it('includes avoid topics', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('Topics to avoid')
    expect(prompt).toContain('Money')
  })

  it('includes safety escalation instruction', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('SAFETY_ESCALATION')
  })

  it('WARM_NURTURER preset produces empathy-focused instructions', () => {
    const prompt = buildSystemPrompt({ name: 'Grace', personalityPreset: 'WARM_NURTURER' as any }, mockPatient, [])
    expect(prompt).toContain('warm nurturer')
    expect(prompt).toContain('empathy')
  })

  it('CHEERFUL_FRIEND preset produces upbeat instructions', () => {
    const prompt = buildSystemPrompt({ name: 'Sunny', personalityPreset: 'CHEERFUL_FRIEND' as any }, mockPatient, [])
    expect(prompt).toContain('cheerful friend')
    expect(prompt).toContain('lightness')
  })

  it('CALM_PRESENCE preset produces grounding instructions', () => {
    const prompt = buildSystemPrompt({ name: 'Lily', personalityPreset: 'CALM_PRESENCE' as any }, mockPatient, [])
    expect(prompt).toContain('calm presence')
    expect(prompt).toContain('unhurried')
  })

  it('WISE_COMPANION preset produces dignity-focused instructions', () => {
    const prompt = buildSystemPrompt({ name: 'Eleanor', personalityPreset: 'WISE_COMPANION' as any }, mockPatient, [])
    expect(prompt).toContain('wise companion')
    expect(prompt).toContain('dignity')
  })

  it('each preset produces meaningfully different text', () => {
    const prompts = ['WARM_NURTURER', 'CHEERFUL_FRIEND', 'CALM_PRESENCE', 'WISE_COMPANION'].map(preset =>
      buildSystemPrompt({ name: 'X', personalityPreset: preset as any }, mockPatient, [])
    )
    for (let i = 0; i < prompts.length; i++) {
      for (let j = i + 1; j < prompts.length; j++) {
        expect(prompts[i]).not.toEqual(prompts[j])
      }
    }
  })
})

const mockCompanion = {
  name: 'Grace',
  personalityPreset: 'WARM_NURTURER' as any,
}

const mockPatient = { name: 'Margaret' }

const mockMemoryCards = [
  { type: 'person', label: 'Daughter Linda', sentiment: 'positive',
    structuredData: { relationship: 'daughter', location: 'Seattle' }, freeText: 'Makes her very happy' },
  { type: 'topic', label: 'Money', sentiment: 'avoid', freeText: 'Causes significant anxiety' },
  { type: 'person', label: 'Husband Robert', sentiment: 'handle-carefully',
    freeText: 'Passed away 2014. She loves talking about him but may not remember he died.' },
]
