'use client'

import { useState, useEffect } from 'react'
import { Trash2, Copy, Check, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { showToast } from '@/components/ui/Toast'
import { AdminSectionTitle } from './AdminCard'
import MediaLibraryModal, { type MediaFile } from '@/components/admin/media/MediaLibraryModal'

function formatSize(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

export default function OrtamAdmin() {
  const [files, setFiles] = useState<MediaFile[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const [showUpload, setShowUpload] = useState(false)

  const loadFiles = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('media_library')
      .select('id, filename, original_name, url, storage_path, size_bytes, mime_type, created_at')
      .order('created_at', { ascending: false })
    setFiles((data as MediaFile[]) ?? [])
    setLoading(false)
  }

  useEffect(() => { loadFiles() }, [])

  const deleteFile = async (file: MediaFile) => {
    setDeleting(file.id)
    if (file.storage_path) {
      await supabase.storage.from('media').remove([file.storage_path])
    }
    await supabase.from('media_library').delete().eq('id', file.id)
    setFiles(prev => prev.filter(f => f.id !== file.id))
    setDeleting(null)
    showToast('Dosya silindi', 'success')
  }

  const copyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <AdminSectionTitle title="Ortam Dosyaları" desc="Yüklenen görsel ve dosyaları yönetin" />
        <button
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-bold px-4 py-2 rounded-xl transition-colors"
        >
          <Upload className="w-4 h-4" /> Görsel Yükle
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-neutral-400 text-sm">Yükleniyor...</div>
      ) : files.length === 0 ? (
        <div className="text-center py-20 text-neutral-400 text-sm">Henüz dosya yok.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {files.map(file => (
            <div
              key={file.id}
              className="group relative bg-white rounded-xl border border-neutral-100 overflow-hidden shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="aspect-square bg-neutral-50">
                <img
                  src={file.url}
                  alt={file.original_name ?? file.filename}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-2">
                <p className="text-[11px] font-medium text-neutral-700 truncate">
                  {file.original_name ?? file.filename}
                </p>
                {file.size_bytes != null && (
                  <p className="text-[10px] text-neutral-400">{formatSize(file.size_bytes)}</p>
                )}
              </div>
              <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => copyUrl(file.url, file.id)}
                  title="URL Kopyala"
                  className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow text-neutral-600 hover:text-primary-600 transition-colors"
                >
                  {copied === file.id
                    ? <Check className="w-3.5 h-3.5 text-success-600" />
                    : <Copy className="w-3.5 h-3.5" />
                  }
                </button>
                <button
                  onClick={() => deleteFile(file)}
                  disabled={deleting === file.id}
                  title="Sil"
                  className="w-7 h-7 bg-white/90 rounded-lg flex items-center justify-center shadow text-neutral-600 hover:text-red-500 disabled:opacity-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUpload && (
        <MediaLibraryModal
          onSelect={() => { setShowUpload(false); loadFiles() }}
          onClose={() => { setShowUpload(false); loadFiles() }}
        />
      )}
    </div>
  )
}
