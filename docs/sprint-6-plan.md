# Sprint 6 Plan

Estado: implementado en `sprint-6`, pendiente de cierre formal.

## Alcance aprobado

1. motor de anomalias por ruta
2. scoring de confianza del registrador
3. reportes de rentabilidad por bus y por ruta
4. cierres semanales y mensuales consolidados
5. exportacion descargable de reportes

## Decisiones operativas

- No se creo migracion nueva: el esquema existente de `daily_records`, `buses`, `routes`, `profiles` y `audit_log` ya permite construir la capa de inteligencia y reportes en servidor sin tocar la base transaccional.
- Regla de anomalias: marcar solo cuando haya al menos 5 cierres historicos por ruta y el ingreso del cierre actual supere `1.5` desviaciones estandar respecto al promedio historico de esa ruta.
- Formula del score de confianza: base 100 menos penalizacion por correcciones, diferencias acumuladas y horarios atipicos. Se prioriza una formula legible y trazable, no un score opaco.
- Los cierres semanales y mensuales son una capa de consolidacion/reporting; no modifican el flujo diario ya aprobado.
- La exportacion se resolvio como CSV protegido para admin.

## Resultado esperado

- `/dashboard/intelligence` visible solo para admin
- `/dashboard/reports` visible solo para admin
- registrador redirigido a `/dashboard/daily/new`
- anomalias, score y reportes calculados sobre datos reales
- exportacion CSV descargable operativa
- regresion de Sprint 1, 2, 3, 4 y 5 intacta
