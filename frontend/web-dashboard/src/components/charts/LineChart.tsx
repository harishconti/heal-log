import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: { date: string; count: number }[];
  color?: string;
  height?: number;
  /** Accessible label describing the chart */
  ariaLabel?: string;
  /** Title for the chart */
  title?: string;
}

export function LineChart({
  data,
  color = '#3b82f6',
  height = 300,
  ariaLabel,
  title = 'Line chart'
}: LineChartProps) {
  // Generate accessible description from data
  const dataDescription = data.length > 0
    ? `Data ranges from ${data[0]?.date} to ${data[data.length - 1]?.date}`
    : 'No data available';

  const chartLabel = ariaLabel || `${title}. ${dataDescription}`;

  return (
    <figure role="figure" aria-label={chartLabel}>
      {/* Visually hidden table for screen readers */}
      <table className="sr-only" aria-label={`${title} data table`}>
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">Count</th>
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => (
            <tr key={index}>
              <td>{item.date}</td>
              <td>{item.count}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Visual chart - hidden from screen readers since data is in table */}
      <div aria-hidden="true">
        <ResponsiveContainer width="100%" height={height}>
          <RechartsLineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: '#e5e7eb' }}
            />
            <YAxis tick={{ fontSize: 12 }} tickLine={false} axisLine={{ stroke: '#e5e7eb' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
              }}
            />
            <Line
              type="monotone"
              dataKey="count"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 6 }}
            />
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  );
}
