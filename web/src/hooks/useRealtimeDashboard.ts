'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase'

export function useRealtimeDashboard() {
  const qc = useQueryClient()

  useEffect(() => {
    const supabase = createClient()

    const channel = supabase
      .channel('dashboard-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'movements' }, () => {
        qc.invalidateQueries({ queryKey: ['dashboard'] })
        qc.invalidateQueries({ queryKey: ['products'] })
        qc.invalidateQueries({ queryKey: ['movements'] })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [qc])
}
