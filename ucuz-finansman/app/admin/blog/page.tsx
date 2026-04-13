import type { Metadata } from 'next'
import BlogListAdmin from '@/components/admin/blog/BlogListAdmin'
export const metadata: Metadata = { title: 'Blog Yazıları' }
export default function AdminBlogPage() { return <BlogListAdmin /> }
