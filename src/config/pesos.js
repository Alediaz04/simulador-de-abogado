/**
 * Pesos de la fórmula del veredicto y penalización por historial.
 * puntaje = pA * afinidades + pE * (evidencia_disponible + bonus) - pG * gravedad - pAb * max(0, absurdo_caso - tolerancia_ironia_juez) - penalizacionHistorial
 */
export const PESOS_VEREDICTO = Object.freeze({
  pA: 1.0,
  pE: 1.5,
  pG: 1.2,
  pAb: 1.2,
  penalizacionHistorial: 5
});
