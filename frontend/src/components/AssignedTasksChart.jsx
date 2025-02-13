import { PieChart, Pie, Cell } from "recharts"

const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
].map((color) => ({
  fill: color,
  gradient: {
    start: color.replace(")", ", 0.2)"),
    end: color.replace(")", ", 0.05)"),
  },
}))

const AssignedTasksChart = ({ assignmentData }) => {
  return (
    <PieChart width={300} height={300}>
      <defs>
        {CHART_COLORS.map((color, index) => (
          <linearGradient key={index} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color.gradient.start} />
            <stop offset="100%" stopColor={color.gradient.end} />
          </linearGradient>
        ))}
      </defs>
      <Pie
        data={assignmentData}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius={60}
        outerRadius={80}
        fill="#8884d8"
        paddingAngle={2}
      >
        {assignmentData.map((entry, index) => (
          <Cell
            key={entry.id}
            fill={`url(#gradient-${index % CHART_COLORS.length})`}
            stroke={CHART_COLORS[index % CHART_COLORS.length].fill}
            className="transition-all duration-300 hover:opacity-80"
          />
        ))}
      </Pie>
    </PieChart>
  )
}

export default AssignedTasksChart

