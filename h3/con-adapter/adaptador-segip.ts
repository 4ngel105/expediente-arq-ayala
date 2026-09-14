// H3 · ADAPTER — el ADAPTADOR
// Firma el contrato de SIGOT y por dentro habla con el SEGIP. Traduce en los dos sentidos:
// ida (Cliente -> SegipSolicitud) y vuelta (SegipRespuesta o excepción -> ResultadoVerificacion).
// Es la ÚNICA clase del sistema que conoce los dos idiomas.

import type { Cliente } from './modelo.ts';
import type { SegipRespuesta, SegipSolicitud, ServicioSegipFalso } from './segip.ts';
import type { ResultadoVerificacion, VerificadorDeIdentidad } from './verificador-de-identidad.ts';

export class AdaptadorSegip implements VerificadorDeIdentidad {
  private static readonly CODIGO_DEPARTAMENTO: Record<string, number> = {
    CH: 1, LP: 2, CB: 3, OR: 4, PT: 5, TJ: 6, SC: 7, BE: 8, PD: 9,
  };

  private readonly segip: ServicioSegipFalso;

  constructor(segip: ServicioSegipFalso) {
    this.segip = segip;
  }

  async verificar(cliente: Cliente): Promise<ResultadoVerificacion> {
    const departamento = AdaptadorSegip.CODIGO_DEPARTAMENTO[cliente.expedido.toUpperCase()];
    if (!/^\d+$/.test(cliente.numeroDocumento) || departamento === undefined) {
      return { estado: 'NO_ENCONTRADO' };
    }

    // Ida: nuestro cliente -> la solicitud del SEGIP
    const solicitud: SegipSolicitud = {
      nroDocumento: Number(cliente.numeroDocumento),
      complemento: cliente.complemento.trim().toUpperCase(),
      codDepartamento: departamento,
    };

    let respuesta: SegipRespuesta;
    try {
      respuesta = await this.segip.consultaDatosPersona(solicitud);
    } catch (error) {
      // Una excepción ajena se traduce a un resultado del dominio: no cruza la frontera.
      const motivo = error instanceof Error ? error.message : String(error);
      return { estado: 'SERVICIO_NO_DISPONIBLE', motivo };
    }

    // Vuelta: código numérico y nombre partido -> nuestro resultado
    if (respuesta.codigoRespuesta !== 1 || respuesta.datosPersona === null) {
      return { estado: 'NO_ENCONTRADO' };
    }

    const p = respuesta.datosPersona;
    const nombreOficial = [p.nombres, p.primerApellido, p.segundoApellido].filter(Boolean).join(' ');
    return normalizar(nombreOficial) === normalizar(cliente.nombreCompleto)
      ? { estado: 'VERIFICADO', nombreOficial }
      : { estado: 'NOMBRE_NO_COINCIDE' };
  }
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .trim();
}
