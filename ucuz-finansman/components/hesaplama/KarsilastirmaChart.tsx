'use client'

import { useEffect, useRef } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type TooltipItem,
} from 'chart.js'
import { Line } from 'react-chartjs-2'
import type { KarsilastirmaParams, KarsilastirmaSonuc } from '@/lib/hesaplamalar'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler)

interface Props {
  params: KarsilastirmaParams
  sonuc: KarsilastirmaSonuc
}

export default function KarsilastirmaChart({ params, sonuc }: Props) {
  const vade = sonuc.vade
  const labels = Array.from({ length: vade + 1 }, (_, i) => i)

  // TF kümülatif
  const getTaksit = (ay: number) => {
    if (params.takTuru === 'artisli' && ay > params.artisAy) return params.yeniTaksit
    return params.taksit0
  }

  const tfCumulative: number[] = [params.pesinat + sonuc.orgBedeli]
  let kalanTF = params.tutar - params.pesinat
  for (let t = 1; t <= vade; t++) {
    const tak = Math.min(getTaksit(t), kalanTF)
    kalanTF -= tak
    tfCumulative.push(tfCumulative[t - 1] + tak)
  }

  // Alt kümülatif
  const altCumulative: number[] = [params.pesinat + sonuc.orgBedeli]
  let kalanAlt = params.tutar - params.pesinat
  for (let t = 1; t <= params.teslimAy; t++) {
    const tak = Math.min(getTaksit(t), kalanAlt)
    kalanAlt -= tak
    altCumulative.push(altCumulative[t - 1] + tak)
  }
  const krTaksit = sonuc.krTaksit
  for (let t = params.teslimAy + 1; t <= vade; t++) {
    altCumulative.push(altCumulative[altCumulative.length - 1] + (krTaksit > 0 ? krTaksit : 0))
  }

  const data = {
    labels,
    datasets: [
      {
        label: 'Tasarruf Finansmanı',
        data: tfCumulative.map(v => v / 1000),
        borderColor: '#059669',
        backgroundColor: 'rgba(5,150,105,.06)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2.5,
      },
      {
        label: 'Kredi Alternatifi',
        data: altCumulative.map(v => v / 1000),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59,130,246,.06)',
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2.5,
        borderDash: [6, 4],
      },
    ],
  }

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    interaction: { mode: 'index' as const, intersect: false },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: { font: { size: 12, family: 'Poppins' }, usePointStyle: true, padding: 16 },
      },
      tooltip: {
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            `${ctx.dataset.label}: ${Math.round((ctx.parsed.y ?? 0) as number).toLocaleString('tr-TR')} bin ₺`,
        },
      },
    },
    scales: {
      x: {
        title: { display: true, text: 'Ay', font: { size: 11 } },
        ticks: { maxTicksLimit: 12, font: { size: 10 } },
        grid: { color: 'rgba(0,0,0,.04)' },
      },
      y: {
        title: { display: true, text: 'Kümülatif Ödeme (bin ₺)', font: { size: 11 } },
        ticks: {
          font: { size: 10 },
          callback: (v: number | string) => `${typeof v === 'number' ? Math.round(v).toLocaleString('tr-TR') : v}K`,
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
