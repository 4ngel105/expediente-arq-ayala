
import { Cliente, Equipo, OrdenDeTrabajo, formatearFecha, sumarDias, sumarHoras } from './modelo.ts';
import type { Prioridad } from './modelo.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);

//antes de la refactorizacion del estrategy

type Contrato = 'ESTANDAR' | 'GARANTIA' | 'CORPORATIVO';

function calcularPlazoAntes(contrato: Contrato, esRemoto: boolean, recepcion: Date, prioridad: Prioridad): Date {
  if (contrato === 'GARANTIA') {
    // la garantía no se cobra: no compite por la cola, y la prioridad no la acelera
    return esRemoto ? sumarHoras(recepcion, 48) : sumarDias(recepcion, 7);
  } else if (contrato === 'CORPORATIVO') {
    // el SLA se contrató en horas y no distingue taller de remoto
    return sumarHoras(recepcion, prioridad === 'URGENTE' ? 6 : 12);
  } else {
    // el plazo de siempre
    if (esRemoto) return sumarHoras(recepcion, prioridad === 'URGENTE' ? 4 : 24);
    return sumarDias(recepcion, prioridad === 'URGENTE' ? 1 : 3);
  }
}

//implementacion del estrategy

//interface 
export interface PoliticaDePlazo {
  readonly nombre: string;
  calcular(recepcion: Date, prioridad: Prioridad, esRemoto: boolean): Date;
}



//separacion  por clase 
export class PlazoEstandar implements PoliticaDePlazo {
  readonly nombre = 'estándar';

  calcular(recepcion: Date, prioridad: Prioridad, esRemoto: boolean): Date {
    return esRemoto
      ? sumarHoras(recepcion, prioridad === 'URGENTE' ? 4 : 24)
      : sumarDias(recepcion, prioridad === 'URGENTE' ? 1 : 3);
  }
}


// Reparación en garantía: no se cobra, así que no se apura.
// Ojo: esta política IGNORA la prioridad. No es "el mismo cálculo con otro número": es otra regla.
export class PlazoDeGarantia implements PoliticaDePlazo {
  readonly nombre = 'garantía (la prioridad no la acelera)';

  calcular(recepcion: Date, _prioridad: Prioridad, esRemoto: boolean): Date {
    return esRemoto ? sumarHoras(recepcion, 48) : sumarDias(recepcion, 7);
  }
}

//otra clase 
export class PlazoCorporativo implements PoliticaDePlazo {
  readonly nombre: string;
  private readonly horasContratadas: number;

  constructor(horasContratadas: number) {
    this.horasContratadas = horasContratadas;
    this.nombre = `corporativo (SLA ${horasContratadas}h)`;
  }

  calcular(recepcion: Date, prioridad: Prioridad, _esRemoto: boolean): Date {
    return sumarHoras(recepcion, prioridad === 'URGENTE' ? this.horasContratadas / 2 : this.horasContratadas);
  }
}

//contrato 
const POLITICA_POR_CONTRATO: Record<Contrato, PoliticaDePlazo> = {
  ESTANDAR: new PlazoEstandar(),
  GARANTIA: new PlazoDeGarantia(),
  CORPORATIVO: new PlazoCorporativo(12),
};



let ultimoNumero = 0;

function registrarOrden(politica: PoliticaDePlazo, cliente: Cliente, equipo: Equipo | null,
                        diagnostico: string, prioridad: Prioridad): OrdenDeTrabajo {
  ultimoNumero += 1;
  const numero = String(ultimoNumero).padStart(4, '0');
  const esRemoto = equipo === null;
  const prometida = politica.calcular(LUNES_9AM, prioridad, esRemoto);   // <-- la única línea que cambió
  const orden = new OrdenDeTrabajo(`${esRemoto ? 'TK' : 'OT'}-${numero}`, cliente, equipo,
                                   diagnostico, prioridad, LUNES_9AM, prometida);
  console.log(`[ORDEN] ${orden.codigo} · ${prioridad} · ${politica.nombre} · prometida ${formatearFecha(orden.fechaPrometida)}`);
  return orden;
}

// ============================================================================
// DEMO
// ============================================================================

const juan = new Cliente('Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');

console.log('========== H3 · CON STRATEGY ==========');

console.log('-- 1 · ANTES: la función con if/else, llamada a mano --');
console.log(`  taller ALTA    -> ${formatearFecha(calcularPlazoAntes('ESTANDAR', false, LUNES_9AM, 'ALTA'))}`);
console.log(`  remoto URGENTE -> ${formatearFecha(calcularPlazoAntes('ESTANDAR', true, LUNES_9AM, 'URGENTE'))}`);

console.log('-- 2 · DESPUÉS: las mismas dos órdenes, con la política inyectada --');
const estandar = POLITICA_POR_CONTRATO.ESTANDAR;
registrarOrden(estandar, juan, laptop, 'No enciende, olor a quemado', 'ALTA');
registrarOrden(estandar, juan, null, 'Outlook no sincroniza el correo', 'URGENTE');

console.log('-- 3 · la prueba de que no se rompió nada: ANTES y DESPUÉS dan lo mismo --');
for (const contrato of ['ESTANDAR', 'GARANTIA', 'CORPORATIVO'] as Contrato[]) {
  for (const prioridad of ['NORMAL', 'URGENTE'] as Prioridad[]) {
    for (const esRemoto of [false, true]) {
      const antes = calcularPlazoAntes(contrato, esRemoto, LUNES_9AM, prioridad);
      const despues = POLITICA_POR_CONTRATO[contrato].calcular(LUNES_9AM, prioridad, esRemoto);
      const iguales = antes.getTime() === despues.getTime();
      console.log(`  ${iguales ? 'OK   ' : 'FALLA'} ${contrato}/${prioridad}/${esRemoto ? 'remoto' : 'taller'} -> ${formatearFecha(despues)}`);
    }
  }
}

console.log('-- 4 · lo que el ANTES no podía hacer sin abrir la función --');
// El mismo registrarOrden() de arriba, sin tocar una línea, atiende contratos que no conocía.
registrarOrden(POLITICA_POR_CONTRATO.GARANTIA, juan, laptop, 'Pantalla con líneas (en garantía)', 'URGENTE');
registrarOrden(POLITICA_POR_CONTRATO.CORPORATIVO, juan, laptop, 'Servidor de la sucursal caído', 'URGENTE');

// Y un contrato que se firma HOY: una clase nueva, cero cambios en registrarOrden().
class PlazoExpressDeFeria implements PoliticaDePlazo {
  readonly nombre = 'express de feria (mismo día)';

  calcular(recepcion: Date, _prioridad: Prioridad, _esRemoto: boolean): Date {
    return sumarHoras(recepcion, 8);
  }
}
registrarOrden(new PlazoExpressDeFeria(), juan, laptop, 'Cambio de teclado', 'NORMAL');
