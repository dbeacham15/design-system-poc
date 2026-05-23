import type React from 'react'

export const componentRegistry: Record<string, () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>> = {
  Button: () => import('@ds/components/Button').then(m => ({ default: m.Button as unknown as React.ComponentType<Record<string, unknown>> })),
}
