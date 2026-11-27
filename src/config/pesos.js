/**
 * Pesos de la fórmula del veredicto y penalización por historial.
 * Fórmula:
 *   puntaje = pA * afinidades + pE * (evidencia_disponible + bonus)
 *             - pG * gravedad - pAb * max(0, absurdo_caso - tolerancia_ironia_juez)
 *             - penalizacionHistorial
 *
 * Calibración de balance (grilla pAb ∈ [0.3..1.2], umbral ∈ [18..32] sobre 4 jueces x 6 casos):
 * - pA = 1.0: peso base de las 3 afinidades (formalidad, ironía, teatralidad).
 * - pE = 1.5: peso de la evidencia total (disponible del caso + bonus de cartas).
 * - pG = 1.2: penalización por gravedad del caso.
 * - pAb = 0.9: seleccionado tras exploración de grilla por maximizar las combinaciones juez x caso
 *   dentro del rango objetivo (30%-70% de victorias: 10/24), eliminar el 0% absoluto en casos graves
 *   ante jueces estrictos con la ironía (juez-03, caso 4 pasa de 0% a 2%) y ser el valor más cercano
 *   al peso original 1.0 (|0.9 - 1.0| = 0.1).
 * - penalizacionHistorial = 5: descuento fijo cuando se repite tipo de carta ante el mismo juez.
 */
export const PESOS_VEREDICTO = Object.freeze({
  pA: 1.0,
  pE: 1.5,
  pG: 1.2,
  pAb: 0.9,
  penalizacionHistorial: 5
});
