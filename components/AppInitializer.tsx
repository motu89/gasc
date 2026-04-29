'use client'

import { useEffect } from 'react'
import { useStore } from '@/lib/store'

export default function AppInitializer() {
  const initializeAppState = useStore((state) => state.initializeAppState)

  useEffect(() => {
    initializeAppState()
  }, [initializeAppState])

  return null
}
