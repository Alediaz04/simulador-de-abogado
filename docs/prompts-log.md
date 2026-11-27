24/11/26
Prompt 1:
Creá un proyecto web con HTML, CSS y JavaScript puro (módulos ES), sin frameworks.
Es un "Simulador de Abogado": el jugador defiende un caso absurdo jugando 2 o 3
cartas (evidencia, ley, testigo) ante un juez, y un motor paramétrico calcula
el veredicto con desglose.

Reglas de arquitectura (obligatorias):
- /src/engine es JS puro: no puede importar DOM, Firebase ni /ui.
- Las cartas modifican un Alegato mediante el patrón Decorator.
- La fórmula del veredicto es una Strategy intercambiable; los pesos van en /src/config.
- El motor emite eventos (Observer): cartaJugada, penalizacionAplicada, veredictoListo.
- El historial se accede por una interfaz (RepositorioHistorial), inyectada al motor
  (Dependency Injection), con una implementación en memoria por ahora.
- Todo el contenido es ficticio y absurdo; nada de personas ni leyes reales.

Primera tarea: creá la estructura de carpetas, las clases base del motor y un script
de consola que juegue una partida con datos fijos e imprima el desglose.
No agregues interfaz todavía.


prompt 2:
Refactorizá el motor para que cumpla exactamente estos requerimientos del cliente.
No agregues funcionalidades que no estén en esta lista.

1. Caso: parámetros gravedad, absurdo y evidencia_disponible (0 a 10).
   Eliminá Solidez y Credibilidad.
2. Juez: parámetros formalidad, tolerancia_ironia y teatralidad (0 a 10).
   Eliminá etiquetas favoritas/odiadas, "máximo de absurdo tolerado" y bonificaciones por etiqueta.
3. Alegato: tiene las dimensiones formalidad, ironia y teatralidad, más un bonus de evidencia.
   Cada carta (evidencia, ley, testigo), aplicada con Decorator, suma o resta sobre esos valores.
   Sin combos ni efectos especiales entre cartas.
4. Veredicto: suma ponderada en /src/config:
   afinidad por dimensión = 10 - |valor del juez - valor del alegato|;
   puntaje = pA*afinidades + pE*(evidencia_disponible + bonus) - pG*gravedad - penalización de historial.
   Pesos y umbral en config.
5. Resultado: GANADO o PERDIDO según el umbral, con una frase temática opcional.
6. Desglose: una línea por término con su aporte, y el puntaje final debe ser exactamente
   la suma de las líneas mostradas. Incluí una línea "penalización por historial" solo si el
   repositorio indica que el jugador repitió un tipo de carta con ese juez.
7. Mantené: Decorator, Observer, la inyección del repositorio y la demo de consola.

Prompt 3:
Ajustá el motor con estos cambios. No agregues nada más.

1. Veredicto: sumá el término de absurdo del caso:
   penalización_absurdo = pAb * max(0, absurdo_caso - tolerancia_ironia_juez)
   Restalo del puntaje. pAb va en /src/config/pesos.js.
   Agregá una línea al desglose: "Absurdo del caso vs. tolerancia del juez".
2. Alegato: limitá formalidad, ironia y teatralidad al rango 0 a 10 después de aplicar
   cada carta (clamp). Documentalo en un comentario.
3. Demo: agregá una tercera partida con otra combinación de cartas y un caso grave que dé
   PERDIDO, con el desglose completo, y mostrá su frase temática de derrota.
4. Mantené la regla actual de penalización por historial, configurable en /src/config.
5. El desglose debe seguir sumando exacto al puntaje final.



Modificá SOLO /src/data. No toques /src/engine.
1. firebaseClient.js: exportá iniciarFirebase() que haga signInAnonymously y devuelva { db, uid }.
2. HistorialFirestore recibe { db, uid } en el constructor, guarda uid en cada partida,
   filtra TODAS las consultas por uid y limpiar() borra solo las partidas de ese uid.
3. Reemplazá structuredClone por JSON.parse(JSON.stringify(...)).
4. Preparalo para Vite: leé la config con import.meta.env.VITE_FIREBASE_* y actualizá el README.


26/11/26

Prompts:
Ajustá el motor. No agregues nada fuera de esta lista.

1. Creá /src/config/juego.js con TAMANO_MANO = 5, MIN_CARTAS = 2 y MAX_CARTAS = 3.
   motor.js debe usar esos valores en vez de números escritos adentro.
2. Creá /src/engine/mano/repartirMano.js con repartirMano(cartas, tamano): devuelve
   `tamano` cartas distintas al azar del catálogo. Si hay menos cartas que `tamano`,
   devuelve todas. Sin lógica de interfaz.
3. GeneradorCasos.generarCaso: si no se indica el conjunto de parámetros, elegilo al azar
   entre parametrosBase (hoy usa siempre el primero).
4. HistorialMemoria y HistorialFirestore: repitioTipoCartaConJuez debe mirar SOLO las
   partidas anteriores con ese juez. Eliminá la comparación de tipos repetidos dentro de
   la misma mano.
5. Mantené Decorator, Strategy, Observer, DI, el desglose exacto y el clamp.
6. `npm run demo`, `npm test` y `npm run balance` deben seguir funcionando. Actualizá las
   pruebas que dependían de la regla vieja.

   