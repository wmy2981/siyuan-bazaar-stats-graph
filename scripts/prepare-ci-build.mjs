import { copyFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const output = path.join(root, '.cloudflare', 'output', 'v0')
await mkdir(output, { recursive: true })
await copyFile(path.join(root, 'cloudflare.config.ts'), path.join(output, 'cloudflare.config.ts'))
console.log('Copied Cloudflare project configuration for prebuilt deployment.')
