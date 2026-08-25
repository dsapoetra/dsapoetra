import { describe, it, expect } from 'vitest'
import { loadSekarang } from '@/lib/content/sekarang'

describe('loadSekarang', () => {
  it('returns the updated date and body', async () => {
    const sekarang = await loadSekarang()
    expect(sekarang).not.toBeNull()
    expect(sekarang?.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(sekarang?.body.length).toBeGreaterThan(0)
  })
})
