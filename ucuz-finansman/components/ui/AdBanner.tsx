'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { supabase } from '@/lib/supabase'
import type { Ad } from '@/types'

interface AdBannerProps {
  placement: string
  className?: string
}

export default function AdBanner({ placement, className = '' }: AdBannerProps) {
  const [ads, setAds] = useState<Ad[]>([])

  useEffect(() => {
    supabase
      .from('ads')
      .select('*')
      .eq('placement', placement)
      .eq('is_active', true)
      .order('order_index')
      .then(({ data }) => { if (data) setAds(data) })
  }, [placement])

  if (ads.length === 0) return null

  return (
    <div className={`flex flex-col gap-3 ${className}`}>
      {ads.map((ad) => (
        <a
          key={ad.id}
          href={ad.link_url ?? '#'}
          target="_blank"
          rel="noopener noreferrer sponsored"
          className="block group rounded-xl overflow-hidden border border-neutral-200 hover:border-primary-300 transition-all hover:shadow-card-md bg-white"
        >
          {ad.image_url && (
            <div className="relative w-full aspect-[3/1]">
              <Image src={ad.image_url} alt={ad.title ?? 'Reklam'} fill className="object-cover" />
            </div>
          )}
          {(ad.title || ad.description) && (
            <div className="px-4 py-3">
              {ad.title && <p className="text-sm font-semibold text-neutral-800 group-hover:text-primary-700 transition-colors">{ad.title}</p>}
              {ad.description && <p className="text-xs text-neutral-500 mt-0.5">{ad.description}</p>}
            </div>
          )}
          <div className="px-4 pb-2">
            <span className="text-[0.65rem] text-neutral-400 uppercase tracking-wide">Reklam</span>
          </div>
        </a>
      ))}
    </div>
  )
}
