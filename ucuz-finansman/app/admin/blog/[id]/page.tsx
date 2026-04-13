import type { Metadata } from 'next'
import BlogEditorClient from '@/components/admin/blog/BlogEditorClient'
export const metadata: Metadata = { title: 'Blog Yazısını Düzenle' }
export default function EditBlogPage({ params }: { params: { id: string } }) {
  return <BlogEditorClient mode="edit" postId={params.id} />
}
