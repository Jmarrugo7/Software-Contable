"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface DatoGrafica {
  periodo: string;
  total: number;
  cantidad_facturas: number;
}

const formatoMoneda = new Intl.NumberFormat("es-CO", { 
  style: "currency", 
  currency: "COP",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0 
});

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-superficie border border-borde p-3 rounded-lg shadow-md">
        <p className="font-semibold text-texto mb-1">{label}</p>
        <p className="text-primario font-medium">
          Total: {formatoMoneda.format(payload[0].value)}
        </p>
        <p className="text-texto-suave text-sm mt-1">
          Facturas: {payload[0].payload.cantidad_facturas}
        </p>
      </div>
    );
  }
  return null;
};

export function GraficaGastos({ datos }: { datos: DatoGrafica[] }) {

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={datos}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#dde1e8" />
        <XAxis 
          dataKey="periodo" 
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          dy={10}
        />
        <YAxis 
          tickFormatter={(value) => `$${(value / 1000000).toFixed(1)}M`}
          axisLine={false}
          tickLine={false}
          tick={{ fill: "#6b7280", fontSize: 12 }}
          width={80}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(28, 167, 236, 0.05)' }} />
        <Bar 
          dataKey="total" 
          fill="#1CA7EC" 
          radius={[4, 4, 0, 0]}
          name="Gasto Total"
          animationDuration={1000}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
