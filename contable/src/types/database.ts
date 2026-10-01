// Tipos de la base de datos, alineados con supabase/migrations/001_esquema_inicial.sql.
// Para regenerarlos desde tu proyecto real:  npm run types
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      gastos_compras: {
        Row: { id: number; nombre: string; permite_negativo: boolean };
        Insert: { id?: never; nombre: string; permite_negativo?: boolean };
        Update: { id?: never; nombre?: string; permite_negativo?: boolean };
        Relationships: [];
      };
      fuentes_recursos: {
        Row: { id: number; nombre: string; es_predefinida: boolean; created_at: string };
        Insert: { id?: never; nombre: string; es_predefinida?: boolean; created_at?: string };
        Update: { id?: never; nombre?: string; es_predefinida?: boolean; created_at?: string };
        Relationships: [];
      };
      metodos_pago: {
        Row: { id: number; nombre: string; requiere_comprobante: boolean };
        Insert: { id?: never; nombre: string; requiere_comprobante?: boolean };
        Update: { id?: never; nombre?: string; requiere_comprobante?: boolean };
        Relationships: [];
      };
      facturas: {
        Row: {
          id: string;
          fecha_registro: string;
          gasto_compra_id: number;
          proveedor: string;
          numero_factura: string | null;
          cantidad: number;
          precio_unitario: number;
          subtotal: number;
          iva: number;
          retefuente: number;
          reteica: number;
          reteiva: number;
          total: number;
          observaciones: string;
          fuente_recursos_id: number;
          metodo_pago_id: number;
          numero_comprobante: string | null;
          estado: string;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          fecha_registro?: string; // el trigger la fija siempre a now()
          gasto_compra_id: number;
          proveedor: string;
          numero_factura?: string | null;
          cantidad?: number;
          precio_unitario: number;
          subtotal?: never; // calculado por la base de datos
          iva?: number;
          retefuente?: number;
          reteica?: number;
          reteiva?: number;
          total?: never; // calculado por la base de datos
          observaciones: string;
          fuente_recursos_id: number;
          metodo_pago_id: number;
          numero_comprobante?: string | null;
          estado?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          fecha_registro?: string;
          gasto_compra_id?: number;
          proveedor?: string;
          numero_factura?: string | null;
          cantidad?: number;
          precio_unitario?: number;
          subtotal?: never;
          iva?: number;
          retefuente?: number;
          reteica?: number;
          reteiva?: number;
          total?: never;
          observaciones?: string;
          fuente_recursos_id?: number;
          metodo_pago_id?: number;
          numero_comprobante?: string | null;
          estado?: string;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "facturas_gasto_compra_id_fkey";
            columns: ["gasto_compra_id"];
            isOneToOne: false;
            referencedRelation: "gastos_compras";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facturas_fuente_recursos_id_fkey";
            columns: ["fuente_recursos_id"];
            isOneToOne: false;
            referencedRelation: "fuentes_recursos";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "facturas_metodo_pago_id_fkey";
            columns: ["metodo_pago_id"];
            isOneToOne: false;
            referencedRelation: "metodos_pago";
            referencedColumns: ["id"];
          },
        ];
      };
      anulaciones: {
        Row: {
          id: string;
          factura_id: string;
          fecha_anulacion: string;
          motivo: string | null;
          reactivada_en: string | null;
        };
        Insert: {
          id?: string;
          factura_id: string;
          fecha_anulacion?: string;
          motivo?: string | null;
          reactivada_en?: string | null;
        };
        Update: {
          id?: string;
          factura_id?: string;
          fecha_anulacion?: string;
          motivo?: string | null;
          reactivada_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "anulaciones_factura_id_fkey";
            columns: ["factura_id"];
            isOneToOne: false;
            referencedRelation: "facturas";
            referencedColumns: ["id"];
          },
        ];
      };
      archivos_adjuntos: {
        Row: {
          id: string;
          factura_id: string;
          nombre: string;
          tipo_mime: string;
          tamano_bytes: number;
          storage_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          factura_id: string;
          nombre: string;
          tipo_mime: string;
          tamano_bytes: number;
          storage_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          factura_id?: string;
          nombre?: string;
          tipo_mime?: string;
          tamano_bytes?: number;
          storage_path?: string;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "archivos_adjuntos_factura_id_fkey";
            columns: ["factura_id"];
            isOneToOne: false;
            referencedRelation: "facturas";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      anular_factura: {
        Args: { p_factura_id: string; p_motivo?: string };
        Returns: undefined;
      };
      reactivar_factura: {
        Args: { p_factura_id: string };
        Returns: undefined;
      };
      resumen_gastos: {
        Args: { p_desde?: string; p_hasta?: string; p_gasto_compra_id?: number };
        Returns: { total: number; cantidad_facturas: number }[];
      };
      gastos_por_periodo: {
        Args: {
          p_agrupacion: string; // 'day' | 'week' | 'month' | 'year'
          p_desde?: string;
          p_hasta?: string;
          p_gasto_compra_id?: number;
        };
        Returns: { periodo: string; total: number; cantidad_facturas: number }[];
      };
      gastos_por_categoria: {
        Args: { p_desde?: string; p_hasta?: string };
        Returns: {
          gasto_compra_id: number;
          nombre: string;
          total: number;
          cantidad_facturas: number;
        }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
