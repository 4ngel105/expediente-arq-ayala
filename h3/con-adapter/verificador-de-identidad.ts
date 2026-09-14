// H3 · ADAPTER — el CONTRATO (Target), en el idioma de SIGOT
// Lo define el dominio según lo que M3 necesita saber de un cliente. No menciona al SEGIP:
// ni códigos numéricos de departamento, ni nombres partidos en tres campos.

import type { Cliente } from './modelo.ts';

export type ResultadoVerificacion =
  | { estado: 'VERIFICADO'; nombreOficial: string }
  | { estado: 'NOMBRE_NO_COINCIDE' }
  | { estado: 'NO_ENCONTRADO' }
  | { estado: 'SERVICIO_NO_DISPONIBLE'; motivo: string };

// LSP: ninguna implementación lanza excepciones; todo termina en un ResultadoVerificacion.
export interface VerificadorDeIdentidad {
  verificar(cliente: Cliente): Promise<ResultadoVerificacion>;
}
