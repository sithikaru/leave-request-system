import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface LineChartComponentProps {
  data: any[];
  title: string;
  xDataKey: string;
  lines: { dataKey: string; name: string; color: string }[];
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  title,
  xDataKey,
  lines,
}) => {
  return (
    <div className="w-full h-80">
      <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 5,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey={xDataKey} />
          <YAxis />
          <Tooltip />
          <Legend />
          {lines.map((line, index) => (
            <Line
              key={index}
              type="monotone"
              dataKey={line.dataKey}
              name={line.name}
              stroke={line.color}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
