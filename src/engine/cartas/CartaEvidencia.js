import { CartaDecorator } from './CartaDecorator.js';

/**
 * Decorador concreto para cartas de tipo Evidencia.
 */
export class CartaEvidencia extends CartaDecorator {
  constructor(alegatoEnvuelto, datosCarta) {
    super(alegatoEnvuelto, { ...datosCarta, tipo: 'evidencia' });
  }
}
