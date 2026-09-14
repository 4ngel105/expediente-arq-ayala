// H3 · BASE — el corazón de SIGOT, SIN patrones
// Transcrito del diagrama DESPUÉS del H2, reducido a las 5 clases que sostienen el ciclo de vida
// de una orden: Cliente, Equipo, Tecnico, Avance y OrdenDeTrabajo.
// Este archivo se copia IGUAL en cada carpeta con-<patron>/: si un patrón necesita tocarlo, se nota en el diff.

export type EstadoOrden = 'RECIBIDA' | 'DIAGNOSTICADA' | 'EN_REPARACION' | 'LISTA' | 'ENTREGADA' | 'CANCELADA';
export type Prioridad = 'BAJA' | 'NORMAL' | 'ALTA' | 'URGENTE';

export type ResultadoTransicion = { ok: true } | { ok: false; motivo: string };

// La tabla de transiciones de docs/03-diagrama-clases.md, tal cual.
// En el H2 la partí en una clase por estado (eso ya es el patrón State); en la base vuelve a ser
// un dato, para que la base no traiga ningún patrón puesto.
const TRANSICIONES: Record<EstadoOrden, EstadoOrden[]> = {
  RECIBIDA: ['DIAGNOSTICADA', 'CANCELADA'],
  DIAGNOSTICADA: ['EN_REPARACION', 'CANCELADA'],
  EN_REPARACION: ['LISTA', 'DIAGNOSTICADA'],
  LISTA: ['ENTREGADA'],
  ENTREGADA: [],
  CANCELADA: [],
};

// ============ M3 · CLIENTES Y EQUIPOS ============

export class Cliente {
  readonly nombreCompleto: string;
  readonly numeroDocumento: string;
  readonly complemento: string;
  readonly expedido: string;
  readonly telefono: string;

  constructor(nombreCompleto: string, numeroDocumento: string, expedido: string, telefono: string, complemento = '') {
    this.nombreCompleto = nombreCompleto;
    this.numeroDocumento = numeroDocumento;
    this.expedido = expedido;
    this.telefono = telefono;
    this.complemento = complemento;
  }

  documento(): string {
    const complemento = this.complemento ? `-${this.complemento.toUpperCase()}` : '';
    return `CI ${this.numeroDocumento}${complemento} ${this.expedido}`;
  }
}

export class Equipo {
  readonly tipo: string;
  readonly marca: string;
  readonly modelo: string;
  readonly numeroSerie: string;
  readonly accesorios: string;

  constructor(tipo: string, marca: string, modelo: string, numeroSerie: string, accesorios = '') {
    this.tipo = tipo;
    this.marca = marca;
    this.modelo = modelo;
    this.numeroSerie = numeroSerie;
    this.accesorios = accesorios;
  }

  identificacion(): string {
    return `${this.tipo} ${this.marca} ${this.modelo} (S/N ${this.numeroSerie})`;
  }
}

// ============ M0 · QUIÉN TRABAJA LA ORDEN ============

// Solo la identidad del técnico. PerfilDeCapacidad (la carga de trabajo) se separó en el H2
// y pertenece a M2: queda fuera de la base porque la base es el ciclo de vida de la orden.
export class Tecnico {
  readonly nombre: string;
  readonly especialidad: string;

  constructor(nombre: string, especialidad: string) {
    this.nombre = nombre;
    this.especialidad = especialidad;
  }
}

// ============ M1 · RECEPCIÓN Y ÓRDENES ============

// Inmutable: la bitácora no se edita ni se borra (invariante 2).
export class Avance {
  readonly estadoAnterior: EstadoOrden;
  readonly estadoNuevo: EstadoOrden;
  readonly autor: string;
  readonly comentario: string;

  constructor(estadoAnterior: EstadoOrden, estadoNuevo: EstadoOrden, autor: string, comentario = '') {
    this.estadoAnterior = estadoAnterior;
    this.estadoNuevo = estadoNuevo;
    this.autor = autor;
    this.comentario = comentario;
  }
}

export class OrdenDeTrabajo {
  readonly codigo: string;
  readonly cliente: Cliente;
  readonly equipo: Equipo | null;          // null = ticket de soporte remoto: no hay equipo en el taller
  readonly diagnosticoInicial: string;
  readonly prioridad: Prioridad;
  readonly fechaRecepcion: Date;
  readonly fechaPrometida: Date;

  private estadoActual: EstadoOrden = 'RECIBIDA';
  private tecnicoAsignado: Tecnico | null = null;
  private readonly bitacora: Avance[] = [];

  constructor(codigo: string, cliente: Cliente, equipo: Equipo | null, diagnosticoInicial: string,
              prioridad: Prioridad, fechaRecepcion: Date, fechaPrometida: Date) {
    this.codigo = codigo;
    this.cliente = cliente;
    this.equipo = equipo;
    this.diagnosticoInicial = diagnosticoInicial;
    this.prioridad = prioridad;
    this.fechaRecepcion = fechaRecepcion;
    this.fechaPrometida = fechaPrometida;
  }

  get estado(): EstadoOrden {
    return this.estadoActual;
  }

  get tecnico(): Tecnico | null {
    return this.tecnicoAsignado;
  }

  avances(): readonly Avance[] {
    return this.bitacora;
  }

  asignarA(tecnico: Tecnico): void {
    this.tecnicoAsignado = tecnico;
  }

  // No existe setEstado(): toda transición pasa por acá y deja rastro (invariantes 1 y 2).
  cambiarEstado(destino: EstadoOrden, autor: string, comentario = ''): ResultadoTransicion {
    if (!TRANSICIONES[this.estadoActual].includes(destino)) {
      return { ok: false, motivo: `de ${this.estadoActual} no se puede pasar a ${destino}` };
    }
    if (destino === 'EN_REPARACION' && this.tecnicoAsignado === null) {
      return { ok: false, motivo: 'no se pasa a EN_REPARACION sin técnico asignado' };   // invariante 4
    }
    this.bitacora.push(new Avance(this.estadoActual, destino, autor, comentario));
    this.estadoActual = destino;
    return { ok: true };
  }
}

// ============ UTILIDADES DE FECHA (no son clases del dominio) ============

export function sumarHoras(fecha: Date, horas: number): Date {
  return new Date(fecha.getTime() + horas * 60 * 60 * 1000);
}

export function sumarDias(fecha: Date, dias: number): Date {
  return sumarHoras(fecha, dias * 24);
}

export function formatearFecha(fecha: Date): string {
  const dos = (n: number) => String(n).padStart(2, '0');
  return `${dos(fecha.getDate())}/${dos(fecha.getMonth() + 1)}/${fecha.getFullYear()} ${dos(fecha.getHours())}:${dos(fecha.getMinutes())}`;
}
