// H3 · FACTORY METHOD — los PRODUCTOS
// Cada tipo de orden conoce sus propias reglas de nacimiento: prefijo del código, plazo y si lleva equipo.
// En la base esas reglas vivían repartidas entre los case del switch de registrarOrden().

import { OrdenDeTrabajo, sumarDias, sumarHoras } from './modelo.ts';
import type { Cliente, Equipo, Prioridad } from './modelo.ts';

// Equipo físico entregado en el mostrador. El equipo NO es opcional: lo exige el tipo del parámetro.
// En la base era un Equipo | null que nadie controlaba.
export class OrdenDeTaller extends OrdenDeTrabajo {
  constructor(numero: string, cliente: Cliente, equipo: Equipo, diagnostico: string, prioridad: Prioridad, recepcion: Date) {
    super(`OT-${numero}`, cliente, equipo, diagnostico, prioridad, recepcion,
          sumarDias(recepcion, prioridad === 'URGENTE' ? 1 : 3));
  }
}

// Ticket de soporte: no hay equipo en el taller y el plazo se mide en horas, no en días.
export class TicketRemoto extends OrdenDeTrabajo {
  constructor(numero: string, cliente: Cliente, diagnostico: string, prioridad: Prioridad, recepcion: Date) {
    super(`TK-${numero}`, cliente, null, diagnostico, prioridad, recepcion,
          sumarHoras(recepcion, prioridad === 'URGENTE' ? 4 : 24));
  }
}
