import type { Metadata } from 'next'
import MenuAdmin from '@/components/admin/MenuAdmin'
export const metadata: Metadata = { title: 'Menü Yönetimi' }
export default function MenuPage() { return <MenuAdmin /> }
