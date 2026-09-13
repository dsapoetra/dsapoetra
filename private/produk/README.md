# Product files

The actual things people buy. **Not served publicly** — this folder is outside
`public/`, and the only way in is `/unduh/<token>`, which checks a signature
before it reads anything.

Point a product at a file with `download:` in its `.mdx`:

```yaml
download: sunyi-hanya-angan.pdf
```

That means `private/produk/sunyi-hanya-angan.pdf`. A bare filename only — no
slashes, no `../`. The loader rejects anything else, so a path cannot be pointed
somewhere it should not go.

A product with no `download:` still sells; the confirmation email says that item
follows separately rather than carrying a link for it.

Keep files small enough for git to be comfortable — a few MB each is fine. If
you ever sell video, move this to Vercel Blob rather than committing it here.
