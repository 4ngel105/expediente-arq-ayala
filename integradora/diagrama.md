# Diagrama de Clases — Sistema de Comedor Universitario
**Autor: Roberto Angel Ayala Lecoña**
### 1. Sustantivos
Estudiante, Pedido, Menú, TipoDeMenú, EstadoDePedido, Usuario,
Cajero, Administrador, Precio
### 2. Verbos
registrar pedido, agregar menú al pedido, calcular total, cambiar de estado,
marcar preparado, marcar entregado, anular, ajustar precio, avisar al estudiante
### 3. Filtro
| Candidato | Decisión | Motivo |
|---|---|---|
| `ReporteVentas` | **clase** | Tiene lógica de agregación por tipo y un período. |
| `Aviso` | descartado | Ya lo cubre `Notificador`; sería una clase anémica. |


### 4. Relaciones
- `Estudiante` **1 → 0..\*** `Pedido` (asociación: un estudiante realiza varios pedidos).
- `Pedido` **1 → 1..\*** `LineaPedido` (composición: la línea no existe sin el pedido).
- `LineaPedido` **\* → 1** `Menu` (asociación: la línea referencia un menú del catálogo).
- `Menu` **\* → 1** `TipoMenu` (enum).