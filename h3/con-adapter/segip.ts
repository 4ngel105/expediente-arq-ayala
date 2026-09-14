// H3 · ADAPTER — el servicio EXTERNO (Adaptee): código que SIGOT no controla
// Simula la API de consulta del SEGIP. Habla su propio idioma: número de documento numérico,
// departamento como código (1 = CH ... 9 = PD), nombre partido en tres campos, códigos de respuesta
// y excepciones de red. SIGOT no puede cambiar nada de esto: por eso se adapta en vez de modificarse.

export interface SegipSolicitud {
  nroDocumento: number;
  complemento: string;
  codDepartamento: number;
}

export interface SegipPersona {
  nombres: string;
  primerApellido: string;
  segundoApellido: string;
  fechaNacimiento: string;
}

export interface SegipRespuesta {
  codigoRespuesta: number;          // 1 = consulta exitosa, 2 = no existe registro
  mensaje: string;
  datosPersona: SegipPersona | null;
}

export class ServicioSegipFalso {
  private disponible = true;
  private readonly padron = new Map<string, SegipPersona>([
    ['4789123||2', { nombres: 'JUAN CARLOS', primerApellido: 'PEREZ', segundoApellido: 'MAMANI', fechaNacimiento: '14/03/1990' }],
    ['6543210|1A|3', { nombres: 'MARIA', primerApellido: 'QUISPE', segundoApellido: 'CONDORI', fechaNacimiento: '02/11/1985' }],
  ]);

  simularCaida(caido: boolean): void {
    this.disponible = !caido;
  }

  async consultaDatosPersona(solicitud: SegipSolicitud): Promise<SegipRespuesta> {
    if (!this.disponible) throw new Error('ECONNREFUSED: el servicio no responde');

    const clave = `${solicitud.nroDocumento}|${solicitud.complemento}|${solicitud.codDepartamento}`;
    const persona = this.padron.get(clave);
    return persona
      ? { codigoRespuesta: 1, mensaje: 'CONSULTA EXITOSA', datosPersona: persona }
      : { codigoRespuesta: 2, mensaje: 'NO EXISTE REGISTRO', datosPersona: null };
  }
}
