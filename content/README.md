# Supplying a page's words with a Markdown file

Every top-level page of this site is a **sheet** in one drawing set — a
blueprint, with a numbered header, a headline, and a ruled title block along the
bottom. The layout is code. Everything *written* on the sheet is a Markdown file
in this folder, and you can change all of it without opening a `.tsx`.

This file is about that second kind of file. For poems, stories, reviews and
products — the things you add more of — see
**[docs/ADDING-CONTENT.md](../docs/ADDING-CONTENT.md)** instead.

---

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
