#!/usr/bin/env node
/**
 * Mengambil sampul buku dari Open Library untuk setiap buku di content/rak.md,
 * lalu menyimpannya sebagai public/sampul/<slug>.jpg.
 *
 *   node scripts/ambil-sampul.mjs           # lewati yang sudah punya sampul
 *   node scripts/ambil-sampul.mjs --force   # ambil ulang semuanya
 *   node scripts/ambil-sampul.mjs --only na-willa,akar
 *
 * Skrip ini dijalankan sesekali oleh pemilik situs, bukan saat build. Hasilnya
 * berkas gambar yang ikut di-commit — situs tidak pernah memanggil Open Library
 * saat ada pengunjung.
 *
 * Buku yang tidak ketemu dibiarkan tanpa berkas. Halaman buku sudah punya
 * jalan keluarnya: blok sampul buatan sendiri dengan judul dan penulis di
 * atasnya. Jadi "tidak ketemu" bukan kegagalan, dan skrip ini tidak pernah
 * menebak — sampul yang salah jauh lebih buruk daripada tidak ada sampul.
 */

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const ROOT = path.join(import.meta.dirname, '..')
const RAK = path.join(ROOT, 'content', 'rak.md')
const SAMPUL = path.join(ROOT, 'public', 'sampul')

/** Open Library minta User-Agent yang bisa dihubungi. */
const UA = 'dsapoetra.com cover fetcher (angga.dimassaputra@gmail.com)'

/** Jeda antar permintaan. Open Library gratis; jangan digebuk. */
const JEDA_MS = 350

/**
 * Sampul di bawah ukuran ini hampir pasti placeholder 1×1 milik Open Library,
 * bukan sampul sungguhan.
 */
const MIN_BYTES = 3000

/**
 * HARUS sama persis dengan slugify() di lib/content/slug.ts — slug inilah yang
 * jadi URL buku, jadi berkas yang salah nama tidak akan pernah terpakai.
 */
const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

function parseRak(raw) {
  const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---[ \t]*\r?\n?/, '')
  const buku = []
  let dalamKomentar = false

  for (const baris of body.split('\n')) {
    const line = baris.trim()

    if (dalamKomentar) {
      if (line.includes('-->')) dalamKomentar = false
      continue
    }
    if (line.startsWith('<!--')) {
      if (!line.includes('-->')) dalamKomentar = true
      continue
    }
    if (!line.startsWith('- ')) continue

    const [head] = line.slice(2).split('·')
    if (!head.includes(' — ')) continue

    const [title, author] = head.split(' — ').map((s) => s.trim())
    buku.push({ title, author, slug: slugify(title) })
  }

  return buku
}

/** Nama belakang penulis pertama, untuk mencocokkan hasil pencarian. */
function surname(author) {
  const bersih = author
    .replace(/^(dr\.|ed\.)\s+/i, '')
    .replace(/,\s*(Sp\.[A-Za-z.]*|Ph\.?\s?D\.?|M\.[A-Za-z.]*|S\.[A-Za-z.]*)\.?$/i, '')
    .trim()
  return bersih.split(/,| & | et al\./)[0].trim().split(/\s+/).slice(-1)[0]
}

const tidur = (ms) => new Promise((r) => setTimeout(r, ms))

async function cari(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

/**
 * Mencari cover_i untuk satu buku.
 *
 * Dua percobaan: judul + penulis, lalu judul saja. Percobaan kedua WAJIB
 * mencocokkan nama belakang penulis — tanpa itu "Akar" akan mengambil sampul
 * buku pertama bernama Akar di seluruh katalog Open Library.
 */
async function cariSampul({ title, author }) {
  const q = new URLSearchParams({
    title,
    author,
    limit: '5',
    fields: 'title,author_name,cover_i,edition_count',
  })

  let docs = (await cari(`https://openlibrary.org/search.json?${q}`)).docs ?? []
  let kandidat = docs.filter((d) => d.cover_i)

  if (kandidat.length === 0) {
    await tidur(JEDA_MS)
    const q2 = new URLSearchParams({
      title,
      limit: '10',
      fields: 'title,author_name,cover_i,edition_count',
    })
    docs = (await cari(`https://openlibrary.org/search.json?${q2}`)).docs ?? []

    const nama = surname(author).toLowerCase()
    kandidat = docs.filter(
      (d) =>
        d.cover_i &&
        (d.author_name ?? []).some((a) => a.toLowerCase().includes(nama))
    )
  }

  if (kandidat.length === 0) return null

  // Edisi terbanyak = edisi yang paling mungkin dikenali orang.
  kandidat.sort((a, b) => (b.edition_count ?? 0) - (a.edition_count ?? 0))
  return kandidat[0]
}

async function unduh(coverId) {
  const res = await fetch(`https://covers.openlibrary.org/b/id/${coverId}-L.jpg`, {
    headers: { 'User-Agent': UA },
    redirect: 'follow',
  })
  if (!res.ok) return null

  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length < MIN_BYTES) return null
  // Cek dua byte pertama: Open Library kadang membalas HTML dengan status 200.
  if (buf[0] !== 0xff || buf[1] !== 0xd8) return null

  return buf
}

async function main() {
  const argv = process.argv.slice(2)
  const force = argv.includes('--force')
  const onlyArg = argv.indexOf('--only')
  const only =
    onlyArg === -1 ? null : new Set((argv[onlyArg + 1] ?? '').split(',').filter(Boolean))

  await mkdir(SAMPUL, { recursive: true })

  const semua = parseRak(await readFile(RAK, 'utf8'))
  const ada = new Set(
    (await readdir(SAMPUL)).filter((f) => f.endsWith('.jpg')).map((f) => f.slice(0, -4))
  )

  const antre = semua.filter(
    (b) => (!only || only.has(b.slug)) && (force || !ada.has(b.slug))
  )

  console.log(
    `${semua.length} buku di rak.md · ${ada.size} sudah punya sampul · ${antre.length} akan dicari\n`
  )

  const gagal = []
  let dapat = 0

  for (const [i, buku] of antre.entries()) {
    const urut = `${String(i + 1).padStart(3)}/${antre.length}`
    try {
      const doc = await cariSampul(buku)
      if (!doc) {
        gagal.push({ ...buku, sebab: 'tidak ada di Open Library' })
        console.log(`${urut} ✗ ${buku.title} — tidak ketemu`)
      } else {
        const buf = await unduh(doc.cover_i)
        if (!buf) {
          gagal.push({ ...buku, sebab: 'sampul kosong' })
          console.log(`${urut} ✗ ${buku.title} — sampul kosong`)
        } else {
          await writeFile(path.join(SAMPUL, `${buku.slug}.jpg`), buf)
          dapat++
          console.log(
            `${urut} ✓ ${buku.title} → ${buku.slug}.jpg (${Math.round(buf.length / 1024)} KB)`
          )
        }
      }
    } catch (error) {
      gagal.push({ ...buku, sebab: String(error.message ?? error) })
      console.log(`${urut} ✗ ${buku.title} — ${error.message ?? error}`)
    }

    await tidur(JEDA_MS)
  }

  console.log(`\nSelesai: ${dapat} sampul baru, ${gagal.length} tidak ketemu.`)

  if (gagal.length > 0) {
    console.log(
      '\nBuku berikut tetap memakai blok sampul buatan sendiri.\n' +
        'Kalau mau sampul aslinya, simpan sendiri sebagai public/sampul/<slug>.jpg:\n'
    )
    for (const b of gagal) console.log(`  ${b.slug}.jpg   ${b.title} — ${b.author}`)
  }
}

await main()
