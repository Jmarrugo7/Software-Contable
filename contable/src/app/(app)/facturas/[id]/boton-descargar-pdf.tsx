"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FacturaData {
  id: string;
  fecha_registro: string;
  proveedor: string;
  numero_factura: string | null;
  observaciones: string | null;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  iva: number;
  retefuente: number;
  reteica: number;
  reteiva: number;
  total: number;
  numero_comprobante: string | null;
  gastos_compras: { nombre: string } | null;
  fuentes_recursos: { nombre: string } | null;
  metodos_pago: { nombre: string } | null;
}

interface BotonDescargarPdfProps {
  factura: FacturaData;
}

export function BotonDescargarPdf({ factura }: BotonDescargarPdfProps) {
  const [descargando, setDescargando] = useState(false);

  const handleDescargar = async () => {
    try {
      setDescargando(true);

      const { default: jsPDF } = await import("jspdf");

      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 18;
      const contentWidth = pageWidth - margin * 2;

      const fmt = (v: number) =>
        new Intl.NumberFormat("es-CO", {
          style: "currency",
          currency: "COP",
          minimumFractionDigits: 0,
          maximumFractionDigits: 0,
        }).format(v);

      const fechaFormateada = new Date(factura.fecha_registro).toLocaleDateString("es-CO", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // ── Colors ──
      const primario = [15, 118, 110] as const;     // teal-700
      const grisOscuro = [55, 65, 81] as const;     // gray-700
      const grisMedio = [107, 114, 128] as const;    // gray-500
      const grisClaro = [243, 244, 246] as const;    // gray-100
      const blanco = [255, 255, 255] as const;
      const rojo = [220, 38, 38] as const;

      let y = margin;

      // ═══════════════════════════════════════
      // HEADER BAR
      // ═══════════════════════════════════════
      doc.setFillColor(...primario);
      doc.rect(0, 0, pageWidth, 32, "F");

      doc.setTextColor(...blanco);
      doc.setFontSize(20);
      doc.setFont("helvetica", "bold");
      doc.text("Detalle de Factura", margin, 16);

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Registrada el ${fechaFormateada}`, margin, 24);

      y = 42;

      // ═══════════════════════════════════════
      // INFORMATION SECTION
      // ═══════════════════════════════════════
      const infoStartY = y;
      const colLeft = margin;
      const colRight = pageWidth / 2 + 4;
      const labelStyle = () => {
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grisMedio);
      };
      const valueStyle = () => {
        doc.setFontSize(11);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...grisOscuro);
      };

      // Left column
      labelStyle();
      doc.text("PROVEEDOR", colLeft, y);
      y += 5;
      valueStyle();
      doc.text(factura.proveedor || "N/A", colLeft, y);
      y += 9;

      labelStyle();
      doc.text("CATEGORÍA / TIPO DE GASTO", colLeft, y);
      y += 5;
      valueStyle();
      doc.text(factura.gastos_compras?.nombre || "N/A", colLeft, y);
      y += 9;

      labelStyle();
      doc.text("NÚMERO DE FACTURA", colLeft, y);
      y += 5;
      valueStyle();
      doc.text(factura.numero_factura || "N/A", colLeft, y);
      y += 9;

      labelStyle();
      doc.text("FUENTE DE RECURSOS", colLeft, y);
      y += 5;
      valueStyle();
      doc.text(factura.fuentes_recursos?.nombre || "N/A", colLeft, y);
      y += 9;

      labelStyle();
      doc.text("MÉTODO DE PAGO", colLeft, y);
      y += 5;
      valueStyle();
      const metodoTexto = factura.metodos_pago?.nombre
        ? `${factura.metodos_pago.nombre}${factura.numero_comprobante ? ` (#${factura.numero_comprobante})` : ""}`
        : "N/A";
      doc.text(metodoTexto, colLeft, y);

      const leftEndY = y;

      // Right column — values table
      y = infoStartY;

      // Table header
      doc.setFillColor(...primario);
      doc.rect(colRight, y - 4, contentWidth / 2 - 4, 8, "F");
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(...blanco);
      doc.text("Valores y Pagos", colRight + 4, y + 1);
      y += 8;

      const drawValueRow = (
        label: string,
        value: string,
        options?: { bold?: boolean; bg?: readonly [number, number, number]; textColor?: readonly [number, number, number]; separator?: boolean }
      ) => {
        const rowH = 8;
        if (options?.separator) {
          doc.setDrawColor(220, 220, 220);
          doc.line(colRight, y - 3, colRight + contentWidth / 2 - 4, y - 3);
        }
        if (options?.bg) {
          doc.setFillColor(...options.bg);
          doc.rect(colRight, y - 4, contentWidth / 2 - 4, rowH, "F");
        }
        doc.setFontSize(9);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grisMedio);
        doc.text(label, colRight + 4, y);

        doc.setFont("helvetica", options?.bold ? "bold" : "normal");
        doc.setTextColor(...(options?.textColor || grisOscuro));
        doc.setFontSize(options?.bold ? 11 : 9);
        doc.text(value, colRight + contentWidth / 2 - 8, y, { align: "right" });
        y += rowH;
      };

      drawValueRow("Cantidad x Precio", `${factura.cantidad} x ${fmt(factura.precio_unitario)}`);
      drawValueRow("Subtotal", fmt(factura.subtotal), { bg: grisClaro });

      if (factura.iva > 0) {
        drawValueRow("IVA (+)", fmt(factura.iva));
      }

      if (factura.retefuente > 0 || factura.reteica > 0 || factura.reteiva > 0) {
        // Retenciones header
        y += 1;
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...grisMedio);
        doc.text("Retenciones (−)", colRight + 4, y);
        y += 5;

        if (factura.retefuente > 0) {
          drawValueRow("  Retefuente", fmt(factura.retefuente));
        }
        if (factura.reteica > 0) {
          drawValueRow("  ReteICA", fmt(factura.reteica));
        }
        if (factura.reteiva > 0) {
          drawValueRow("  ReteIVA", fmt(factura.reteiva));
        }
      }

      // Total row
      y += 2;
      drawValueRow("TOTAL", fmt(factura.total), {
        bold: true,
        bg: [209, 250, 229] as const,
        textColor: primario,
        separator: true,
      });

      // Use the max of both columns to continue
      y = Math.max(leftEndY, y) + 12;

      // ═══════════════════════════════════════
      // OBSERVACIONES
      // ═══════════════════════════════════════
      if (factura.observaciones) {
        doc.setFillColor(...grisClaro);
        doc.roundedRect(margin, y - 4, contentWidth, 20, 2, 2, "F");

        labelStyle();
        doc.text("OBSERVACIONES", margin + 4, y + 1);

        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...grisOscuro);
        const obsLines = doc.splitTextToSize(factura.observaciones, contentWidth - 8);
        doc.text(obsLines, margin + 4, y + 7);

        y += 8 + obsLines.length * 5 + 4;
      }

      // ═══════════════════════════════════════
      // FOOTER LINE
      // ═══════════════════════════════════════
      y += 6;
      doc.setDrawColor(...primario);
      doc.setLineWidth(0.5);
      doc.line(margin, y, pageWidth - margin, y);
      y += 6;
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...grisMedio);
      doc.text(
        `Documento generado el ${new Date().toLocaleDateString("es-CO", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`,
        margin,
        y
      );
      doc.text("Sistema Contable", pageWidth - margin, y, { align: "right" });

      // ── Save ──
      const nombreArchivo = `Factura_${factura.numero_factura || factura.id}_${factura.proveedor.replace(/\s+/g, "_").substring(0, 20)}.pdf`;
      doc.save(nombreArchivo);
    } catch (error) {
      console.error("Error generando PDF:", error);
      alert("Hubo un error al generar el PDF.");
    } finally {
      setDescargando(false);
    }
  };

  return (
    <Button variante="secundario" onClick={handleDescargar} disabled={descargando}>
      <Download className="size-4 mr-2" />
      {descargando ? "Generando..." : "Descargar PDF"}
    </Button>
  );
}
