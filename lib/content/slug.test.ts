import { describe, it, expect } from 'vitest'
import { slugFromFilename } from '@/lib/content/slug'

describe('slugFromFilename', () => {
  it('strips the .mdx extension', () => {
    expect(slugFromFilename('hujan-di-bulan-juni.mdx')).toBe('hujan-di-bulan-juni')
  })

  it('leaves a bare slug untouched', () => {
    expect(slugFromFilename('hujan-di-bulan-juni')).toBe('hujan-di-bulan-juni')
  })

  it('only strips the final extension', () => {
    expect(slugFromFilename('bagian.1.mdx')).toBe('bagian.1')
  })
})
