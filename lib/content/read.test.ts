import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'
import { byNewestFirst, byOrder, readCollection, readDoc } from './read'
import { caseStudySchema, noteSchema } from './schema'
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
    await expect(readCollection('notes', noteSchema, byNewestFirst)).resolves.toEqual([])
  })

  it('parses frontmatter and keeps the body verbatim', async () => {
    await write(
      'notes/ledger.md',
      '---\ntitle: Ledger\ndate: "2026-09-06"\ncategory: c\n---\n\nline one\nline two\n'
    )

    const [note] = await readCollection('notes', noteSchema, byNewestFirst)

    expect(note.title).toBe('Ledger')
    expect(note.slug).toBe('ledger')
    // Line breaks are content. They must survive the loader untouched.
    expect(note.body).toBe('line one\nline two')
  })

  it('applies schema defaults', async () => {
    await write('case-studies/a.md', '---\ntitle: A\ndate: "2026-01-01"\nsummary: S\n---\nbody\n')

    const [study] = await readCollection('case-studies', caseStudySchema, byNewestFirst)

    expect(study.context).toEqual({})
  })

  it('sorts newest first', async () => {
    await write('notes/old.md', '---\ntitle: Old\ndate: "2025-01-01"\ncategory: c\n---\nx\n')
    await write('notes/new.md', '---\ntitle: New\ndate: "2026-01-01"\ncategory: c\n---\nx\n')

    const notes = await readCollection('notes', noteSchema, byNewestFirst)

    expect(notes.map((note) => note.title)).toEqual(['New', 'Old'])
  })

  it('ignores files that are not markdown', async () => {
    await write('notes/a.md', '---\ntitle: A\ndate: "2026-01-01"\ncategory: c\n---\nx\n')
    await write('notes/.DS_Store', 'junk')
    await write('notes/notes.txt', 'junk')

    const notes = await readCollection('notes', noteSchema, byNewestFirst)

    expect(notes).toHaveLength(1)
  })

  it('names the file and the field when frontmatter is wrong', async () => {
    await write('notes/broken.md', '---\ndate: "2026-01-01"\ncategory: c\n---\nx\n')

    await expect(
      readCollection('notes', noteSchema, byNewestFirst)
    ).rejects.toThrow(/notes\/broken\.md[\s\S]*title/)
  })

  /*
   * An unquoted YAML date becomes a Date object, not a string, and every
   * comparison downstream then behaves differently. Failing here, by name, is
   * far cheaper than a list that silently sorts wrong in production.
   */
  it('rejects an unquoted date', async () => {
    await write('notes/x.md', '---\ntitle: X\ndate: 2026-01-01\ncategory: c\n---\nx\n')

    await expect(
      readCollection('notes', noteSchema, byNewestFirst)
    ).rejects.toThrow(/date/)
  })

  it('rejects a date that is not a real calendar day', async () => {
    await write('notes/x.md', '---\ntitle: X\ndate: "2026-02-30"\ncategory: c\n---\nx\n')

    await expect(
      readCollection('notes', noteSchema, byNewestFirst)
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
    await write('notes/one.md', '---\ntitle: One\ndate: "2026-01-01"\ncategory: c\n---\nbody\n')

    const doc = await readDoc('notes/one.md', noteSchema)

    expect(doc.title).toBe('One')
    expect(doc.body).toBe('body')
  })

  /*
   * A missing collection is an empty section; a missing PAGE is a broken
   * build. The two must not be confused, or a typo'd filename renders a blank
   * page instead of failing.
   */
  it('throws when a required page file is missing', async () => {
    await expect(readDoc('pages/home.md', noteSchema)).rejects.toThrow(
      /Missing content file: pages\/home\.md/
    )
  })
})
