// H3 · CON BUILDER — el mismo lunes en el mostrador, armando la orden por pasos
// Comparado con ../base/demo.ts: registrarOrden() ya no llama a new OrdenDeTrabajo() con 7 argumentos.
// Recibe un borrador (OrdenBuilder) y lo confirma. Todo lo demás es igual.

import { Cliente, Equipo, Tecnico, formatearFecha, sumarDias } from './modelo.ts';
import type { EstadoOrden, OrdenDeTrabajo } from './modelo.ts';
import { OrdenBuilder } from './orden-builder.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);
let ultimoNumero = 0;

// ⚑ ADAPTER: igual que en la base, el cliente se registra con el CI que dice de palabra.
function registrarCliente(nombre: string, numero: string, expedido: string, telefono: string, complemento = ''): Cliente {
  const cliente = new Cliente(nombre, numero, expedido, telefono, complemento);
  console.log(`[CLIENTE] ${cliente.documento()}: ${cliente.nombreCompleto} (sin verificar)`);
  return cliente;
}

function siguienteNumero(): string {
  ultimoNumero += 1;
  return String(ultimoNumero).padStart(4, '0');
}

// El botón "Confirmar" del formulario: el borrador nace como orden válida o no nace.
function registrarOrden(borrador: OrdenBuilder): OrdenDeTrabajo | null {
  try {
    const orden = borrador.build();
    const que = orden.equipo ? orden.equipo.identificacion() : 'soporte remoto';
    console.log(`[ORDEN] ${orden.codigo} · ${orden.cliente.nombreCompleto} · ${que} · prometida ${formatearFecha(orden.fechaPrometida)}`);
    return orden;
  } catch (error) {
    console.log(`[NO NACE] ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

function mover(orden: OrdenDeTrabajo, destino: EstadoOrden, autor: string, comentario = ''): void {
  const desde = orden.estado;
  const resultado = orden.cambiarEstado(destino, autor, comentario);
  console.log(resultado.ok
    ? `[BITACORA] ${orden.codigo}: ${desde} -> ${destino} (por ${autor})`
    : `[RECHAZADO] ${orden.codigo}: ${resultado.motivo}`);
}

// ============ DEMO ============

console.log('========== H3 · CON BUILDER ==========');
console.log('-- recepción --');
const juan = registrarCliente('Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');
const maria = registrarCliente('María Quispe Condori', '6543210', 'CB', '71234567', '1a');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');

// Los pasos del stepper de recepción. Cada paso carga su parte del borrador, en el momento en que ocurre.
const borradorOT = new OrdenBuilder().conCodigo(`OT-${siguienteNumero()}`).recibidaEl(LUNES_9AM);
borradorOT.paraCliente(juan);                                                   // paso 1 · cliente
borradorOT.conEquipo(laptop);                                                   // paso 2 · equipo
borradorOT.conDiagnostico('No enciende, olor a quemado').conPrioridad('ALTA');  // paso 3 · diagnóstico
const ot = registrarOrden(borradorOT);

// "Es remoto" es un paso con nombre, no un null en la tercera posición.
registrarOrden(new OrdenBuilder()
  .conCodigo(`TK-${siguienteNumero()}`)
  .paraCliente(maria)
  .comoTicketRemoto()
  .conDiagnostico('Outlook no sincroniza el correo')
  .conPrioridad('URGENTE')
  .recibidaEl(LUNES_9AM));

console.log('-- lo que en la base se aceptaba en silencio --');
// Recepción apurada: guardó sin cliente, sin equipo y con el diagnóstico en blanco.
registrarOrden(new OrdenBuilder().conCodigo('OT-9998').recibidaEl(LUNES_9AM).conDiagnostico('  '));
// Fechas invertidas: con new OrdenDeTrabajo(..., prometida, recepcion) esto compila, corre
// y deja una orden vencida desde el minuto en que nace.
registrarOrden(new OrdenBuilder().conCodigo('OT-9999').paraCliente(juan).conEquipo(laptop)
  .conDiagnostico('Pantalla rota').recibidaEl(sumarDias(LUNES_9AM, 3)).prometidaPara(LUNES_9AM));

if (ot !== null) {
  console.log(`-- ciclo de vida de ${ot.codigo} (idéntico a la base: el builder solo cambió cómo nace) --`);
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
}
