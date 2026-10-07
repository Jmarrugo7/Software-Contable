"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { obtenerDatosExportacion } from "./acciones-exportar";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

interface BotonExportarProps {
  filtrosActuales: {
    desde?: string | null;
    hasta?: string | null;
    categoria?: number | null;
    fuente?: number | null;
    metodo?: number | null;
  };
}

export function BotonExportar({ filtrosActuales }: BotonExportarProps) {
  const [exportando, setExportando] = useState(false);

  const handleExport = async () => {
    try {
      setExportando(true);
      const { facturas, resumen } = await obtenerDatosExportacion(filtrosActuales);

      const workbook = new ExcelJS.Workbook();
      
      // ==========================================
      // Hoja 1: Facturas
      // ==========================================
      const sheetFacturas = workbook.addWorksheet("Facturas");
      
      // Definir columnas y estilos por defecto
      sheetFacturas.columns = [
        { header: "Fecha", key: "fecha", width: 12 },
        { header: "Descripción Producto o Servicio", key: "desc", width: 35 },
        { header: "TIPO DE GASTO", key: "tipo", width: 20 },
        { header: "Proveedor", key: "proveedor", width: 30 },
        { header: "NRO FACTURA", key: "nro_factura", width: 15 },
        { header: "Cant", key: "cant", width: 8 },
        { header: "Precio Unitario", key: "precio_unitario", width: 15 },
        { header: "Precio Total", key: "subtotal", width: 15 },
        { header: "IVA (19%)", key: "iva", width: 15 },
        { header: "Retefuente", key: "retefuente", width: 15 },
        { header: "Reteica (8,56)", key: "reteica", width: 15 },
        { header: "Reteiva (15%)", key: "reteiva", width: 15 },
        { header: "TOTAL", key: "total", width: 15 },
        { header: "Observaciones", key: "obs", width: 20 },
        { header: "Fuente de Recursos", key: "fuente", width: 20 },
        { header: "METODO DE PAGO", key: "metodo", width: 20 },
        { header: "NRO COMPROBANTE", key: "nro_comprobante", width: 20 }
      ];

      // Formato moneda: rojo para negativos
      const moneyFormat = '"$" #,##0.00;[Red]-"$" #,##0.00';

      // Calcular totales
      let sumSubtotal = 0;
      let sumIva = 0;
      let sumRetefuente = 0;
      let sumReteica = 0;
      let sumReteiva = 0;
      let sumTotal = 0;

      // Agregar datos
      facturas.forEach((f: any) => {
        sumSubtotal += Number(f.subtotal);
        sumIva += Number(f.iva);
        sumRetefuente += Number(f.retefuente);
        sumReteica += Number(f.reteica);
        sumReteiva += Number(f.reteiva);
        sumTotal += Number(f.total);

        sheetFacturas.addRow({
          fecha: new Date(f.fecha_registro),
          desc: f.observaciones,
          tipo: f.gastos_compras?.nombre || "",
          proveedor: f.proveedor,
          nro_factura: f.numero_factura || "",
          cant: f.cantidad,
          precio_unitario: Number(f.precio_unitario),
          subtotal: Number(f.subtotal),
          iva: Number(f.iva),
          retefuente: Number(f.retefuente),
          reteica: Number(f.reteica),
          reteiva: Number(f.reteiva),
          total: Number(f.total),
          obs: "",
          fuente: f.fuentes_recursos?.nombre || "",
          metodo: f.metodos_pago?.nombre || "",
          nro_comprobante: f.numero_comprobante || "N/A"
        });
      });

      // Fila de totales
      const totalRowFacturas = sheetFacturas.addRow({
        fecha: "Totales",
        desc: "",
        tipo: "",
        proveedor: "",
        nro_factura: "",
        cant: null,
        precio_unitario: null,
        subtotal: sumSubtotal,
        iva: sumIva,
        retefuente: sumRetefuente,
        reteica: sumReteica,
        reteiva: sumReteiva,
        total: sumTotal,
        obs: "",
        fuente: "",
        metodo: "",
        nro_comprobante: ""
      });

      // Estilo de encabezados (Hoja 1)
      const headerRowFacturas = sheetFacturas.getRow(1);
      headerRowFacturas.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF92D050" } // Verde claro
        };
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });

      // Aplicar formatos a columnas
      sheetFacturas.getColumn("fecha").numFmt = "dd/mm/yyyy";
      sheetFacturas.getColumn("precio_unitario").numFmt = moneyFormat;
      sheetFacturas.getColumn("subtotal").numFmt = moneyFormat;
      sheetFacturas.getColumn("iva").numFmt = moneyFormat;
      sheetFacturas.getColumn("retefuente").numFmt = moneyFormat;
      sheetFacturas.getColumn("reteica").numFmt = moneyFormat;
      sheetFacturas.getColumn("reteiva").numFmt = moneyFormat;
      sheetFacturas.getColumn("total").numFmt = moneyFormat;
      sheetFacturas.getColumn("cant").alignment = { horizontal: "center" };

      // Filas alternadas y estilos
      sheetFacturas.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber < totalRowFacturas.number) {
          const esNotaCredito = row.getCell("tipo").value?.toString().toUpperCase() === "NOTA CREDITO";

          row.eachCell({ includeEmpty: true }, (cell) => {
            if (esNotaCredito) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFFFE4E6" } // Rojo pastel (Tailwind rose-100)
              };
              cell.font = { color: { argb: "FFBE123C" } }; // Texto rojo oscuro (Tailwind rose-700)
            } else if (rowNumber % 2 === 0) {
              cell.fill = {
                type: "pattern",
                pattern: "solid",
                fgColor: { argb: "FFE2EFDA" } // Verde super claro
              };
            }
            // Bordes suaves
            cell.border = {
              top: { style: "hair" },
              left: { style: "hair" },
              bottom: { style: "hair" },
              right: { style: "hair" }
            };
          });
        }
      });

      // Estilo para la fila de totales (última fila de facturas)
      totalRowFacturas.eachCell({ includeEmpty: true }, (cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FFD8F3E5" } // Verde suave igual al de la app (Tailwind emerald-100)
        };
        cell.font = { bold: true, color: { argb: "FF065F46" } }; // Texto verde oscuro (Tailwind emerald-800)
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });


      // ==========================================
      // Hoja 2: Control de Gastos
      // ==========================================
      const sheetControl = workbook.addWorksheet("Control de Gastos");
      
      sheetControl.columns = [
        { header: "TIPO DE GASTO", key: "tipo", width: 35 },
        { header: "SUM de TOTAL", key: "sum_total", width: 20 },
        { header: "PORCENTAJE", key: "porcentaje", width: 15 }
      ];

      const sumaTotal = resumen.reduce((acc: number, item: any) => acc + Number(item.total), 0);
      
      resumen.forEach((item: any) => {
        const val = Number(item.total);
        sheetControl.addRow({
          tipo: item.nombre,
          sum_total: val,
          porcentaje: sumaTotal > 0 ? (val / sumaTotal) : 0
        });
      });

      // Fila de totales
      const totalRow = sheetControl.addRow({
        tipo: "SUMA TOTAL",
        sum_total: sumaTotal,
        porcentaje: sumaTotal > 0 ? 1 : 0
      });

      // Estilo de encabezados (Hoja 2)
      const headerRowControl = sheetControl.getRow(1);
      headerRowControl.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9BC2E6" } // Azul claro
        };
        cell.font = { bold: true };
        cell.alignment = { vertical: "middle", horizontal: "center" };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });

      // Formatos de columnas
      sheetControl.getColumn("sum_total").numFmt = moneyFormat;
      sheetControl.getColumn("porcentaje").numFmt = "0.00%";

      // Estilo de la fila de SUMA TOTAL
      totalRow.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "FF9BC2E6" } // Azul claro
        };
        cell.font = { bold: true };
        cell.border = {
          top: { style: "thin" },
          left: { style: "thin" },
          bottom: { style: "thin" },
          right: { style: "thin" }
        };
      });

      // Añadir bordes a todas las celdas de datos en Hoja 2
      sheetControl.eachRow((row, rowNumber) => {
        if (rowNumber > 1 && rowNumber < totalRow.number) {
          row.eachCell((cell) => {
            cell.border = {
              top: { style: "hair" },
              left: { style: "hair" },
              bottom: { style: "hair" },
              right: { style: "hair" }
            };
          });
        }
      });

      // ==========================================
      // Exportar
      // ==========================================
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, "Control_Gastos.xlsx");
      
    } catch (error) {
      console.error("Error al exportar:", error);
      alert("Hubo un error al exportar la información.");
    } finally {
      setExportando(false);
    }
  };

  return (
    <Button 
      variante="secundario" 
      onClick={handleExport} 
      disabled={exportando}
      className="gap-2"
    >
      <Download className="size-4" />
      {exportando ? "Exportando..." : "Exportar a Excel"}
    </Button>
  );
}
