# H3 — Laboratorio de patrones · primera tanda

**Variante 6 · Órdenes de trabajo — "Taller y soporte técnico" (SIGOT)**
Roberto Angel Ayala Lecoña · Arquitectura de Software · UAB · Gestión 2026-2 · Ing. Josue Chura
**Entrega:** H3 — vence dom 13-sep-2026, 23:59

---

## Estructura

```
h3/
├── base/            el corazón de SIGOT SIN patrones: 5 clases transcritas del H2
├── con-factory/     COPIA de base + Factory Method   (qué tipo de orden nace según el canal de ingreso)
├── con-builder/     COPIA de base + Builder          (la orden se arma por pasos y nace válida o no nace)
├── con-adapter/     COPIA de base + Adapter          (verificar el CI del cliente contra el SEGIP)
└── con-singleton/   singleton.md: por qué SIGOT NO lo pide
```

**Regla del laboratorio:** cada patrón va aislado sobre su propia copia de la base, nunca uno encima de otro.
`modelo.ts` es **byte a byte el mismo archivo** en `base/`, `con-factory/`, `con-builder/` y `con-adapter/`
(mismo SHA-256): ningún patrón necesitó abrir el modelo. Lo que cambia en cada copia es solo lo que el patrón toca.

## Los patrones de esta tanda

| Patrón | Dolor concreto de la base | Dónde está en la base | Qué agrega la copia | Qué desaparece de la base |
|---|---|---|---|---|
| **Factory Method** | Un `switch` decide qué orden nace; cada canal de ingreso nuevo es un `case` más | `registrarOrden()` en `base/demo.ts` | `recepcion.ts` (creadores) + `ordenes.ts` (productos) | el `switch` y `registrarOrden()` |
| **Builder** | `new OrdenDeTrabajo()` con 7 argumentos posicionales, dos fechas seguidas y un `null` que significa "remoto" | los `new OrdenDeTrabajo(...)` de `registrarOrden()` | `orden-builder.ts` | el constructor largo en el código de recepción |
| **Adapter** | El CI se acepta de palabra; el SEGIP habla otro idioma (códigos numéricos, nombre partido, excepciones de red) | `registrarCliente()` en `base/demo.ts` | `verificador-de-identidad.ts` + `segip.ts` + `adaptador-segip.ts` | la confianza ciega en el dato del cliente |
| **Singleton** | — ningún dolor lo pide — | — | [`con-singleton/singleton.md`](con-singleton/singleton.md) | — |

Cada carpeta tiene su propio `README.md` con los roles del patrón mapeados a clases de SIGOT, su costo y su `salida.txt` real.

## Cómo correrlo

No hay nada que instalar. Node 22.18 o superior ejecuta TypeScript directamente (probado con Node 26.7):

```bash
cd h3/base         && node demo.ts
cd h3/con-factory  && node demo.ts
cd h3/con-builder  && node demo.ts
cd h3/con-adapter  && node demo.ts
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
```

En los tres casos `modelo.ts` no aparece en el diff, y el ciclo de vida de `OT-0001` al final de cada
`salida.txt` es idéntico al de la base: el patrón cambió **cómo nace** la orden o **quién es** el cliente,
nunca **cómo vive** la orden.

## Lo que viene

- **Semana próxima (segunda tanda):** Observer, Strategy y Decorator, cada uno en su propia copia de esta misma base.
  Strategy ya tiene candidato desde el H1 (`EstrategiaDeAsignacion`) y Observer también (el aviso al cliente cuando la orden pasa a `LISTA`, RF5).
- **H4:** elegir dos patrones del menú completo y fusionarlos en el módulo final. La elección queda para entonces;
  esta tanda deja la base sólida y las copias limpias para poder comparar.
