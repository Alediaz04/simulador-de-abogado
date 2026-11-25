/**
 * Interfaz base (contrato) para los repositorios de historial de partidas.
 * Se inyecta en MotorJuicio mediante Dependency Injection.
 */
export class RepositorioHistorial {
  /**
   * Guarda el resultado de un juicio en el historial.
   * @param {object} _partida
   * @returns {Promise<void>}
   */
  async guardarPartida(_partida) {
    throw new Error('guardarPartida() debe ser implementado por una subclase.');
  }

  /**
   * Devuelve todas las partidas almacenadas.
   * @returns {Promise<Array<object>>}
   */
  async obtenerTodas() {
    throw new Error('obtenerTodas() debe ser implementado por una subclase.');
  }

  /**
   * Indica si el jugador repitió un tipo de carta con ese juez
   * (ya sea en las cartas de la partida o respecto al historial previo con ese juez).
   * @param {string} _juezId
   * @param {Array<string>} _tiposCartasJugadas
   * @returns {Promise<boolean>}
   */
  async repitioTipoCartaConJuez(_juezId, _tiposCartasJugadas) {
    throw new Error('repitioTipoCartaConJuez() debe ser implementado por una subclase.');
  }

  /**
   * Limpia el historial.
   * @returns {Promise<void>}
   */
  async limpiar() {
    throw new Error('limpiar() debe ser implementado por una subclase.');
  }
}
