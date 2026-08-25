import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { cache } from 'react'
import matter from 'gray-matter'
import { z } from 'zod'
import { isoDate } from './schema'

const sekarangSchema = z.object({ updated: isoDate })

export type Sekarang = { updated: string; body: string }

export const loadSekarang = cache(async (): Promise<Sekarang | null> => {
  const file = path.join(process.cwd(), 'content/sekarang.mdx')

  let raw: string
  try {
    raw = await readFile(file, 'utf8')
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
      return null
    }
    throw error
  }

  const { data, content } = matter(raw)
  const parsed = sekarangSchema.safeParse(data)

  if (!parsed.success) {
    const detail = parsed.error.issues
      .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
      .join('; ')
    throw new Error(`Frontmatter tidak valid di content/sekarang.mdx — ${detail}`)
  }

  return { updated: parsed.data.updated, body: content.trim() }
})
