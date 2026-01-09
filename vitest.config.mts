import { defineConfig } from 'vitest/config'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    test: {
        environment: 'jsdom',
        globals: true,
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    },
    resolve: {
        alias: [
            { find: '@', replacement: resolve(__dirname, 'src') },
            { find: /.*\/scripts\/app\.js$/, replacement: resolve(__dirname, 'src/__mocks__/app.ts') },
            { find: /.*\/scripts\/api\.js$/, replacement: resolve(__dirname, 'src/__mocks__/api.ts') }
        ]
    }
})
