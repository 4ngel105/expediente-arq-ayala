// H3 · BASE — un lunes en el mostrador de SIGOT, sin patrones
// Las marcas ⚑ señalan el punto exacto que toca cada copia con-<patron>/.

import { Cliente, Equipo, OrdenDeTrabajo, Tecnico, formatearFecha, sumarDias, sumarHoras } from './modelo.ts';
import type { EstadoOrden, Prioridad } from './modelo.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);
let ultimoNumero = 0;

// ⚑ ADAPTER: el cliente se registra con el CI que dice de palabra. Nadie lo verifica.
function registrarCliente(nombre: string, numero: string, expedido: string, telefono: string, complemento = ''): Cliente {
  const cliente = new Cliente(nombre, numero, expedido, telefono, complemento);
  console.log(`[CLIENTE] ${cliente.documento()}: ${cliente.nombreCompleto} (sin verificar)`);
  return cliente;
}

// ⚑ FACTORY METHOD: el switch decide QUÉ tipo de orden nace; cada canal de ingreso nuevo es un case más.
// ⚑ BUILDER: 7 argumentos posicionales, dos fechas seguidas y un null que significa "es remoto".
function registrarOrden(tipo: 'TALLER' | 'REMOTO', cliente: Cliente, equipo: Equipo | null,
                        diagnostico: string, prioridad: Prioridad): OrdenDeTrabajo {
  ultimoNumero += 1;
  const numero = String(ultimoNumero).padStart(4, '0');
  switch (tipo) {
    case 'TALLER':
      return anunciar(new OrdenDeTrabajo(`OT-${numero}`, cliente, equipo, diagnostico, prioridad,
                                         LUNES_9AM, sumarDias(LUNES_9AM, prioridad === 'URGENTE' ? 1 : 3)));
    case 'REMOTO':
      return anunciar(new OrdenDeTrabajo(`TK-${numero}`, cliente, null, diagnostico, prioridad,
                                         LUNES_9AM, sumarHoras(LUNES_9AM, prioridad === 'URGENTE' ? 4 : 24)));
  }
}

function anunciar(orden: OrdenDeTrabajo): OrdenDeTrabajo {
  const que = orden.equipo ? orden.equipo.identificacion() : 'soporte remoto';
  console.log(`[ORDEN] ${orden.codigo} · ${orden.cliente.nombreCompleto} · ${que} · prometida ${formatearFecha(orden.fechaPrometida)}`);
  return orden;
}

function mover(orden: OrdenDeTrabajo, destino: EstadoOrden, autor: string, comentario = ''): void {
  const desde = orden.estado;
  const resultado = orden.cambiarEstado(destino, autor, comentario);
  console.log(resultado.ok
    ? `[BITACORA] ${orden.codigo}: ${desde} -> ${destino} (por ${autor})`
    : `[RECHAZADO] ${orden.codigo}: ${resultado.motivo}`);
}

// ============ DEMO ============

console.log('========== H3 · BASE (sin patrones) ==========');
console.log('-- recepción --');
const juan = registrarCliente('Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');
const maria = registrarCliente('María Quispe Condori', '6543210', 'CB', '71234567', '1a');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');

const ot = registrarOrden('TALLER', juan, laptop, 'No enciende, olor a quemado', 'ALTA');
registrarOrden('REMOTO', maria, null, 'Outlook no sincroniza el correo', 'URGENTE');

console.log(`-- ciclo de vida de ${ot.codigo} --`);
const ana = new Tecnico('Ana', 'electronica');
mover(ot, 'DIAGNOSTICADA', 'recepcion', 'fuente dañada');
mover(ot, 'EN_REPARACION', 'jefe');                 // la orden se defiende: todavía no tiene técnico
ot.asignarA(ana);
console.log(`[ASIGNACION] ${ot.codigo} -> ${ana.nombre}`);
mover(ot, 'EN_REPARACION', 'jefe');
mover(ot, 'LISTA', ana.nombre, 'fuente reemplazada');
mover(ot, 'CANCELADA', 'jefe');                     // LISTA solo sale hacia ENTREGADA
mover(ot, 'ENTREGADA', 'recepcion', 'firma del cliente');

console.log(`-- bitácora de ${ot.codigo} --`);
for (const avance of ot.avances()) {
  console.log(`  ${avance.estadoAnterior} -> ${avance.estadoNuevo} · ${avance.autor}${avance.comentario ? ' · ' + avance.comentario : ''}`);
}
