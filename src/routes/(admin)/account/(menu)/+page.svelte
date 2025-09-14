<script lang="ts">
  import { getContext, onMount } from "svelte"
  import type { Writable } from "svelte/store"
  import type { PageData } from './$types'
  
  export let data: PageData
  
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("home")
  
  let radarChartContainer: HTMLElement
  let chart: any = null
  
  // Create radar config from Supabase data
  function createRadarConfig(radarData: any) {
    if (!radarData) return null
    
    return {
      title: {
        text: radarData.title || 'Performance Radar'
      },
      legend: {
        data: radarData.legend || ['Current Performance']
      },
      radar: {
        indicator: radarData.indicators || [
          { name: 'Metric 1', max: 100 },
          { name: 'Metric 2', max: 100 },
          { name: 'Metric 3', max: 100 },
          { name: 'Metric 4', max: 100 },
          { name: 'Metric 5', max: 100 }
        ]
      },
      series: [{
        name: radarData.seriesName || 'Performance',
        type: 'radar',
        data: radarData.series || [{
          value: [80, 90, 85, 70, 95],
          name: 'Current'
        }]
      }]
    }
  }
  
  // ECharts dynamic import and radar chart setup
  onMount(async () => {
    try {
      // Dynamically import ECharts
      const echarts = await import('echarts')
      
      if (radarChartContainer && data.radarChartData) {
        chart = echarts.init(radarChartContainer)
        
        // Create ECharts radar configuration from Supabase data
        const radarConfig = createRadarConfig(data.radarChartData)
        
        if (radarConfig) {
          chart.setOption(radarConfig)
        }
        
        // Handle window resize
        const handleResize = () => chart?.resize()
        window.addEventListener('resize', handleResize)
        
        return () => {
          window.removeEventListener('resize', handleResize)
          chart?.dispose()
        }
      }
    } catch (error) {
      console.error('Error initializing radar chart:', error)
    }
  })
</script>

<!-- Radar Chart Section -->
{#if data.radarChartData}
  <div class="radar-chart-section">
    <h2>Performance Overview</h2>
    <div bind:this={radarChartContainer} class="w-full h-96" style="min-height:400px;"></div>
  </div>
{/if}

<style>
  .radar-chart-section {
    margin: 2rem 0;
    padding: 1rem;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
  }
  
  .radar-chart-section h2 {
    margin-bottom: 1rem;
    font-size: 1.5rem;
    font-weight: 600;
  }
</style>
