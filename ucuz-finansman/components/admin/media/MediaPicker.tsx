'use client'

import { useState } from 'react'
import { Image as ImageIcon } from 'lucide-react'
import MediaLibraryModal from './MediaLibraryModal'

interface MediaPickerProps {
  value: string
  onChange: (url: string) => void
  label?: string
  className?: string
}

export default function MediaPicker({ value, onChange, label, className = '' }: MediaPickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className={className}>
      {label && <label className="block text-xs font-semibold text-neutral-500 mb-1.5">{label}</label>}

      <div className="flex items-start gap-3">
        {/* Thumbnail / placeholder */}
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 overflow-hidden hover:border-primary-400 transition-colors flex-shrink-0 bg-neutral-50"
        >
          {value ? (
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-1">
              <ImageIcon className="w-5 h-5 text-neutral-300" />
              <span className="text-[10px] text-neutral-400 font-medium">Seç</span>
            </div>
          )}
        </button>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 pt-1">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="text-xs font-semibold text-primary-600 hover:text-primary-700 bg-primary-50 hover:bg-primary-100 px-3 py-1.5 rounded-lg transition-colors"
          >
            {value ? 'Değiştir' : 'Ortamdan Seç'}
          </button>
          {value && (
            <>
              <button
                type="button"
                onClick={() => onChange('')}
                className="text-xs text-neutral-400 hover:text-red-500 transition-colors text-left"
              >
                Kaldır
              </button>
              <span className="text-[10px] text-neutral-400 max-w-[140px] truncate leading-tight">
                {value.split('/').pop()}
              </span>
            </>
          )}
        </div>
      </div>

      {open && (
        <MediaLibraryModal
          onSelect={url => { onChange(url); setOpen(false) }}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  )
}
