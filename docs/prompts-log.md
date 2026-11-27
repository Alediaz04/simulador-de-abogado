# Registro de Evolución de Prompts - Simulador de Abogado (Iron Dev's)

## 24/11/26

### Prompt 1: Estructura base del motor y arquitectura
```text
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
```

* **Fecha:** 24/11/2026
* **Prompt:** Solicitud inicial de arquitectura en capas, patrones de diseño (Decorator, Strategy, Observer, DI) y script de consola sin interfaz.
* **Resultado:** Se generó la estructura de carpetas (`/src/engine`, `/src/config`, `/src/data`) con los patrones solicitados y una primera simulación ejecutándose por consola.
* **Qué salió mal:** La IA inventó atributos y mecánicas que el cliente nunca pidió en el SRS: agregó parámetros extra como *Solidez* y *Credibilidad*, etiquetas favoritas/odiadas en los jueces y bonificaciones por coincidencia de etiquetas.
* **Qué se ajustó:** Se redactó el Prompt 2 acotando estrictamente el dominio a los parámetros definidos por el cliente y prohibiendo agregar funcionalidades fuera de lista.

---

### Prompt 2: Alineación con el modelo de datos y fórmula del cliente
```text
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
```

* **Fecha:** 24/11/2026
* **Prompt:** Refactorización del motor para eliminar atributos inventados y ajustar el cálculo a las dimensiones del SRS.
* **Resultado:** Se limpiaron los modelos de `Caso`, `Juez` y `Alegato`, dejando solo los parámetros reales del cliente y los decoradores de cartas puros.
* **Qué salió mal:** Hubo dos fallas: por un lado, la suma individual de las líneas del desglose no coincidía de forma exacta con el puntaje final por redondeos/términos omitidos; por otro, por un error en nuestro propio prompt, la fórmula dejaba afuera el parámetro `absurdo` del caso. Además, las dimensiones del alegato podían desbordarse fuera de 0–10 y la demo solo mostraba partidas ganadas.
* **Qué se ajustó:** Se preparó el Prompt 3 para incorporar el término de penalización por absurdo, aplicar límites (clamp 0–10) y asegurar la consistencia matemática del desglose junto con un caso de derrota.

---

### Prompt 3: Término de absurdo, clamp 0–10 y caso de derrota en demo
```text
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
```

* **Fecha:** 24/11/2026
* **Prompt:** Inclusión del impacto del absurdo frente a la tolerancia a la ironía del juez, acotación de valores y escenario de derrota en consola.
* **Resultado:** El motor incorporó `pAb * max(0, absurdo_caso - tolerancia_ironia_juez)` en `EstrategiaParametrica`, el clamp 0–10 tras decorar cada carta y una tercera partida en `npm run demo` que finaliza en `PERDIDO` con desglose exacto.
* **Qué salió mal:** En esta iteración no hubo errores funcionales en el motor; el cálculo quedó cerrado y validado por pruebas unitarias.
* **Qué se ajustó:** Se pasó a implementar la capa de persistencia en la nube (`/src/data`) manteniendo desacoplado el motor.

---

### Prompt 4: Persistencia en Firebase y preparación para Vite
```text
Modificá SOLO /src/data. No toques /src/engine.
1. firebaseClient.js: exportá iniciarFirebase() que haga signInAnonymously y devuelva { db, uid }.
2. HistorialFirestore recibe { db, uid } en el constructor, guarda uid en cada partida,
   filtra TODAS las consultas por uid y limpiar() borra solo las partidas de ese uid.
3. Reemplazá structuredClone por JSON.parse(JSON.stringify(...)).
4. Preparalo para Vite: leé la config con import.meta.env.VITE_FIREBASE_* y actualizá el README.
```

* **Fecha:** 24/11/2026
* **Prompt:** Implementación de `HistorialFirestore` y configuración de Firebase sin modificar `/src/engine`.
* **Resultado:** Se creó el cliente de Firebase y el repositorio persistente en `/src/data` respetando la interfaz `RepositorioHistorial`.
* **Qué salió mal:** En una versión preliminar de Firebase, el historial se guardaba de forma global (mezclando las partidas de todos los usuarios) y los `imports` de módulos fallaban al ejecutarse directamente en el navegador sin empaquetador.
* **Qué se ajustó:** Se implementó autenticación anónima (`signInAnonymously`) para aislar el historial por `uid` de jugador, se reemplazó `structuredClone` por clonación compatible y se configuró el proyecto con Vite (`import.meta.env.VITE_FIREBASE_*`).

---

## 26/11/26

### Prompt 5: Reglas de reparto de mano y corrección de historial entre partidas
```text
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
```

* **Fecha:** 26/11/2026
* **Prompt:** Parametrización del tamaño de mano, reparto aleatorio, selección aleatoria de dificultad de caso y ajuste en la regla del juez recurrente.
* **Resultado:** Se extrajeron las constantes a `/src/config/juego.js`, se implementó `repartirMano` y se corrigió la evaluación del historial para que penalice únicamente repeticiones respecto de partidas previas.
* **Qué salió mal:** La regla anterior penalizaba repetir tipos de carta dentro de la misma mano de una única partida, lo que no coincidía con el comportamiento esperado del juez recurrente entre partidas.
* **Qué se ajustó:** Se actualizó tanto `HistorialMemoria` como `HistorialFirestore` y se adaptaron los tests correspondientes para que sigan pasando las 12 pruebas.

---

### Prompt 6: Interfaz web en /src/ui con Vite
```text
Creá la interfaz web en /src/ui con Vite (JavaScript, HTML y CSS puros, sin frameworks).
Instalá vite como devDependency y agregá los scripts dev, build y preview.
Reglas: la interfaz NO calcula nada; usa MotorJuicio, repartirMano, GeneradorCasos y los
datos de /data-seed (leelos del JSON sin asumir cuántos jueces ni cartas hay). /src/engine
no se modifica. Nada fuera de esta lista.

Pantallas (en español):
1. Inicio: título del juego y botón "Comenzar juicio".
2. Caso y juez: texto del caso, sus parámetros (gravedad, absurdo, evidencia_disponible)
   y el perfil del juez con sus parámetros. Botón para continuar.
3. Alegato: mano de 5 cartas. El jugador elige 2 o 3 y ve cómo cambia el alegato
   (formalidad, ironía, teatralidad, bonus) usando el evento 'cartaJugada' del motor.
   No se puede confirmar con menos de 2 ni elegir más de 3.
4. Veredicto: GANADO o PERDIDO, la frase temática, el puntaje y el desglose línea por
   línea. La penalización por historial debe verse destacada. Botón "Nueva partida".

Persistencia: usá iniciarFirebase() y HistorialFirestore. Si Firebase falla o no está
configurado, usá HistorialMemoria y mostrá un aviso discreto.
Sin login, sin menús extra, sin sonidos.
```

* **Fecha:** 26/11/2026
* **Prompt:** Creación de las 4 pantallas de interfaz web desacopladas del motor, consumiendo `/data-seed` dinámicamente y con fallback automático a memoria local.
* **Resultado:** Interfaz funcional en `/src/ui` conectada al motor mediante eventos (`cartaJugada`, `veredictoListo`), con soporte para cantidades variables de jueces y cartas en `/data-seed`.
* **Qué salió mal:** Sin inconvenientes; la interfaz delega el 100% de los cálculos a `/src/engine` y degrada con gracia a `HistorialMemoria` si no hay credenciales de Firebase configuradas.
* **Qué se ajustó:** Se dejó preparado el consumo dinámico de los JSON para incorporar las nuevas semillas de jueces, cartas y casos.