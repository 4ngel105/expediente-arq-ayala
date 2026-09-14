// H3 · CON ADAPTER — el mismo lunes en el mostrador, verificando el CI contra el SEGIP
// Comparado con ../base/demo.ts: registrarCliente() ya no confía en lo que el cliente dice; pregunta a un
// VerificadorDeIdentidad sin saber que atrás está el SEGIP. registrarOrden() y el ciclo de vida son iguales.

import { Cliente, Equipo, OrdenDeTrabajo, Tecnico, formatearFecha, sumarDias, sumarHoras } from './modelo.ts';
import type { EstadoOrden, Prioridad } from './modelo.ts';
import { AdaptadorSegip } from './adaptador-segip.ts';
import { ServicioSegipFalso } from './segip.ts';
import type { VerificadorDeIdentidad } from './verificador-de-identidad.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);
let ultimoNumero = 0;

// Recibe el CONTRATO. No importa segip.ts ni sabe que existe un código de departamento.
async function registrarCliente(verificador: VerificadorDeIdentidad, nombre: string, numero: string,
                                expedido: string, telefono: string, complemento = ''): Promise<Cliente | null> {
  const declarado = new Cliente(nombre, numero, expedido, telefono, complemento);
  const resultado = await verificador.verificar(declarado);

  switch (resultado.estado) {
    case 'VERIFICADO': {
      const cliente = new Cliente(resultado.nombreOficial, numero, expedido, telefono, complemento);
      console.log(`[VERIFICADO] ${cliente.documento()}: registrado como ${cliente.nombreCompleto}`);
      return cliente;
    }
    // Si el servicio está caído no se frena la recepción: se registra, pero la duda queda visible.
    case 'SERVICIO_NO_DISPONIBLE':
      console.log(`[PENDIENTE] ${declarado.documento()}: verificación pendiente (${resultado.motivo})`);
      return declarado;
    case 'NOMBRE_NO_COINCIDE':
      console.log(`[RECHAZADO] ${declarado.documento()}: el nombre no coincide con el padrón`);
      return null;
    case 'NO_ENCONTRADO':
      console.log(`[RECHAZADO] ${declarado.documento()}: no existe en el padrón`);
      return null;
  }
}

// ⚑ FACTORY METHOD / ⚑ BUILDER: igual que en la base.
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

console.log('========== H3 · CON ADAPTER ==========');

// El único lugar que sabe que el verificador es el SEGIP: quien arma el sistema.
// En Angular: { provide: VERIFICADOR_DE_IDENTIDAD, useClass: AdaptadorSegip }
const segip = new ServicioSegipFalso();
const verificador: VerificadorDeIdentidad = new AdaptadorSegip(segip);

console.log('-- recepción: el CI se verifica antes de abrir la orden --');
const juan = await registrarCliente(verificador, 'Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');   // tildes y minúsculas
await registrarCliente(verificador, 'María Quispe Mamani', '6543210', 'CB', '71234567', '1a');               // apellido equivocado
await registrarCliente(verificador, 'Pedro Flores', '1111111', 'SC', '72345678');                            // CI inexistente
segip.simularCaida(true);
const maria = await registrarCliente(verificador, 'María Quispe Condori', '6543210', 'CB', '71234567', '1a'); // SEGIP caído
segip.simularCaida(false);

const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');

if (juan !== null && maria !== null) {
  const ot = registrarOrden('TALLER', juan, laptop, 'No enciende, olor a quemado', 'ALTA');
  registrarOrden('REMOTO', maria, null, 'Outlook no sincroniza el correo', 'URGENTE');

  console.log(`-- ciclo de vida de ${ot.codigo} (idéntico a la base: la orden no se enteró del SEGIP) --`);
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
