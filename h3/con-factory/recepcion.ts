// H3 · FACTORY METHOD — los CREADORES
// Registrar una orden es UN procedimiento para todo canal de ingreso: numerar, crear, anunciar.
// Lo único que el procedimiento no sabe es QUÉ orden nace: eso lo decide cada subclase en crearOrden().

import { formatearFecha } from './modelo.ts';
import type { Cliente, Equipo, OrdenDeTrabajo, Prioridad } from './modelo.ts';
import { OrdenDeTaller, TicketRemoto } from './ordenes.ts';

export interface Solicitud {
  cliente: Cliente;
  diagnostico: string;
  prioridad: Prioridad;
  recepcion: Date;
  equipo?: Equipo;
}

// Correlativo de la demo. En producción el código lo asigna la API (ver ../con-singleton/singleton.md).
let ultimoNumero = 0;

// ============ CREATOR ============

export abstract class Recepcion {
  // El algoritmo fijo. No tiene switch ni conoce OrdenDeTaller ni TicketRemoto.
  registrar(solicitud: Solicitud): OrdenDeTrabajo {
    ultimoNumero += 1;
    const orden = this.crearOrden(String(ultimoNumero).padStart(4, '0'), solicitud);
    const que = orden.equipo ? orden.equipo.identificacion() : 'soporte remoto';
    console.log(`[ORDEN] ${orden.codigo} · ${orden.cliente.nombreCompleto} · ${que} · prometida ${formatearFecha(orden.fechaPrometida)}`);
    return orden;
  }

  // EL FACTORY METHOD: la pieza que cambia de una recepción a otra.
  protected abstract crearOrden(numero: string, solicitud: Solicitud): OrdenDeTrabajo;
}

// ============ CONCRETE CREATORS ============

export class RecepcionEnMostrador extends Recepcion {
  protected crearOrden(numero: string, solicitud: Solicitud): OrdenDeTrabajo {
    if (!solicitud.equipo) {
      throw new Error('en mostrador la orden nace con el equipo en mano');
    }
    return new OrdenDeTaller(numero, solicitud.cliente, solicitud.equipo, solicitud.diagnostico,
                             solicitud.prioridad, solicitud.recepcion);
  }
}

export class RecepcionPorSoporteRemoto extends Recepcion {
  protected crearOrden(numero: string, solicitud: Solicitud): OrdenDeTrabajo {
    return new TicketRemoto(numero, solicitud.cliente, solicitud.diagnostico, solicitud.prioridad, solicitud.recepcion);
  }
}
