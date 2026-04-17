'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Upload, X, FolderOpen, HardDrive, Check } from 'lucide-react'

export interface MediaFile {
  id: string
  filename: string
  original_name: string | null
  url: string
  storage_path: string | null
  size_bytes: number | null
  mime_type: string | null
  created_at: string
}

interface Props {
  onSelect: (url: string) => void
  onClose: () => void
}

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

function convertToWebP(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return reject(new Error('Canvas unsupported'))
      ctx.drawImage(img, 0, 0)
      canvas.toBlob(blob => {
        if (!blob) return reject(new Error('Conversion failed'))
        resolve({ blob, width: img.naturalWidth, height: img.naturalHeight })
      }, 'image/webp', 0.85)
    }
    img.onerror = reject
    img.src = URL.createObjectURL(file)
  })
}

export default function MediaLibraryModal({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<'library' | 'upload'>('library')
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [highlighted, setHighlighted] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadFiles = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('media_library')
      .select('id, filename, original_name, url, storage_path, size_bytes, mime_type, created_at')
      .order('created_at', { ascending: false })
    setFiles((data as MediaFile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => {
    if (tab === 'library') loadFiles()
  }, [tab])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
    setPreview(URL.createObjectURL(file))
  }

  const handleUpload = async () => {
    if (!selectedFile || uploading) return
    setUploading(true)
    try {
      const { blob, width, height } = await convertToWebP(selectedFile)
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^.]+$/, '')
      const filename = `${Date.now()}-${safeName}.webp`

      const { error: storageErr } = await supabase.storage
        .from('media')
        .upload(filename, blob, { contentType: 'image/webp', upsert: false })
      if (storageErr) throw storageErr

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filename)
      const publicUrl = urlData.publicUrl

      await supabase.from('media_library').insert({
        filename,
        original_name: selectedFile.name,
        url: publicUrl,
        storage_path: filename,
        size_bytes: blob.size,
        mime_type: 'image/webp',
        width,
        height,
      })

      onSelect(publicUrl)
      onClose()
    } catch (err) {
      console.error('Upload error:', err)
      alert('Yükleme sırasında hata oluştu. Supabase Storage "media" bucket\'ın oluşturulduğundan emin olun.')
    }
    setUploading(false)
  }

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-100 flex-shrink-0">
          <h2 className="font-bold text-neutral-800 text-sm">Görsel Seç</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-100 flex-shrink-0">
          {([['library', 'Ortam Dosyaları', FolderOpen], ['upload', 'Yükle', Upload]] as const).map(([key, label, Icon]) => (
            <button
              key={key}
              onClick={() => setTab(key as 'library' | 'upload')}
              className={`flex items-center gap-1.5 px-5 py-3 text-sm font-semibold transition-colors border-b-2 ${
                tab === key ? 'text-primary-600 border-primary-600 bg-primary-50/30' : 'text-neutral-500 border-transparent hover:text-neutral-700'
              }`}
            >
              <Icon className="w-3.5 h-3.5" /> {label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 min-h-0">
          {tab === 'library' ? (
            loading ? (
              <div className="flex items-center justify-center h-48 text-neutral-400 text-sm">Yükleniyor...</div>
            ) : files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 gap-2 text-neutral-400">
                <HardDrive className="w-8 h-8" />
                <p className="text-sm">Ortamda henüz dosya yok.</p>
                <button onClick={() => setTab('upload')} className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors">
                  Yükle →
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {files.map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setHighlighted(f.url)}
                    onDoubleClick={() => { onSelect(f.url); onClose() }}
                    title={f.original_name ?? f.filename}
                    className={`group relative aspect-square rounded-xl overflow-hidden border-2 transition-all ${
                      highlighted === f.url
                        ? 'border-primary-500 shadow-lg ring-2 ring-primary-200'
                        : 'border-transparent hover:border-neutral-300'
                    }`}
                  >
                    <img src={f.url} alt={f.filename} className="w-full h-full object-cover" />
                    {f.size_bytes != null && (
                      <span className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[9px] py-0.5 text-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatSize(f.size_bytes)}
                      </span>
                    )}
                    {highlighted === f.url && (
                      <div className="absolute inset-0 bg-primary-500/10 flex items-center justify-center">
                        <div className="w-6 h-6 bg-primary-500 rounded-full flex items-center justify-center shadow">
                          <Check className="w-3.5 h-3.5 text-white" />
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )
          ) : (
            <div className="space-y-4">
              <div
                className="border-2 border-dashed border-neutral-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-400 hover:bg-primary-50/30 transition-all"
                onClick={() => fileInputRef.current?.click()}
              >
                {preview ? (
                  <img src={preview} alt="Önizleme" className="max-h-52 mx-auto rounded-xl object-contain" />
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-neutral-300 mx-auto mb-3" />
                    <p className="text-sm font-semibold text-neutral-600">Görsel seçmek için tıklayın</p>
                    <p className="text-xs text-neutral-400 mt-1">PNG, JPG, WebP, GIF · Otomatik WebP'ye dönüştürülür (kalite: 0.85)</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              {selectedFile && (
                <div className="flex items-center gap-3 bg-neutral-50 rounded-xl p-3 border border-neutral-100">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-neutral-700 truncate">{selectedFile.name}</p>
                    <p className="text-xs text-neutral-400">{formatSize(selectedFile.size)} · WebP'ye dönüştürülecek</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleUpload}
                    disabled={uploading}
                    className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-60 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors flex-shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    {uploading ? 'Yükleniyor...' : 'Yükle ve Seç'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer: confirm selected from library */}
        {tab === 'library' && highlighted && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-neutral-100 bg-neutral-50/60 flex-shrink-0">
            <span className="text-xs text-neutral-500 truncate">{highlighted.split('/').pop()}</span>
            <button
              type="button"
              onClick={() => { onSelect(highlighted); onClose() }}
              className="bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-5 py-2 rounded-xl transition-colors flex-shrink-0"
            >
              Seç
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
