export function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, '')
}

/**
 * The slug a book on the shelf gets from its title.
 *
 * `content/rak.md` holds titles, not filenames, so the URL has to be derived.
 * The rule is deliberately blunt — lowercase, every run of non-alphanumerics
 * becomes one hyphen — because it has to be reproducible by hand: an owner
 * naming `content/ulasan/<slug>.mdx` to attach a review needs to be able to
 * work out the slug from the title without running the site.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
