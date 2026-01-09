import { defineConfig } from 'vite'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

export default defineConfig({
    build: {
        lib: {
            entry: {
                'background-themes': resolve(__dirname, 'src/background-themes.ts'),
                'aether-snow': resolve(__dirname, 'src/aether-snow.ts'),
                'christmas-sidebar': resolve(__dirname, 'src/christmas-sidebar.ts'),
                'link_animations': resolve(__dirname, 'src/link-animations.ts'),
                'settings-cache': resolve(__dirname, 'src/settings-cache.ts')
            },
            formats: ['es'],
            fileName: (_, entryName) => `${entryName}.js`
        },
        outDir: 'js',
        emptyOutDir: true,
        rollupOptions: {
            external: [
                /^\/scripts\//,           // Absolute: /scripts/app.js
                /^\.\.\/.*scripts\//,     // Relative: ../../scripts/app.js
                /^\.\.\/\.\.\/scripts\//, // Relative: ../../scripts/app.js
                /^\.\.\/\.\.\/\.\.\/scripts\// // Relative: ../../../scripts/app.js
            ],
            output: {
                entryFileNames: '[name].js'
            }
        },
        sourcemap: true,
        minify: false
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'src')
        }
    }
})
