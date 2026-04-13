import type { Metadata } from 'next'
import BlogEditorClient from '@/components/admin/blog/BlogEditorClient'
export const metadata: Metadata = { title: 'Yeni Blog Yazısı' }
export default function YeniBlogPage() { return <BlogEditorClient mode="create" /> }
