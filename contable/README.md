# Contable

Sistema de gestión y control de gastos mediante facturas (Next.js 16 + Supabase).
Requisitos: `docs/ERS_V2.pdf`. Reglas del proyecto: `AGENTS.md`.

## Puesta en marcha

1. Ejecuta `supabase/migrations/001_esquema_inicial.sql` en Supabase (SQL Editor → Run).
2. En Supabase → Authentication: desactiva "Allow new users to sign up" y crea tu usuario
   (Users → Add user).
3. Copia `.env.local.example` a `.env.local` y completa la URL y la anon key
   (Project Settings → API).
4. `npm install` y luego `npm run dev` → http://localhost:3000
