/**
 * Generador modular de casos absurdos con parámetros gravedad, absurdo y evidencia_disponible (0 a 10).
 */
export class GeneradorCasos {
  /**
   * @param {object} modulos - Diccionario con acusados, cargos, contextos y parametrosBase.
   */
  constructor(modulos) {
    this.modulos = modulos;
  }

  static validarRango(valor, nombreCampo) {
    if (valor < 0 || valor > 10) {
      throw new RangeError(`El parámetro "${nombreCampo}" del caso debe estar entre 0 y 10.`);
    }
    return valor;
  }

  /**
   * Genera un caso combinando módulos por índice fijo o aleatorio.
   * @param {object} [indices]
   */
  generarCaso(indices = {}) {
    const { acusados, cargos, contextos, parametrosBase } = this.modulos;

    const idxAcusado = indices.acusado ?? Math.floor(Math.random() * acusados.length);
    const idxCargo = indices.cargo ?? Math.floor(Math.random() * cargos.length);
    const idxContexto = indices.contexto ?? Math.floor(Math.random() * contextos.length);
    const idxParams = indices.parametros ?? Math.floor(Math.random() * parametrosBase.length);

    const acusado = acusados[idxAcusado];
    const cargo = cargos[idxCargo];
    const contexto = contextos[idxContexto];
    const params = parametrosBase[idxParams];

    const gravedad = GeneradorCasos.validarRango(params.gravedad, 'gravedad');
    const absurdo = GeneradorCasos.validarRango(params.absurdo, 'absurdo');
    const evidencia_disponible = GeneradorCasos.validarRango(
      params.evidencia_disponible,
      'evidencia_disponible'
    );

    return {
      id: `caso-${idxAcusado}-${idxCargo}-${idxContexto}`,
      titulo: `El Pueblo vs. ${acusado}`,
      acusado,
      cargo,
      contexto,
      descripcionCompleta: `Se acusa a "${acusado}" de ${cargo}, ${contexto}.`,
      gravedad,
      absurdo,
      evidencia_disponible
    };
  }
}
