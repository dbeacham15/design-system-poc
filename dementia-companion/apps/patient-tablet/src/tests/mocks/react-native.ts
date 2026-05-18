// Minimal React Native stubs for unit tests
export const StyleSheet = { create: (s: any) => s }
export const View = 'View'
export const Text = 'Text'
export const TouchableOpacity = 'TouchableOpacity'
export const Animated = {
  Value: class { constructor(v: number) {} interpolate() { return {} } stopAnimation() {} setValue() {} },
  timing: () => ({ start: () => {} }),
  loop: (a: any) => ({ start: (cb?: () => void) => { cb?.() } }),
  sequence: (a: any[]) => a[0],
}
export const Dimensions = { get: () => ({ width: 768, height: 1024 }) }
export const Platform = { OS: 'web' }
