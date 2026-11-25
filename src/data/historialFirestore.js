import { RepositorioHistorial } from './repositorioHistorial.js';

/**
 * Stub reservado para la futura implementación con Firebase Firestore.
 */
export class HistorialFirestore extends RepositorioHistorial {
  async guardarPartida(_partida) {
    throw new Error('HistorialFirestore aún no está conectado.');
  }

  async obtenerTodas() {
    throw new Error('HistorialFirestore aún no está conectado.');
  }

  async repitioTipoCartaConJuez(_juezId, _tiposCartasJugadas) {
    throw new Error('HistorialFirestore aún no está conectado.');
  }
}
