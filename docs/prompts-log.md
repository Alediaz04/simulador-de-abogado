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


