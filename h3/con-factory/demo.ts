// H3 · CON FACTORY METHOD — el mismo lunes en el mostrador, sin el switch de tipos
// Comparado con ../base/demo.ts: desaparecen registrarOrden() y su switch. Todo lo demás es igual.

import { Cliente, Equipo, Tecnico } from './modelo.ts';
import type { EstadoOrden, OrdenDeTrabajo } from './modelo.ts';
import { RecepcionEnMostrador, RecepcionPorSoporteRemoto } from './recepcion.ts';
import type { Recepcion, Solicitud } from './recepcion.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);

// ⚑ ADAPTER: igual que en la base, el cliente se registra con el CI que dice de palabra.
function registrarCliente(nombre: string, numero: string, expedido: string, telefono: string, complemento = ''): Cliente {
  const cliente = new Cliente(nombre, numero, expedido, telefono, complemento);
  console.log(`[CLIENTE] ${cliente.documento()}: ${cliente.nombreCompleto} (sin verificar)`);
  return cliente;
}

function mover(orden: OrdenDeTrabajo, destino: EstadoOrden, autor: string, comentario = ''): void {
  const desde = orden.estado;
  const resultado = orden.cambiarEstado(destino, autor, comentario);
  console.log(resultado.ok
    ? `[BITACORA] ${orden.codigo}: ${desde} -> ${destino} (por ${autor})`
    : `[RECHAZADO] ${orden.codigo}: ${resultado.motivo}`);
}

// ============ DEMO ============

console.log('========== H3 · CON FACTORY METHOD ==========');
console.log('-- recepción --');
const juan = registrarCliente('Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');
const maria = registrarCliente('María Quispe Condori', '6543210', 'CB', '71234567', '1a');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');

// Los new de las RECEPCIONES se mudaron acá, a quien arma el sistema (en Angular: los providers).
const jornada: Array<[Recepcion, Solicitud]> = [
  [new RecepcionEnMostrador(),      { cliente: juan, equipo: laptop, diagnostico: 'No enciende, olor a quemado', prioridad: 'ALTA', recepcion: LUNES_9AM }],
  [new RecepcionPorSoporteRemoto(), { cliente: maria, diagnostico: 'Outlook no sincroniza el correo', prioridad: 'URGENTE', recepcion: LUNES_9AM }],
];

// El código cliente es UNA línea para todo canal de ingreso: no pregunta el tipo, no hay switch.
// Un canal nuevo (RecepcionPorWhatsApp) es una subclase más; este bucle no se toca.
const ordenes = jornada.map(([recepcion, solicitud]) => recepcion.registrar(solicitud));
const [ot, tk] = ordenes;
console.log(`[TIPO] ${ot.codigo} nació como ${ot.constructor.name}; ${tk.codigo} nació como ${tk.constructor.name}`);

console.log(`-- ciclo de vida de ${ot.codigo} (idéntico a la base: el producto sigue siendo una OrdenDeTrabajo) --`);
const ana = new Tecnico('Ana', 'electronica');
mover(ot, 'DIAGNOSTICADA', 'recepcion', 'fuente dañada');
mover(ot, 'EN_REPARACION', 'jefe');
ot.asignarA(ana);
console.log(`[ASIGNACION] ${ot.codigo} -> ${ana.nombre}`);
mover(ot, 'EN_REPARACION', 'jefe');
mover(ot, 'LISTA', ana.nombre, 'fuente reemplazada');
mover(ot, 'CANCELADA', 'jefe');
mover(ot, 'ENTREGADA', 'recepcion', 'firma del cliente');

console.log(`-- bitácora de ${ot.codigo} --`);
for (const avance of ot.avances()) {
  console.log(`  ${avance.estadoAnterior} -> ${avance.estadoNuevo} · ${avance.autor}${avance.comentario ? ' · ' + avance.comentario : ''}`);
}
