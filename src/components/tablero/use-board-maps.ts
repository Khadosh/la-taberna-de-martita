import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { type CampaignMap } from './tablero-types'

const db = supabase as any

export function useBoardMaps(campaignId: string) {
  const [activeMapUrl, setActiveMapUrl] = useState<string | null>(null)
  const [mapUploading, setMapUploading] = useState(false)
  const [mapsList, setMapsList] = useState<CampaignMap[]>([])
  const [loadingMaps, setLoadingMaps] = useState(false)
  const [showMapSelector, setShowMapSelector] = useState(false)

  const fetchMaps = useCallback(async () => {
    setLoadingMaps(true)
    try {
      const { data, error } = await supabase.storage
        .from('campaign-maps')
        .list(campaignId, { limit: 100 })

      if (error) throw error

      if (data) {
        const list = data
          .filter(f => f.name !== '.emptyFolderPlaceholder')
          .map(f => {
            const { data: { publicUrl } } = supabase.storage
              .from('campaign-maps')
              .getPublicUrl(`${campaignId}/${f.name}`)
            const friendlyName = f.name.replace(/^\d+_/, '')
            return { name: friendlyName, rawName: f.name, url: publicUrl }
          })
        setMapsList(list)
      }
    } catch (err) {
      console.error('Error fetching maps:', err)
    } finally {
      setLoadingMaps(false)
    }
  }, [campaignId])

  const activateMap = async (url: string) => {
    try {
      await db.from('campaigns').update({ active_map_url: url }).eq('id', campaignId)
      setActiveMapUrl(url)
    } catch (err) {
      console.error('Error activating map:', err)
    }
  }

  const deleteMap = async (map: CampaignMap) => {
    if (!confirm(`¿Seguro que deseas eliminar el mapa "${map.name}"?`)) return
    try {
      const { error } = await supabase.storage
        .from('campaign-maps')
        .remove([`${campaignId}/${map.rawName}`])
      if (error) throw error

      if (activeMapUrl === map.url) {
        await db.from('campaigns').update({ active_map_url: null }).eq('id', campaignId)
        setActiveMapUrl(null)
      }

      fetchMaps()
    } catch (err) {
      console.error('Error deleting map:', err)
    }
  }

  const uploadMap = async (file: File) => {
    setMapUploading(true)
    try {
      const ext = file.name.split('.').pop() ?? 'png'
      const path = `${campaignId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('campaign-maps')
        .upload(path, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-maps')
        .getPublicUrl(path)
      await db.from('campaigns').update({ active_map_url: publicUrl }).eq('id', campaignId)
      setActiveMapUrl(publicUrl)
    } catch (err) {
      console.error('Error subiendo mapa:', err)
    } finally {
      setMapUploading(false)
    }
  }

  useEffect(() => {
    db.from('campaigns').select('active_map_url').eq('id', campaignId).single()
      .then(({ data }: { data: { active_map_url?: string | null } | null }) => {
        if (data?.active_map_url) setActiveMapUrl(data.active_map_url)
      })

    fetchMaps()

    const channel = supabase.channel(`dm-map-${campaignId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'campaigns', filter: `id=eq.${campaignId}` },
        (payload) => {
          const url = (payload.new as { active_map_url?: string | null }).active_map_url
          setActiveMapUrl(url ?? null)
        })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [campaignId, fetchMaps])

  return {
    activeMapUrl,
    mapUploading,
    mapsList,
    loadingMaps,
    showMapSelector, setShowMapSelector,
    fetchMaps, activateMap, deleteMap, uploadMap,
  }
}
