import { MIN_CARTAS, MAX_CARTAS } from '../config/juego.js';
import { AlegatoBase } from './alegato.js';
import { decorarAlegatoConCarta } from './cartas/index.js';
import { EmisorEventos } from './eventos.js';

/**
 * Motor principal del Simulador de Abogado.
 * Recibe todas sus dependencias por inyección (Estrategia, RepositorioHistorial, EmisorEventos).
 * No tiene ninguna dependencia con DOM, Firebase ni /ui.
 */
export class MotorJuicio {
  /**
   * @param {object} dependencias
   * @param {import('./veredicto/EstrategiaVeredicto.js').EstrategiaVeredicto} dependencias.estrategiaVeredicto
   * @param {import('../data/repositorioHistorial.js').RepositorioHistorial} dependencias.repositorioHistorial
   * @param {EmisorEventos} [dependencias.eventos]
   */
  constructor({ estrategiaVeredicto, repositorioHistorial, eventos = new EmisorEventos() }) {
    if (!estrategiaVeredicto) {
      throw new Error('MotorJuicio requiere una estrategiaVeredicto inyectada.');
    }
    if (!repositorioHistorial) {
      throw new Error('MotorJuicio requiere un repositorioHistorial inyectado.');
    }

    this.estrategiaVeredicto = estrategiaVeredicto;
    this.repositorioHistorial = repositorioHistorial;
    this.eventos = eventos;

    this.casoActual = null;
    this.juezActual = null;
    this.alegatoActual = null;
    this.cartasJugadas = [];
  }

  /**
   * Permite cambiar la estrategia de cálculo en tiempo de ejecución (Patrón Strategy).
   * @param {import('./veredicto/EstrategiaVeredicto.js').EstrategiaVeredicto} nuevaEstrategia
   */
  cambiarEstrategiaVeredicto(nuevaEstrategia) {
    this.estrategiaVeredicto = nuevaEstrategia;
  }

  /**
   * Suscribe un observador a los eventos del motor ('cartaJugada', 'penalizacionAplicada', 'veredictoListo').
   * @param {'cartaJugada' | 'penalizacionAplicada' | 'veredictoListo'} evento
   * @param {Function} callback
   */
  on(evento, callback) {
    return this.eventos.on(evento, callback);
  }

  /**
   * Inicia un nuevo juicio con un caso y un juez.
   * @param {object} caso
   * @param {import('./jueces/PerfilJuez.js').PerfilJuez} juez
   */
  iniciarJuicio(caso, juez) {
    this.casoActual = caso;
    this.juezActual = juez;
    this.alegatoActual = new AlegatoBase();
    this.cartasJugadas = [];
  }

  /**
   * Juega una carta (evidencia, ley o testigo) envolviendo el alegato actual con un Decorator.
   * @param {object} carta
   */
  jugarCarta(carta) {
    if (!this.alegatoActual || !this.juezActual) {
      throw new Error('Debe iniciar un juicio antes de jugar una carta.');
    }
    if (this.cartasJugadas.length >= MAX_CARTAS) {
      throw new Error(`Solo se pueden jugar entre ${MIN_CARTAS} y ${MAX_CARTAS} cartas por juicio.`);
    }

    this.alegatoActual = decorarAlegatoConCarta(this.alegatoActual, carta);
    this.cartasJugadas.push(carta);

    this.eventos.emit('cartaJugada', {
      carta,
      orden: this.cartasJugadas.length,
      estadoAlegato: {
        formalidad: this.alegatoActual.obtenerFormalidad(),
        ironia: this.alegatoActual.obtenerIronia(),
        teatralidad: this.alegatoActual.obtenerTeatralidad(),
        bonusEvidencia: this.alegatoActual.obtenerBonusEvidencia()
      }
    });
  }

  /**
   * Calcula el veredicto final usando la Strategy inyectada, emite eventos y guarda en el historial.
   */
  async dictarVeredicto() {
    if (!this.alegatoActual || !this.juezActual || !this.casoActual) {
      throw new Error('No hay un juicio activo para dictar veredicto.');
    }
    if (this.cartasJugadas.length < MIN_CARTAS || this.cartasJugadas.length > MAX_CARTAS) {
      throw new Error(
        `El alegato requiere entre ${MIN_CARTAS} y ${MAX_CARTAS} cartas jugadas (actual: ${this.cartasJugadas.length}).`
      );
    }

    const tiposJugados = this.cartasJugadas.map((c) => c.tipo);
    const repitioTipoCartaConJuez = await this.repositorioHistorial.repitioTipoCartaConJuez(
      this.juezActual.id,
      tiposJugados
    );

    const desgloseVeredicto = this.estrategiaVeredicto.calcular({
      alegato: this.alegatoActual,
      juez: this.juezActual,
      caso: this.casoActual,
      repitioTipoCartaConJuez
    });

    if (repitioTipoCartaConJuez) {
      const lineaPenalizacion = desgloseVeredicto.lineasDesglose.find(
        (l) => l.termino === 'penalización por historial'
      );
      this.eventos.emit('penalizacionAplicada', {
        termino: 'penalización por historial',
        detalle: lineaPenalizacion?.detalle ?? 'Repitió un tipo de carta con ese juez',
        aporte: lineaPenalizacion?.aporte ?? 0
      });
    }

    const registroPartida = {
      id: `juicio-${Date.now()}`,
      fecha: new Date().toISOString(),
      casoId: this.casoActual.id,
      caso: this.casoActual.titulo,
      juezId: this.juezActual.id,
      juez: this.juezActual.nombre,
      cartas: this.cartasJugadas.map((c) => ({
        id: c.id,
        tipo: c.tipo,
        nombre: c.nombre
      })),
      veredicto: desgloseVeredicto
    };

    await this.repositorioHistorial.guardarPartida(registroPartida);

    this.eventos.emit('veredictoListo', registroPartida);

    return registroPartida;
  }
}
