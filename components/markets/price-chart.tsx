"use client"

import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"

type Point = { t: string; yes: number }

export function PriceChart({ data }: { data: Point[] }) {
  return (
    <ChartContainer
      config={{ yes: { label: "YES price", color: "var(--chart-1)" } }}
      className="aspect-[16/7] w-full"
    >
      <AreaChart data={data} margin={{ left: 4, right: 4, top: 8, bottom: 0 }}>
        <defs>
          <linearGradient id="fillYes" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-yes)" stopOpacity={0.35} />
            <stop offset="100%" stopColor="var(--color-yes)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" strokeDasharray="3 3" />
        <XAxis
          dataKey="t"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          minTickGap={32}
          className="text-xs"
        />
        <YAxis
          domain={[0, 100]}
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          width={36}
          tickFormatter={(v) => `${v}`}
          className="text-xs"
        />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Area
          dataKey="yes"
          type="monotone"
          fill="url(#fillYes)"
          stroke="var(--color-yes)"
          strokeWidth={2}
          isAnimationActive={false}
        />
      </AreaChart>
    </ChartContainer>
  )
}
