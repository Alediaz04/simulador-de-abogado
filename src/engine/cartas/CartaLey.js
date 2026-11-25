import { CartaDecorator } from './CartaDecorator.js';

/**
 * Decorador concreto para cartas de tipo Ley.
 */
export class CartaLey extends CartaDecorator {
  constructor(alegatoEnvuelto, datosCarta) {
    super(alegatoEnvuelto, { ...datosCarta, tipo: 'ley' });
  }
}
