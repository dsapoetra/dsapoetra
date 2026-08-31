# Products, parked

These are not live. The shop loader only reads `content/produk/`, so anything in
here is invisible to the site — no shop section on the homepage, no `Toko` in
the nav or footer, no sitemap entry, and `/toko` and `/keranjang` return 404.

To put the shop back:

```bash
mv content/produk-draf/*.mdx content/produk/
```

Then commit and push. Nothing in the code needs touching either way.

The three files here still carry the design mockup's titles, blurbs and prices.
Replace them with what is actually for sale before bringing the shop back.
