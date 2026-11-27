/**
 * Umbral para determinar si el resultado es GANADO (>= umbral) o PERDIDO (< umbral).
 *
 * Calibración de balance:
 * - UMBRAL_VEREDICTO = 20: junto con pAb = 0.9, maximiza la cantidad de combinaciones juez x caso
 *   dentro de la franja del 30% al 70% de victorias (10/24), minimiza los extremos (0% o 100%)
 *   y mantiene casos ganables para los 4 jueces sin que ningún caso sea 0% o 100% para todos.
 */
export const UMBRAL_VEREDICTO = 20;
