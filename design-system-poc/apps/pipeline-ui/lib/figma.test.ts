import { describe, it, expect } from 'vitest'
import { parseFigmaFileKey } from './figma'

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
