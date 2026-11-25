# Reglas para la IA (Antigravity) — Simulador de Abogado

Estas reglas son OBLIGATORIAS en cada prompt. Si una petición las contradice, avisá antes de hacerla.

## Alcance
- Hacé solo lo que pide el SRS del cliente (equipo "Simulador de Abogado"). No agregues funcionalidades, parámetros, mecánicas ni dependencias que no estén en el pedido.
- Todo el contenido es ficticio, absurdo y no ofensivo. Sin personas ni leyes reales.
- Idioma de la aplicación: español.

## Arquitectura (capas)
- `/src/engine`: JavaScript puro. PROHIBIDO importar o usar DOM (`document`, `window`), Firebase, `localStorage` o cualquier cosa de `/src/ui` y `/src/data`.
- `/src/data`: ÚNICA capa que conoce Firebase/Firestore. Implementa el contrato `RepositorioHistorial`.
- `/src/ui`: vistas y controlador (HTML/CSS/JS). Habla con el motor solo por su API pública y los eventos.
- `/src/config`: pesos y umbral. Ningún número de la fórmula va escrito dentro del motor.
- `/data-seed`: catálogo (jueces, cartas, módulos de casos) en JSON.

## Patrones (no los reemplaces)
- Decorator: cada carta envuelve al alegato (`CartaDecorator`).
- Strategy: la fórmula del veredicto es intercambiable (`EstrategiaVeredicto`).
- Observer: el motor emite `cartaJugada`, `penalizacionAplicada`, `veredictoListo`.
- Dependency Injection: al `MotorJuicio` se le inyectan la estrategia y el repositorio; nunca los crea él.

## Reglas del juego
- Caso: `gravedad`, `absurdo`, `evidencia_disponible` (0 a 10).
- Juez: `formalidad`, `tolerancia_ironia`, `teatralidad` (0 a 10).
- Alegato: `formalidad`, `ironia`, `teatralidad` (0 a 10, con clamp) y `bonusEvidencia`.
- El jugador juega 2 o 3 cartas. Resultado: GANADO o PERDIDO según el umbral.
- El desglose tiene una línea por término y el puntaje final es EXACTAMENTE la suma de esas líneas.

## Calidad
- Antes de terminar, `npm run demo` y `npm test` deben seguir funcionando.
- No subas claves ni credenciales. Las variables `VITE_FIREBASE_*` van en `.env.local` (ignorado por git).
