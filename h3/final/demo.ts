// H3 · FINAL — LA FUSIÓN: Decorator + Strategy
//
// Dos patrones que ya vivían en carpetas separadas, y que acá se conectan por un solo dato.
//
//   DECORATOR (h3/con-decorator/)  arma QUÉ se contrató     -> su salida es horas()
//   STRATEGY  (h3/con-strategy/)   decide CÓMO se promete   -> su entrada son esas horas
//
// La costura es una sola línea:   politica.calcular(recepcion, prioridad, servicio.horas())
//
// No es coexistencia: hay un dato que nace en un patrón y se consume en el otro. El Decorator no
// sabe qué contrato tiene el cliente; la Strategy no sabe qué extras se contrataron.
//
// Lo que la fusión destapó: PoliticaDePlazo recibía esRemoto: boolean, que describe DÓNDE está el
// equipo. Lo que en realidad necesita saber es CUÁNTO TRABAJO HAY. Ese booleano desapareció y en su
// lugar entra un número que produce el Decorator. Ver h4/ADR-001.
//
// modelo.ts NO se tocó (mismo SHA-256 que base/).

import { Cliente, Equipo, OrdenDeTrabajo, formatearFecha, sumarHoras } from './modelo.ts';
import type { Prioridad } from './modelo.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);

// ============================================================================
// PATRÓN 1 · DECORATOR — el servicio contratado
// ============================================================================

// -- Contrato (Component) --
export interface Servicio {
  detalle(): string;
  precio(): number;   // en Bs
  horas(): number;    // el trabajo estimado: esto es lo que viaja hacia la Strategy
}

// -- Piezas base (ConcreteComponent) --
// Son DOS porque acá murió el booleano esRemoto: el lugar donde se trabaja dejó de ser una bandera
// y pasó a ser el servicio que se contrató, cada uno con su propio trabajo estimado.

export class ReparacionEnTaller implements Servicio {
  detalle(): string { return 'Reparación en taller'; }
  precio(): number { return 150; }
  horas(): number { return 72; }
}

export class SoporteRemoto implements Servicio {
  detalle(): string { return 'Soporte remoto'; }
  precio(): number { return 90; }
  horas(): number { return 24; }
}

// -- Decorador abstracto (Decorator) --
// ES un Servicio y TIENE un Servicio: por eso los extras se apilan.
export abstract class DecoradorDeServicio implements Servicio {
  protected readonly base: Servicio;

  constructor(base: Servicio) {
    this.base = base;
  }

  detalle(): string { return this.base.detalle(); }
  precio(): number { return this.base.precio(); }
  horas(): number { return this.base.horas(); }
}

// -- Las capas (ConcreteDecorators) --

export class ConRespaldoDeDatos extends DecoradorDeServicio {
  override detalle(): string { return super.detalle() + ' + respaldo de datos'; }
  override precio(): number { return super.precio() + 80; }
  override horas(): number { return super.horas() + 4; }
}

export class ConRecojoADomicilio extends DecoradorDeServicio {
  override detalle(): string { return super.detalle() + ' + recojo a domicilio'; }
  override precio(): number { return super.precio() + 120; }
  override horas(): number { return super.horas() + 24; }
}

// ============================================================================
// PATRÓN 2 · STRATEGY — la política de plazo del contrato
// ============================================================================

// -- Contrato --
// El tercer parámetro es la costura. Antes era esRemoto: boolean; ahora son las horas que
// produjo el Decorator.
export interface PoliticaDePlazo {
  readonly nombre: string;
  calcular(recepcion: Date, prioridad: Prioridad, horasBase: number): Date;
}

// Cliente de mostrador: paga, y la urgencia le parte el plazo al medio.
export class PlazoEstandar implements PoliticaDePlazo {
  readonly nombre = 'estándar';

  calcular(recepcion: Date, prioridad: Prioridad, horasBase: number): Date {
    return sumarHoras(recepcion, prioridad === 'URGENTE' ? horasBase / 2 : horasBase);
  }
}

// Reparación en garantía: no se cobra, así que no compite por la cola.
// IGNORA la prioridad a propósito: no es el mismo cálculo con otro número, es otra regla.
export class PlazoDeGarantia implements PoliticaDePlazo {
  readonly nombre = 'garantía (la prioridad no la acelera)';

  calcular(recepcion: Date, _prioridad: Prioridad, horasBase: number): Date {
    return sumarHoras(recepcion, horasBase * 2);
  }
}

// El corporativo contrató un techo: nunca espera más que su SLA, cueste lo que cueste el trabajo.
// Si el trabajo es más corto que el SLA, se entrega antes: el techo no es una promesa de demorar.
export class PlazoCorporativo implements PoliticaDePlazo {
  readonly nombre: string;
  private readonly slaHoras: number;

  constructor(slaHoras: number) {
    this.slaHoras = slaHoras;
    this.nombre = `corporativo (SLA ${slaHoras}h)`;
  }

  calcular(recepcion: Date, prioridad: Prioridad, horasBase: number): Date {
    const techo = prioridad === 'URGENTE' ? this.slaHoras / 2 : this.slaHoras;
    return sumarHoras(recepcion, Math.min(horasBase, techo));
  }
}

// ============================================================================
// LA COSTURA · el mostrador
// ============================================================================
// Esta función es todo el punto del H4: recibe un Servicio armado y una Política, y no conoce el
// detalle de ninguno de los dos. No sabe qué extras trae ni qué contrato es. Solo los conecta.

let ultimoNumero = 0;

function registrarOrden(servicio: Servicio, politica: PoliticaDePlazo, cliente: Cliente,
                        equipo: Equipo | null, diagnostico: string, prioridad: Prioridad): OrdenDeTrabajo {
  ultimoNumero += 1;
  const numero = String(ultimoNumero).padStart(4, '0');

  // ↓↓↓ LA FUSIÓN: el Decorator dice cuánto trabajo hay, la Strategy lo convierte en fecha. ↓↓↓
  const prometida = politica.calcular(LUNES_9AM, prioridad, servicio.horas());

  const orden = new OrdenDeTrabajo(`${equipo ? 'OT' : 'TK'}-${numero}`, cliente, equipo,
                                   diagnostico, prioridad, LUNES_9AM, prometida);

  console.log(`[ORDEN] ${orden.codigo} · ${cliente.nombreCompleto}`);
  console.log(`        servicio : ${servicio.detalle()} (${servicio.horas()} h · Bs ${servicio.precio()})`);
  console.log(`        contrato : ${politica.nombre} · ${prioridad}`);
  console.log(`        prometida: ${formatearFecha(orden.fechaPrometida)}`);
  return orden;
}

// ============================================================================
// DEMO
// ============================================================================

console.log('========== H3 · FINAL — DECORATOR + STRATEGY ==========');

const juan = new Cliente('Juan Carlos Pérez Mamani', '4789123', 'LP', '70011223');
const maria = new Cliente('María Quispe Condori', '6543210', 'CB', '71234567', '1a');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');
const pc = new Equipo('PC de escritorio', 'HP', 'ProDesk 400', 'MXL2410', '');

const ESTANDAR = new PlazoEstandar();
const GARANTIA = new PlazoDeGarantia();
const CORPORATIVO = new PlazoCorporativo(48);

console.log('-- 1 · dos órdenes reales: cada una arma su servicio y trae su contrato --');

// Juan trae la laptop y contrata el respaldo. Cliente de mostrador.
const servicioDeJuan = new ConRespaldoDeDatos(
  new ReparacionEnTaller()
);
registrarOrden(servicioDeJuan, ESTANDAR, juan, laptop, 'No enciende, olor a quemado', 'ALTA');

// María no puede venir, quiere respaldo, y su empresa tiene SLA corporativo.
const servicioDeMaria = new ConRecojoADomicilio(
  new ConRespaldoDeDatos(
    new ReparacionEnTaller()
  )
);
registrarOrden(servicioDeMaria, CORPORATIVO, maria, pc, 'Se reinicia sola al abrir el navegador', 'URGENTE');

console.log('-- 2 · los dos ejes son independientes: la matriz lo prueba --');
console.log('   (misma fila = mismo servicio con otro contrato · misma columna = otro servicio, mismo contrato)');

const servicios: Servicio[] = [
  new ReparacionEnTaller(),
  new ConRespaldoDeDatos(new ReparacionEnTaller()),
  new ConRecojoADomicilio(new ConRespaldoDeDatos(new ReparacionEnTaller())),
  new SoporteRemoto(),
];
const politicas: PoliticaDePlazo[] = [ESTANDAR, GARANTIA, CORPORATIVO];

for (const servicio of servicios) {
  console.log(`   ${servicio.detalle()} (${servicio.horas()} h)`);
  for (const politica of politicas) {
    const fecha = politica.calcular(LUNES_9AM, 'NORMAL', servicio.horas());
    console.log(`     ${politica.nombre.padEnd(38)} -> ${formatearFecha(fecha)}`);
  }
}

console.log('-- 3 · un extra nuevo NO toca ninguna política --');
// El taller empieza a vender instalación de software. Una clase, y las 3 políticas la entienden.
class ConInstalacionDeSoftware extends DecoradorDeServicio {
  override detalle(): string { return super.detalle() + ' + instalación de software'; }
  override precio(): number { return super.precio() + 60; }
  override horas(): number { return super.horas() + 6; }
}
const conInstalacion = new ConInstalacionDeSoftware(new ReparacionEnTaller());
for (const politica of politicas) {
  console.log(`   ${politica.nombre.padEnd(38)} -> ${formatearFecha(politica.calcular(LUNES_9AM, 'NORMAL', conInstalacion.horas()))}`);
}

console.log('-- 4 · un contrato nuevo NO toca ningún extra --');
// Se firma un convenio de feria: todo el mismo día, sin importar el trabajo. Una clase, y los
// 4 servicios de arriba (extras incluidos) siguen funcionando sin cambiar una línea.
class PlazoExpressDeFeria implements PoliticaDePlazo {
  readonly nombre = 'express de feria (mismo día)';

  calcular(recepcion: Date, _prioridad: Prioridad, _horasBase: number): Date {
    return sumarHoras(recepcion, 8);
  }
}
const feria = new PlazoExpressDeFeria();
for (const servicio of servicios) {
  console.log(`   ${servicio.detalle().padEnd(62)} -> ${formatearFecha(feria.calcular(LUNES_9AM, 'NORMAL', servicio.horas()))}`);
}

console.log('-- 5 · la orden sigue viviendo igual que en la base --');
// OrdenDeTrabajo recibió una fecha ya calculada y no se enteró de que existen extras ni contratos.
const ot = registrarOrden(new ConRespaldoDeDatos(new SoporteRemoto()), GARANTIA, maria, null,
                          'Outlook no sincroniza el correo', 'URGENTE');
console.log(`        estado   : ${ot.estado} · bitácora: ${ot.avances().length} avances`);
