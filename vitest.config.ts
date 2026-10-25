/** Tests import src directly and stub the Worker APIs per file. */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: { include: ['test/**/*.test.ts'] },
})
