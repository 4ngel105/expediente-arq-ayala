# H3 · FINAL — La fusión: Decorator + Strategy

Esta es la **Parte A del H4**: los dos patrones ya no viven en carpetas separadas, se conectan.
La decisión y sus alternativas descartadas están en [h4/ADR-001](../../h4/ADR-001-fusion-decorator-strategy.md).

---

## Qué se fusiona y por dónde

| Patrón | Viene de | Responsabilidad | Su papel en la costura |
|---|---|---|---|
| **Decorator** | [`con-decorator/`](../con-decorator/) | armar **qué** se contrató, apilando extras | **produce** `horas()` |
| **Strategy** | [`con-strategy/`](../con-strategy/) | decidir **cómo** ese trabajo se promete | **consume** esas horas |

La costura es una sola línea, en `registrarOrden()`:

```ts
const prometida = politica.calcular(LUNES_9AM, prioridad, servicio.horas());
```

**Por qué esto es fusión y no coexistencia:** hay un dato que **nace** en un patrón y se **consume**
en el otro. El Decorator no sabe qué contrato tiene el cliente; la Strategy no sabe qué extras se
contrataron. Si fueran dos patrones puestos uno al lado del otro, podrías borrar uno y el otro
seguiría dando el mismo resultado — acá no.

---

## Lo que la fusión destapó

`PoliticaDePlazo` recibía `esRemoto: boolean`, que describe **dónde está el equipo**. Lo que la
política en realidad necesita saber es **cuánto trabajo hay**. Al juntar los patrones ese booleano
quedó sin sentido y desapareció:

```diff
- calcular(recepcion: Date, prioridad: Prioridad, esRemoto: boolean): Date
+ calcular(recepcion: Date, prioridad: Prioridad, horasBase: number): Date
```

En su lugar aparecieron **dos piezas base** en el Decorator — `ReparacionEnTaller` (72 h) y
`SoporteRemoto` (24 h) — porque el lugar donde se trabaja dejó de ser una bandera y pasó a ser el
servicio que se contrató, cada uno con su propio trabajo estimado.

Ese es el argumento de que la fusión aportó algo: **mejoró una firma que las copias aisladas habían
dejado pasar.**

---

## Los roles, mapeados

| Rol GoF | Clase en SIGOT |
|---|---|
| Component | `Servicio` (`detalle` / `precio` / `horas`) |
| ConcreteComponent | `ReparacionEnTaller` · `SoporteRemoto` |
| Decorator (abstracto) | `DecoradorDeServicio` |
| ConcreteDecorator | `ConRespaldoDeDatos` · `ConRecojoADomicilio` |
| Strategy | `PoliticaDePlazo` |
| ConcreteStrategy | `PlazoEstandar` · `PlazoDeGarantia` · `PlazoCorporativo` |
| Context | `registrarOrden()` — conecta los dos sin conocer el detalle de ninguno |

---

## Qué demuestra la salida

[`salida.txt`](salida.txt) está capturada de una ejecución real. Las secciones prueban, en orden:

2. **Los dos ejes son independientes.** La matriz de 4 servicios × 3 políticas: leer una fila muestra
   el mismo trabajo prometido distinto según el contrato; leer una columna muestra el mismo contrato
   sobre trabajos distintos. La columna corporativa es la más interesante: con SLA de 48 h el techo
   gana en taller (72 h → 48 h) pero **pierde en remoto** (24 h de trabajo < 48 h de techo), y ahí se
   ve que la política sí está consumiendo lo que el Decorator produjo.
3. **Un extra nuevo no toca ninguna política.** `ConInstalacionDeSoftware` es una clase, y las tres
   políticas la entienden sin cambiar una línea.
4. **Un contrato nuevo no toca ningún extra.** `PlazoExpressDeFeria` es una clase, y los cuatro
   servicios (con extras apilados incluidos) siguen funcionando.
5. **La orden vive igual que en la base.** `OrdenDeTrabajo` recibe una fecha ya calculada y no se
   entera de que existen ni extras ni contratos.

---

## Costo del diseño

Está detallado en las **consecuencias** del [ADR-001](../../h4/ADR-001-fusion-decorator-strategy.md).
En corto: donde había una función con `if` ahora hay 9 clases, el cálculo quedó repartido en dos
lugares, y nada impide apilar dos veces el mismo extra. Para un taller que vendiera un solo servicio
a un solo tipo de cliente, esto sería sobre-ingeniería.

---

## Cómo correrlo

```bash
cd h3/final && node demo.ts
```

`modelo.ts` sigue siendo **byte a byte el mismo archivo** que en `base/` (SHA-256 `b80b3440…`):
la fusión no necesitó abrir el dominio.
