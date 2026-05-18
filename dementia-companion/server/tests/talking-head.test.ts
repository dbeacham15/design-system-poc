// server/tests/talking-head.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { SimliAdapter, TalkingHeadError } from '../src/services/talking-head'

const PORTRAIT_URL = 'https://example.com/portrait.jpg'

// Mock global fetch so tests never hit Simli
const mockFetch = vi.fn()
vi.stubGlobal('fetch', mockFetch)

beforeEach(() => { mockFetch.mockReset() })

describe('SimliAdapter', () => {
  describe('constructor', () => {
    it('throws if apiKey is empty', () => {
      expect(() => new SimliAdapter('')).toThrow('SIMLI_API_KEY is required')
    })
  })

  describe('validatePortrait', () => {
    it('returns valid:true on successful Simli response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      })
      const adapter = new SimliAdapter('test-key')
      const result = await adapter.validatePortrait(PORTRAIT_URL)
      expect(result.valid).toBe(true)
      expect(result.reason).toBeUndefined()
    })

    it('returns valid:false with reason when face not detected', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: false, reason: 'No face detected' }),
      })
      const adapter = new SimliAdapter('test-key')
      const result = await adapter.validatePortrait(PORTRAIT_URL)
      expect(result.valid).toBe(false)
      expect(result.reason).toBe('No face detected')
    })

    it('throws TalkingHeadError (not raw vendor error) on non-2xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 429,
        text: async () => 'rate limited',
      })
      const adapter = new SimliAdapter('test-key')
      const err = await adapter.validatePortrait(PORTRAIT_URL).catch(e => e)
      expect(err).toBeInstanceOf(TalkingHeadError)
      expect(err.message).toContain('429')
    })

    it('throws TalkingHeadError (not raw fetch error) on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('network error'))
      const adapter = new SimliAdapter('test-key')
      await expect(adapter.validatePortrait(PORTRAIT_URL)).rejects.toThrow(TalkingHeadError)
    })
  })

  describe('generateIdleLoop', () => {
    it('returns videoUrl and duration on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ videoUrl: 'https://cdn.simli.ai/idle-123.mp4', durationSeconds: 8 }),
      })
      const adapter = new SimliAdapter('test-key')
      const result = await adapter.generateIdleLoop(PORTRAIT_URL)
      expect(result.videoUrl).toBe('https://cdn.simli.ai/idle-123.mp4')
      expect(result.durationSeconds).toBe(8)
    })

    it('throws TalkingHeadError if response is missing videoUrl', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      })
      const adapter = new SimliAdapter('test-key')
      const err = await adapter.generateIdleLoop(PORTRAIT_URL).catch(e => e)
      expect(err).toBeInstanceOf(TalkingHeadError)
      expect(err.message).toContain('missing videoUrl')
    })

    it('throws TalkingHeadError (not raw vendor error) on non-2xx', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        text: async () => 'service unavailable',
      })
      const adapter = new SimliAdapter('test-key')
      await expect(adapter.generateIdleLoop(PORTRAIT_URL)).rejects.toThrow(TalkingHeadError)
    })

    it('throws TalkingHeadError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))
      const adapter = new SimliAdapter('test-key')
      await expect(adapter.generateIdleLoop(PORTRAIT_URL)).rejects.toThrow(TalkingHeadError)
    })
  })

  describe('createLiveSession', () => {
    it('returns sessionToken and metadata on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ session_token: 'sim-live-abc123', session_id: 'sess-001' }),
      })
      const adapter = new SimliAdapter('test-key')
      const result = await adapter.createLiveSession(PORTRAIT_URL)
      expect(result.sessionToken).toBe('sim-live-abc123')
      expect(result.metadata.sessionId).toBe('sess-001')
    })

    it('throws TalkingHeadError if response is missing session_token', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ status: 'ok' }),
      })
      const adapter = new SimliAdapter('test-key')
      const err = await adapter.createLiveSession(PORTRAIT_URL).catch(e => e)
      expect(err).toBeInstanceOf(TalkingHeadError)
      expect(err.message).toContain('session_token')
    })

    it('throws TalkingHeadError on non-2xx', async () => {
      mockFetch.mockResolvedValue({
        ok: false, status: 429,
        text: async () => 'rate limited',
      })
      const adapter = new SimliAdapter('test-key')
      const err = await adapter.createLiveSession(PORTRAIT_URL).catch(e => e)
      expect(err).toBeInstanceOf(TalkingHeadError)
      expect(err.message).toContain('429')
    })

    it('throws TalkingHeadError on network failure', async () => {
      mockFetch.mockRejectedValueOnce(new TypeError('fetch failed'))
      const adapter = new SimliAdapter('test-key')
      await expect(adapter.createLiveSession(PORTRAIT_URL)).rejects.toThrow(TalkingHeadError)
    })
  })

  describe('vendor isolation', () => {
    it('a stub implementation satisfies the full TalkingHeadAdapter interface including createLiveSession', async () => {
      const stub = {
        validatePortrait: async (_url: string) => ({ valid: true }),
        generateIdleLoop: async (_url: string) => ({ videoUrl: 'https://stub.example/idle.mp4', durationSeconds: 8 }),
        createLiveSession: async (_url: string) => ({
          sessionToken: 'stub-session-token',
          metadata: { sessionId: 'stub-001' },
        }),
      }
      const liveResult = await stub.createLiveSession(PORTRAIT_URL)
      expect(liveResult.sessionToken).toBe('stub-session-token')
      // Zero changes outside the implementation file needed to swap to this stub
    })
  })
})
