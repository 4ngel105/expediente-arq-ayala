
import { Cliente, Equipo, OrdenDeTrabajo, formatearFecha, sumarHoras } from './modelo.ts';

const LUNES_9AM = new Date(2026, 8, 14, 9, 0);

// ============================================================================
// 1 · ANTES: los extras como banderas
// ============================================================================

type Cotizacion = { detalle: string; precio: number; horas: number };

function cotizarAntes(conRespaldo: boolean, conDomicilio: boolean): Cotizacion {
  let detalle = 'Reparación en taller';
  let precio = 150;
  let horas = 72;

  
  if (conRespaldo) {
    detalle += ' + respaldo de datos';
    precio += 80;
    horas += 4;
  }
  if (conDomicilio) {
    detalle += ' + recojo a domicilio';
    precio += 120;
    horas += 24;
  }
  return { detalle, precio, horas };
}

// ============================================================================
// 2 · EL CONTRATO (Component)
// ============================================================================

export interface Servicio {
  detalle(): string;
  precio(): number;   // en Bs
  horas(): number;    // cuánto empuja la fecha prometida
}

// ============================================================================
// 3 · LA PIEZA BASE (ConcreteComponent)
// ============================================================================

export class ReparacionEnTaller implements Servicio {
  detalle(): string { return 'Reparación en taller'; }
  precio(): number { return 150; }
  horas(): number { return 72; }
}

// ============================================================================
// 4 · EL DECORADOR ABSTRACTO 
// ============================================================================

export abstract class DecoradorDeServicio implements Servicio {
  protected readonly base: Servicio;   // protected: los extras concretos lo usan vía super

  constructor(base: Servicio) {
    this.base = base;
  }

  detalle(): string { return this.base.detalle(); }
  precio(): number { return this.base.precio(); }
  horas(): number { return this.base.horas(); }
}

// ============================================================================
// 5 · LAS DOS CAPAS (ConcreteDecorators)
// ============================================================================

// CAPA 1 · el cliente no quiere perder sus fotos: se clona el disco antes de meter mano.
export class ConRespaldoDeDatos extends DecoradorDeServicio {
  override detalle(): string { return super.detalle() + ' + respaldo de datos'; }
  override precio(): number { return super.precio() + 80; }
  override horas(): number { return super.horas() + 4; }
}

// CAPA 2 · el cliente no puede acercarse al taller: la movilidad va y vuelve.
export class ConRecojoADomicilio extends DecoradorDeServicio {
  override detalle(): string { return super.detalle() + ' + recojo a domicilio'; }
  override precio(): number { return super.precio() + 120; }
  override horas(): number { return super.horas() + 24; }
}

// ============================================================================
// 6 · EL TALLER COTIZA
// ============================================================================

function cotizar(servicio: Servicio): void {
  console.log(`  ${servicio.detalle()}`);
  console.log(`    Bs ${servicio.precio()} · ${servicio.horas()} h`);
}

function abrirOrden(codigo: string, cliente: Cliente, equipo: Equipo | null,
                    diagnostico: string, servicio: Servicio): OrdenDeTrabajo {
  const prometida = sumarHoras(LUNES_9AM, servicio.horas());   // las horas salen del servicio armado
  const orden = new OrdenDeTrabajo(codigo, cliente, equipo, diagnostico, 'NORMAL', LUNES_9AM, prometida);
  console.log(`[ORDEN] ${orden.codigo} · ${servicio.detalle()}`);
  console.log(`        Bs ${servicio.precio()} · prometida ${formatearFecha(orden.fechaPrometida)}`);
  return orden;
}



// ============================================================================
// DEMO
// ============================================================================

console.log('========== H3 · CON DECORATOR ==========');

const juan = new Cliente('Juan Carlos Pérez Mamani', '4789123', 'LP',  '70011223');
const maria = new Cliente('María Quispe Condori', '6543210', 'CB', '71234567', '1a');
const laptop = new Equipo('Laptop', 'Lenovo', 'ThinkPad T14', 'PF3K9Z', 'cargador');
const pc = new Equipo('PC de escritorio', 'HP', 'ProDesk 400', 'MXL2410', '');

console.log('-- 1 · ANTES: los extras como booleanos en la llamada --');
const antesA = cotizarAntes(true, false);
console.log(`  cotizarAntes(true, false) -> ${antesA.detalle} · Bs ${antesA.precio} · ${antesA.horas} h`);
const antesB = cotizarAntes(true, true);
console.log(`  cotizarAntes(true, true)  -> ${antesB.detalle} · Bs ${antesB.precio} · ${antesB.horas} h`);



console.log('-- 2 · DESPUÉS: DOS combinaciones armadas en la llamada, cero clases nuevas --');

// COMBINACIÓN 1 · Juan trae la laptop él mismo, pero no quiere perder sus fotos.
const servicioDeJuan = new ConRespaldoDeDatos(
  new ReparacionEnTaller()
);
cotizar(servicioDeJuan);

// COMBINACIÓN 2 · María no puede venir al taller, y además quiere el respaldo.
// Se usan las MISMAS tres clases de arriba: lo único distinto es cómo se anidan.
const servicioDeMaria = new ConRecojoADomicilio(
  new ConRespaldoDeDatos(
    new ReparacionEnTaller()
  )
);
cotizar(servicioDeMaria);

console.log('-- 3 · la prueba de que no se rompió nada: ANTES y DESPUÉS dan lo mismo --');
for (const respaldo of [false, true]) {
  for (const domicilio of [false, true]) {
    const antes = cotizarAntes(respaldo, domicilio);

    // El mismo armado, pero decidido acá afuera y no adentro de una función llena de ifs.
    let despues: Servicio = new ReparacionEnTaller();
    if (respaldo) despues = new ConRespaldoDeDatos(despues);
    if (domicilio) despues = new ConRecojoADomicilio(despues);

    const iguales = antes.precio === despues.precio() && antes.horas === despues.horas();
    console.log(`  ${iguales ? 'OK   ' : 'FALLA'} respaldo=${respaldo} domicilio=${domicilio} -> Bs ${despues.precio()} · ${despues.horas()} h`);
  }
}

console.log('-- 4 · el servicio armado entra en la orden de siempre --');
// OrdenDeTrabajo no sabe que existen los extras: solo recibe una fecha prometida ya calculada.
abrirOrden('OT-0001', juan, laptop, 'No enciende, olor a quemado', servicioDeJuan);
abrirOrden('OT-0002', maria, pc, 'Se reinicia sola al abrir el navegador', servicioDeMaria);
