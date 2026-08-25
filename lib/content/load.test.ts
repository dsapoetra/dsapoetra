import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest'
import { mkdir, writeFile, rm, readdir } from 'node:fs/promises'
import path from 'node:path'
import { loadPoems, loadPoem, loadStories, loadStory, loadReviews, loadReview } from '@/lib/content/load'

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
const reviewDir = path.join(process.cwd(), 'content/ulasan')
const fixtures = [
  'uji-satu.mdx',
  'uji-dua.mdx',
  'uji-rusak.mdx',
  'uji-sama-a.mdx',
  'uji-sama-b.mdx',
  'uji-sama-c.mdx',
  'uji-ulasan.mdx',
  'uji-ulasan-video.mdx',
]

beforeAll(async () => {
  await mkdir(poemDir, { recursive: true })
  await mkdir(storyDir, { recursive: true })
  await mkdir(reviewDir, { recursive: true })

  await writeFile(
    path.join(poemDir, 'uji-satu.mdx'),
    '---\ntitle: Uji Satu\ndate: 2026-01-10\n---\n\nbaris pertama\nbaris kedua\n'
  )
  await writeFile(
    path.join(poemDir, 'uji-dua.mdx'),
    '---\ntitle: Uji Dua\ndate: 2026-03-20\n---\n\nsatu baris saja\n'
  )
  await writeFile(
    path.join(storyDir, 'uji-satu.mdx'),
    '---\ntitle: Cerita Uji\ndate: 2026-02-01\nexcerpt: Ringkasan singkat.\n---\n\nIsi cerita.\n'
  )
  await writeFile(
    path.join(reviewDir, 'uji-ulasan.mdx'),
    '---\ntitle: Ulasan Uji\nbook:\n  title: Judul Buku Uji\n  author: Penulis Uji\ndate: 2026-05-02\ncover: /sampul/uji.jpg\nexcerpt: Ringkasan ulasan.\n---\n\nIsi ulasan.\n'
  )
  await writeFile(
    path.join(reviewDir, 'uji-ulasan-video.mdx'),
    '---\ntitle: Ulasan Bervideo\nbook:\n  title: Buku Kedua\n  author: Penulis Kedua\ndate: 2026-05-03\ncover: /sampul/uji2.jpg\nexcerpt: Ada videonya.\nvideoUrl: https://www.instagram.com/reel/ABC123/\n---\n\nIsi ulasan kedua.\n'
  )
})

afterAll(async () => {
  for (const name of fixtures) {
    await rm(path.join(poemDir, name), { force: true })
    await rm(path.join(storyDir, name), { force: true })
    await rm(path.join(reviewDir, name), { force: true })
  }
})

describe('loadPoems', () => {
  it('returns poems sorted newest first', async () => {
    const poems = await loadPoems()
    const slugs = poems.map((p) => p.slug)
    expect(slugs.indexOf('uji-dua')).toBeLessThan(slugs.indexOf('uji-satu'))
  })

  it('derives the slug from the filename', async () => {
    const poems = await loadPoems()
    expect(poems.some((p) => p.slug === 'uji-satu')).toBe(true)
  })

  it('preserves the poet line breaks in the body', async () => {
    const poem = await loadPoem('uji-satu')
    expect(poem?.body).toContain('baris pertama\nbaris kedua')
  })

  it('keeps a deterministic, stable order for entries sharing the same date', async () => {
    const sameDateFiles = ['uji-sama-a.mdx', 'uji-sama-b.mdx', 'uji-sama-c.mdx']
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
    expect(slugs.indexOf('uji-dua')).toBeLessThan(slugs.indexOf('uji-satu'))

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
    const story = stories.find((s) => s.slug === 'uji-satu')
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
      path.join(poemDir, 'uji-rusak.mdx'),
      '---\ntitle: Tanpa Tanggal\n---\n\nisi\n'
    )
    await expect(loadPoems()).rejects.toThrow('uji-rusak.mdx')
    await rm(path.join(poemDir, 'uji-rusak.mdx'), { force: true })
  })
})

// A test-fixture filter was tried here and removed. It excluded `__`-prefixed
// filenames, but the positive-assertion tests above need their fixtures to
// load, so those fixtures could not carry the filtered prefix — leaving the
// filter guarding a name the suite never produces. A leftover `uji-*.mdx` from
// an interrupted run is still published by the next build; that was verified
// empirically. The fix is a guard that FAILS the build when fixture-named files
// are found in content/, and ultimately an injectable content root so tests
// never touch the live tree at all. Both are recorded in
// docs/superpowers/plans/CARRY-FORWARD.md.

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

describe('loadReviews', () => {
  it('parses the nested book object', async () => {
    const reviews = await loadReviews()
    const review = reviews.find((r) => r.slug === 'uji-ulasan')
    expect(review?.book.title).toBe('Judul Buku Uji')
    expect(review?.book.author).toBe('Penulis Uji')
  })

  it('leaves videoUrl undefined when absent', async () => {
    const review = await loadReview('uji-ulasan')
    expect(review?.videoUrl).toBeUndefined()
  })

  it('carries videoUrl through when present', async () => {
    const review = await loadReview('uji-ulasan-video')
    expect(review?.videoUrl).toBe('https://www.instagram.com/reel/ABC123/')
  })

  it('rejects a videoUrl that is not a full URL', async () => {
    await writeFile(
      path.join(reviewDir, 'uji-ulasan-rusak.mdx'),
      '---\ntitle: Rusak\nbook:\n  title: B\n  author: A\ndate: 2026-05-01\ncover: /sampul/x.jpg\nexcerpt: E\nvideoUrl: bukan-url\n---\n\nisi\n'
    )
    await expect(loadReviews()).rejects.toThrow('uji-ulasan-rusak.mdx')
    await rm(path.join(reviewDir, 'uji-ulasan-rusak.mdx'), { force: true })
  })

  it('returns null for an unknown slug', async () => {
    expect(await loadReview('tidak-ada')).toBeNull()
  })
})
