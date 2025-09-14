import { redirect, error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession()
  
  if (!session) {
    throw redirect(303, '/login')
  }

  try {
    // Fetch radar chart data with multi-tenant filtering
    const { data: radarData, error: radarError } = await supabase
      .from('radar_charts')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (radarError) {
      console.error('Error fetching radar chart data:', radarError)
    }

    // Fetch metrics data with multi-tenant filtering
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics')
      .select('*')
      .eq('tenant_id', session.user.id)
      .order('metric_date', { ascending: true })
      .limit(30) // Get last 30 data points

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError)
    }

    // Return both radar chart and metrics data
    return {
      radarChartData: radarData?.[0] || null,
      metricsData: metricsData || [],
      user: session.user
    }
  } catch (err) {
    console.error('Server error:', err)
    throw error(500, 'Internal server error')
  }
}

export const actions = {
  signout: async ({ locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession()
    if (session) {
      await supabase.auth.signOut()
      throw redirect(303, '/')
    }
  },
}
