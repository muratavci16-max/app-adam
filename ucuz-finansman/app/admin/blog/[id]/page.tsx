import type { Metadata } from 'next'
import BlogEditorClient from '@/components/admin/blog/BlogEditorClient'
export const metadata: Metadata = { title: 'Blog Yazısını Düzenle' }
export default async function EditBlogPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <BlogEditorClient mode="edit" postId={id} />
}
