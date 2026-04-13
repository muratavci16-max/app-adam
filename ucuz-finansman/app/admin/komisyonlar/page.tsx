import type { Metadata } from 'next'
import KomisyonlarAdmin from '@/components/admin/KomisyonlarAdmin'
export const metadata: Metadata = { title: 'Banka Faizleri' }
export default function KomisyonlarPage() { return <KomisyonlarAdmin /> }
