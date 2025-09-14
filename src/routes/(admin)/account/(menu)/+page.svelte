<script lang="ts">
  import { getContext, onMount } from "svelte"
  import type { Writable } from "svelte/store"
  import type { PageData } from './$types'
  
  export let data: PageData
  
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("home")
  
  let radarChartContainer: HTMLElement
  let chart: any = null
  
  // ECharts dynamic import and radar chart setup
  onMount(async () => {
    try {
      // Dynamically import ECharts
      const echarts = await import('echarts')
      
      if (radarChartContainer && data.radarChartData) {
        chart = echarts.init(radarChartContainer)
        
        // Create ECharts radar configuration from Supabase data
        const radarConfig = createRadarConfig(data.radarChartData)
        
        chart.setOption(radarConfig)
        
        // Handle window resize
        const handleResize = () => chart?.resize()
        window.addEventListener('resize', handleResize)
        
        return () => {
          window.removeEventListener('resize', handleResize)
          chart?.dispose()
        }
      }
    } catch (error) {
      console.error('Error loading ECharts or rendering radar chart:', error)
    }
  })
  
  // Transform Supabase data into ECharts radar configuration
  function createRadarConfig(radarData: any) {
    // Ensure data is properly structured and safe
    const chartData = radarData.chart_data || {}
    const dimensions = chartData.dimensions || []
    const values = chartData.values || []
    const title = chartData.title || 'User Performance Radar'
    const maxValue = chartData.max_value || 100
    
    return {
      title: {
        text: title,
        left: 'center',
        textStyle: {
          color: '#333',
          fontSize: 18,
          fontWeight: 'bold'
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: function(params: any) {
          const data = params.data
          if (data && data.value && dimensions.length > 0) {
            let tooltip = `<strong>${data.name || 'Performance'}</strong><br/>`
            data.value.forEach((val: number, idx: number) => {
              if (dimensions[idx]) {
                tooltip += `${dimensions[idx].name}: ${val}<br/>`
              }
            })
            return tooltip
          }
          return 'No data available'
        }
      },
      radar: {
        indicator: dimensions.map((dim: any) => ({
          name: dim.name || 'Unknown',
          max: dim.max || maxValue,
          min: dim.min || 0
        })),
        radius: '70%',
        center: ['50%', '55%'],
        splitNumber: 5,
        axisName: {
          color: '#666',
          fontSize: 12
        },
        splitLine: {
          lineStyle: {
            color: '#ddd',
            width: 1
          }
        },
        splitArea: {
          areaStyle: {
            color: ['rgba(114, 172, 209, 0.1)', 'rgba(114, 172, 209, 0.05)']
          }
        }
      },
      series: [{
        name: 'Performance Metrics',
        type: 'radar',
        data: [{
          value: values,
          name: 'Current Performance',
          areaStyle: {
            color: 'rgba(59, 130, 246, 0.3)'
          },
          lineStyle: {
            color: '#3b82f6',
            width: 2
          },
          itemStyle: {
            color: '#3b82f6',
            borderColor: '#fff',
            borderWidth: 2
          }
        }]
      }],
      responsive: true
    }
  }
</script>

<!-- Dashboard Header -->
<section class="mb-8">
  <h1 class="text-3xl font-bold mb-2">Dashboard</h1>
  <p class="text-gray-600">Welcome back, {data.user?.email || 'User'}!</p>
</section>

<!-- Radar Chart Section -->
<div class="my-8">
  <h2 class="text-2xl font-bold mb-4">Performance Overview</h2>
  
  {#if data.radarChartData}
    <div class="bg-white rounded-lg shadow-md p-6">
      <div 
        bind:this={radarChartContainer} 
        class="w-full h-96"
        style="min-height: 400px;"
      ></div>
      
      <!-- Chart metadata -->
      <div class="mt-4 text-sm text-gray-600">
        Last updated: {new Date(data.radarChartData.created_at).toLocaleDateString()}
        {#if data.radarChartData.description}
          <p class="mt-2">{data.radarChartData.description}</p>
        {/if}
      </div>
    </div>
  {:else}
    <div class="bg-gray-50 rounded-lg p-8 text-center">
      <div class="text-gray-500 mb-4">
        <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewbox="0 0 24 24">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"></path>
        </svg>
      </div>
      <h3 class="text-lg font-semibold text-gray-700 mb-2">No Performance Data Available</h3>
      <p class="text-gray-600">Your radar chart will appear here once performance data is available.</p>
    </div>
  {/if}
</div>

<!-- Existing Stats Sections -->
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
  <!-- Users Stats -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-xl font-bold mb-4">Users</h3>
    <div class="stats stats-vertical w-full">
      <div class="stat">
        <div class="stat-title">Downloads</div>
        <div class="stat-value text-primary">31K</div>
        <div class="stat-desc">↗︎ 546 (2%)</div>
      </div>
      <div class="stat">
        <div class="stat-title">Users</div>
        <div class="stat-value text-secondary">4,200</div>
        <div class="stat-desc">↗︎ 40 (2%)</div>
      </div>
    </div>
  </div>
  
  <!-- Accounts Stats -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-xl font-bold mb-4">Accounts</h3>
    <div class="stats stats-vertical w-full">
      <div class="stat">
        <div class="stat-title">New Registers</div>
        <div class="stat-value text-info">1,200</div>
        <div class="stat-desc">↘︎ 90 (14%)</div>
      </div>
      <div class="stat">
        <div class="stat-title">Churned Accounts</div>
        <div class="stat-value text-warning">42</div>
        <div class="stat-desc">↘︎ 6 (12%)</div>
      </div>
    </div>
  </div>
  
  <!-- Revenue Stats -->
  <div class="bg-white rounded-lg shadow-md p-6">
    <h3 class="text-xl font-bold mb-4">Revenue</h3>
    <div class="stats stats-vertical w-full">
      <div class="stat">
        <div class="stat-title text-success">Revenue</div>
        <div class="stat-value text-success">$4,200</div>
        <div class="stat-desc">↗︎ $180 (4%)</div>
      </div>
      <div class="stat">
        <div class="stat-title">New Subscribers</div>
        <div class="stat-value text-primary">16</div>
        <div class="stat-desc">↘︎ 1 (7%)</div>
      </div>
    </div>
  </div>
</div>

<!-- Quick Actions -->
<div class="bg-white rounded-lg shadow-md p-6">
  <h3 class="text-xl font-bold mb-4">Quick Actions</h3>
  <div class="flex flex-wrap gap-4">
    <a class="btn btn-primary" href="/account/billing">Manage Billing</a>
    <a class="btn btn-secondary" href="/account/settings">Account Settings</a>
    <button class="btn btn-outline" disabled>Generate Report</button>
  </div>
</div>

<!-- Debug Info (only visible in development) -->
{#if data.radarChartData}
  <details class="mt-8 p-4 bg-gray-100 rounded-lg">
    <summary class="cursor-pointer font-semibold">Debug: Raw Radar Chart Data</summary>
    <pre class="mt-2 text-xs overflow-x-auto">{JSON.stringify(data.radarChartData, null, 2)}</pre>
  </details>
{/if}
