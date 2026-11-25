import { CartaEvidencia } from './CartaEvidencia.js';
import { CartaLey } from './CartaLey.js';
import { CartaTestigo } from './CartaTestigo.js';

/**
 * Envuelve un alegato con el decorador concreto según el tipo de carta.
 * @param {import('../alegato.js').AlegatoBase} alegato
 * @param {object} carta
 */
export function decorarAlegatoConCarta(alegato, carta) {
  switch (carta.tipo) {
    case 'evidencia':
      return new CartaEvidencia(alegato, carta);
    case 'ley':
      return new CartaLey(alegato, carta);
    case 'testigo':
      return new CartaTestigo(alegato, carta);
    default:
      throw new Error(`Tipo de carta desconocido: "${carta.tipo}"`);
  }
}

export { CartaEvidencia, CartaLey, CartaTestigo };
