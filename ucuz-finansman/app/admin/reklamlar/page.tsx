import type { Metadata } from 'next'
import ReklamlarAdmin from '@/components/admin/ReklamlarAdmin'
export const metadata: Metadata = { title: 'Reklam Alanları' }
export default function ReklamlarPage() { return <ReklamlarAdmin /> }
