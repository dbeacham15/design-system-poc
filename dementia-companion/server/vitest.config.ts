import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
  },
  resolve: {
    alias: {
      '@dementia/db': path.resolve(__dirname, '../packages/db/src/index.ts'),
      '@dementia/types': path.resolve(__dirname, '../packages/types/src/index.ts'),
    },
  },
})
