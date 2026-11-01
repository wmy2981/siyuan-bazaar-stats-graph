/** Tests import src directly and stub the Worker APIs per file. */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  // `css: true` keeps `?raw` stylesheet imports at their real text; without it
  // Vitest replaces every stylesheet import with an empty string, so the inlined
  // CSS of the demo page and the Swagger UI would go untested.
  test: { include: ['test/**/*.test.ts'], css: true },
})
