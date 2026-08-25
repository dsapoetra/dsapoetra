export function slugFromFilename(filename: string): string {
  return filename.replace(/\.mdx$/, '')
}
