# Frontend Polish

## Objetivo
Mejorar la apariencia, legibilidad y consistencia de RutaControl sin cambiar reglas de negocio ni flujos backend.

## Problemas detectados
- Navegacion admin plana, sin agrupacion clara por dominio.
- Dashboard con buenas metricas pero sin una jerarquia visual fuerte.
- Formularios principales correctos, aunque todavia con apariencia de sistema interno.
- Tablas funcionales pero densas y poco escaneables.
- Login con copy desactualizado y una primera impresion mas cercana a MVP que a producto operable.
- Flujo del registrador cargado de informacion util, pero no siempre ordenada para el cierre rapido del dia.

## Sistema visual aplicado
- Paleta mas consistente con azules operativos, fondos claros y acentos de estado.
- Superficies unificadas con bordes suaves, mas profundidad y gradientes ligeros.
- Inputs, selects, textareas, badges y botones estandarizados.
- Encabezados de pagina compartidos con eyebrow, descripcion y badges de contexto.
- Navegacion admin agrupada por:
  - Operacion
  - Monitoreo
  - Finanzas
  - Analisis

## Pantallas cubiertas
- `/login`
- `/dashboard`
- `/dashboard/daily/new`
- `/dashboard/daily`
- `/dashboard/routes`
- `/dashboard/buses`
- `/dashboard/alerts`
- `/dashboard/debts`
- `/dashboard/repairs`
- `/dashboard/intelligence`
- `/dashboard/reports`
- `/dashboard/audit`

## Criterios de esta fase
- Mantener rutas y permisos existentes.
- No alterar calculos ni validaciones del negocio.
- Mejorar claridad en desktop y pantallas medianas.
- Priorizar la velocidad de uso del registrador y la lectura operativa del admin.

## Siguientes prioridades visuales si la fase continua
- Afinar tablas en mobile y tablet con variantes colapsables.
- Revisar microcopy y estados vacios secundarios.
- Pulir mas la vista de historial diario para rangos largos.
- Compactar aun mas el flujo del registrador para pantallas medianas.
