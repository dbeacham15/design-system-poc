import { describe, it, expect } from 'vitest'
import { parseFigmaFileKey, readFigmaNode } from './figma'

describe('parseFigmaFileKey', () => {
  it('extracts file key from figma.com/design URL', () => {
    expect(parseFigmaFileKey('https://www.figma.com/design/nZWd2gIdibUaIcmwUvy6qk/My-File?node-id=116-828'))
      .toBe('nZWd2gIdibUaIcmwUvy6qk')
  })

  it('extracts file key from figma.com/file URL', () => {
    expect(parseFigmaFileKey('https://www.figma.com/file/abc123XYZ/My-Design'))
      .toBe('abc123XYZ')
  })

  it('returns null for a non-Figma URL', () => {
    expect(parseFigmaFileKey('https://example.com/not-figma')).toBeNull()
  })
})

describe('readFigmaNode — node ID format', () => {
  it('converts dash-separated node ID from URL to colon-separated for API', async () => {
    let capturedUrl = ''
    global.fetch = async (url: RequestInfo) => {
      capturedUrl = url.toString()
      return { ok: true, json: async () => ({}) } as Response
    }
    await readFigmaNode('abc123', '116-828', 'token')
    expect(capturedUrl).toContain('116%3A828') // colon encoded as %3A
  })
})
