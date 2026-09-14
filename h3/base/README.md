# H3 · base — el corazón de SIGOT, sin patrones

El punto de partida de todo el laboratorio. Cinco clases transcritas del diagrama DESPUÉS del H2,
reducidas a lo que sostiene el ciclo de vida de una orden.

## Las 5 clases

| Clase | Módulo | De dónde viene | Qué sabe |
|---|---|---|---|
| `Cliente` | M3 | H1/H2 `Cliente` | nombre, documento (número, complemento, expedido), teléfono |
| `Equipo` | M3 | H1/H2 `Equipo` | tipo, marca, modelo, serie, accesorios |
| `Tecnico` | M0 | H2 `Tecnico` (identidad) | nombre y especialidad |
| `Avance` | M1 | H1/H2 `Avance` | estado anterior, estado nuevo, autor, comentario; inmutable |
| `OrdenDeTrabajo` | M1 | H2 `Orden` | código, cliente, equipo, diagnóstico, prioridad, fechas, estado, técnico y bitácora |

`OrdenDeTrabajo` hace cumplir cuatro invariantes del H1: no hay salto de estado (1), todo cambio deja
un `Avance` (2), no se pasa a `EN_REPARACION` sin técnico (4) y `ENTREGADA`/`CANCELADA` son terminales (6).

## Lo que dejé fuera del H2, a propósito

La base tiene que estar **sin patrones**, y el DESPUÉS del H2 ya traía algunos puestos:

| En el H2 | En la base | Por qué |
|---|---|---|
| `IEstadoDeOrden` + una clase por estado | una tabla `TRANSICIONES` (dato) | una clase por estado ya es el patrón **State**; la tabla es la misma regla sin patrón |
| `IEstrategiaDeAsignacion` + políticas | fuera | es **Strategy**: entra en la tanda de la semana próxima |
| `IPublicadorDeEventos` + canales de aviso | fuera | es terreno de **Observer**: tanda de la semana próxima |
| `PerfilDeCapacidad` | fuera | pertenece a M2 (carga de trabajo), no al ciclo de vida de la orden |
| `CalculadoraDeCostos`, `MetricasDeOrden`, repositorio, reporte | fuera | no son el corazón; la base debe ser chica para que el diff de cada patrón se lea solo |

## Los puntos marcados con ⚑ en `demo.ts`

`demo.ts` es un lunes en el mostrador escrito de la forma más directa posible. Tiene tres lugares que duelen,
y cada uno es el punto de entrada de una copia:

| Marca | Dónde | Qué duele | Copia que lo resuelve |
|---|---|---|---|
| ⚑ FACTORY METHOD | `switch (tipo)` en `registrarOrden()` | cada canal de ingreso nuevo (WhatsApp, web) es un `case` más en la misma función | [`../con-factory/`](../con-factory/) |
| ⚑ BUILDER | `new OrdenDeTrabajo(...)` con 7 argumentos | `fechaRecepcion` y `fechaPrometida` son dos `Date` seguidos: invertirlos compila y corre; `null` en `equipo` significa "remoto" por convención | [`../con-builder/`](../con-builder/) |
| ⚑ ADAPTER | `registrarCliente()` | el CI se acepta de palabra; nadie lo verifica contra el SEGIP | [`../con-adapter/`](../con-adapter/) |

## Correr

```bash
node demo.ts
```

Salida real: [`salida.txt`](salida.txt).
