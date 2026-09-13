import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { readProductFile, productFileExists, contentTypeFor } from '@/lib/download/files'

let root: string

beforeEach(async () => {
  root = await mkdtemp(path.join(tmpdir(), 'dsapoetra-berkas-'))
  process.env.PRODUCT_FILE_ROOT = root
  await writeFile(path.join(root, 'sunyi.pdf'), 'ISI-BUKU')
})

afterEach(async () => {
  delete process.env.PRODUCT_FILE_ROOT
  await rm(root, { recursive: true, force: true })
})

describe('readProductFile', () => {
  it('reads a file that exists', async () => {
    const file = await readProductFile('sunyi.pdf')
    expect(file?.bytes.toString()).toBe('ISI-BUKU')
    expect(file?.contentType).toBe('application/pdf')
  })

  it('returns null for a file that does not exist', async () => {
    expect(await readProductFile('tidak-ada.pdf')).toBeNull()
  })

  it('refuses to escape the product folder', async () => {
    // The file is real and readable — the point is that the path is refused,
    // not that the read happens to fail.
    const outside = path.join(root, '..', 'rahasia.txt')
    await writeFile(outside, 'JANGAN-BOCOR')
    try {
      expect(await readProductFile('../rahasia.txt')).toBeNull()
      expect(await readProductFile('../../rahasia.txt')).toBeNull()
      expect(await readProductFile(`${root}/../rahasia.txt`)).toBeNull()
    } finally {
      await rm(outside, { force: true })
    }
  })

  it('refuses a nested path, even a legitimate-looking one', async () => {
    await mkdir(path.join(root, 'bonus'), { recursive: true })
    await writeFile(path.join(root, 'bonus', 'extra.pdf'), 'x')
    expect(await readProductFile('bonus/extra.pdf')).toBeNull()
  })

  it('refuses an absolute path', async () => {
    expect(await readProductFile('/etc/hosts')).toBeNull()
  })
})

describe('productFileExists', () => {
  it('is true for a file that is there', async () => {
    expect(await productFileExists('sunyi.pdf')).toBe(true)
  })

  it('is false for a product whose file was never deployed', async () => {
    // Drives the "menyusul" path in the receipt: better to promise nothing than
    // to send a link that fails when the buyer clicks it.
    expect(await productFileExists('belum-ada.pdf')).toBe(false)
  })

  it('refuses to answer for a path outside the folder', async () => {
    expect(await productFileExists('../rahasia.txt')).toBe(false)
    expect(await productFileExists('/etc/hosts')).toBe(false)
    expect(await productFileExists('bonus/extra.pdf')).toBe(false)
  })
})

describe('contentTypeFor', () => {
  it('maps the formats actually sold here', () => {
    expect(contentTypeFor('a.pdf')).toBe('application/pdf')
    expect(contentTypeFor('a.epub')).toBe('application/epub+zip')
    expect(contentTypeFor('a.ZIP')).toBe('application/zip')
  })

  it('falls back to a byte stream rather than guessing', () => {
    // Never text/html for an unknown extension — that is how an uploaded file
    // turns into stored XSS.
    expect(contentTypeFor('a.unknown')).toBe('application/octet-stream')
    expect(contentTypeFor('noextension')).toBe('application/octet-stream')
  })
})
