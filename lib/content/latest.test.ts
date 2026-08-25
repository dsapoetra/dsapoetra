import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import path from 'node:path'
import { loadLatest } from '@/lib/content/latest'

const poemDir = path.join(process.cwd(), 'content/puisi')
const storyDir = path.join(process.cwd(), 'content/cerita')
const reviewDir = path.join(process.cwd(), 'content/ulasan')

const fixtures: Array<{ dir: string; name: string }> = [
  { dir: poemDir, name: 'uji-latest-puisi-lama.mdx' },
  { dir: poemDir, name: 'uji-latest-puisi-sama.mdx' },
  { dir: storyDir, name: 'uji-latest-cerita.mdx' },
  { dir: storyDir, name: 'uji-latest-cerita-sama.mdx' },
  { dir: reviewDir, name: 'uji-latest-ulasan.mdx' },
]

async function cleanup() {
  for (const { dir, name } of fixtures) {
    await rm(path.join(dir, name), { force: true })
  }
}

beforeAll(async () => {
  await mkdir(poemDir, { recursive: true })
  await mkdir(storyDir, { recursive: true })
  await mkdir(reviewDir, { recursive: true })

  // Ensure a clean slate in case a previous run crashed before cleanup.
  await cleanup()

  // A poem well in the past, so it lands last in the merged stream.
  await writeFile(
    path.join(poemDir, 'uji-latest-puisi-lama.mdx'),
    '---\ntitle: Puisi Lama Uji\ndate: 2020-01-01\n---\n\nbaris uji\n'
  )

  // Two items sharing the SAME date, in different collections. On disk,
  // "cerita" (story) fixture is written before "puisi" (poem) fixture below —
  // the on-disk / filename order is what determines tie-break stability
  // once merged, since the merge itself only appends collection arrays in a
  // fixed order (ulasan, puisi, cerita) before sorting by date.
  const tiedDate = '2025-06-15'
  await writeFile(
    path.join(storyDir, 'uji-latest-cerita-sama.mdx'),
    `---\ntitle: Cerita Sama Uji\ndate: ${tiedDate}\nexcerpt: Ringkasan cerita uji.\n---\n\nIsi cerita uji.\n`
  )
  await writeFile(
    path.join(poemDir, 'uji-latest-puisi-sama.mdx'),
    `---\ntitle: Puisi Sama Uji\ndate: ${tiedDate}\n---\n\nbaris sama\n`
  )

  // A recent story, most recent of all fixtures.
  await writeFile(
    path.join(storyDir, 'uji-latest-cerita.mdx'),
    '---\ntitle: Cerita Terbaru Uji\ndate: 2025-12-01\nexcerpt: Ringkasan cerita terbaru.\n---\n\nIsi cerita terbaru.\n'
  )

  // A review, dated between the two extremes.
  await writeFile(
    path.join(reviewDir, 'uji-latest-ulasan.mdx'),
    '---\ntitle: Ulasan Terbaru Uji\nbook:\n  title: Buku Uji\n  author: Penulis Uji\ndate: 2025-08-01\ncover: /sampul/uji-latest.jpg\nexcerpt: Ringkasan ulasan uji.\n---\n\nIsi ulasan uji.\n'
  )
})

afterAll(async () => {
  await cleanup()
})

describe('loadLatest', () => {
  it('merges all three collections into one list', async () => {
    const items = await loadLatest()
    const kinds = new Set(items.map((item) => item.kind))
    expect(kinds.has('ulasan')).toBe(true)
    expect(kinds.has('puisi')).toBe(true)
    expect(kinds.has('cerita')).toBe(true)
  })

  it('sorts newest first across collections', async () => {
    const items = await loadLatest()
    const dates = items.map((item) => item.date)
    const sorted = [...dates].sort().reverse()
    expect(dates).toEqual(sorted)
  })

  it('builds a correct href for each kind', async () => {
    const items = await loadLatest()
    for (const item of items) {
      expect(item.href).toBe(`/${item.kind}/${item.slug}`)
    }
  })

  it('respects the limit', async () => {
    const items = await loadLatest(2)
    expect(items).toHaveLength(2)
  })

  it('orders two same-date items from different collections deterministically', async () => {
    const items = await loadLatest()
    const tied = items.filter((item) => item.date === '2025-06-15')
    expect(tied).toHaveLength(2)

    // The merge concatenates reviews, then poems, then stories, then does a
    // stable sort by date — so for equal dates, whichever collection was
    // concatenated first keeps its relative position. Poems are
    // concatenated before stories, so the poem stays ahead of the story.
    expect(tied.map((item) => item.slug)).toEqual([
      'uji-latest-puisi-sama',
      'uji-latest-cerita-sama',
    ])

    // Run again to confirm this ordering is stable, not incidental.
    const again = await loadLatest()
    const tiedAgain = again.filter((item) => item.date === '2025-06-15')
    expect(tiedAgain.map((item) => item.slug)).toEqual(
      tied.map((item) => item.slug)
    )
  })
})
