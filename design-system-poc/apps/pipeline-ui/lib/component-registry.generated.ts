import type React from 'react'

export const componentRegistry: Record<string, () => Promise<{ default: React.ComponentType<Record<string, unknown>> }>> = {
}
