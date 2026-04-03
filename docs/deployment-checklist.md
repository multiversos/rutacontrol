# Deployment Checklist

Checklist exacto para pasar de `Sprint 1 listo para conexion externa` a `Sprint 1 conectado`.

## GitHub remoto

Estado actual:

- repo local listo en `main`
- `origin` configurado a `https://github.com/multiversos/rutacontrol.git`
- push pendiente porque el repo remoto no existe o no esta accesible

Checklist:

- [ ] Crear el repo `multiversos/rutacontrol` en GitHub como repositorio vacio.
- [ ] Verificar que `origin` siga apuntando a `https://github.com/multiversos/rutacontrol.git`.
- [ ] Confirmar acceso con `git ls-remote origin`.
- [ ] Subir `main` con `git push -u origin main`.
- [ ] Confirmar que la rama `main` quede visible en GitHub.

Comandos exactos:

```bash
git remote -v
git ls-remote origin
git push -u origin main
```

## Supabase

Estado actual:

- codigo preparado para Supabase SSR
- migracion y seed listos
- sin proyecto real enlazado

Checklist:

- [ ] Crear el proyecto Supabase.
- [ ] Guardar `PROJECT_REF`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y, solo si hiciera falta mas adelante, `SUPABASE_SERVICE_ROLE_KEY`.
- [ ] Copiar `.env.example` a `.env.local`.
- [ ] Completar `.env.local` con los valores reales.
- [ ] Autenticarse con `npx supabase login` o definir `SUPABASE_ACCESS_TOKEN`.
- [ ] Enlazar el proyecto con `npx supabase link --project-ref <PROJECT_REF>`.
- [ ] Aplicar el esquema con `npx supabase db push`.
- [ ] Ejecutar [supabase/seed.sql](N:/projects/busescontrol/supabase/seed.sql) en el SQL Editor del proyecto.
- [ ] Regenerar tipos con `npx supabase gen types typescript --project-id "<PROJECT_REF>" --schema public > lib/supabase/database.types.ts`.

Variables que deben quedar resueltas:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` solo si se decide usar la nueva clave publica
- `SUPABASE_SERVICE_ROLE_KEY` opcional para procesos privilegiados de servidor

## Vercel variables restantes

Estado actual:

- proyecto Vercel creado y enlazado
- produccion desplegada en [https://rutacontrol.vercel.app](https://rutacontrol.vercel.app)
- variables ya cargadas en produccion:
  - `NEXT_PUBLIC_APP_NAME`
  - `BUSINESS_TIMEZONE`
  - `NEXT_PUBLIC_SITE_URL`

Checklist:

- [ ] Agregar `NEXT_PUBLIC_SUPABASE_URL` en `Production`.
- [ ] Agregar `NEXT_PUBLIC_SUPABASE_ANON_KEY` o `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en `Production`.
- [ ] Agregar las mismas variables publicas en `Preview` si se quiere probar login en previews.
- [ ] Agregar `SUPABASE_SERVICE_ROLE_KEY` solo si se habilita un flujo de servidor que realmente la necesite.
- [ ] Redeploy de produccion despues de guardar variables.
- [ ] Redeploy de preview si se usara ese canal para QA.

Comandos verificados para produccion:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production --value "https://<project-ref>.supabase.co" --yes
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --value "<anon-key>" --yes
vercel --prod --yes
```

Nota para preview:

Vercel puede pedir resolucion de rama en modo no interactivo. Si eso ocurre, agrega las variables de `Preview` desde el dashboard del proyecto y selecciona `All Preview Branches` o la rama deseada.
