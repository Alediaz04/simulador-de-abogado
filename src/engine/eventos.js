/**
 * Implementación del patrón Observer para emitir eventos del motor.
 * Eventos soportados: 'cartaJugada', 'penalizacionAplicada', 'veredictoListo'
 */
export class EmisorEventos {
  constructor() {
    /** @type {Map<string, Set<Function>>} */
    this.suscriptores = new Map();
  }

  /**
   * Suscribe un listener a un evento específico.
   * @param {string} evento
   * @param {Function} callback
   * @returns {Function} Función para cancelar la suscripción.
   */
  on(evento, callback) {
    if (!this.suscriptores.has(evento)) {
      this.suscriptores.set(evento, new Set());
    }
    this.suscriptores.get(evento).add(callback);
    return () => this.off(evento, callback);
  }

  /**
   * Elimina un listener de un evento.
   * @param {string} evento
   * @param {Function} callback
   */
  off(evento, callback) {
    const lista = this.suscriptores.get(evento);
    if (lista) {
      lista.delete(callback);
    }
  }

  /**
   * Emite un evento notificando a todos los suscriptores registrados.
   * @param {string} evento
   * @param {any} payload
   */
  emit(evento, payload) {
    const lista = this.suscriptores.get(evento);
    if (!lista) return;
    for (const callback of lista) {
      callback(payload);
    }
  }
}
