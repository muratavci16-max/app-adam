'use client'

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { OptimizeOption } from '@/lib/tf-optimize'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface Props {
  allEvaluated: OptimizeOption[]
  topVades: number[]
}

/**
 * Full-sweep diagnostic. X = vade (1..maxMonths), Y = Delta (C_TF − C_alt, bin ₺).
 * Infeasible points are gapped (NaN in dataset). Top-3 vades highlighted as
 * larger points so the user sees where the optimizer picked.
 *
 * Dynamic-imported by OptimizerClient (SSR-disabled) same as KarsilastirmaChart.
 */
export default function DeltaSweepChart({ allEvaluated, topVades }: Props) {
  const labels = allEvaluated.map(o => o.vade)
  const deltaBin = allEvaluated.map(o =>
    o.feasible ? o.delta / 1000 : Number.NaN
  )
  const topVadeSet = new Set(topVades)

  const pointRadius = allEvaluated.map(o =>
    topVadeSet.has(o.vade) ? 5 : 0
  )
  const pointBackgroundColor = allEvaluated.map(o =>
    topVadeSet.has(o.vade) ? '#059669' : 'transparent'
  )

  const data = {
    labels,
    datasets: [
      {
        label: 'TF − Banka farkı',
        data: deltaBin,
        borderColor: '#7c3aed',
        backgroundColor: 'rgba(124,58,237,.06)',
        fill: true,
        tension: 0.2,
        pointRadius,
        pointBackgroundColor,
        pointBorderColor: '#059669',
        pointBorderWidth: 2,
        borderWidth: 2,
        spanGaps: false, // gap visually marks infeasible ranges
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          title: (items: TooltipItem<'line'>[]) =>
            items[0] ? `${items[0].label} ay vade` : '',
          label: (ctx: TooltipItem<'line'>) => {
            const opt = allEvaluated[ctx.dataIndex]
            if (!opt.feasible) {
              return `Uygulanamaz: ${opt.reason ?? ''}`
            }
            const delta = opt.delta
            const sign = delta < 0 ? 'TF daha ucuz' : 'Banka daha ucuz'
            return `${sign}: ${Math.abs(Math.round(delta / 1000)).toLocaleString('tr-TR')} bin ₺ · teslim ${opt.teslimAy}. ay`
          },
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Vade (ay)', font: { size: 11 } },
        ticks: { maxTicksLimit: 12, font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,.04)' },
      },
      y: {
        title: {
          display: true,
          text: 'Δ = TF − Banka (bin ₺, negatif = TF daha ucuz)',
          font: { size: 11 },
        },
        ticks: {
          font: { size: 10 },
          callback: (v: number | string) =>
            typeof v === 'number' ? Math.round(v).toLocaleString('tr-TR') : v,
        },
        grid: { color: 'rgba(0,0,0,.04)' },
      },
    },
  }

  return (
    <div className="w-full">
      <Line data={data} options={options} />
    </div>
  )
}
