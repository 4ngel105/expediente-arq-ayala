// H3 · BUILDER — la orden se arma por pasos y nace válida o no nace
// En la base, new OrdenDeTrabajo() recibía 7 argumentos posicionales de una vez. Dos fechas seguidas
// del mismo tipo se podían invertir sin que nada avise, y el null del equipo significaba "remoto" por convención.
// En Angular esto es el stepper del formulario de recepción (RF1): cada paso carga una parte del borrador.

import { OrdenDeTrabajo, sumarDias, sumarHoras } from './modelo.ts';
import type { Cliente, Equipo, Prioridad } from './modelo.ts';

export class OrdenBuilder {
  private codigo = '';
  private cliente: Cliente | null = null;
  private equipo: Equipo | null = null;
  private remoto = false;
  private diagnostico = '';
  private prioridad: Prioridad = 'NORMAL';
  private recepcion: Date | null = null;
  private prometida: Date | null = null;

  // ---- los pasos: cada uno tiene nombre, así el orden de los argumentos deja de importar ----

  conCodigo(codigo: string): this {
    this.codigo = codigo;
    return this;
  }

  paraCliente(cliente: Cliente): this {
    this.cliente = cliente;
    return this;
  }

  conEquipo(equipo: Equipo): this {
    this.equipo = equipo;
    return this;
  }

  // "Es remoto" pasa a ser una decisión explícita, no un null.
  comoTicketRemoto(): this {
    this.remoto = true;
    return this;
  }

  conDiagnostico(diagnostico: string): this {
    this.diagnostico = diagnostico;
    return this;
  }

  conPrioridad(prioridad: Prioridad): this {
    this.prioridad = prioridad;
    return this;
  }

  recibidaEl(fecha: Date): this {
    this.recepcion = fecha;
    return this;
  }

  // Opcional: si no se da, build() aplica el plazo por defecto según tipo y prioridad.
  prometidaPara(fecha: Date): this {
    this.prometida = fecha;
    return this;
  }

  // ---- el único lugar donde nace una OrdenDeTrabajo ----

  build(): OrdenDeTrabajo {
    const faltantes: string[] = [];
    if (this.codigo === '') faltantes.push('código');
    if (this.cliente === null) faltantes.push('cliente');
    if (this.diagnostico.trim() === '') faltantes.push('diagnóstico inicial');
    if (this.recepcion === null) faltantes.push('fecha de recepción');
    if (!this.remoto && this.equipo === null) faltantes.push('equipo (o marcarla como ticket remoto)');
    if (faltantes.length > 0 || this.cliente === null || this.recepcion === null) {
      throw new Error(`orden incompleta, falta: ${faltantes.join(', ')}`);
    }
    if (this.remoto && this.equipo !== null) {
      throw new Error('un ticket remoto no lleva equipo en el taller');
    }

    const prometida = this.prometida ?? this.plazoPorDefecto(this.recepcion);
    if (prometida.getTime() <= this.recepcion.getTime()) {
      throw new Error('la fecha prometida no es posterior a la recepción (¿fechas invertidas?)');
    }

    return new OrdenDeTrabajo(this.codigo, this.cliente, this.remoto ? null : this.equipo,
                              this.diagnostico, this.prioridad, this.recepcion, prometida);
  }

  // La regla de plazos que en la base estaba copiada en cada case del switch.
  private plazoPorDefecto(recepcion: Date): Date {
    if (this.remoto) return sumarHoras(recepcion, this.prioridad === 'URGENTE' ? 4 : 24);
    return sumarDias(recepcion, this.prioridad === 'URGENTE' ? 1 : 3);
  }
}
