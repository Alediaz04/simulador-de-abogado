# Simulador de Abogado

Proyecto web desarrollado en **JavaScript, HTML y CSS puros (ES Modules con Vite)**, sin frameworks, donde el jugador defiende un caso absurdo y ficticio jugando entre 2 y 3 cartas (**evidencia**, **ley**, **testigo**) ante un juez, y un motor paramétrico desacoplado calcula el veredicto final con su desglose exacto línea por línea.

---

## Instalación, Dependencias y Ejecución

### 1. Requisitos previos
- **Node.js** v18 o superior.
- **npm** (incluido con Node.js).

### 2. Clonar e instalar dependencias
Cloná el repositorio e instalá las dependencias ejecutando en la raíz del proyecto:

```bash
git clone https://github.com/Alediaz04/simulador-de-abogado.git
cd simulador-de-abogado
npm install
```

### 3. Configuración de Firebase con Vite (`.env.local`)
Por seguridad, las claves y credenciales de Firebase **no se suben a GitHub** (están excluidas en `.gitignore`).
`src/data/firebaseClient.js` lee la configuración exclusivamente desde `import.meta.env.VITE_FIREBASE_*` y autentica de forma anónima mediante `signInAnonymously`:

1. Creá un archivo `.env.local` en la raíz del proyecto (ignorado por Git) con las variables `VITE_FIREBASE_*`:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
   VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
   ```
   Si falta `VITE_FIREBASE_API_KEY`, `iniciarFirebase()` lanza un error claro y la interfaz web pasa automáticamente a usar `HistorialMemoria` mostrando un aviso discreto.

2. Uso de `iniciarFirebase()` e `HistorialFirestore`:
   ```js
   import { iniciarFirebase } from './src/data/firebaseClient.js';
   import { HistorialFirestore } from './src/data/historialFirestore.js';

   const { db, uid } = await iniciarFirebase(); // Ejecuta signInAnonymously
   const repositorioHistorial = new HistorialFirestore({ db, uid });
   ```
   - `HistorialFirestore` recibe `{ db, uid }` en su constructor.
   - Guarda el `uid` en cada partida (`JSON.parse(JSON.stringify(partida))`).
   - Filtra **todas** las consultas (`obtenerTodas`, `repitioTipoCartaConJuez`) por `uid`.
   - `limpiar()` borra únicamente las partidas pertenecientes a ese `uid`.

### 4. Cómo ejecutar el proyecto

- **Interfaz web en modo desarrollo (Vite)**:
  ```bash
  npm run dev
  ```
- **Compilar interfaz para producción**:
  ```bash
  npm run build
  npm run preview
  ```
- **Simulación por consola (3 partidas con desglose completo)**:
  ```bash
  npm run demo
  ```
- **Pruebas unitarias del motor**:
  ```bash
  npm test
  ```
- **Análisis de balance de cartas y jueces**:
  ```bash
  npm run balance
  ```

---

## Estructura del Proyecto

```text
/src
  /engine        ← Motor en JS puro (sin DOM, sin Firebase, sin /ui)
    alegato.js                     (Componente base del patrón Decorator)
    /cartas
      CartaDecorator.js            (Decorador base con clamp 0..10 por carta)
      CartaEvidencia.js            (Decorador concreto: Evidencia)
      CartaLey.js                  (Decorador concreto: Ley)
      CartaTestigo.js              (Decorador concreto: Testigo)
      index.js                     (Factory decorarAlegatoConCarta)
    /mano
      repartirMano.js              (Reparto aleatorio sin repetición desde el catálogo)
    /jueces
      PerfilJuez.js                (Parámetros del juez: formalidad, tolerancia_ironia, teatralidad)
    /veredicto
      EstrategiaVeredicto.js       (Patrón Strategy: cálculo paramétrico y desglose exacto)
    /casos
      GeneradorCasos.js            (Generador modular de casos absurdos)
    eventos.js                     (Patrón Observer: EmisorEventos)
    motor.js                       (MotorJuicio: orquestador con inyección de dependencias)
  /data          ← Única capa que conoce la persistencia y Firebase
    repositorioHistorial.js        (Interfaz base / contrato RepositorioHistorial)
    historialMemoria.js            (Implementación en memoria para pruebas, consola y fallback)
    historialFirestore.js          (Implementación Firestore filtrada por { db, uid })
    firebaseClient.js              (Exporta iniciarFirebase() con signInAnonymously e import.meta.env.VITE_FIREBASE_*)
  /ui            ← Vistas y controlador web (HTML/CSS/JS puro con Vite)
    main.js                        (Controlador de pantallas que consume MotorJuicio y sus eventos)
    styles.css                     (Estética de tribunal solemne/absurda y diseño responsive 320px+)
  /config
    juego.js                       (TAMANO_MANO = 5, MIN_CARTAS = 2, MAX_CARTAS = 3)
    pesos.js                       (Pesos pA, pE, pG, pAb y penalizacionHistorial)
    umbral.js                      (Umbral de puntaje para GANADO / PERDIDO)
/data-seed
  cartas.json                      (Catálogo de cartas ficticias)
  jueces.json                      (Perfiles de jueces ficticios)
  modulos-casos.json               (Módulos de acusados, cargos, contextos y parámetros base)
/tests
  demo-consola.js                  (Simulación de 3 partidas por consola con desglose completo)
  motor.test.js                    (Suite de pruebas unitarias del motor con node:test)
  balance.js                       (Script de análisis de balance de todas las manos posibles)
/docs
  prompts-log.md                   (Registro de evolución e iteraciones del proyecto)
index.html                         (Punto de entrada HTML para Vite)
```

---

## Reglas y Patrones de Arquitectura

1. **Aislamiento del Motor (`/src/engine`)**:
   - Escrito 100% en JavaScript puro. No importa ni conoce el DOM, Firebase ni la carpeta `/src/ui`.
2. **Aislamiento de Datos y Firebase (`/src/data`)**:
   - Solo `/src/data` conoce al SDK de Firebase (`firebase/app`, `firebase/auth` y `firebase/firestore`).
   - `iniciarFirebase()` lee `import.meta.env.VITE_FIREBASE_*`, autentica anónimamente al jugador (`signInAnonymously`) y entrega `{ db, uid }` a `HistorialFirestore`, aislando las partidas por usuario.
   - El motor interactúa únicamente con el contrato `RepositorioHistorial` mediante **Inyección de Dependencias**, permitiendo alternar entre `HistorialMemoria` e `HistorialFirestore` sin tocar una sola línea del motor.
3. **Patrón Decorator (`AlegatoBase` + `CartaDecorator`)**:
   - El alegato comienza en `AlegatoBase` con dimensiones `formalidad`, `ironia`, `teatralidad` y `bonusEvidencia`.
   - Cada carta jugada (`CartaEvidencia`, `CartaLey`, `CartaTestigo`) envuelve al alegato anterior sumando o restando directamente sobre esas dimensiones, sin combos ni efectos cruzados entre cartas.
   - Después de aplicar cada carta, las dimensiones `formalidad`, `ironia` y `teatralidad` se limitan (**clamp**) al rango `[0, 10]`.
4. **Patrón Strategy (`EstrategiaVeredicto` / `EstrategiaParametrica`)**:
   - La fórmula de cálculo del veredicto está encapsulada en una estrategia intercambiable inyectada en `MotorJuicio`, parametrizada mediante `/src/config/pesos.js` y `/src/config/umbral.js`.
5. **Patrón Observer (`EmisorEventos`)**:
   - El motor emite eventos en tiempo real durante el juicio:
     - `cartaJugada`: al envolver el alegato con una nueva carta (informa el orden y el estado acumulado con clamp).
     - `penalizacionAplicada`: cuando se aplica la penalización por historial.
     - `veredictoListo`: cuando concluye el juicio y la partida queda registrada en el historial.
