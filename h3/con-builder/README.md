# H3 · con-builder — Builder

**Copia de [`../base/`](../base/) con Builder y nada más.** `modelo.ts` no cambió.

## El problema en la base

```ts
new OrdenDeTrabajo(`OT-${numero}`, cliente, equipo, diagnostico, prioridad, LUNES_9AM, sumarDias(LUNES_9AM, 3))
```

Siete argumentos posicionales. Tres problemas concretos:

1. **Dos `Date` seguidos.** Invertir `fechaRecepcion` y `fechaPrometida` compila, corre y deja una orden vencida desde que nace.
   Eso le pega directo a mi atributo crítico de **fiabilidad** (H1 §5.2): el estado mostrado deja de ser el real.
2. **`null` como bandera.** `equipo = null` significa "ticket remoto" solo por convención; nada impide un `null` por olvido.
3. **Todo de una vez.** En la pantalla real (RF1) la recepción es un *stepper*: cliente → equipo → diagnóstico → confirmar.
   El constructor obliga a tener los 7 datos juntos en el mismo instante.

## Los roles del patrón en SIGOT

| Rol GoF | Clase | Archivo |
|---|---|---|
| **Builder** | `OrdenBuilder`: un paso con nombre por dato y `build()` que valida | `orden-builder.ts` |
| **Product** | `OrdenDeTrabajo` | `modelo.ts` (sin cambios) |
| **Client** | `registrarOrden()` y los pasos del stepper | `demo.ts` |
| **Director** | *no hay, a propósito* | — |

**Por qué no hay Director:** hoy existe una sola forma de armar una orden, y la dicta el formulario. Un Director
con `armarOrdenDeTaller()` y `armarTicketRemoto()` sería una capa decorativa. Si aparecen "plantillas" repetidas
(por ejemplo, mantenimiento preventivo mensual de un mismo cliente corporativo), ese es el momento de agregarlo.

## Qué cambió respecto de la base

| Archivo | Cambio |
|---|---|
| `modelo.ts` | **ninguno** |
| `orden-builder.ts` | **nuevo**: pasos con nombre (`paraCliente`, `conEquipo`, `comoTicketRemoto`, `recibidaEl`, `prometidaPara`...) y `build()` |
| `demo.ts` | `registrarOrden()` recibe un borrador y lo confirma; el `switch` de plazos desaparece porque el plazo por defecto es una regla de construcción y vive en `build()` |

## Qué garantiza `build()`

| Regla | Si no se cumple |
|---|---|
| código, cliente, diagnóstico no vacío y fecha de recepción presentes | `orden incompleta, falta: ...`, con **todo** lo que falta, no solo el primero |
| orden de taller ⇒ equipo presente | idem |
| ticket remoto ⇒ sin equipo | `un ticket remoto no lleva equipo en el taller` |
| prometida posterior a la recepción | `la fecha prometida no es posterior a la recepción (¿fechas invertidas?)` |
| sin `prometidaPara()` | aplica el plazo por defecto: taller 3 días (URGENTE 1), remoto 24 h (URGENTE 4) |

## Lo que muestra la salida

- `OT-0001` y `TK-0002` nacen con las mismas fechas prometidas que en la base.
- Las dos líneas `[NO NACE]` son órdenes que **la base habría aceptado en silencio**.
- El ciclo de vida de `OT-0001` es idéntico al de la base: el Builder cambió **cómo nace** la orden, no cómo vive.

## El costo, dicho en voz alta

- El constructor de `OrdenDeTrabajo` sigue siendo público: alguien puede saltarse el Builder. No lo cerré a propósito,
  porque cerrarlo obliga a tocar `modelo.ts` y la regla del laboratorio es no tocar la base. En el módulo final (H4)
  lo cerraría.
- Más código para crear un objeto. Vale la pena porque la orden es **el** dato del que cuelga toda la operación del taller.

## Correr

```bash
node demo.ts
```

Salida real: [`salida.txt`](salida.txt).
