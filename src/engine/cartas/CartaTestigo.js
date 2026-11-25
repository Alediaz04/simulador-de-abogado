import { CartaDecorator } from './CartaDecorator.js';

/**
 * Decorador concreto para cartas de tipo Testigo.
 */
export class CartaTestigo extends CartaDecorator {
  constructor(alegatoEnvuelto, datosCarta) {
    super(alegatoEnvuelto, { ...datosCarta, tipo: 'testigo' });
  }
}
