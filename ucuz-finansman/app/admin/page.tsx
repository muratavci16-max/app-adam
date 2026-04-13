import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase'
import AdminDashboardClient from '@/components/admin/AdminDashboardClient'

export const metadata: Metadata = { title: 'Dashboard' }

async function getStats() {
  try {
    const db = createAdminClient()
    const [adsRes, plansRes, postsRes] = await Promise.all([
      db.from('ads').select('id', { count: 'exact', head: true }),
      db.from('saved_plans').select('id', { count: 'exact', head: true }),
      db.from('blog_posts').select('id', { count: 'exact', head: true }),
    ])
    return {
      adsCount: adsRes.count ?? 0,
      plansCount: plansRes.count ?? 0,
      postsCount: postsRes.count ?? 0,
    }
  } catch {
    return { adsCount: 0, plansCount: 0, postsCount: 0 }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()
  return <AdminDashboardClient stats={stats} />
}
