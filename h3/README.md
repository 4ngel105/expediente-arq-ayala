# H3 — Laboratorio de patrones · completo

**Variante 6 · Órdenes de trabajo — "Taller y soporte técnico" (SIGOT)**
Roberto Angel Ayala Lecoña · Arquitectura de Software · UAB · Gestión 2026-2 · Ing. Josue Chura
**Entrega:** H3 — vence dom 13-sep-2026, 23:59

---

## Estructura

```
h3/
├── base/            el corazón de SIGOT SIN patrones: 5 clases transcritas del H2
│
│   ── primera tanda ──
├── con-factory/     COPIA de base + Factory Method   (qué tipo de orden nace según el canal de ingreso)
├── con-builder/     COPIA de base + Builder          (la orden se arma por pasos y nace válida o no nace)
├── con-adapter/     COPIA de base + Adapter          (verificar el CI del cliente contra el SEGIP)
├── con-singleton/   singleton.md: por qué SIGOT NO lo pide
│
│   ── segunda tanda ──
├── con-observer/    COPIA de base + Observer         (avisarle al cliente cuando su orden pasa a LISTA)
├── con-strategy/    COPIA de base + Strategy         (el plazo cambia según el contrato del cliente)
├── con-decorator/   COPIA de base + Decorator        (los extras que se contratan sobre una reparación)
│
│   ── H4 · Parte A ──
└── final/           LA FUSIÓN: Decorator + Strategy conectados por un solo dato
```

**Regla del laboratorio:** cada patrón va aislado sobre su propia copia de la base, nunca uno encima de otro.
`modelo.ts` es **byte a byte el mismo archivo** en las ocho carpetas (mismo SHA-256, `b80b3440…`):
ningún patrón necesitó abrir el modelo, ni siquiera la fusión. Lo que cambia en cada copia es solo lo que
el patrón toca.

```bash
sha256sum h3/*/modelo.ts | sort -u -k1,1 | wc -l   # -> 1
```

## Los patrones

| Patrón | Dolor concreto | Dónde estaba | Qué agrega la copia | Qué desaparece |
|---|---|---|---|---|
| **Factory Method** | Un `switch` decide qué orden nace; cada canal de ingreso nuevo es un `case` más | `registrarOrden()` en `base/demo.ts` | `recepcion.ts` (creadores) + `ordenes.ts` (productos) | el `switch` y `registrarOrden()` |
| **Builder** | `new OrdenDeTrabajo()` con 7 argumentos posicionales, dos fechas seguidas y un `null` que significa "remoto" | los `new OrdenDeTrabajo(...)` de `registrarOrden()` | `orden-builder.ts` | el constructor largo en el código de recepción |
| **Adapter** | El CI se acepta de palabra; el SEGIP habla otro idioma (códigos numéricos, nombre partido, excepciones de red) | `registrarCliente()` en `base/demo.ts` | `verificador-de-identidad.ts` + `segip.ts` + `adaptador-segip.ts` | la confianza ciega en el dato del cliente |
| **Observer** | Avisarle al cliente era un `console.log` dentro de `mover()`: cada nuevo interesado obligaba a reabrir esa función | `mover()` en `base/demo.ts` | `OrdenObservable` (sujeto) + `AvisoAlCliente` y `TableroDelJefe` (observadores) | que la orden sepa quién la escucha |
| **Strategy** | Un `if/else` por tipo de contrato calculaba el plazo; garantía y corporativo no son "el mismo cálculo con otro número" | `calcularPlazoAntes()` | `PoliticaDePlazo` + 3 políticas | el `if/else` de contratos |
| **Decorator** | Los extras del servicio como banderas: `cotizar(true, false)`. Cada extra nuevo, un parámetro y un `if` más | `cotizarAntes()` | `Servicio` + `DecoradorDeServicio` + 2 capas apilables | las banderas booleanas |
| **Singleton** | — ningún dolor lo pide — | — | [`con-singleton/singleton.md`](con-singleton/singleton.md) | — |

Cada carpeta tiene su `salida.txt` **capturada de una ejecución real**, y la mayoría su propio `README.md`
con los roles del patrón mapeados a clases de SIGOT y su costo.

## La fusión (H4 · Parte A)

[`final/`](final/) conecta **Decorator + Strategy** por un solo dato: el Decorator arma el servicio
contratado y produce `horas()`; la Strategy consume esas horas y las convierte en fecha prometida
según el contrato del cliente.

```ts
const prometida = politica.calcular(LUNES_9AM, prioridad, servicio.horas());
```

No es coexistencia: si borrás uno de los dos patrones, el otro deja de dar el mismo resultado. La
fusión además destapó que `PoliticaDePlazo` recibía el parámetro equivocado (`esRemoto: boolean`
en lugar de `horasBase: number`).

La decisión, las tres alternativas descartadas y el costo están en
[`h4/ADR-001`](../h4/ADR-001-fusion-decorator-strategy.md). Los diagramas C4 del sistema, en
[`h4/README.md`](../h4/README.md).

## Cómo correrlo

No hay nada que instalar. Node 22.18 o superior ejecuta TypeScript directamente (probado con Node 26.7):

```bash
cd h3/base          && node demo.ts
cd h3/con-factory   && node demo.ts
cd h3/con-builder   && node demo.ts
cd h3/con-adapter   && node demo.ts
cd h3/con-observer  && node demo.ts
cd h3/con-strategy  && node demo.ts
cd h3/con-decorator && node demo.ts
cd h3/final         && node demo.ts
```

`package.json` existe solo para que Node trate los `.ts` como módulos ES. El código usa únicamente sintaxis
TypeScript "borrable" (sin `enum`, sin propiedades en el constructor), y además pasa el chequeo estricto:

```bash
npx -p typescript@5.9 tsc --noEmit --strict --target es2022 --module nodenext \
    --allowImportingTsExtensions --erasableSyntaxOnly base/demo.ts con-*/demo.ts
```

> **A diferencia del H2**, cada `salida.txt` está **capturada de una ejecución real**, no derivada a mano.

## Cómo ver el efecto puro de cada patrón

```bash
git diff --no-index h3/base h3/con-factory
git diff --no-index h3/base h3/con-builder
git diff --no-index h3/base h3/con-adapter
git diff --no-index h3/base h3/con-observer
git diff --no-index h3/base h3/con-strategy
git diff --no-index h3/base h3/con-decorator
git diff --no-index h3/base h3/final
```

**En los siete casos `modelo.ts` no aparece en el diff.** Ese es el resultado que sostiene todo el
laboratorio: ningún patrón —ni la fusión— necesitó abrir el dominio. Lo que cambia es **cómo nace** la
orden, **quién es** el cliente, **quién se entera** de que cambió o **qué se le prometió**; nunca **cómo
vive** la orden.

## Estado

| Entrega | Qué pedía | Estado |
|---|---|---|
| H3 · primera tanda | Factory, Builder, Adapter (+ Singleton descartado con razón) | ✅ |
| H3 · segunda tanda | Observer, Strategy, Decorator | ✅ |
| H4 · Parte A | las copias + `final/` con la fusión de dos patrones | ✅ [`final/`](final/) |
| H4 · Parte B | C4 nivel 1 y 2 + 1 ADR | ✅ [`h4/`](../h4/) |
