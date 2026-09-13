# `content/` — everything the site publishes

No CMS, no database, no admin login. Every poem, story, review, product and page
headline is a Markdown file in this folder. Edit a file, commit, push — it is
live. You should never need to open a `.tsx` to publish.

## What is in here

| Path | Holds | Guide |
|---|---|---|
| `puisi/` | Poems → `/puisi/<filename>` | [ADDING-CONTENT](../docs/ADDING-CONTENT.md#a-poem--contentpuisihujan-di-bulan-junimdx) |
| `cerita/` | Short stories → `/cerita/<filename>` | [ADDING-CONTENT](../docs/ADDING-CONTENT.md#a-short-story--contentceritajudul-ceritamdx) |
| `ulasan/` | Book reviews → `/ulasan/<filename>` | [ADDING-CONTENT](../docs/ADDING-CONTENT.md#a-book-review--contentulasanjudul-bukumdx) |
| `produk/` | What is for sale. **Empty = no shop at all** | [ADDING-CONTENT](../docs/ADDING-CONTENT.md#a-product--contentproduksunyi-hanya-anganmdx) |
| `produk-draf/` | Parked products, invisible to the site | [produk-draf/README](produk-draf/README.md) |
| `sekarang.mdx` | What you are up to → `/sekarang` | [ADDING-CONTENT](../docs/ADDING-CONTENT.md) |
| `novel.mdx` | The novel progress strip on `/` | [ADDING-CONTENT](../docs/ADDING-CONTENT.md#novel-progress--contentnovelmdx) |
| `rak.md` | Every book you have read → the shelf on `/ulasan` | [ADDING-CONTENT](../docs/ADDING-CONTENT.md#rak-buku--contentrakmd) |
| `tulisan.mdx` | The words **on** `/tulisan` | ↓ the rest of this file |

Two kinds of file, and the difference is worth holding onto:

- **Collections** are folders — one file per thing, as many as you like, and the
  **filename becomes the URL**. Adding a poem means adding a file.
- **Page copy** is one file named after a route. It is not a piece of writing;
  it is the words a *page* is made of — its headline, its intro, the fields
  along its bottom edge.

For collections, go to **[docs/ADDING-CONTENT.md](../docs/ADDING-CONTENT.md)** —
it covers every frontmatter field, every build error, and the traps. The rest of
this file is about page copy.

---

# Supplying a page's words with a Markdown file

Every top-level page of this site is a **sheet** in one drawing set — a
blueprint, with a numbered header, a headline, and a ruled title block along the
bottom. The layout is code; every word on it comes from a file you can edit.

## The short version

One sheet, one file, named after the route:

| Route | File | Supplies |
|---|---|---|
| `/tulisan` | `content/tulisan.mdx` | The headline, the line under it, the title block |

That is the whole rule. `/tulisan` reads `tulisan.mdx`; a sheet added at
`/tentang` would read `tentang.mdx`.

The file looks like this:

```mdx
---
title: Puisi, cerita,
titleAccent: catatan bacaan.
metaTitle: Tulisan — dsapoetra
description: Semua puisi, cerita pendek, dan ulasan buku, per tahun.
titleBlock:
  - label: Digambar oleh
    value: Dimas Angga Saputra
  - label: Lokasi
    value: Indonesia · WIB
  - label: Irama
    value: 1 buku / 2 minggu
  - label: Rev.
    value: "2026"
---

Yang saya tulis, dan apa yang saya pikirkan tentang buku yang saya baca. Bukan
ringkasan: catatan tentang apa yang tersisa setelah halaman terakhir.
```

And it lands on the page like this:

```
 LEMBAR 3 — TULISAN                     ← from the register, not this file
 Puisi, cerita, catatan bacaan.         ← title + titleAccent
 Yang saya tulis, dan apa yang ...      ← the body
 ┌─────────────┬──────────┬─────────────┬──────┬──────────┐
 │ DIGAMBAR    │ LOKASI   │ IRAMA       │ REV. │ LEMBAR   │
 │ Dimas ...   │ Indo ... │ 1 buku ...  │ 2026 │ 3 / 4    │
 └─────────────┴──────────┴─────────────┴──────┴──────────┘
       ↑ titleBlock, in the order you write it        ↑ added for you
```

## The fields

| Field | Required | What it is |
|---|---|---|
| `title` | yes | The headline, or its first half |
| `titleAccent` | no | The rest of the headline, set in the drafting blue |
| `metaTitle` | no | The browser tab and the search result. Falls back to `title` |
| `description` | no | The search-result and share-card blurb |
| `titleBlock` | no | The ruled fields at the foot of the sheet |
| *the body* | no | The paragraph under the headline |

### `title` and `titleAccent`

The headline is split across two colours: full ink, then the drafting blue. You
decide where the split falls by where you break the sentence.

```yaml
title: Puisi, cerita,
titleAccent: catatan bacaan.
```

They are joined with a single space, so keep the comma or the space you want at
the end of `title`. Leave `titleAccent` out and the headline is one colour — a
headline in one colour is a headline, not a broken one.

### The body

Everything below the closing `---` is the paragraph under the headline. Wrap it
over as many lines as you like; it is collapsed onto one paragraph on the way to
the page, so a stray blank line cannot change the shape of the header band.

It is prose, not Markdown — no headings, no lists, no links. If the sheet needs
those, it needs a section, and a section needs code.

### `titleBlock`

A list of `label` / `value` pairs, ruled across the bottom in the order you write
them. The labels are free text: the Writing sheet measures a reading cadence,
another sheet might measure something else entirely.

```yaml
titleBlock:
  - label: Digambar oleh
    value: Dimas Angga Saputra
  - label: Rev.
    value: "2026"
```

Two rules:

- **A field with an empty value is dropped, not rendered blank.** A title block
  with a missing value reads as a drawing nobody checked — worse than a title
  block with one fewer field. Same rule as the rest of the site: a thing that is
  not ready is absent, not empty.
- **Do not write the sheet number yourself.** `LEMBAR 3 / 4` is appended for you
  from the register in `lib/site.ts`. Written by hand it would go stale the first
  time a page is added or the shop is switched off — and the shop being off
  really does renumber the set.

## Deleting the file

Nothing breaks. The sheet falls back to its own built-in headline and renders
with no title block, exactly as it would on a fresh checkout with an empty
`content/`. Put the file back and the words return.

This is the same switch the rest of the site uses — see *Turning a section off*
in [docs/ADDING-CONTENT.md](../docs/ADDING-CONTENT.md).

## Quote anything that looks like a number or a date

`value: "2026"` with the quotation marks, not `value: 2026`.

Unquoted, YAML reads `2026` as a number and `2026-08-25` as a date, and you get
whichever text those happen to turn back into. The same trap as dates and prices
in the content guide, and worth the two keystrokes every time.

A value containing a colon needs quoting too: `value: "Catatan: draf kedua"`.

## When the build refuses

The message names the file and the field, in Indonesian:

| Message | Meaning |
|---|---|
| `title wajib diisi` | `title` is missing or empty |
| `label wajib diisi` | A `titleBlock` entry has no `label` |
| `value wajib diisi` | A `titleBlock` entry has no `value` |

All of them are prefixed with the file, e.g.
`Frontmatter tidak valid di content/tulisan.mdx — title wajib diisi`.

## Adding a sheet of your own

Two steps, and the second is code:

1. Write `content/<name>.mdx` in the shape above.
2. Add a row to `sheets` in `lib/site.ts` and call `loadSheet('<name>')` from the
   page. The register is what gives the sheet its number, its nav entry and its
   `LEMBAR n / m` — adding a row is all the renumbering there is.

## Publishing

```bash
npm run dev     # look at it: http://localhost:3000/tulisan
npm run build   # catch mistakes before pushing
git add content/
git commit -m "tulisan: perbarui judul lembar"
git push
```
