/**
 * Limita un valor numérico al rango [0, 10] (clamp).
 * @param {number} valor
 * @returns {number}
 */
function clamp0a10(valor) {
  return Math.min(10, Math.max(0, valor));
}

/**
 * Decorador que envuelve un Alegato y suma o resta sobre formalidad, ironia, teatralidad y bonus de evidencia.
 * Limita (clamp) formalidad, ironia y teatralidad al rango de 0 a 10 después de aplicar cada carta.
 * Sin combos ni efectos especiales entre cartas.
 */
export class CartaDecorator {
  /**
   * @param {import('../alegato.js').AlegatoBase} alegatoEnvuelto
   * @param {object} datosCarta
   */
  constructor(alegatoEnvuelto, datosCarta) {
    if (!alegatoEnvuelto) {
      throw new Error('CartaDecorator requiere una instancia de Alegato para envolver.');
    }
    this.alegato = alegatoEnvuelto;
    this.carta = datosCarta;
  }

  // Se aplica clamp al rango [0, 10] tras sumar/restar el modificador de la carta
  obtenerFormalidad() {
    return clamp0a10(this.alegato.obtenerFormalidad() + (this.carta.formalidad ?? 0));
  }

  // Se aplica clamp al rango [0, 10] tras sumar/restar el modificador de la carta
  obtenerIronia() {
    return clamp0a10(this.alegato.obtenerIronia() + (this.carta.ironia ?? 0));
  }

  // Se aplica clamp al rango [0, 10] tras sumar/restar el modificador de la carta
  obtenerTeatralidad() {
    return clamp0a10(this.alegato.obtenerTeatralidad() + (this.carta.teatralidad ?? 0));
  }

  obtenerBonusEvidencia() {
    return this.alegato.obtenerBonusEvidencia() + (this.carta.bonusEvidencia ?? 0);
  }

  obtenerCartasJugadas() {
    return [...this.alegato.obtenerCartasJugadas(), this.carta];
  }
}
