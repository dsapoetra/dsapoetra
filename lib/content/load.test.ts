import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import path from 'node:path'
import { loadPoems, loadPoem, loadStories, loadStory } from '@/lib/content/load'

// `readdir` is wrapped in a spy-able vi.fn (delegating to the real
// implementation by default) so individual tests can force a rejection
// without hitting Vitest's "module namespace is not configurable in ESM"
// limitation when spying on a built-in module's named export directly.
vi.mock('node:fs/promises', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs/promises')>()
  return {
    ...actual,
    readdir: vi.fn(actual.readdir),
  }
})

const poemDir = path.join(process.cwd(), 'content/puisi')
const storyDir = path.join(process.cwd(), 'content/cerita')
const fixtures = [
  '__uji-satu.mdx',
  '__uji-dua.mdx',
  '__uji-rusak.mdx',
  '__uji-sama-a.mdx',
  '__uji-sama-b.mdx',
  '__uji-sama-c.mdx',
]

beforeAll(async () => {
  await mkdir(poemDir, { recursive: true })
  await mkdir(storyDir, { recursive: true })

  await writeFile(
    path.join(poemDir, '__uji-satu.mdx'),
    '---\ntitle: Uji Satu\ndate: 2026-01-10\n---\n\nbaris pertama\nbaris kedua\n'
  )
  await writeFile(
    path.join(poemDir, '__uji-dua.mdx'),
    '---\ntitle: Uji Dua\ndate: 2026-03-20\n---\n\nsatu baris saja\n'
  )
  await writeFile(
    path.join(storyDir, '__uji-satu.mdx'),
    '---\ntitle: Cerita Uji\ndate: 2026-02-01\nexcerpt: Ringkasan singkat.\n---\n\nIsi cerita.\n'
  )
})

afterAll(async () => {
  for (const name of fixtures) {
    await rm(path.join(poemDir, name), { force: true })
    await rm(path.join(storyDir, name), { force: true })
  }
})

describe('loadPoems', () => {
  it('returns poems sorted newest first', async () => {
    const poems = await loadPoems()
    const slugs = poems.map((p) => p.slug)
    expect(slugs.indexOf('__uji-dua')).toBeLessThan(slugs.indexOf('__uji-satu'))
  })

  it('derives the slug from the filename', async () => {
    const poems = await loadPoems()
    expect(poems.some((p) => p.slug === '__uji-satu')).toBe(true)
  })

  it('preserves the poet line breaks in the body', async () => {
    const poem = await loadPoem('__uji-satu')
    expect(poem?.body).toContain('baris pertama\nbaris kedua')
  })

  it('keeps a deterministic, stable order for entries sharing the same date', async () => {
    const sameDateFiles = ['__uji-sama-a.mdx', '__uji-sama-b.mdx', '__uji-sama-c.mdx']
    for (const [index, name] of sameDateFiles.entries()) {
      await writeFile(
        path.join(poemDir, name),
        `---\ntitle: Sama ${index}\ndate: 2026-05-05\n---\n\nisi ${index}\n`
      )
    }

    const onDiskOrder = (await readdir(poemDir))
      .filter((name) => sameDateFiles.includes(name))
      .map((name) => name.replace(/\.mdx$/, ''))

    const poems = await loadPoems()
    const sameDateSlugs = poems
      .filter((p) => p.date === '2026-05-05')
      .map((p) => p.slug)

    expect(sameDateSlugs).toEqual(onDiskOrder)

    // Distinct dates must still sort newest first alongside the equal-date group.
    const slugs = poems.map((p) => p.slug)
    expect(slugs.indexOf('__uji-dua')).toBeLessThan(slugs.indexOf('__uji-satu'))

    for (const name of sameDateFiles) {
      await rm(path.join(poemDir, name), { force: true })
    }
  })
})

describe('loadPoem', () => {
  it('returns null for an unknown slug', async () => {
    expect(await loadPoem('tidak-ada')).toBeNull()
  })
})

describe('loadStories', () => {
  it('carries the excerpt through', async () => {
    const stories = await loadStories()
    const story = stories.find((s) => s.slug === '__uji-satu')
    expect(story?.excerpt).toBe('Ringkasan singkat.')
  })
})

describe('loadStory', () => {
  it('returns null for an unknown slug', async () => {
    expect(await loadStory('tidak-ada')).toBeNull()
  })
})

describe('validation', () => {
  it('throws a helpful error when frontmatter is invalid', async () => {
    await writeFile(
      path.join(poemDir, '__uji-rusak.mdx'),
      '---\ntitle: Tanpa Tanggal\n---\n\nisi\n'
    )
    await expect(loadPoems()).rejects.toThrow('__uji-rusak.mdx')
    await rm(path.join(poemDir, '__uji-rusak.mdx'), { force: true })
  })
})

describe('readdir failure handling', () => {
  it('returns an empty array when the collection directory is missing (ENOENT)', async () => {
    const missing = Object.assign(new Error('ENOENT: no such file or directory'), {
      code: 'ENOENT',
    })
    vi.mocked(readdir).mockRejectedValueOnce(missing)
    await expect(loadStories()).resolves.toEqual([])
  })

  it('rethrows a non-ENOENT readdir error instead of silently returning an empty array', async () => {
    const permissionDenied = Object.assign(new Error('EACCES: permission denied'), {
      code: 'EACCES',
    })
    vi.mocked(readdir).mockRejectedValueOnce(permissionDenied)
    await expect(loadStories()).rejects.toThrow('EACCES')
  })
})
