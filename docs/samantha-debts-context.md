# Contexto para Samanta: deudas y abonos

Este contexto permite que Samanta opere el modulo de deudas de RutaControl con
instrucciones en lenguaje natural, sin saltarse permisos ni escribir directo en
Supabase.

## Alcance permitido

- Crear deudas generales de la operacion.
- Registrar abonos parciales sobre deudas existentes.
- Operar solo como usuario `admin`.
- Usar la UI y los Server Actions existentes.

No debe crear deuda ni abono por SQL directo, API improvisada o cliente anonimo.
Las reglas de saldo, estado y permisos viven en servidor, validadores y RLS.

## Ruta principal

- Web completa: `/dashboard/debts`
- Movil interno: `/mobile/register/debts`

Ambas rutas aceptan el parametro `samantha=1` para prellenar campos cuando
Samanta viene desde una instruccion del usuario.

## Crear una deuda

Ejemplo de usuario:

> Samanta, crea una deuda de cauchos por 100 dolares.

Interpretacion:

- `creditor`: `cauchos`
- `amountUsd`: `100`

URL sugerida:

```text
/dashboard/debts?samantha=1&creditor=cauchos&amountUsd=100
```

Flujo:

1. Abrir la URL como usuario `admin`.
2. Verificar que el formulario "Crear deuda" tenga:
   - Acreedor: `cauchos`
   - Monto original USD: `100`
3. Presionar "Crear deuda".
4. Confirmar el mensaje "Deuda registrada correctamente."

Otro ejemplo:

> Entra en RutaControl y crea una deuda llamada discos por 150 dolares.

URL:

```text
/dashboard/debts?samantha=1&creditor=discos&amountUsd=150
```

## Registrar un abono

Ejemplo de usuario:

> Samanta, haz un abono a la deuda de los cauchos por 25 dolares.

Interpretacion:

- Buscar deuda abierta cuyo acreedor o descripcion contenga `cauchos`.
- `paymentAmountUsd`: `25`

URL sugerida:

```text
/dashboard/debts?samantha=1&payDebt=cauchos&paymentAmountUsd=25
```

Flujo:

1. Abrir la URL como usuario `admin`.
2. Confirmar que la tarjeta "Registrar pago parcial" corresponde a la deuda
   correcta.
3. Verificar el saldo pendiente antes de abonar.
4. Verificar que "Abono (USD)" este prellenado con `25`.
5. Presionar "Registrar pago parcial".
6. Confirmar el mensaje "Abono registrado correctamente."

Si hay mas de una deuda abierta que coincida con el texto, Samanta debe revisar
la tabla y escoger la deuda correcta con "Registrar pago". Si el usuario indico
un monto mayor al saldo, debe advertirlo y no insistir despues del rechazo del
servidor.

## Parametros aceptados para Samanta

Para crear deuda:

- `samantha=1`
- `creditor`: nombre visible de la deuda o acreedor.
- `amountUsd`: monto principal en USD, positivo.

Para abonar:

- `samantha=1`
- `pay`: UUID exacto de la deuda, si Samanta lo conoce.
- `payDebt`: texto para buscar una deuda abierta por acreedor o descripcion.
- `debtQuery`: alias de `payDebt`.
- `paymentAmountUsd`: monto del abono en USD, positivo.
- `paymentDate`: fecha opcional en formato `YYYY-MM-DD`.
- `notes`: nota opcional del pago.

## Reglas de seguridad y negocio

- Solo `admin` puede entrar a `/dashboard/debts` y registrar deudas o abonos.
- El registrador no debe operar deudas.
- La deuda nueva queda como compromiso general, sin bus ni registro diario
  asociado.
- El estado cambia en base de datos:
  - `pending` cuando no tiene abonos.
  - `partial` cuando tiene abonos pero queda saldo.
  - `paid` cuando el saldo llega a cero.
- El saldo no se calcula a mano en el frontend.

## Respuesta esperada al usuario

Cuando termine, Samanta debe responder con un resultado concreto:

- Deuda creada: nombre y monto.
- Abono registrado: deuda, monto abonado y saldo si la UI lo muestra.
- Si no pudo operar: explicar si falto login admin, deuda no encontrada,
  deuda ya pagada o monto invalido.
