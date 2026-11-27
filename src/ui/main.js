import cartasSeed from '../../data-seed/cartas.json';
import juecesSeed from '../../data-seed/jueces.json';
import modulosCasosSeed from '../../data-seed/modulos-casos.json';

import { PESOS_VEREDICTO } from '../config/pesos.js';
import { UMBRAL_VEREDICTO } from '../config/umbral.js';
import { TAMANO_MANO, MIN_CARTAS, MAX_CARTAS } from '../config/juego.js';

import { MotorJuicio } from '../engine/motor.js';
import { EstrategiaParametrica } from '../engine/veredicto/EstrategiaVeredicto.js';
import { GeneradorCasos } from '../engine/casos/GeneradorCasos.js';
import { PerfilJuez } from '../engine/jueces/PerfilJuez.js';
import { repartirMano } from '../engine/mano/repartirMano.js';

import { iniciarFirebase } from '../data/firebaseClient.js';
import { HistorialFirestore } from '../data/historialFirestore.js';
import { HistorialMemoria } from '../data/historialMemoria.js';

// Referencias a elementos del DOM
const avisoPersistencia = document.getElementById('aviso-persistencia');

const pantallas = {
  inicio: document.getElementById('pantalla-inicio'),
  casoJuez: document.getElementById('pantalla-caso-juez'),
  alegato: document.getElementById('pantalla-alegato'),
  veredicto: document.getElementById('pantalla-veredicto')
};

const btnComenzar = document.getElementById('btn-comenzar');
const btnIrAlegato = document.getElementById('btn-ir-alegato');
const btnReiniciarAlegato = document.getElementById('btn-reiniciar-alegato');
const btnDictarVeredicto = document.getElementById('btn-dictar-veredicto');
const btnNuevaPartida = document.getElementById('btn-nueva-partida');

const casoTitulo = document.getElementById('caso-titulo');
const casoDescripcion = document.getElementById('caso-descripcion');
const casoParametros = document.getElementById('caso-parametros');

const juezNombre = document.getElementById('juez-nombre');
const juezDescripcion = document.getElementById('juez-descripcion');
const juezParametros = document.getElementById('juez-parametros');

const instruccionCartas = document.getElementById('instruccion-cartas');
const resumenCasoTitulo = document.getElementById('resumen-caso-titulo');
const resumenJuezNombre = document.getElementById('resumen-juez-nombre');
const contadorCartasJugadas = document.getElementById('contador-cartas-jugadas');

const alegatoFormalidad = document.getElementById('alegato-formalidad');
const alegatoIronia = document.getElementById('alegato-ironia');
const alegatoTeatralidad = document.getElementById('alegato-teatralidad');
const alegatoBonus = document.getElementById('alegato-bonus');
const contenedorMano = document.getElementById('contenedor-mano');

const veredictoResultado = document.getElementById('veredicto-resultado');
const veredictoFrase = document.getElementById('veredicto-frase');
const veredictoPuntaje = document.getElementById('veredicto-puntaje');
const veredictoUmbral = document.getElementById('veredicto-umbral');
const listaDesglose = document.getElementById('lista-desglose');

// Catálogo cargado desde /data-seed sin asumir cantidad fija
const catalogoJueces = juecesSeed.map((datosJuez) => new PerfilJuez(datosJuez));
const catalogoCartas = [...cartasSeed];
const generadorCasos = new GeneradorCasos(modulosCasosSeed);

let motor = null;
let casoActual = null;
let juezActual = null;
let manoActual = [];
let ordenCartasJugadas = new Map();

function mostrarPantalla(clave) {
  Object.entries(pantallas).forEach(([nombre, seccion]) => {
    seccion.classList.toggle('oculto', nombre !== clave);
  });
}

function mostrarAvisoDiscreto(mensaje) {
  avisoPersistencia.textContent = mensaje;
  avisoPersistencia.classList.remove('oculto');
}

async function crearRepositorioHistorial() {
  try {
    const { db, uid } = await iniciarFirebase();
    return new HistorialFirestore({ db, uid });
  } catch {
    mostrarAvisoDiscreto(
      'Aviso: Firebase no disponible o sin configurar. Usando historial en memoria para esta sesión.'
    );
    return new HistorialMemoria();
  }
}

function renderizarFilasParametros(contenedor, pares) {
  contenedor.innerHTML = '';
  for (const { etiqueta, valor } of pares) {
    const fila = document.createElement('div');
    fila.className = 'fila-parametro';
    const span = document.createElement('span');
    span.textContent = etiqueta;
    const strong = document.createElement('strong');
    strong.textContent = `${valor} / 10`;
    fila.append(span, strong);
    contenedor.appendChild(fila);
  }
}

function actualizarPanelEstadoAlegato({ formalidad, ironia, teatralidad, bonusEvidencia }, cantidadCartas) {
  alegatoFormalidad.textContent = String(formalidad);
  alegatoIronia.textContent = String(ironia);
  alegatoTeatralidad.textContent = String(teatralidad);
  const signo = bonusEvidencia >= 0 ? '+' : '';
  alegatoBonus.textContent = `${signo}${bonusEvidencia}`;

  contadorCartasJugadas.textContent = `Cartas jugadas: ${cantidadCartas} (${MIN_CARTAS} a ${MAX_CARTAS})`;
  btnDictarVeredicto.disabled = cantidadCartas < MIN_CARTAS || cantidadCartas > MAX_CARTAS;
}

function formatearModificador(etiqueta, valor) {
  const signo = valor >= 0 ? '+' : '';
  return `${etiqueta}: ${signo}${valor}`;
}

function renderizarMano() {
  contenedorMano.innerHTML = '';
  const limiteAlcanzado = ordenCartasJugadas.size >= MAX_CARTAS;

  for (const carta of manoActual) {
    const ordenJugada = ordenCartasJugadas.get(carta.id);
    const yaJugada = ordenJugada !== undefined;

    const articulo = document.createElement('article');
    articulo.className = `carta-juego ${yaJugada ? 'jugada' : ''}`;

    const cabecera = document.createElement('div');
    cabecera.className = 'cabecera-carta';

    const spanTipo = document.createElement('span');
    spanTipo.className = `etiqueta-tipo-carta tipo-${carta.tipo}`;
    spanTipo.textContent = carta.tipo;
    cabecera.appendChild(spanTipo);

    if (yaJugada) {
      const spanOrden = document.createElement('span');
      spanOrden.className = 'orden-jugada';
      spanOrden.textContent = `Carta #${ordenJugada}`;
      cabecera.appendChild(spanOrden);
    }

    const titulo = document.createElement('h4');
    titulo.textContent = carta.nombre;

    const descripcion = document.createElement('p');
    descripcion.className = 'descripcion-carta';
    descripcion.textContent = carta.descripcion;

    const modificadores = document.createElement('div');
    modificadores.className = 'modificadores-carta';

    const listaMods = [
      formatearModificador('Formalidad', carta.formalidad),
      formatearModificador('Ironía', carta.ironia),
      formatearModificador('Teatralidad', carta.teatralidad),
      formatearModificador('Bonus Evidencia', carta.bonusEvidencia)
    ];

    for (const textoMod of listaMods) {
      const chip = document.createElement('span');
      chip.className = 'chip-modificador';
      chip.textContent = textoMod;
      modificadores.appendChild(chip);
    }

    const boton = document.createElement('button');
    boton.type = 'button';
    boton.className = 'boton-jugar-carta';

    if (yaJugada) {
      boton.textContent = 'Carta jugada';
      boton.disabled = true;
    } else if (limiteAlcanzado) {
      boton.textContent = `Máximo ${MAX_CARTAS} cartas`;
      boton.disabled = true;
    } else {
      boton.textContent = 'Jugar carta';
      boton.addEventListener('click', () => {
        motor.jugarCarta(carta);
      });
    }

    const bloqueSuperior = document.createElement('div');
    bloqueSuperior.append(cabecera, titulo, descripcion, modificadores);

    articulo.append(bloqueSuperior, boton);
    contenedorMano.appendChild(articulo);
  }
}

function prepararNuevoCasoYJuez() {
  casoActual = generadorCasos.generarCaso();
  const indiceJuez = Math.floor(Math.random() * catalogoJueces.length);
  juezActual = catalogoJueces[indiceJuez];

  casoTitulo.textContent = casoActual.titulo;
  casoDescripcion.textContent = casoActual.descripcionCompleta;
  renderizarFilasParametros(casoParametros, [
    { etiqueta: 'Gravedad', valor: casoActual.gravedad },
    { etiqueta: 'Absurdo', valor: casoActual.absurdo },
    { etiqueta: 'Evidencia disponible', valor: casoActual.evidencia_disponible }
  ]);

  juezNombre.textContent = juezActual.nombre;
  juezDescripcion.textContent = juezActual.descripcion;
  renderizarFilasParametros(juezParametros, [
    { etiqueta: 'Formalidad', valor: juezActual.formalidad },
    { etiqueta: 'Tolerancia a la ironía', valor: juezActual.tolerancia_ironia },
    { etiqueta: 'Teatralidad', valor: juezActual.teatralidad }
  ]);

  mostrarPantalla('casoJuez');
}

function iniciarFaseAlegato() {
  manoActual = repartirMano(catalogoCartas, TAMANO_MANO);
  instruccionCartas.textContent = `Elegí entre ${MIN_CARTAS} y ${MAX_CARTAS} cartas de tu mano de ${manoActual.length} para construir tu alegato.`;
  resumenCasoTitulo.textContent = casoActual.titulo;
  resumenJuezNombre.textContent = juezActual.nombre;

  reiniciarSeleccionCartas();
  mostrarPantalla('alegato');
}

function reiniciarSeleccionCartas() {
  ordenCartasJugadas.clear();
  motor.iniciarJuicio(casoActual, juezActual);

  actualizarPanelEstadoAlegato(
    {
      formalidad: motor.alegatoActual.obtenerFormalidad(),
      ironia: motor.alegatoActual.obtenerIronia(),
      teatralidad: motor.alegatoActual.obtenerTeatralidad(),
      bonusEvidencia: motor.alegatoActual.obtenerBonusEvidencia()
    },
    0
  );
  renderizarMano();
}

function renderizarPantallaVeredicto(registroPartida) {
  const { veredicto } = registroPartida;

  veredictoResultado.textContent = veredicto.resultado;
  veredictoResultado.className = `sello-resultado ${
    veredicto.resultado === 'GANADO' ? 'ganado' : 'perdido'
  }`;
  veredictoFrase.textContent = veredicto.fraseTematica;
  veredictoPuntaje.textContent = veredicto.puntajeFinal.toFixed(2);
  veredictoUmbral.textContent = String(veredicto.umbral);

  listaDesglose.innerHTML = '';
  for (const linea of veredicto.lineasDesglose) {
    const li = document.createElement('li');
    const esPenalizacionHistorial = linea.termino === 'penalización por historial';
    li.className = `item-desglose ${esPenalizacionHistorial ? 'penalizacion-historial' : ''}`;

    const info = document.createElement('div');
    info.className = 'info-termino';

    const nombre = document.createElement('span');
    nombre.className = 'nombre-termino';
    nombre.textContent = linea.termino;

    const detalle = document.createElement('span');
    detalle.className = 'detalle-termino';
    detalle.textContent = linea.detalle;

    info.append(nombre, detalle);

    const aporte = document.createElement('span');
    const signo = linea.aporte >= 0 ? '+' : '';
    aporte.className = `aporte-termino ${
      linea.aporte >= 0 ? 'aporte-positivo' : 'aporte-negativo'
    }`;
    aporte.textContent = `${signo}${linea.aporte.toFixed(2)}`;

    li.append(info, aporte);
    listaDesglose.appendChild(li);
  }

  mostrarPantalla('veredicto');
}

async function inicializarApp() {
  const repositorioHistorial = await crearRepositorioHistorial();
  const estrategiaVeredicto = new EstrategiaParametrica(PESOS_VEREDICTO, UMBRAL_VEREDICTO);

  motor = new MotorJuicio({
    estrategiaVeredicto,
    repositorioHistorial
  });

  // Escuchar eventos del motor (Patrón Observer)
  motor.on('cartaJugada', ({ carta, orden, estadoAlegato }) => {
    ordenCartasJugadas.set(carta.id, orden);
    actualizarPanelEstadoAlegato(estadoAlegato, orden);
    renderizarMano();
  });

  motor.on('veredictoListo', (registroPartida) => {
    renderizarPantallaVeredicto(registroPartida);
  });

  btnComenzar.addEventListener('click', () => {
    prepararNuevoCasoYJuez();
  });

  btnIrAlegato.addEventListener('click', () => {
    iniciarFaseAlegato();
  });

  btnReiniciarAlegato.addEventListener('click', () => {
    reiniciarSeleccionCartas();
  });

  btnDictarVeredicto.addEventListener('click', async () => {
    btnDictarVeredicto.disabled = true;
    try {
      await motor.dictarVeredicto();
    } catch {
      // Si el repositorio remoto (Firestore) falla en medio de la partida, cambiar a memoria y reintentar
      mostrarAvisoDiscreto(
        'Aviso: No se pudo guardar en Firestore. Se cambió a historial en memoria para continuar.'
      );
      motor.repositorioHistorial = new HistorialMemoria();
      await motor.dictarVeredicto();
    }
  });

  btnNuevaPartida.addEventListener('click', () => {
    prepararNuevoCasoYJuez();
  });
}

inicializarApp();
