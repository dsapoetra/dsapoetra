import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { byNewestFirst, byOrder, readCollection, readDoc } from './read'
import { poemSchema, readingNoteSchema } from './schema'
import { slugFromFilename } from './paths'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-'))
  process.env.CONTENT_ROOT = root
})

afterEach(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})

async function write(relative: string, contents: string) {
  const absolute = path.join(root, relative)
  await mkdir(path.dirname(absolute), { recursive: true })
  await writeFile(absolute, contents, 'utf8')
}

describe('slugFromFilename', () => {
  it('drops the extension', () => {
    expect(slugFromFilename('ledger.md')).toBe('ledger')
    expect(slugFromFilename('ledger.mdx')).toBe('ledger')
  })

  it('strips a sort prefix so ordering never leaks into the URL', () => {
    expect(slugFromFilename('01-olx-indonesia.md')).toBe('olx-indonesia')
    expect(slugFromFilename('10_amartha.md')).toBe('amartha')
  })

  it('leaves a number that is part of the name alone', () => {
    expect(slugFromFilename('2026-in-review.md')).toBe('in-review')
  })
})

describe('readCollection', () => {
  it('returns an empty list for a directory that does not exist', async () => {
    await expect(readCollection('poems', poemSchema, byNewestFirst)).resolves.toEqual([])
  })

  it('parses frontmatter and keeps the body verbatim', async () => {
    await write(
      'poems/ledger.md',
      '---\ntitle: Ledger\ndate: "2026-09-06"\n---\n\nline one\nline two\n'
    )

    const [poem] = await readCollection('poems', poemSchema, byNewestFirst)

    expect(poem.title).toBe('Ledger')
    expect(poem.slug).toBe('ledger')
    // The line break is the poem. It must survive the loader untouched.
    expect(poem.body).toBe('line one\nline two')
  })

  it('applies schema defaults', async () => {
    await write('poems/a.md', '---\ntitle: A\ndate: "2026-01-01"\n---\nbody\n')

    const [poem] = await readCollection('poems', poemSchema, byNewestFirst)

    expect(poem.lang).toBe('en')
    expect(poem.align).toBe('left')
  })

  it('sorts newest first', async () => {
    await write('poems/old.md', '---\ntitle: Old\ndate: "2025-01-01"\n---\nx\n')
    await write('poems/new.md', '---\ntitle: New\ndate: "2026-01-01"\n---\nx\n')

    const poems = await readCollection('poems', poemSchema, byNewestFirst)

    expect(poems.map((poem) => poem.title)).toEqual(['New', 'Old'])
  })

  it('ignores files that are not markdown', async () => {
    await write('poems/a.md', '---\ntitle: A\ndate: "2026-01-01"\n---\nx\n')
    await write('poems/.DS_Store', 'junk')
    await write('poems/notes.txt', 'junk')

    const poems = await readCollection('poems', poemSchema, byNewestFirst)

    expect(poems).toHaveLength(1)
  })

  it('names the file and the field when frontmatter is wrong', async () => {
    await write('poems/broken.md', '---\ndate: "2026-01-01"\n---\nx\n')

    await expect(
      readCollection('poems', poemSchema, byNewestFirst)
    ).rejects.toThrow(/poems\/broken\.md[\s\S]*title/)
  })

  /*
   * An unquoted YAML date becomes a Date object, not a string, and every
   * comparison downstream then behaves differently. Failing here, by name, is
   * far cheaper than a list that silently sorts wrong in production.
   */
  it('rejects an unquoted date', async () => {
    await write('poems/x.md', '---\ntitle: X\ndate: 2026-01-01\n---\nx\n')

    await expect(
      readCollection('poems', poemSchema, byNewestFirst)
    ).rejects.toThrow(/date/)
  })

  it('rejects a date that is not a real calendar day', async () => {
    await write('poems/x.md', '---\ntitle: X\ndate: "2026-02-30"\n---\nx\n')

    await expect(
      readCollection('poems', poemSchema, byNewestFirst)
    ).rejects.toThrow(/not a real calendar day/)
  })
})

describe('byOrder', () => {
  const schema = z.object({ order: z.number().int().optional() })

  it('sorts by order, then puts unordered entries last in filename order', async () => {
    await write('things/03-c.md', '---\norder: 3\n---\nx\n')
    await write('things/01-a.md', '---\norder: 1\n---\nx\n')
    await write('things/zz-no-order.md', '---\n{}\n---\nx\n')
    await write('things/aa-no-order.md', '---\n{}\n---\nx\n')

    const things = await readCollection('things', schema, byOrder)

    expect(things.map((thing) => thing.slug)).toEqual(['a', 'c', 'aa-no-order', 'zz-no-order'])
  })
})

describe('readDoc', () => {
  it('reads a single page file', async () => {
    await write('poems/one.md', '---\ntitle: One\ndate: "2026-01-01"\n---\nbody\n')

    const doc = await readDoc('poems/one.md', poemSchema)

    expect(doc.title).toBe('One')
    expect(doc.body).toBe('body')
  })

  /*
   * A missing collection is an empty section; a missing PAGE is a broken
   * build. The two must not be confused, or a typo'd filename renders a blank
   * page instead of failing.
   */
  it('throws when a required page file is missing', async () => {
    await expect(readDoc('pages/home.md', poemSchema)).rejects.toThrow(
      /Missing content file: pages\/home\.md/
    )
  })
})

describe('readingNoteSchema', () => {
  it('parses a basic reading note without instagram fields', () => {
    const parsed = readingNoteSchema.parse({
      title: 'Laut Bercerita',
      date: '2026-08-21',
      lang: 'id',
    })

    expect(parsed.title).toBe('Laut Bercerita')
    expect(parsed.instagramUrl).toBeUndefined()
    expect(parsed.instagramCover).toBeUndefined()
    expect(parsed.instagramLabel).toBe('WATCH THE REVIEW ↗')
  })

  it('accepts instagramUrl, instagramCover, and custom instagramLabel', () => {
    const parsed = readingNoteSchema.parse({
      title: 'The Hitchhiker\'s Guide to the Galaxy',
      date: '2026-09-14',
      lang: 'en',
      instagramUrl: 'https://www.instagram.com/reel/C-xyz123/',
      instagramCover: '/reviews/hitchhiker.jpg',
      instagramLabel: 'VIEW ON INSTAGRAM ↗',
    })

    expect(parsed.instagramUrl).toBe('https://www.instagram.com/reel/C-xyz123/')
    expect(parsed.instagramCover).toBe('/reviews/hitchhiker.jpg')
    expect(parsed.instagramLabel).toBe('VIEW ON INSTAGRAM ↗')
  })

  it('tolerates empty string for instagramUrl', () => {
    const parsed = readingNoteSchema.parse({
      title: 'Note',
      date: '2026-09-14',
      instagramUrl: '',
    })

    expect(parsed.instagramUrl).toBe('')
  })
})

