/**
 * Interfaz base (Strategy) para el cálculo del veredicto.
 */
export class EstrategiaVeredicto {
  /**
   * @param {object} _contexto
   */
  calcular(_contexto) {
    throw new Error('El método calcular() debe ser implementado por una estrategia concreta.');
  }
}

/**
 * Estrategia paramétrica con la fórmula oficial:
 * afinidad por dimensión = 10 - |valor del juez - valor del alegato|
 * penalización_absurdo = pAb * max(0, absurdo_caso - tolerancia_ironia_juez)
 * puntaje = pA * afinidades + pE * (evidencia_disponible + bonus) - pG * gravedad - penalización_absurdo - penalización de historial
 */
export class EstrategiaParametrica extends EstrategiaVeredicto {
  /**
   * @param {object} pesos - Configuración de pesos (/src/config/pesos.js)
   * @param {number} umbral - Umbral de victoria (/src/config/umbral.js)
   */
  constructor(pesos, umbral) {
    super();
    this.pesos = pesos;
    this.umbral = umbral;
  }

  /**
   * @param {object} params
   * @param {import('../alegato.js').AlegatoBase} params.alegato
   * @param {import('../jueces/PerfilJuez.js').PerfilJuez} params.juez
   * @param {object} params.caso
   * @param {boolean} [params.repitioTipoCartaConJuez=false]
   */
  calcular({ alegato, juez, caso, repitioTipoCartaConJuez = false }) {
    const { pA, pE, pG, pAb, penalizacionHistorial } = this.pesos;

    const formalidadAlegato = alegato.obtenerFormalidad();
    const ironiaAlegato = alegato.obtenerIronia();
    const teatralidadAlegato = alegato.obtenerTeatralidad();
    const bonusEvidencia = alegato.obtenerBonusEvidencia();

    const afinidadFormalidad = 10 - Math.abs(juez.formalidad - formalidadAlegato);
    const afinidadIronia = 10 - Math.abs(juez.tolerancia_ironia - ironiaAlegato);
    const afinidadTeatralidad = 10 - Math.abs(juez.teatralidad - teatralidadAlegato);

    const aporteFormalidad = Number((pA * afinidadFormalidad).toFixed(2));
    const aporteIronia = Number((pA * afinidadIronia).toFixed(2));
    const aporteTeatralidad = Number((pA * afinidadTeatralidad).toFixed(2));

    const evidenciaTotal = caso.evidencia_disponible + bonusEvidencia;
    const aporteEvidencia = Number((pE * evidenciaTotal).toFixed(2));
    const aporteGravedad = Number((-pG * caso.gravedad).toFixed(2));

    const excesoAbsurdo = Math.max(0, caso.absurdo - juez.tolerancia_ironia);
    const penalizacionAbsurdo = pAb * excesoAbsurdo;
    const aporteAbsurdo = Number((-penalizacionAbsurdo).toFixed(2));

    /** @type {Array<{ termino: string, detalle: string, aporte: number }>} */
    const lineasDesglose = [
      {
        termino: 'Afinidad en Formalidad',
        detalle: `pA(${pA}) * (10 - |juez(${juez.formalidad}) - alegato(${formalidadAlegato})| = ${afinidadFormalidad})`,
        aporte: aporteFormalidad
      },
      {
        termino: 'Afinidad en Ironía',
        detalle: `pA(${pA}) * (10 - |juez(${juez.tolerancia_ironia}) - alegato(${ironiaAlegato})| = ${afinidadIronia})`,
        aporte: aporteIronia
      },
      {
        termino: 'Afinidad en Teatralidad',
        detalle: `pA(${pA}) * (10 - |juez(${juez.teatralidad}) - alegato(${teatralidadAlegato})| = ${afinidadTeatralidad})`,
        aporte: aporteTeatralidad
      },
      {
        termino: 'Evidencia (disponible + bonus)',
        detalle: `pE(${pE}) * (evidencia_disponible(${caso.evidencia_disponible}) + bonus(${bonusEvidencia}))`,
        aporte: aporteEvidencia
      },
      {
        termino: 'Gravedad del caso',
        detalle: `-pG(${pG}) * gravedad(${caso.gravedad})`,
        aporte: aporteGravedad
      },
      {
        termino: 'Absurdo del caso vs. tolerancia del juez',
        detalle: `-pAb(${pAb}) * max(0, absurdo(${caso.absurdo}) - tolerancia_ironia(${juez.tolerancia_ironia}))`,
        aporte: aporteAbsurdo
      }
    ];

    if (repitioTipoCartaConJuez) {
      const aportePenalizacion = Number((-Math.abs(penalizacionHistorial)).toFixed(2));
      lineasDesglose.push({
        termino: 'penalización por historial',
        detalle: `Repitió un tipo de carta ante ${juez.nombre}`,
        aporte: aportePenalizacion
      });
    }

    // El puntaje final es exactamente la suma de las líneas mostradas
    const puntajeFinal = Number(
      lineasDesglose.reduce((acum, linea) => acum + linea.aporte, 0).toFixed(2)
    );

    const resultado = puntajeFinal >= this.umbral ? 'GANADO' : 'PERDIDO';
    const fraseTematica =
      resultado === 'GANADO'
        ? `${juez.nombre} declara inocente al acusado y archiva el expediente con honores.`
        : `${juez.nombre} rechaza la defensa y condena al acusado sin atenuantes.`;

    return {
      resultado,
      puntajeFinal,
      umbral: this.umbral,
      fraseTematica,
      lineasDesglose
    };
  }
}
