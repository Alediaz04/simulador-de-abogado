// Tests del motor del Simulador de Abogado (Node, sin librerías externas).
// Ejecutar con:  npm test      (o)      node --test tests/
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import { MotorJuicio } from '../src/engine/motor.js';
import { EstrategiaParametrica } from '../src/engine/veredicto/EstrategiaVeredicto.js';
import { PerfilJuez } from '../src/engine/jueces/PerfilJuez.js';
import { HistorialMemoria } from '../src/data/historialMemoria.js';
import { PESOS_VEREDICTO } from '../src/config/pesos.js';
import { UMBRAL_VEREDICTO } from '../src/config/umbral.js';

// --- Datos de prueba (se leen de data-seed) ---
const leerJson = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf-8'));
const CARTAS = leerJson('../data-seed/cartas.json');
const JUECES = leerJson('../data-seed/jueces.json').map((j) => new PerfilJuez(j));
const JUEZ = JUECES[0];

const CASO = { id: 'caso-test', titulo: 'Caso de prueba', gravedad: 4, absurdo: 7, evidencia_disponible: 5 };

const cartaDeTipo = (tipo, n = 0) => CARTAS.filter((c) => c.tipo === tipo)[n];

// Crea un motor nuevo con historial vacío en cada test (así los tests no dependen entre sí).
function crearMotor() {
  return new MotorJuicio({
    estrategiaVeredicto: new EstrategiaParametrica(PESOS_VEREDICTO, UMBRAL_VEREDICTO),
    repositorioHistorial: new HistorialMemoria()
  });
}

async function jugar(motor, caso, juez, cartas) {
  motor.iniciarJuicio(caso, juez);
  cartas.forEach((c) => motor.jugarCarta(c));
  return motor.dictarVeredicto();
}

// --- 1. El desglose suma EXACTAMENTE el puntaje final (criterio de aceptación) ---
test('el puntaje final es la suma exacta de las líneas del desglose', async () => {
  const manos = [
    [cartaDeTipo('evidencia'), cartaDeTipo('ley')],
    [cartaDeTipo('evidencia'), cartaDeTipo('ley'), cartaDeTipo('testigo')]
  ];
  for (const mano of manos) {
    const { veredicto } = await jugar(crearMotor(), CASO, JUEZ, mano);
    const suma = veredicto.lineasDesglose.reduce((acc, l) => acc + l.aporte, 0);
    assert.equal(Number(suma.toFixed(2)), veredicto.puntajeFinal);
  }
});

// --- 2. El resultado es coherente con el umbral ---
test('GANADO si puntaje >= umbral y PERDIDO si es menor', async () => {
  const { veredicto } = await jugar(crearMotor(), CASO, JUEZ, [cartaDeTipo('evidencia'), cartaDeTipo('ley')]);
  const esperado = veredicto.puntajeFinal >= UMBRAL_VEREDICTO ? 'GANADO' : 'PERDIDO';
  assert.equal(veredicto.resultado, esperado);
});

// --- 3. Clamp: el alegato nunca sale de 0..10, aunque las cartas sean extremas ---
test('formalidad, ironía y teatralidad del alegato quedan entre 0 y 10', () => {
  const motor = crearMotor();
  motor.iniciarJuicio(CASO, JUEZ);
  const extrema = { id: 'x', tipo: 'evidencia', nombre: 'Extrema', formalidad: 50, ironia: -50, teatralidad: 50, bonusEvidencia: 0 };
  motor.jugarCarta(extrema);
  const a = motor.alegatoActual;
  for (const v of [a.obtenerFormalidad(), a.obtenerIronia(), a.obtenerTeatralidad()]) {
    assert.ok(v >= 0 && v <= 10, `valor fuera de rango: ${v}`);
  }
});

// --- 4. Cantidad de cartas: solo 2 o 3 ---
test('no se puede dictar veredicto con menos de 2 cartas', async () => {
  const motor = crearMotor();
  motor.iniciarJuicio(CASO, JUEZ);
  motor.jugarCarta(cartaDeTipo('evidencia'));
  await assert.rejects(() => motor.dictarVeredicto());
});

test('no se pueden jugar más de 3 cartas', () => {
  const motor = crearMotor();
  motor.iniciarJuicio(CASO, JUEZ);
  motor.jugarCarta(cartaDeTipo('evidencia', 0));
  motor.jugarCarta(cartaDeTipo('ley', 0));
  motor.jugarCarta(cartaDeTipo('testigo', 0));
  assert.throws(() => motor.jugarCarta(cartaDeTipo('evidencia', 1)));
});

test('un tipo de carta desconocido da error', () => {
  const motor = crearMotor();
  motor.iniciarJuicio(CASO, JUEZ);
  assert.throws(() => motor.jugarCarta({ id: 'raro', tipo: 'inventada', nombre: 'Rara' }));
});

// --- 5. Memoria del juez (criterio de aceptación) ---
test('la primera partida con un juez NO tiene penalización por historial (manos sin repetir tipo)', async () => {
  const mano = [cartaDeTipo('evidencia'), cartaDeTipo('ley'), cartaDeTipo('testigo')];
  const { veredicto } = await jugar(crearMotor(), CASO, JUEZ, mano);
  const hay = veredicto.lineasDesglose.some((l) => l.termino === 'penalización por historial');
  assert.equal(hay, false);
});

test('repetir tipo de carta con el mismo juez agrega la penalización por historial', async () => {
  const motor = crearMotor();
  await jugar(motor, CASO, JUEZ, [cartaDeTipo('evidencia', 0), cartaDeTipo('ley', 0)]);
  const { veredicto } = await jugar(motor, CASO, JUEZ, [cartaDeTipo('evidencia', 1), cartaDeTipo('ley', 1)]);
  const linea = veredicto.lineasDesglose.find((l) => l.termino === 'penalización por historial');
  assert.ok(linea, 'debería existir la línea de penalización');
  assert.ok(linea.aporte < 0);
});

test('el historial con un juez NO penaliza a otro juez', async () => {
  const motor = crearMotor();
  await jugar(motor, CASO, JUECES[0], [cartaDeTipo('evidencia', 0), cartaDeTipo('ley', 0)]);
  const { veredicto } = await jugar(motor, CASO, JUECES[1], [cartaDeTipo('evidencia', 1), cartaDeTipo('ley', 1)]);
  const hay = veredicto.lineasDesglose.some((l) => l.termino === 'penalización por historial');
  assert.equal(hay, false);
});

// --- 6. Inyección de dependencias y Strategy ---
test('el motor exige que le inyecten estrategia y repositorio', () => {
  assert.throws(() => new MotorJuicio({ repositorioHistorial: new HistorialMemoria() }));
  assert.throws(() => new MotorJuicio({ estrategiaVeredicto: new EstrategiaParametrica(PESOS_VEREDICTO, UMBRAL_VEREDICTO) }));
});

test('se puede cambiar la fórmula sin tocar el motor (Strategy)', async () => {
  const motor = crearMotor();
  motor.cambiarEstrategiaVeredicto(new EstrategiaParametrica(PESOS_VEREDICTO, 999)); // umbral imposible
  const { veredicto } = await jugar(motor, CASO, JUEZ, [cartaDeTipo('evidencia'), cartaDeTipo('ley')]);
  assert.equal(veredicto.resultado, 'PERDIDO');
});

// --- 7. Observer: el motor emite los eventos ---
test('el motor emite cartaJugada y veredictoListo', async () => {
  const motor = crearMotor();
  const vistos = [];
  motor.on('cartaJugada', () => vistos.push('cartaJugada'));
  motor.on('veredictoListo', () => vistos.push('veredictoListo'));
  await jugar(motor, CASO, JUEZ, [cartaDeTipo('evidencia'), cartaDeTipo('ley')]);
  assert.deepEqual(vistos, ['cartaJugada', 'cartaJugada', 'veredictoListo']);
});
