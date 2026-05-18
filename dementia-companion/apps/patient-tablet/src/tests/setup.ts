// Minimal browser API stubs needed for hook tests

// Stub Audio constructor (not in jsdom)
global.Audio = class {
  srcObject: unknown = null
  play() { return Promise.resolve() }
} as any

// Stub RTCPeerConnection
const mockPc = {
  addTrack: vi.fn(),
  createDataChannel: vi.fn(() => ({ onmessage: null, onopen: null })),
  createOffer: vi.fn(() => Promise.resolve({ type: 'offer', sdp: 'v=0\r\n' })),
  setLocalDescription: vi.fn(() => Promise.resolve()),
  setRemoteDescription: vi.fn(() => Promise.resolve()),
  close: vi.fn(),
  ontrack: null,
}
global.RTCPeerConnection = vi.fn(() => mockPc) as any

// Stub getUserMedia
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: vi.fn(() => Promise.resolve({ getTracks: () => [{ kind: 'audio' }] })),
  },
  writable: true,
})
