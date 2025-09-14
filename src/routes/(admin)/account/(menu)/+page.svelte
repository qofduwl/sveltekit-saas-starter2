<script lang="ts">
  import { getContext, onMount } from "svelte"
  import type { Writable } from "svelte/store"
  import type { PageData } from './$types'
  import { createAreaChartConfig } from '$lib/metrics'
  
  export let data: PageData
  
  let adminSection: Writable<string> = getContext("adminSection")
  adminSection.set("home")
  
  let radarChartContainer: HTMLElement
  let metricsChartContainer: HTMLElement
  let radarChart: any = null
  let metricsChart: any = null
  
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
  
  // ECharts dynamic import and chart setup
  onMount(async () => {
    try {
      // Dynamically import ECharts
      const echarts = await import('echarts')
      
      // Initialize radar chart if data exists
      if (radarChartContainer && data.radarChartData) {
        radarChart = echarts.init(radarChartContainer)
        
        // Create ECharts radar configuration from Supabase data
        const radarConfig = createRadarConfig(data.radarChartData)
        
        if (radarConfig) {
          radarChart.setOption(radarConfig)
        }
      }
      
      // Initialize metrics area chart if data exists
      if (metricsChartContainer && data.metricsData && data.metricsData.length > 0) {
        metricsChart = echarts.init(metricsChartContainer)
        
        // Create ECharts area chart configuration from metrics data
        const metricsConfig = createAreaChartConfig(data.metricsData)
        
        if (metricsConfig) {
          metricsChart.setOption(metricsConfig)
        }
      }
      
      // Handle window resize for both charts
      const handleResize = () => {
        radarChart?.resize()
        metricsChart?.resize()
      }
      window.addEventListener('resize', handleResize)
      
      return () => {
        window.removeEventListener('resize', handleResize)
        radarChart?.dispose()
        metricsChart?.dispose()
      }
    } catch (error) {
      console.error('Error initializing charts:', error)
    }
  })
</script>

<!-- Dashboard Title -->
<div class="dashboard-header">
  <h1>Analytics Dashboard</h1>
  <p>Welcome back, {data.user?.email || 'User'}!</p>
</div>

<!-- Metrics Area Chart Section -->
{#if data.metricsData && data.metricsData.length > 0}
  <div class="metrics-chart-section">
    <h2>Metrics Overview</h2>
    <div bind:this={metricsChartContainer} class="chart-container"></div>
  </div>
{:else}
  <div class="no-data-section">
    <h2>Metrics Overview</h2>
    <p class="no-data-message">No metrics data available. Once you have data, your charts will appear here.</p>
  </div>
{/if}

<!-- Radar Chart Section -->
{#if data.radarChartData}
  <div class="radar-chart-section">
    <h2>Performance Overview</h2>
    <div bind:this={radarChartContainer} class="chart-container"></div>
  </div>
{:else}
  <div class="no-data-section">
    <h2>Performance Overview</h2>
    <p class="no-data-message">No performance data available. Configure your radar chart to see visualizations here.</p>
  </div>
{/if}

<style>
  .dashboard-header {
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .dashboard-header h1 {
    margin: 0 0 0.5rem 0;
    font-size: 2rem;
    font-weight: 700;
  }
  
  .dashboard-header p {
    margin: 0;
    opacity: 0.9;
    font-size: 1.1rem;
  }
  
  .metrics-chart-section,
  .radar-chart-section {
    margin: 2rem 0;
    padding: 1.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
  }
  
  .metrics-chart-section h2,
  .radar-chart-section h2 {
    margin: 0 0 1.5rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #374151;
  }
  
  .chart-container {
    width: 100%;
    height: 400px;
    min-height: 400px;
  }
  
  .no-data-section {
    margin: 2rem 0;
    padding: 2rem;
    background: #f9fafb;
    border: 2px dashed #d1d5db;
    border-radius: 12px;
    text-align: center;
  }
  
  .no-data-section h2 {
    margin: 0 0 1rem 0;
    font-size: 1.5rem;
    font-weight: 600;
    color: #6b7280;
  }
  
  .no-data-message {
    margin: 0;
    color: #9ca3af;
    font-size: 1rem;
    line-height: 1.5;
  }
  
  @media (max-width: 768px) {
    .dashboard-header {
      padding: 1rem;
    }
    
    .dashboard-header h1 {
      font-size: 1.5rem;
    }
    
    .metrics-chart-section,
    .radar-chart-section {
      padding: 1rem;
    }
    
    .chart-container {
      height: 300px;
      min-height: 300px;
    }
  }
</style>
