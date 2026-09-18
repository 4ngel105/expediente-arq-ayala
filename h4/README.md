# H4 · Parte B — Arquitectura de SIGOT en C4



Los dos niveles de C4 del sistema, en Mermaid, viviendo en el repositorio. La Parte A (el laboratorio
de patrones y la fusión) está en [`h3/`](../h3/).

---

## Nivel 1 — Contexto (el sistema y su mundo)

La pregunta que responde: **¿quién usa SIGOT y con qué otros sistemas habla?**

```mermaid
flowchart TB
    recepcionista[" Recepcionista<br>(registra órdenes y entrega equipos)"]
    tecnico[" Técnico<br>(carga avances y repara)"]
    jefe[" Jefe de Taller<br>(asigna, prioriza y mide)"]
    almacen[" Encargado de Almacén<br>(controla stock de repuestos)"]

    sigot[" SIGOT — SISTEMA DE ÓRDENES DE TRABAJO<br>Registra el equipo que entra al taller,<br>custodia el estado de cada orden<br>y avisa al cliente cuando está lista"]

    segip[" SEGIP<br>(externo · padrón de identidad)"]
    correo[" Servicio de correo / mensajería<br>(externo)"]
    cliente[" Cliente<br>(recibe el aviso de su equipo)"]

    recepcionista -->|"registra la orden y cierra la entrega"| sigot
    tecnico -->|"carga avances y mueve el estado"| sigot
    jefe -->|"asigna, reprioriza y consulta reportes"| sigot
    almacen -->|"ajusta stock y precios de repuestos"| sigot

    sigot -->|"verifica el CI del cliente"| segip
    sigot -->|"envía el aviso de orden lista"| correo
    correo -->|"entrega el aviso"| cliente
```






