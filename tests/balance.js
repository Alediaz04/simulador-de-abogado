// Script de balance: prueba TODAS las combinaciones de 2 y 3 cartas contra cada juez y cada
// conjunto de parámetros de caso, y muestra qué % de manos gana. Objetivo: entre 30% y 70%.
// Ejecutar con:  npm run balance
import { readFileSync } from 'node:fs';
import { AlegatoBase } from '../src/engine/alegato.js';
import { decorarAlegatoConCarta } from '../src/engine/cartas/index.js';
import { EstrategiaParametrica } from '../src/engine/veredicto/EstrategiaVeredicto.js';
import { PerfilJuez } from '../src/engine/jueces/PerfilJuez.js';
import { PESOS_VEREDICTO } from '../src/config/pesos.js';
import { UMBRAL_VEREDICTO } from '../src/config/umbral.js';

const leer = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf-8'));
const cartas = leer('../data-seed/cartas.json');
const jueces = leer('../data-seed/jueces.json').map((j) => new PerfilJuez(j));
const parametros = leer('../data-seed/modulos-casos.json').parametrosBase;
const estrategia = new EstrategiaParametrica(PESOS_VEREDICTO, UMBRAL_VEREDICTO);

// Todas las combinaciones de k cartas distintas
function combinaciones(lista, k) {
  if (k === 0) return [[]];
  const salida = [];
  lista.forEach((x, i) => {
    combinaciones(lista.slice(i + 1), k - 1).forEach((resto) => salida.push([x, ...resto]));
  });
  return salida;
}

console.log(`Umbral: ${UMBRAL_VEREDICTO} | Cartas: ${cartas.length} | Jueces: ${jueces.length}\n`);
for (const juez of jueces) {
  parametros.forEach((caso, i) => {
    let ganadas = 0;
    let total = 0;
    let min = Infinity;
    let max = -Infinity;
    for (const k of [2, 3]) {
      for (const mano of combinaciones(cartas, k)) {
        let alegato = new AlegatoBase();
        mano.forEach((c) => { alegato = decorarAlegatoConCarta(alegato, c); });
        const r = estrategia.calcular({ alegato, juez, caso, repitioTipoCartaConJuez: false });
        total++;
        if (r.resultado === 'GANADO') ganadas++;
        min = Math.min(min, r.puntajeFinal);
        max = Math.max(max, r.puntajeFinal);
      }
    }
    const pct = Math.round((100 * ganadas) / total);
    const aviso = pct < 30 || pct > 70 ? '  <-- FUERA DE 30-70%' : '';
    console.log(
      `${juez.id} | caso ${i} (gravedad ${caso.gravedad}, absurdo ${caso.absurdo}, evidencia ${caso.evidencia_disponible}): ` +
      `${ganadas}/${total} ganan (${pct}%), puntaje ${min.toFixed(1)} a ${max.toFixed(1)}${aviso}`
    );
  });
}
