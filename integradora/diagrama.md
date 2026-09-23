# Diagrama de Clases — Sistema de Comedor Universitario
**Autor: Roberto Angel Ayala Lecoña**

### 1. Sustantivos
Estudiante, Pedido, LíneaDePedido, Menú, TipoDeMenú, EstadoDePedido, Usuario,
Cajero, Administrador, Precio, Aviso/Notificación, ReporteVentas

### 2. Verbos
registrar pedido, agregar menú al pedido, calcular total, cambiar de estado,
marcar preparado, marcar entregado, anular, ajustar precio, avisar al estudiante,
generar reporte de menús vendidos por tipo

### 3. Filtro

| Candidato | Decisión | Motivo |
|---|---|---|
| `TipoDeMenu` | **enum** | Valor cerrado (estándar, vegetariano, beca) |
| `EstadoPedido` | **enum** | Los estados no tienen atributos; las transiciones viven en `Pedido` |
| `Precio` | **atributo** de `Menu` | Es un dato, no un objeto con identidad. |
| `Cajero` / `Administrador` | **subclases** de `Usuario` | Comparten identidad y logins |
| `LineaPedido` | **clase** | Un pedido lleva varios menús con cantidad: necesita cantidad y subtotal propios |
| `Notificador` | **interfaz** | El aviso es comportamiento variable (SMS, pantalla), no un dato |
| `ReporteVentas` | **clase** | Tiene lógica de agregación por tipo y un período |
| `Aviso` | descartado | Ya lo cubre `Notificador`; sería una clase anémica|

### 4. Relaciones
- `Estudiante` **1 → 0..\*** `Pedido` (asociación: un estudiante realiza varios pedidos).
- `Pedido` **1 → 1..\*** `LineaPedido` (composición: la línea no existe sin el pedido).
- `LineaPedido` **\* → 1** `Menu` (asociación: la línea referencia un menú del catálogo).
- `Menu` **\* → 1** `TipoMenu` (enum).
- `Pedido` **1 → 1** `EstadoPedido` (enum).
- `Cajero` y `Administrador` **heredan** de `Usuario` (generalización).
- `Cajero` **→** `Pedido` (dependencia: lo registra).
- `Administrador` **→** `Menu` y `Pedido` (dependencia: ajusta precio y anula).
- `Pedido` **→** `Notificador` (dependencia: al quedar preparado, avisa).
- `ReporteVentas` **→** `Pedido` (dependencia: agrega los pedidos del período).

---

## Diagrama

```mermaid
classDiagram
    direction TB

    class Estudiante {
        -string codigo
        -string nombre
        +realizarPedido() Pedido
    }

    class Pedido {
        -int id
        -DateTime fecha
        -EstadoPedido estado
        +agregarLinea(menu, cantidad)
        +calcularTotal() decimal
        +marcarPreparado()
        +marcarEntregado()
        +anular()
    }

    class LineaPedido {
        -int cantidad
        -decimal precioUnitario
        +subtotal() decimal
    }

    class Menu {
        -string descripcion
        -decimal precio
        -TipoMenu tipo
        +ajustarPrecio(nuevo)
    }

    class Usuario {
        -string usuario
        -string nombre
    }

    class Cajero {
        +registrarPedido()
    }

    class Administrador {
        +ajustarPrecio(menu, nuevo)
        +anularPedido(pedido)
        +generarReporte() ReporteVentas
    }

    class Notificador {
        <<interface>>
        +avisarPreparado(pedido)
    }

    class ReporteVentas {
        -DateTime desde
        -DateTime hasta
        +totalPorTipo()
    }

    class TipoMenu {
        <<enumeration>>
        ESTANDAR
        VEGETARIANO
        BECA
    }

    class EstadoPedido {
        <<enumeration>>
        SOLICITADO
        PREPARADO
        ENTREGADO
        ANULADO
    }

    Estudiante "1" --> "0..*" Pedido : realiza
    Pedido "1" *-- "1..*" LineaPedido
    LineaPedido "*" --> "1" Menu
    Menu --> TipoMenu
    Pedido --> EstadoPedido
    Usuario <|-- Cajero
    Usuario <|-- Administrador
    Cajero ..> Pedido : registra
    Administrador ..> Menu : ajusta
    Administrador ..> Pedido : anula
    Pedido ..> Notificador : avisa
    ReporteVentas ..> Pedido : agrega
```