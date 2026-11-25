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
    const copia = structuredClone ? structuredClone(partida) : JSON.parse(JSON.stringify(partida));
    this.partidas.push(copia);
  }

  async obtenerTodas() {
    return [...this.partidas];
  }

  /**
   * Verifica si el jugador ya utilizó alguno de los tipos de carta jugados
   * en partidas anteriores frente al mismo juez (o si repitió tipo dentro de la misma mano con ese juez).
   * @param {string} juezId
   * @param {Array<string>} tiposCartasJugadas
   * @returns {Promise<boolean>}
   */
  async repitioTipoCartaConJuez(juezId, tiposCartasJugadas) {
    // 1. Verificar si en el historial de partidas previas con este juez ya se usó alguno de estos tipos
    const partidasConEsteJuez = this.partidas.filter((p) => p.juezId === juezId);
    const tiposUsadosPreviamente = new Set(
      partidasConEsteJuez.flatMap((p) => (p.cartas ?? []).map((c) => c.tipo))
    );

    const repitioContraHistorialPrevio = tiposCartasJugadas.some((tipo) =>
      tiposUsadosPreviamente.has(tipo)
    );

    // 2. Verificar también si repitió tipo de carta en la misma jugada ante este juez
    const repitioEnMismaMano = new Set(tiposCartasJugadas).size < tiposCartasJugadas.length;

    return repitioContraHistorialPrevio || repitioEnMismaMano;
  }

  async limpiar() {
    this.partidas = [];
  }
}
