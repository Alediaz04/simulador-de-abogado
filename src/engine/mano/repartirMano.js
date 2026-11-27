/**
 * Devuelve `tamano` cartas distintas elegidas al azar del catálogo.
 * Si el catálogo tiene menos cartas que `tamano`, devuelve todas las disponibles (mezcladas).
 * @param {Array<object>} cartas
 * @param {number} tamano
 * @returns {Array<object>}
 */
export function repartirMano(cartas, tamano) {
  const copia = [...cartas];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia.slice(0, Math.max(0, tamano));
}
