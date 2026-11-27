import { RepositorioHistorial } from './repositorioHistorial.js';

/**
 * Implementación en memoria de RepositorioHistorial.
 */
export class HistorialMemoria extends RepositorioHistorial {
  constructor() {
    super();
    /** @type {Array<object>} */
    this.partidas = [];
  }

  async guardarPartida(partida) {
    const copia = JSON.parse(JSON.stringify(partida));
    this.partidas.push(copia);
  }

  async obtenerTodas() {
    return [...this.partidas];
  }

  /**
   * Verifica si el jugador ya utilizó alguno de los tipos de carta jugados
   * en partidas anteriores frente al mismo juez.
   * @param {string} juezId
   * @param {Array<string>} tiposCartasJugadas
   * @returns {Promise<boolean>}
   */
  async repitioTipoCartaConJuez(juezId, tiposCartasJugadas) {
    const partidasConEsteJuez = this.partidas.filter((p) => p.juezId === juezId);
    const tiposUsadosPreviamente = new Set(
      partidasConEsteJuez.flatMap((p) => (p.cartas ?? []).map((c) => c.tipo))
    );

    return tiposCartasJugadas.some((tipo) => tiposUsadosPreviamente.has(tipo));
  }

  async limpiar() {
    this.partidas = [];
  }
}
