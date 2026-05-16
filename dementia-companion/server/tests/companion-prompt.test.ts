// server/tests/companion-prompt.test.ts
import { describe, it, expect } from 'vitest'
import { buildSystemPrompt } from '../src/services/companion-prompt.service'

describe('buildSystemPrompt', () => {
  it('includes companion name', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('Your name is Grace')
  })

  it('includes therapeutic fibbing guidance', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('emotional truth over factual correction')
  })

  it('includes memory card context for positive sentiment', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('Daughter Linda')
    expect(prompt).toContain('positive')
  })

  it('includes avoid topics', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('avoid')
    expect(prompt).toContain('Money')
  })

  it('includes safety escalation instruction', () => {
    const prompt = buildSystemPrompt(mockCompanion, mockPatient, mockMemoryCards)
    expect(prompt).toContain('SAFETY_ESCALATION')
  })
})

const mockCompanion = {
  name: 'Grace',
  personalityStyle: 'warm',
  speakingStyle: 'simple',
  engagementLevel: 'medium',
  genderPresentation: 'feminine',
}

const mockPatient = { name: 'Margaret' }

const mockMemoryCards = [
  { type: 'person', label: 'Daughter Linda', sentiment: 'positive',
    structuredData: { relationship: 'daughter', location: 'Seattle' }, freeText: 'Makes her very happy' },
  { type: 'topic', label: 'Money', sentiment: 'avoid', freeText: 'Causes significant anxiety' },
  { type: 'person', label: 'Husband Robert', sentiment: 'handle-carefully',
    freeText: 'Passed away 2014. She loves talking about him but may not remember he died.' },
]
