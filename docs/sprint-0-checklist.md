# Sprint 0 Checklist

## Fundacion operativa

- [x] Estructura base del proyecto creada en `N:\projects\busescontrol`
- [x] `package.json`, `tsconfig.json`, `next.config.mjs` y `postcss.config.mjs` definidos
- [x] `.gitignore`, `.env.example`, `README.md` y `AGENTS.md` creados
- [x] ADR inicial de arquitectura creada
- [x] Base compatible con Next.js App Router, Tailwind CSS y shadcn/ui preparada

## Supabase

- [x] Migracion `supabase/migrations/0001_core.sql` creada
- [x] Tablas `profiles`, `routes`, `buses`, `daily_records`, `expenses` y `audit_log` definidas
- [x] Triggers de consistencia y auditoria definidos
- [x] RLS habilitado en tablas expuestas
- [x] Policies minimas por rol definidas
- [x] `supabase/seed.sql` creado
- [x] Tipos TypeScript base alineados al esquema preparados

## Auth y aplicacion

- [x] Clientes Supabase para browser y server preparados
- [x] Proxy de proteccion para `/dashboard` preparado
- [x] Login base por email/password preparado
- [x] Layout protegido del dashboard preparado
- [x] Paginas base del Sprint 1 creadas
- [x] Rutas corregidas a `/dashboard/...` reales en App Router
- [x] Validadores compartidos preparados
- [x] Auth endurecida para `profiles.active` y perfiles faltantes

## Deploy y operacion

- [x] Variables de entorno documentadas
- [x] Proyecto preparado para Vercel a nivel de codigo
- [x] `git` instalado localmente
- [x] `node` y `npm` instalados localmente
- [x] `git init` ejecutado en `main`
- [ ] repo remoto GitHub conectado
- [x] dependencias instaladas
- [x] `npm run typecheck`
- [x] `npm run lint`
- [x] `npm run build`
- [ ] deploy inicial en Vercel

## Bloqueos externos reales

- [ ] Crear o proporcionar el repo remoto `multiversos/rutacontrol`
- [ ] Crear proyecto Supabase y entregar credenciales reales
- [ ] Conectar o crear proyecto en Vercel
