/**
 * Perfil de Juez con parámetros formalidad, tolerancia_ironia y teatralidad (0 a 10).
 */
export class PerfilJuez {
  /**
   * @param {object} datos
   */
  constructor(datos) {
    this.id = datos.id;
    this.nombre = datos.nombre;
    this.descripcion = datos.descripcion;
    this.formalidad = PerfilJuez.validarRango(datos.formalidad ?? 5, 'formalidad');
    this.tolerancia_ironia = PerfilJuez.validarRango(
      datos.tolerancia_ironia ?? 5,
      'tolerancia_ironia'
    );
    this.teatralidad = PerfilJuez.validarRango(datos.teatralidad ?? 5, 'teatralidad');
  }

  static validarRango(valor, nombreCampo) {
    if (valor < 0 || valor > 10) {
      throw new RangeError(`El parámetro "${nombreCampo}" del juez debe estar entre 0 y 10.`);
    }
    return valor;
  }
}
