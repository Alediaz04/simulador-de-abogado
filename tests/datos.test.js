// Pruebas de datos: PerfilJuez, GeneradorCasos y archivos de /data-seed.
// Autor: Joaquín (rol Tester). Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { PerfilJuez } from '../src/engine/jueces/PerfilJuez.js';
import { readFileSync } from 'node:fs';
import { GeneradorCasos } from '../src/engine/casos/GeneradorCasos.js';
import { MotorJuicio } from '../src/engine/motor.js';
import { EstrategiaParametrica } from '../src/engine/veredicto/EstrategiaVeredicto.js';
import { HistorialMemoria } from '../src/data/historialMemoria.js';
import { PESOS_VEREDICTO } from '../src/config/pesos.js';
import { UMBRAL_VEREDICTO } from '../src/config/umbral.js';

// Lee un JSON de data-seed (mismo helper que usa motor.test.js)
const leerJson = (ruta) => JSON.parse(readFileSync(new URL(ruta, import.meta.url), 'utf-8'));
const MODULOS = leerJson('../data-seed/modulos-casos.json');

// Un juez válido que usamos como base y al que le rompemos un campo por vez.
const juezBase = {
  id: 'juez-prueba',
  nombre: 'Juez de prueba',
  descripcion: 'Solo para tests',
  formalidad: 5,
  tolerancia_ironia: 5,
  teatralidad: 5
};

const CAMPOS_JUEZ = ['formalidad', 'tolerancia_ironia', 'teatralidad'];

// --- PerfilJuez: rango 0 a 10 ---
test('PerfilJuez acepta los valores límite 0 y 10', () => {
  for (const campo of CAMPOS_JUEZ) {
    for (const valor of [0, 10]) {
      assert.doesNotThrow(() => new PerfilJuez({ ...juezBase, [campo]: valor }));
    }
  }
});

test('PerfilJuez lanza RangeError si un valor está fuera de 0 a 10', () => {
  for (const campo of CAMPOS_JUEZ) {
    for (const valor of [-1, 11]) {
      assert.throws(
        () => new PerfilJuez({ ...juezBase, [campo]: valor }),
        RangeError,
        `"${campo}" = ${valor} debería lanzar RangeError`
      );
    }
  }
});
// --- GeneradorCasos: rango 0 a 10 ---
const CAMPOS_CASO = ['gravedad', 'absurdo', 'evidencia_disponible'];

test('GeneradorCasos lanza RangeError con parámetros fuera de rango', () => {
  for (const campo of CAMPOS_CASO) {
    for (const valor of [-1, 11]) {
      // Un único conjunto de parámetros válido, con UN campo roto
      const modulos = {
        ...MODULOS,
        parametrosBase: [{ gravedad: 5, absurdo: 5, evidencia_disponible: 5, [campo]: valor }]
      };
      assert.throws(
        () => new GeneradorCasos(modulos).generarCaso({ parametros: 0 }),
        RangeError,
        `"${campo}" = ${valor} debería lanzar RangeError`
      );
    }
  }
});

test('GeneradorCasos siempre devuelve gravedad, absurdo y evidencia_disponible entre 0 y 10', () => {
  const generador = new GeneradorCasos(MODULOS);
  const casos = [];

  // 1) Cada conjunto de parametrosBase, uno por uno (determinista)
  for (let i = 0; i < MODULOS.parametrosBase.length; i++) {
    casos.push(generador.generarCaso({ parametros: i }));
  }
  // 2) 100 casos al azar (el generador elige índices random)
  for (let i = 0; i < 100; i++) {
    casos.push(generador.generarCaso());
  }

  for (const caso of casos) {
    for (const campo of CAMPOS_CASO) {
      assert.equal(typeof caso[campo], 'number', `"${campo}" debe ser número en ${caso.id}`);
      assert.ok(caso[campo] >= 0 && caso[campo] <= 10, `"${campo}" fuera de rango en ${caso.id}: ${caso[campo]}`);
    }
  }
});

// --- data-seed: validación de jueces y cartas ---
const JUECES_DATA = leerJson('../data-seed/jueces.json');
const CARTAS_DATA = leerJson('../data-seed/cartas.json');

const TIPOS_VALIDOS = ['evidencia', 'ley', 'testigo'];
const esTextoNoVacio = (v) => typeof v === 'string' && v.trim().length > 0;
const esNumero = (v) => typeof v === 'number' && Number.isFinite(v);

// Devuelve los ids que aparecen más de una vez
const idsRepetidos = (lista) => {
  const vistos = new Set();
  const repetidos = new Set();
  for (const { id } of lista) {
    if (vistos.has(id)) repetidos.add(id);
    vistos.add(id);
  }
  return [...repetidos];
};

test('data-seed: cada juez tiene los campos obligatorios y valores de 0 a 10', () => {
  assert.ok(JUECES_DATA.length > 0, 'jueces.json no puede estar vacío');
  for (const j of JUECES_DATA) {
    for (const campo of ['id', 'nombre', 'descripcion']) {
      assert.ok(esTextoNoVacio(j[campo]), `juez ${j.id}: falta "${campo}"`);
    }
    for (const campo of CAMPOS_JUEZ) {
      assert.ok(esNumero(j[campo]), `juez ${j.id}: "${campo}" debe ser un número`);
      assert.ok(j[campo] >= 0 && j[campo] <= 10, `juez ${j.id}: "${campo}" fuera de 0..10 (${j[campo]})`);
    }
  }
});

test('data-seed: los ids de los jueces son únicos', () => {
  assert.deepEqual(idsRepetidos(JUECES_DATA), []);
});

test('data-seed: cada carta tiene los campos obligatorios y un tipo válido', () => {
  assert.ok(CARTAS_DATA.length > 0, 'cartas.json no puede estar vacío');
  for (const c of CARTAS_DATA) {
    for (const campo of ['id', 'nombre', 'descripcion']) {
      assert.ok(esTextoNoVacio(c[campo]), `carta ${c.id}: falta "${campo}"`);
    }
    assert.ok(TIPOS_VALIDOS.includes(c.tipo), `carta ${c.id}: tipo inválido "${c.tipo}"`);
    for (const campo of ['formalidad', 'ironia', 'teatralidad', 'bonusEvidencia']) {
      assert.ok(esNumero(c[campo]), `carta ${c.id}: "${campo}" debe ser un número`);
    }
  }
});

test('data-seed: los ids de las cartas son únicos', () => {
  assert.deepEqual(idsRepetidos(CARTAS_DATA), []);
});

test('data-seed: los efectos de las cartas están en el rango sugerido por el equipo', () => {
  // Rango del documento del equipo: formalidad/ironia/teatralidad entre -3 y +5; bonusEvidencia entre 0 y 3
  for (const c of CARTAS_DATA) {
    for (const campo of ['formalidad', 'ironia', 'teatralidad']) {
      assert.ok(c[campo] >= -3 && c[campo] <= 5, `carta ${c.id}: "${campo}" fuera de -3..5 (${c[campo]})`);
    }
    assert.ok(c.bonusEvidencia >= 0 && c.bonusEvidencia <= 3, `carta ${c.id}: "bonusEvidencia" fuera de 0..3 (${c.bonusEvidencia})`);
  }
});

// --- Motor: helpers (copiados de motor.test.js, que no los exporta) ---
const JUEZ = new PerfilJuez(JUECES_DATA[0]);
const CASO = { id: 'caso-test', titulo: 'Caso de prueba', gravedad: 4, absurdo: 7, evidencia_disponible: 5 };
const cartaPorId = (id) => CARTAS_DATA.find((c) => c.id === id);

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

// --- HALLAZGO: mano con dos cartas del mismo tipo ---
// Documentado en el plan del equipo como hallazgo conocido: antes, repetir tipo dentro de la
// MISMA mano se rotulaba "penalización por historial" aunque no hubiera historial.
// Estado actual: corregido. La penalización solo aparece si el repositorio encuentra
// partidas anteriores con ese juez.
test('HALLAZGO: dos cartas del mismo tipo en la primera partida no generan penalización de historial', async () => {
  const mano = [cartaPorId('ev-01'), cartaPorId('ev-02')]; // 2 evidencias
  const { veredicto } = await jugar(crearMotor(), CASO, JUEZ, mano);

  const terminos = veredicto.lineasDesglose.map((l) => l.termino);
  assert.equal(terminos.includes('penalización por historial'), false);
  assert.equal(veredicto.lineasDesglose.length, 6, `líneas del desglose: ${terminos.join(' | ')}`);

  const suma = veredicto.lineasDesglose.reduce((acc, l) => acc + l.aporte, 0);
  assert.equal(Number(suma.toFixed(2)), veredicto.puntajeFinal);
});

// --- Cartas extremas: no rompen el cálculo ni el desglose ---
test('cartas extremas (positivas y negativas) no rompen el cálculo ni el desglose', async () => {
  const variantes = {
    'valores enormes': { formalidad: 1000, ironia: -1000, teatralidad: 1000, bonusEvidencia: 1000 },
    'valores muy negativos': { formalidad: -1000, ironia: 1000, teatralidad: -1000, bonusEvidencia: -1000 }
  };

  for (const [nombre, efectos] of Object.entries(variantes)) {
    const mano = [
      { id: 'x1', tipo: 'evidencia', nombre: 'Extrema 1', ...efectos },
      { id: 'x2', tipo: 'ley', nombre: 'Extrema 2', ...efectos },
      { id: 'x3', tipo: 'testigo', nombre: 'Extrema 3', ...efectos }
    ];
    const { veredicto } = await jugar(crearMotor(), CASO, JUEZ, mano);

    // Todas las líneas son números finitos (nada de NaN ni Infinity)
    for (const l of veredicto.lineasDesglose) {
      assert.ok(Number.isFinite(l.aporte), `${nombre}: "${l.termino}" no es un número finito (${l.aporte})`);
    }
    // Las 3 afinidades (primeras líneas) siempre quedan entre 0 y 10 (por el clamp del alegato)
    for (const l of veredicto.lineasDesglose.slice(0, 3)) {
      assert.ok(l.aporte >= 0 && l.aporte <= 10 * PESOS_VEREDICTO.pA, `${nombre}: afinidad fuera de rango en "${l.termino}" (${l.aporte})`);
    }
    // El desglose sigue sumando exacto y el resultado es válido
    const suma = veredicto.lineasDesglose.reduce((acc, l) => acc + l.aporte, 0);
    assert.equal(Number(suma.toFixed(2)), veredicto.puntajeFinal, `${nombre}: el desglose no suma el puntaje`);
    assert.ok(['GANADO', 'PERDIDO'].includes(veredicto.resultado), `${nombre}: resultado inválido`);
  }
});

// --- HALLAZGO 1: bonusEvidencia no tiene tope ---
// El clamp de 0..10 solo se aplica a formalidad, ironía y teatralidad.
// Esta prueba documenta el comportamiento ACTUAL: si algún día se agrega un tope, fallará
// y habrá que actualizarla (señal de que el hallazgo fue atendido).
test('HALLAZGO (comportamiento actual): bonusEvidencia no tiene tope y puede inflar el puntaje', async () => {
  const BONUS = 1000;
  const mano = [
    { id: 'b1', tipo: 'evidencia', nombre: 'Bonus gigante', formalidad: 0, ironia: 0, teatralidad: 0, bonusEvidencia: BONUS },
    cartaPorId('ley-01')
  ];
  const { veredicto } = await jugar(crearMotor(), CASO, JUEZ, mano);

  const lineaEvidencia = veredicto.lineasDesglose.find((l) => l.termino === 'Evidencia (disponible + bonus)');
  const esperado = Number((PESOS_VEREDICTO.pE * (CASO.evidencia_disponible + BONUS + cartaPorId('ley-01').bonusEvidencia)).toFixed(2));

  assert.equal(lineaEvidencia.aporte, esperado); // sin tope: el aporte crece sin límite
  assert.equal(veredicto.resultado, 'GANADO');
});

// --- HALLAZGO 2: el orden de las cartas cambia el resultado ---
// CartaDecorator aplica el clamp 0..10 después de CADA carta, así que sumar y restar
// no es conmutativo cuando se toca el borde.
test('HALLAZGO (comportamiento actual): el orden de las cartas puede cambiar el puntaje', async () => {
  const ev = cartaPorId('ev-01');  // formalidad +1
  const tes = cartaPorId('tes-01'); // formalidad -2

  const { veredicto: ordenA } = await jugar(crearMotor(), CASO, JUEZ, [ev, tes]);
  const { veredicto: ordenB } = await jugar(crearMotor(), CASO, JUEZ, [tes, ev]);

  const afinidadFormalidad = (v) => v.lineasDesglose.find((l) => l.termino === 'Afinidad en Formalidad').aporte;

  assert.notEqual(afinidadFormalidad(ordenA), afinidadFormalidad(ordenB));
  assert.notEqual(ordenA.puntajeFinal, ordenB.puntajeFinal);
});