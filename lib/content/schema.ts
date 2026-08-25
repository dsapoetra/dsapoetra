import { z } from 'zod'

// gray-matter parses YAML frontmatter with js-yaml, which auto-coerces an
// unquoted ISO date scalar (e.g. `date: 2026-01-10`) into a JS Date object.
// Normalize that back to a plain YYYY-MM-DD string before validating so the
// loader's public `date: string` contract holds regardless of how the
// frontmatter was authored.
export const isoDate = z.preprocess(
  (value) => (value instanceof Date ? value.toISOString().slice(0, 10) : value),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'date harus dalam format YYYY-MM-DD')
)

export const poemSchema = z.object({
  title: z.string().min(1, 'title wajib diisi'),
  date: isoDate,
})

export const storySchema = z.object({
  title: z.string().min(1, 'title wajib diisi'),
  date: isoDate,
  excerpt: z.string().min(1, 'excerpt wajib diisi'),
})

export const reviewSchema = z.object({
  title: z.string().min(1, 'title wajib diisi'),
  book: z.object({
    title: z.string().min(1, 'book.title wajib diisi'),
    author: z.string().min(1, 'book.author wajib diisi'),
  }),
  date: isoDate,
  cover: z.string().min(1, 'cover wajib diisi'),
  excerpt: z.string().min(1, 'excerpt wajib diisi'),
  videoUrl: z.url('videoUrl harus berupa URL lengkap').optional(),
  canonicalUrl: z.url('canonicalUrl harus berupa URL lengkap').optional(),
  tags: z.array(z.string()).optional(),
})

export type PoemFrontmatter = z.infer<typeof poemSchema>
export type StoryFrontmatter = z.infer<typeof storySchema>
export type ReviewFrontmatter = z.infer<typeof reviewSchema>
