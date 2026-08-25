import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { loadSekarang } from '@/lib/content/sekarang'

let root: string

beforeAll(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-'))
  process.env.CONTENT_ROOT = root

  await writeFile(
    path.join(root, 'sekarang.mdx'),
    '---\nupdated: 2026-01-10\n---\n\nSedang menulis sesuatu.\n'
  )
})

afterAll(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})

describe('loadSekarang', () => {
  it('returns the updated date and body', async () => {
    const sekarang = await loadSekarang()
    expect(sekarang).not.toBeNull()
    expect(sekarang?.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(sekarang?.body.length).toBeGreaterThan(0)
  })
})
