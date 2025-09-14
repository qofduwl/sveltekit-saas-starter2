import type { Database } from '../DatabaseDefinitions.js';
import type { EChartsOption } from 'echarts';

type MetricRow = Database['public']['Tables']['metrics']['Row'];

export interface MetricsData {
  labels: string[];
  datasets: {
    name: string;
    data: number[];
    color: string;
  }[];
}

/**
 * Transforms metrics data into ECharts area chart configuration
 * @param metrics - Array of metric rows from the database
 * @param metricNames - Array of metric names to include in the chart
 * @returns ECharts configuration object for area chart
 */
export function createAreaChartConfig(
  metrics: MetricRow[],
  metricNames: string[] = ['Revenue', 'Users']
): EChartsOption {
  // Group metrics by metric_name
  const metricGroups = metricNames.reduce((acc, name) => {
    acc[name] = metrics.filter(m => m.metric_name === name)
      .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime());
    return acc;
  }, {} as Record<string, MetricRow[]>);

  // Get all unique dates and sort them
  const allDates = Array.from(
    new Set(metrics.map(m => m.metric_date))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Format dates for display
  const formattedDates = allDates.map(date => 
    new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  );

  // Create series data for each metric
  const series = metricNames.map((metricName, index) => {
    const metricData = metricGroups[metricName] || [];
    const data = allDates.map(date => {
      const metric = metricData.find(m => m.metric_date === date);
      return metric ? Number(metric.metric_value) : 0;
    });

    // Color palette for different metrics
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
    
    return {
      name: metricName,
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 6,
      areaStyle: {
        opacity: 0.3
      },
      lineStyle: {
        width: 3
      },
      data: data,
      itemStyle: {
        color: colors[index % colors.length]
      }
    };
  });

  return {
    title: {
      text: 'Metrics Overview',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 'bold'
      }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderColor: '#ddd',
      borderWidth: 1,
      textStyle: {
        color: '#333'
      },
      formatter: (params: any) => {
        let tooltip = `<div style="font-weight: bold; margin-bottom: 4px;">${params[0].axisValue}</div>`;
        params.forEach((param: any) => {
          tooltip += `
            <div style="display: flex; align-items: center; margin: 2px 0;">
              <span style="display: inline-block; width: 10px; height: 10px; background-color: ${param.color}; border-radius: 50%; margin-right: 8px;"></span>
              <span style="margin-right: 8px;">${param.seriesName}:</span>
              <span style="font-weight: bold;">${param.value.toLocaleString()}</span>
            </div>
          `;
        });
        return tooltip;
      }
    },
    legend: {
      data: metricNames,
      bottom: 10,
      textStyle: {
        fontSize: 12
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: formattedDates,
      boundaryGap: false,
      axisLine: {
        lineStyle: {
          color: '#e0e0e0'
        }
      },
      axisLabel: {
        color: '#666',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      axisLabel: {
        color: '#666',
        fontSize: 11,
        formatter: (value: number) => {
          if (value >= 1000000) {
            return (value / 1000000).toFixed(1) + 'M';
          } else if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
          }
          return value.toString();
        }
      },
      splitLine: {
        lineStyle: {
          color: '#f0f0f0',
          type: 'dashed'
        }
      }
    },
    series: series,
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut'
  };
}

/**
 * Transforms raw metrics data into a format suitable for chart rendering
 * @param metrics - Array of metric rows from the database
 * @returns Formatted metrics data object
 */
export function formatMetricsData(metrics: MetricRow[]): MetricsData {
  // Group metrics by metric_name
  const metricGroups = metrics.reduce((acc, metric) => {
    if (!acc[metric.metric_name]) {
      acc[metric.metric_name] = [];
    }
    acc[metric.metric_name].push(metric);
    return acc;
  }, {} as Record<string, MetricRow[]>);

  // Get all unique dates and sort them
  const allDates = Array.from(
    new Set(metrics.map(m => m.metric_date))
  ).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());

  // Format dates for display
  const labels = allDates.map(date => 
    new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric'
    })
  );

  // Color palette
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  // Create datasets for each metric
  const datasets = Object.keys(metricGroups).map((metricName, index) => {
    const metricData = metricGroups[metricName]
      .sort((a, b) => new Date(a.metric_date).getTime() - new Date(b.metric_date).getTime());
    
    const data = allDates.map(date => {
      const metric = metricData.find(m => m.metric_date === date);
      return metric ? Number(metric.metric_value) : 0;
    });

    return {
      name: metricName,
      data: data,
      color: colors[index % colors.length]
    };
  });

  return {
    labels,
    datasets
  };
}
