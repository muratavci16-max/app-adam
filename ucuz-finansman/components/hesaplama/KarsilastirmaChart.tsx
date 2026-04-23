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
  // "Kümülatif Ödeme" = actual cash user has paid out so far (out-of-pocket).
  // - TF: peşinat + org + all taksits paid to TF = sonuc.rows[i].tfKumul
  // - Alt: peşinat + org + pre-delivery taksits (deposited to mevduat) + post-delivery loan payments
  //   Both have the same starting point. Pre-delivery they grow together (same taksit
  //   whether it goes to TF or mevduat). Post-delivery they may diverge (bank taksit ≠ TF taksit).
  //
  // Note: we do NOT use sonuc.rows[i].altKumul here — that column represents mevduat
  // BALANCE (investment value including interest earned) during the pre-delivery period,
  // which is a different quantity (market value of savings, not cash laid out).
  const start = params.pesinat + sonuc.orgBedeli
  const tfCumulative: number[] = [start, ...sonuc.rows.map(r => r.tfKumul)]

  const altCumulative: number[] = [start]
  let altSoFar = start
  for (const row of sonuc.rows) {
    if (row.ay < sonuc.teslimAy) {
      // Pre-delivery: user pays the same taksit into mevduat as TF would collect.
      altSoFar += row.tfTaksit
    } else {
      // Post-delivery: user pays bank loan installment.
      altSoFar += sonuc.krTaksit
    }
    altCumulative.push(altSoFar)
  }

  const labels = Array.from({ length: tfCumulative.length }, (_, i) => i)

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
