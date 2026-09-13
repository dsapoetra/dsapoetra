'use client'

import { useEffect } from 'react'
import { useBasket } from '@/components/basket'

/**
 * Empties the basket once the buyer has been sent back from DOKU.
 *
 * Landing here is not proof of payment, so this is a convenience, not
 * bookkeeping — it stops someone who has just checked out from seeing the same
 * items still sitting in their basket. The `ready` guard matters: clearing
 * before the stored basket has been read would write an empty basket over one
 * that was about to load.
 */
export default function ClearBasket() {
  const { ready, quantities, clear } = useBasket()

  useEffect(() => {
    if (ready && Object.keys(quantities).length > 0) clear()
  }, [ready, quantities, clear])

  return null
}
