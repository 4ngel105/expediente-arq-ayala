// H3 · OBSERVER — el aviso al cliente cuando la orden pasa a LISTA (RF5)
//
// SUJETO  : la OrdenDeTrabajo (acá envuelta en OrdenObservable).
// EVENTO  : la orden cambió de estado de verdad (una transición que fue aceptada).
// OBSERVADORES : el aviso al cliente (RF5) y el tablero del jefe.
//
// En la base, avisarle al cliente significaba meter un console.log dentro de mover(): cada vez que
// alguien más quisiera enterarse (el jefe, facturación, un mail), había que volver a abrir esa función.
// Con Observer la orden no sabe QUIÉN escucha: solo avisa, y cada interesado se suscribe.
//
// modelo.ts NO se tocó (mismo SHA-256 que base/): el sujeto se agrega por herencia, acá abajo.

import { Cliente, Equipo, OrdenDeTrabajo, Tecnico, formatearFecha, sumarDias } from './modelo.ts';
import type { EstadoOrden, ResultadoTransicion } from './modelo.ts';

// ============ 1 · EL CONTRATO (Observer) ============
// Lo único que la orden exige de quien quiera escucharla: tener este método.
// No dice quién es, ni qué hace con el aviso.

export interface ObservadorDeOrden {
  alCambiarEstado(orden: OrdenDeTrabajo, anterior: EstadoOrden, nuevo: EstadoOrden): void;
}

// ============ 2 · EL SUJETO (Subject) ============
// Una OrdenDeTrabajo que además lleva una lista de interesados y les avisa.

export class OrdenObservable extends OrdenDeTrabajo {
  private readonly observadores: ObservadorDeOrden[] = [];

  // "Suscribir": anotarse en la lista. Es lo único que el sujeto ofrece hacia afuera.
  suscribir(observador: ObservadorDeOrden): void {
    this.observadores.push(observador);
  }

  // Misma firma que en modelo.ts. Se apoya en la original y le agrega el aviso.
  override cambiarEstado(destino: EstadoOrden, autor: string, comentario = ''): ResultadoTransicion {
    const anterior = this.estado;                                   // el estado ANTES de moverse
    const resultado = super.cambiarEstado(destino, autor, comentario);  // las reglas de siempre, intactas

    // Solo se avisa si la transición fue aceptada: un rechazo no es un evento.
    if (resultado.ok) {
      for (const observador of this.observadores) {
        observador.alCambiarEstado(this, anterior, destino);
      }
    }
    return resultado;
  }
}

// ============ 3 · LOS OBSERVADORES ============

// RF5: el cliente se entera cuando su equipo está listo. Le interesa UN solo estado.
export class AvisoAlCliente implements ObservadorDeOrden {
  alCambiarEstado(orden: OrdenDeTrabajo, _anterior: EstadoOrden, nuevo: EstadoOrden): void {
    if (nuevo !== 'LISTA') return;                                  // los demás cambios no le importan
    const que = orden.equipo ? orden.equipo.identificacion() : 'su ticket de soporte';
    console.log(`[SMS -> ${orden.cliente.telefono}] ${orden.cliente.nombreCompleto}: ${que} ya está listo. Orden ${orden.codigo}.`);
  }
}

// El jefe quiere ver TODO cambio en su panel. Mismo contrato, reacción distinta.
export class TableroDelJefe implements ObservadorDeOrden {
  private cambios = 0;

  alCambiarEstado(orden: OrdenDeTrabajo, anterior: EstadoOrden, nuevo: EstadoOrden): void {
    this.cambios += 1;
    const tecnico = orden.tecnico ? orden.tecnico.nombre : 'sin asignar';
    console.log(`[TABLERO ${this.cambios}] ${orden.codigo} · ${anterior} -> ${nuevo} · técnico: ${tecnico}`);
  }
}

// ============ 4 · DEMO ============

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);

function mover(orden: OrdenDeTrabajo, destino: EstadoOrden, autor: string, comentario = ''): void {
  const desde = orden.estado;
  const resultado = orden.cambiarEstado(destino, autor, comentario);
  console.log(resultado.ok
    ? `[BITACORA] ${orden.codigo}: ${desde} -> ${destino} (por ${autor})`
    : `[RECHAZADO] ${orden.codigo}: ${resultado.motivo}`);
}

console.log('========== H3 · CON OBSERVER ==========');

const juan = new Cliente('Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');

// La orden nace igual que en la base, pero como OrdenObservable.
const ot = new OrdenObservable('OT-0001', juan, laptop, 'No enciende, olor a quemado', 'ALTA',
                               LUNES_9AM, sumarDias(LUNES_9AM, 3));
console.log(`[ORDEN] ${ot.codigo} · ${ot.cliente.nombreCompleto} · ${laptop.identificacion()} · prometida ${formatearFecha(ot.fechaPrometida)}`);

// Acá se arma el sistema: quién escucha a quién. La orden no nombra a ninguno de los dos.
console.log('-- se suscriben los interesados --');
ot.suscribir(new AvisoAlCliente());
ot.suscribir(new TableroDelJefe());
console.log('[SUSCRIPCION] OT-0001 tiene 2 observadores: AvisoAlCliente y TableroDelJefe');

console.log(`-- ciclo de vida de ${ot.codigo} --`);
const ana = new Tecnico('Ana', 'electronica');
mover(ot, 'DIAGNOSTICADA', 'recepcion', 'fuente dañada');
mover(ot, 'EN_REPARACION', 'jefe');                 // rechazada: sin técnico -> nadie recibe aviso
ot.asignarA(ana);
console.log(`[ASIGNACION] ${ot.codigo} -> ${ana.nombre}`);
mover(ot, 'EN_REPARACION', 'jefe');
mover(ot, 'LISTA', ana.nombre, 'fuente reemplazada');   // acá sí: el cliente recibe el SMS (RF5)
mover(ot, 'ENTREGADA', 'recepcion', 'firma del cliente');

console.log(`-- bitácora de ${ot.codigo} (igual que en la base: Observer no cambió cómo vive la orden) --`);
for (const avance of ot.avances()) {
  console.log(`  ${avance.estadoAnterior} -> ${avance.estadoNuevo} · ${avance.autor}${avance.comentario ? ' · ' + avance.comentario : ''}`);
}
