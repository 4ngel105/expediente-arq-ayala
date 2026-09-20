# ADR-001 · La fecha prometida se calcula combinando Decorator y Strategy

**Estado:** Aceptada
**Fecha:** 2026-09-20
**Decide:** Roberto Angel Ayala Lecoña
**Ámbito:** M1 · Recepción y Órdenes — el cálculo de `fechaPrometida` al registrar una orden
**Implementación:** [`h3/final/`](../h3/final/)

---

## Contexto

La fecha prometida es el dato más sensible que SIGOT le da al cliente: es la razón por la que cruza la
ciudad. Hoy se calcula mal, y por dos motivos que **no son el mismo problema**:

1. **Lo que el cliente contrató varía en cantidad.** Una reparación puede llevar extras encima —
   respaldo de datos, recojo a domicilio, limpieza interna — y cada extra suma trabajo real al taller.
   En la base eso vive como banderas booleanas: `cotizar(true, false)`. Cada extra nuevo que el taller
   empieza a vender es un parámetro más en la firma y un `if` más adentro, y en la llamada nadie sabe
   qué significa cada `true`. Modelarlo por herencia es peor: haría falta una clase por combinación
   (`ReparacionConRespaldoYDomicilio`…).
2. **Cómo se traduce ese trabajo en una fecha varía en tipo.** No es lo mismo un cliente estándar, uno
   en garantía (que no se cobra y por lo tanto no compite por la cola) y uno corporativo (que contrató
   un SLA en horas y ni siquiera distingue taller de remoto). Son reglas distintas, no el mismo cálculo
   con otro número.

El error que veníamos cometiendo es tratar los dos como uno solo: una única función con banderas Y
condicionales de contrato, que hay que abrir tanto cuando aparece un extra nuevo como cuando se firma
un contrato nuevo. Dos razones de cambio en el mismo lugar — la violación de SRP que el H2 ya había
señalado sobre `OrdenDeTrabajo`.

El H4 pide además **fusionar dos patrones** del laboratorio en un módulo final, no simplemente
apilarlos en la misma carpeta.

---

## Decisión

**Separamos los dos ejes y los conectamos: el Decorator declara cuánto trabajo hay, y la Strategy
decide cómo ese trabajo se convierte en una fecha.**

- El **Decorator** (`Servicio` / `ReparacionEnTaller` / `DecoradorDeServicio` y sus capas) arma el
  servicio contratado apilando extras. Su salida relevante es `horas()`: el trabajo acumulado.
- La **Strategy** (`PoliticaDePlazo` y sus políticas por contrato) recibe esas horas como **entrada**
  y devuelve la fecha prometida según el contrato del cliente.

La fusión es la firma que los une:

```
politica.calcular(recepcion, prioridad, servicio.horas())
```

No es coexistencia: hay un dato que nace en un patrón y se consume en el otro. El Decorator no sabe
qué contrato tiene el cliente; la Strategy no sabe qué extras se contrataron. Cada uno cambia por su
propia razón.

---

## Alternativas consideradas

### A · Observer + Decorator (la notificación confiable)
La orden pasa a `LISTA`, el Observer avisa, y el aviso sale por un `Notificador` decorado con
reintentos y registro interno. **Descartada por dos razones:** el decorador que ya está escrito decora
`Servicio`, no el envío, así que habría que escribir un decorador nuevo desde cero con la entrega a
tres días; y sobre todo, **los dos patrones apenas se tocan** — el Observer publica y el Decorator
envuelve un objeto que el Observer nunca mira. Es más vistosa como demo, pero es coexistencia, no
fusión. Queda anotada como la evolución natural de M5 (ver el contenedor "Servicio de avisos" en el
[nivel 2](README.md#nivel-2--contenedores-el-zoom-adentro-de-sigot)).

### B · Observer + Strategy
La Strategy fija el plazo al nacer la orden y el Observer avisa cuando termina. **Descartada:** ocurren
en momentos distintos del ciclo de vida y no comparten un solo dato. Sería poner dos patrones en la
misma carpeta y llamarlo fusión.

### C · Meter los extras dentro de la propia Strategy
Que cada política de plazo sepa sumar el respaldo y el domicilio. **Descartada:** multiplica el
problema en vez de resolverlo. Con 3 contratos y 3 extras hacen falta 9 ramas, y agregar un cuarto
extra obliga a abrir las tres políticas. Es exactamente el acoplamiento que el corte busca evitar.

### D · No fusionar — dejar los patrones en carpetas separadas
**Descartada porque el H4 lo pide explícitamente**, pero también porque la fusión revela algo que las
copias aisladas escondían: que `PoliticaDePlazo` tenía el parámetro equivocado. Recibía `esRemoto`, un
booleano que describe *dónde* está el equipo, cuando lo que necesita saber es *cuánto trabajo hay*.

---

## Consecuencias

### A favor

- **Un extra nuevo no toca ninguna política, y un contrato nuevo no toca ningún extra.** Las dos cosas
  que cambian a distinto ritmo quedaron en clases distintas.
- **El acoplamiento entre los dos patrones es un solo número.** `horas()` es toda la superficie de
  contacto: se pueden probar por separado.
- **Mejoró la firma de la Strategy.** Pasar de `esRemoto: boolean` a `horasBase: number` la hace más
  honesta: una política de plazo no tiene por qué saber si el equipo está en el taller. El booleano
  era un detalle de implementación filtrado en el contrato.
- **`modelo.ts` sigue intacto** (mismo SHA-256 que `h3/base/`). La fusión vive enteramente afuera del
  dominio: `OrdenDeTrabajo` sigue recibiendo una fecha ya calculada y no se entera de que existen ni
  los extras ni los contratos.

### En contra — lo que ahora cuesta más

- **Más clases para leer.** Donde había una función con `if`, ahora hay una interfaz, un componente
  concreto, un decorador abstracto, dos capas, una interfaz de política y tres políticas. Para un
  taller que vendiera un solo servicio a un solo tipo de cliente, esto sería sobre-ingeniería y la
  función con banderas ganaría.
- **El orden de los decoradores es responsabilidad de quien los arma.** Nada en el tipo impide apilar
  dos veces el mismo extra (`ConRespaldoDeDatos(ConRespaldoDeDatos(x))` cobra el respaldo dos veces).
  Hoy eso se controla en el punto de armado; si el taller crece, va a hacer falta un Builder que
  valide la combinación antes de construirla — y ese Builder ya existe en [`h3/con-builder/`](../h3/con-builder/).
- **El cálculo quedó repartido en dos lugares.** Para responder "¿por qué esta orden vence el jueves?"
  hay que mirar el servicio armado *y* la política aplicada. Se mitiga con `detalle()` y `nombre`, que
  imprimen el desglose en la salida, pero es una lectura más que antes.
- **Ninguna capa puede quitar trabajo.** Los extras solo suman horas. Un descuento o una promesa
  acelerada no entran en este diseño sin revisarlo.
