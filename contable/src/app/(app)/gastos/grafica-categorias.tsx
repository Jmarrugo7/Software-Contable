"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";

interface DatoCategoria {
  gasto_compra_id: number;
  nombre: string;
  total: number;
  cantidad_facturas: number;
}

export function GraficaCategorias({ datos }: { datos: DatoCategoria[] }) {
  if (!datos || datos.length === 0) {
    return <div className="h-full w-full flex items-center justify-center text-texto-suave">No hay datos para el período seleccionado.</div>;
  }

  const formatoMoneda = new Intl.NumberFormat("es-CO", { 
    style: "currency", 
    currency: "COP",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0 
  });

  const COLORES = ['#7BD5F5', '#787FF6', '#4ADEDE', '#1CA7EC', '#1F2F98', '#F59E0B', '#10B981', '#EC4899'];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-superficie border border-borde p-3 rounded-lg shadow-md">
          <p className="font-semibold text-texto mb-1">{payload[0].name}</p>
          <p className="text-primario font-medium">
            {formatoMoneda.format(payload[0].value)}
          </p>
          <p className="text-texto-suave text-sm mt-1">
            Facturas: {payload[0].payload.cantidad_facturas}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={datos}
          cx="50%"
          cy="45%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="total"
          nameKey="nombre"
          animationDuration={1000}
        >
          {datos.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORES[index % COLORES.length]} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          layout="horizontal" 
          verticalAlign="bottom" 
          align="center"
          wrapperStyle={{ paddingTop: "20px", fontSize: "12px", color: "#6b7280" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
