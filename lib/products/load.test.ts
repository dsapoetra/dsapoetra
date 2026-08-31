import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { loadProducts } from '@/lib/products/load'
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'

let root: string
let produkDir: string

/**
 * `loadProducts` is wrapped in React's `cache`, which only memoizes inside a
 * React request scope — outside one, as here, every call reads the filesystem
 * afresh. That is what lets each test point CONTENT_ROOT at its own directory.
 */
const load = loadProducts

async function write(name: string, contents: string) {
  await writeFile(path.join(produkDir, name), contents)
}

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-produk-'))
  process.env.CONTENT_ROOT = root
  produkDir = path.join(root, 'produk')
  await mkdir(produkDir, { recursive: true })
})

afterEach(async () => {
  delete process.env.CONTENT_ROOT
  await rm(root, { recursive: true, force: true })
})

const VALID = [
  '---',
  'title: Sunyi Hanya Angan',
  'kind: E-book · PDF + EPUB',
  'price: 49000',
  'order: 1',
  'cover:',
  '  tone: ink',
  '  caption: |',
  '    Kumpulan puisi',
  '    2022–2026',
  '---',
  '',
  'Empat puluh delapan puisi.',
  '',
].join('\n')

describe('loadProducts', () => {
  it('reads a product file into the shape the shop renders', async () => {
    await write('sunyi-hanya-angan.mdx', VALID)
    const [product] = await load()

    expect(product).toMatchObject({
      slug: 'sunyi-hanya-angan',
      title: 'Sunyi Hanya Angan',
      kind: 'E-book · PDF + EPUB',
      price: 49000,
      order: 1,
      blurb: 'Empat puluh delapan puisi.',
    })
  })

  it('takes the blurb from the body, not from frontmatter', async () => {
    await write(
      'a.mdx',
      '---\ntitle: A\nkind: K\nprice: 1000\ncover:\n  tone: ink\n  caption: C\n---\n\nDua baris\nyang dibungkus.\n'
    )
    const [product] = await load()
    // Collapsed onto one line — a wrapped paragraph in the file must not become
    // a wrapped paragraph in the markup.
    expect(product.blurb).toBe('Dua baris yang dibungkus.')
  })

  it('trims the trailing newline a YAML block caption leaves behind', async () => {
    await write('sunyi-hanya-angan.mdx', VALID)
    const [product] = await load()
    // The internal break survives — it is what the cover's two lines are.
    expect(product.cover.caption).toBe('Kumpulan puisi\n2022–2026')
  })

  it('sorts by order, then by slug for ties', async () => {
    const file = (title: string, order?: number) =>
      `---\ntitle: ${title}\nkind: K\nprice: 1000\n${
        order === undefined ? '' : `order: ${order}\n`
      }cover:\n  tone: ink\n  caption: C\n---\n\nUji.\n`

    await write('ketiga.mdx', file('Ketiga', 3))
    await write('pertama.mdx', file('Pertama', 1))
    await write('kedua.mdx', file('Kedua', 2))

    const products = await load()
    expect(products.map((p) => p.slug)).toEqual([
      'pertama',
      'kedua',
      'ketiga',
    ])
  })

  it('puts a file with no order after everything that has one', async () => {
    const file = (order?: number) =>
      `---\ntitle: T\nkind: K\nprice: 1000\n${
        order === undefined ? '' : `order: ${order}\n`
      }cover:\n  tone: ink\n  caption: C\n---\n\nUji.\n`

    await write('tanpa-urutan.mdx', file())
    await write('bernomor.mdx', file(9))

    const products = await load()
    expect(products.map((p) => p.slug)).toEqual([
      'bernomor',
      'tanpa-urutan',
    ])
  })

  it('returns an empty shop when content/produk does not exist', async () => {
    await rm(produkDir, { recursive: true })
    expect(await load()).toEqual([])
  })

  it('returns an empty shop when the directory is empty', async () => {
    expect(await load()).toEqual([])
  })

  it('ignores non-mdx files sitting in the directory', async () => {
    await write('.gitkeep', '')
    await write('catatan.txt', 'bukan produk')
    await write('a.mdx', VALID)
    expect(await load()).toHaveLength(1)
  })

  it('catches a price written with a thousands dot, and names the file', async () => {
    // `price: 49.000` is the float 49 in YAML — an integer as far as JavaScript
    // is concerned, so without the floor it would ship as a price of Rp 49.
    await write(
      'salah-harga.mdx',
      '---\ntitle: A\nkind: K\nprice: 49.000\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/produk\/salah-harga\.mdx/)
    await expect(load()).rejects.toThrow(/49000, bukan 49\.000/)
  })

  it('allows a free product', async () => {
    await write(
      'gratis.mdx',
      '---\ntitle: A\nkind: K\nprice: 0\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    const [product] = await load()
    expect(product.price).toBe(0)
  })

  it('rejects an unknown cover tone', async () => {
    await write(
      'salah-tone.mdx',
      '---\ntitle: A\nkind: K\nprice: 1000\ncover:\n  tone: biru\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/cover\.tone/)
  })

  it('rejects a negative price', async () => {
    await write(
      'negatif.mdx',
      '---\ntitle: A\nkind: K\nprice: -1000\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/negatif/)
  })

  it('rejects a genuinely fractional price with the integer message', async () => {
    // Distinct from the thousands-dot case above: 49500.5 is not an integer at
    // all, so it fails earlier and gets the other message. Both are documented
    // in docs/ADDING-CONTENT.md.
    await write(
      'pecahan.mdx',
      '---\ntitle: A\nkind: K\nprice: 49500.5\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/price harus bilangan bulat/)
  })

  it('rejects a missing kind', async () => {
    await write(
      'tanpa-kind.mdx',
      '---\ntitle: A\nprice: 1000\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/kind wajib diisi/)
  })

  it('rejects a caption that is only whitespace', async () => {
    await write(
      'kosong.mdx',
      '---\ntitle: A\nkind: K\nprice: 1000\ncover:\n  tone: ink\n  caption: "   "\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/cover\.caption wajib diisi/)
  })

  it('rejects a missing title', async () => {
    await write(
      'tanpa-judul.mdx',
      '---\nkind: K\nprice: 1000\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/title/)
  })

  it('keeps buyUrl when present and omits it when absent', async () => {
    await write(
      'punya-link.mdx',
      '---\ntitle: A\nkind: K\nprice: 1000\nbuyUrl: https://contoh.test/beli\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await write('tanpa-link.mdx', VALID)

    const products = await load()
    const withLink = products.find((p) => p.slug === 'punya-link')
    const without = products.find((p) => p.slug === 'tanpa-link')

    expect(withLink?.buyUrl).toBe('https://contoh.test/beli')
    expect(without?.buyUrl).toBeUndefined()
  })

  it('rejects a buyUrl that is not a full URL', async () => {
    await write(
      'link-relatif.mdx',
      '---\ntitle: A\nkind: K\nprice: 1000\nbuyUrl: /beli\ncover:\n  tone: ink\n  caption: C\n---\n\nUji.\n'
    )
    await expect(load()).rejects.toThrow(/buyUrl/)
  })
})

describe('the real content/produk the site ships with', () => {
  it('loads, and every slug is unique and URL-safe', async () => {
    delete process.env.CONTENT_ROOT
    const products = await load()

    const slugs = products.map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    }
  })
})
