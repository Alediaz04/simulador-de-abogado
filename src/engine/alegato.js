/**
 * Componente base para el patrón Decorator.
 * Tiene las dimensiones formalidad, ironia y teatralidad, más un bonus de evidencia.
 */
export class AlegatoBase {
  /**
   * @param {object} [valoresIniciales]
   */
  constructor(valoresIniciales = {}) {
    this.formalidadInicial = valoresIniciales.formalidad ?? 0;
    this.ironiaInicial = valoresIniciales.ironia ?? 0;
    this.teatralidadInicial = valoresIniciales.teatralidad ?? 0;
    this.bonusEvidenciaInicial = valoresIniciales.bonusEvidencia ?? 0;
  }

  obtenerFormalidad() {
    return this.formalidadInicial;
  }

  obtenerIronia() {
    return this.ironiaInicial;
  }

  obtenerTeatralidad() {
    return this.teatralidadInicial;
  }

  obtenerBonusEvidencia() {
    return this.bonusEvidenciaInicial;
  }

  obtenerCartasJugadas() {
    return [];
  }
}
