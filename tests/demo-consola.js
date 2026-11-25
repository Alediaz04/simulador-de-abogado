import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { PESOS_VEREDICTO } from '../src/config/pesos.js';
import { UMBRAL_VEREDICTO } from '../src/config/umbral.js';
import { GeneradorCasos } from '../src/engine/casos/GeneradorCasos.js';
import { PerfilJuez } from '../src/engine/jueces/PerfilJuez.js';
import { EstrategiaParametrica } from '../src/engine/veredicto/EstrategiaVeredicto.js';
import { MotorJuicio } from '../src/engine/motor.js';
import { HistorialMemoria } from '../src/data/historialMemoria.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

async function cargarJson(rutaRelativa) {
  const contenido = await readFile(join(rootDir, rutaRelativa), 'utf-8');
  return JSON.parse(contenido);
}

function imprimirDesglose(registroPartida) {
  const { veredicto } = registroPartida;
  console.log('\n---------------- DESGLOSE DEL VEREDICTO ----------------');
  let sumaVerificacion = 0;
  for (const linea of veredicto.lineasDesglose) {
    const signo = linea.aporte >= 0 ? '+' : '';
    console.log(
      `  ${linea.termino.padEnd(42, ' ')}: ${signo}${linea.aporte.toFixed(2)}  [${linea.detalle}]`
    );
    sumaVerificacion = Number((sumaVerificacion + linea.aporte).toFixed(2));
  }
  console.log('--------------------------------------------------------');
  console.log(
    `  PUNTAJE FINAL (suma exacta)               : ${veredicto.puntajeFinal.toFixed(2)} (verificado: ${sumaVerificacion.toFixed(2)})`
  );
  console.log(`  UMBRAL                                    : ${veredicto.umbral}`);
  console.log(`  RESULTADO                                 : ${veredicto.resultado}`);
  if (veredicto.fraseTematica) {
    console.log(`  FRASE TEMÁTICA                            : ${veredicto.fraseTematica}`);
  }
  console.log('--------------------------------------------------------\n');
}

async function ejecutarPartidaConsola() {
  console.log('==============================================================');
  console.log('       SIMULADOR DE ABOGADO - PARTIDA DE CONSOLA (DEMO)       ');
  console.log('==============================================================\n');

  // 1. Cargar semillas de datos fijos
  const cartasSeed = await cargarJson('data-seed/cartas.json');
  const juecesSeed = await cargarJson('data-seed/jueces.json');
  const modulosCasosSeed = await cargarJson('data-seed/modulos-casos.json');

  // 2. Instanciar dependencias e inyectarlas al motor
  const estrategia = new EstrategiaParametrica(PESOS_VEREDICTO, UMBRAL_VEREDICTO);
  const repositorioHistorial = new HistorialMemoria();
  const motor = new MotorJuicio({
    estrategiaVeredicto: estrategia,
    repositorioHistorial
  });

  // 3. Suscribir observadores a los eventos del motor (Patrón Observer)
  motor.on('cartaJugada', ({ carta, orden, estadoAlegato }) => {
    console.log(
      `[EVENTO cartaJugada #${orden}] "${carta.nombre}" (${carta.tipo}) -> Alegato (clamp 0..10): formalidad=${estadoAlegato.formalidad}, ironia=${estadoAlegato.ironia}, teatralidad=${estadoAlegato.teatralidad}, bonusEvidencia=${estadoAlegato.bonusEvidencia}`
    );
  });

  motor.on('penalizacionAplicada', (evento) => {
    console.log(
      `[EVENTO penalizacionAplicada] ${evento.termino}: ${evento.aporte} (${evento.detalle})`
    );
  });

  motor.on('veredictoListo', (registro) => {
    console.log(
      `[EVENTO veredictoListo] Expediente "${registro.caso}" resuelto: ${registro.veredicto.resultado} (${registro.veredicto.puntajeFinal} pts)`
    );
  });

  // 4. Preparar casos y juez con datos fijos
  const generadorCasos = new GeneradorCasos(modulosCasosSeed);
  const casoLeve = generadorCasos.generarCaso({
    acusado: 0,
    cargo: 0,
    contexto: 1,
    parametros: 0 // gravedad: 4, absurdo: 7, evidencia_disponible: 5
  });
  const casoGrave = generadorCasos.generarCaso({
    acusado: 2,
    cargo: 1,
    contexto: 0,
    parametros: 1 // gravedad: 8, absurdo: 9, evidencia_disponible: 3
  });
  const juezFijo = new PerfilJuez(juecesSeed[0]); // formalidad: 8, tolerancia_ironia: 4, teatralidad: 3

  console.log('--- DATOS DEL JUEZ ---');
  console.log(`Juez      : ${juezFijo.nombre}`);
  console.log(
    `Parámetros: formalidad=${juezFijo.formalidad}, tolerancia_ironia=${juezFijo.tolerancia_ironia}, teatralidad=${juezFijo.teatralidad}\n`
  );

  // =========================================================================
  // PARTIDA 1: Sin penalización de historial (primera vez ante el juez con 3 tipos distintos)
  // =========================================================================
  console.log('=== PARTIDA 1 (Caso leve, sin repetición en historial) ===');
  console.log(
    `Caso: ${casoLeve.titulo} (gravedad=${casoLeve.gravedad}, absurdo=${casoLeve.absurdo}, evidencia_disponible=${casoLeve.evidencia_disponible})`
  );
  motor.iniciarJuicio(casoLeve, juezFijo);

  motor.jugarCarta(cartasSeed.find((c) => c.id === 'ev-01'));  // evidencia
  motor.jugarCarta(cartasSeed.find((c) => c.id === 'ley-01')); // ley
  motor.jugarCarta(cartasSeed.find((c) => c.id === 'tes-02')); // testigo

  const partida1 = await motor.dictarVeredicto();
  imprimirDesglose(partida1);

  // =========================================================================
  // PARTIDA 2: Mismo juez, repite tipos en historial
  // =========================================================================
  console.log('=== PARTIDA 2 (Mismo juez, repite tipos en historial) ===');
  console.log(
    `Caso: ${casoLeve.titulo} (gravedad=${casoLeve.gravedad}, absurdo=${casoLeve.absurdo}, evidencia_disponible=${casoLeve.evidencia_disponible})`
  );
  motor.iniciarJuicio(casoLeve, juezFijo);

  motor.jugarCarta(cartasSeed.find((c) => c.id === 'ev-02'));  // evidencia
  motor.jugarCarta(cartasSeed.find((c) => c.id === 'ley-02')); // ley

  const partida2 = await motor.dictarVeredicto();
  imprimirDesglose(partida2);

  // =========================================================================
  // PARTIDA 3: Caso grave con otra combinación de cartas -> PERDIDO
  // =========================================================================
  console.log('=== PARTIDA 3 (Caso grave, otra combinación de cartas -> PERDIDO) ===');
  console.log(
    `Caso: ${casoGrave.titulo} (gravedad=${casoGrave.gravedad}, absurdo=${casoGrave.absurdo}, evidencia_disponible=${casoGrave.evidencia_disponible})`
  );
  motor.iniciarJuicio(casoGrave, juezFijo);

  motor.jugarCarta(cartasSeed.find((c) => c.id === 'ev-02'));  // formalidad -1 -> clamp a 0
  motor.jugarCarta(cartasSeed.find((c) => c.id === 'tes-01')); // formalidad -2 -> clamp a 0, teatralidad +4 -> 5

  const partida3 = await motor.dictarVeredicto();
  imprimirDesglose(partida3);
}

ejecutarPartidaConsola().catch((err) => {
  console.error('Error al ejecutar la simulación:', err);
  process.exit(1);
});
