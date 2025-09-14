import { redirect, error } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession()
  
  if (!session) {
    throw redirect(303, '/login')
  }

  try {
    // Get user's tenant information for multi-tenant safety
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('tenant_id')
      .eq('id', session.user.id)
      .single()

    if (profileError || !userProfile?.tenant_id) {
      console.error('Error fetching user profile:', profileError)
      throw error(500, 'Unable to fetch user profile')
    }

    // Fetch radar chart data with multi-tenant filtering
    const { data: radarData, error: radarError } = await supabase
      .from('radar_charts')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('tenant_id', userProfile.tenant_id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (radarError) {
      console.error('Error fetching radar chart data:', radarError)
    }

    // Return the radar chart data (or null if none exists)
    return {
      radarChartData: radarData?.[0] || null,
      user: session.user,
      tenantId: userProfile.tenant_id
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
