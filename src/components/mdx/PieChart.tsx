// Donut chart: <PieChart data={[{ name, value }]} />. Fixed palette assigned
// in order (never reshuffled), legend on the right, tooltip shows percentages.
import {
  Cell,
  Legend,
  Pie,
  PieChart as RechartsPie,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const PALETTE = ["#3871dc", "#ff8833", "#22c55e", "#a855f7", "#ef4444"];

export interface PieChartProps {
  data: { name: string; value: number }[];
}

export function PieChart({ data }: PieChartProps) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const percent = (value: number) => `${((value / total) * 100).toFixed(1)}%`;

  return (
    <div className="my-6 h-[320px]">
      <ResponsiveContainer width="100%" height={320}>
        <RechartsPie>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={70}
            outerRadius={110}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((d, i) => (
              <Cell key={d.name} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => percent(Number(value))}
            contentStyle={{
              background: "#16171d",
              border: "1px solid #2c2f38",
              borderRadius: 8,
              color: "#d6d9dc",
              fontSize: 13,
            }}
            itemStyle={{ color: "#d6d9dc" }}
          />
          <Legend
            layout="vertical"
            align="right"
            verticalAlign="middle"
            iconType="circle"
            iconSize={9}
            formatter={(name: string) => (
              <span className="text-sm text-soft dark:text-soft-dark">{name}</span>
            )}
          />
        </RechartsPie>
      </ResponsiveContainer>
    </div>
  );
}
