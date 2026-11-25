# Simulador de Abogado

Proyecto web desarrollado en **JavaScript puro (ES Modules)**, sin frameworks, donde el jugador defiende un caso absurdo y ficticio jugando entre 2 y 3 cartas (**evidencia**, **ley**, **testigo**) ante un juez, y un motor paramétrico desacoplado calcula el veredicto final con su desglose exacto línea por línea.

---

## Instalación, Dependencias y Ejecución

### 1. Requisitos previos
- **Node.js** v18 o superior.
- **npm** (incluido con Node.js).

### 2. Clonar e instalar dependencias
Cloná el repositorio e instalá las dependencias (como el SDK de `firebase`) ejecutando en la raíz del proyecto:

```bash
git clone https://github.com/Alediaz04/simulador-de-abogado.git
cd simulador-de-abogado
npm install
```

### 3. Configuración de Firebase para Vite (Variables de entorno)
Por seguridad, las claves y credenciales de Firebase **no se suben a GitHub** (están excluidas en `.gitignore`).
`src/data/firebaseClient.js` está preparado para **Vite** leyendo la configuración desde `import.meta.env.VITE_FIREBASE_*` y autenticando de forma anónima mediante `signInAnonymously`:

1. Creá un archivo `.env` en la raíz del proyecto (ignorado por Git) con las variables `VITE_FIREBASE_*`:
   ```env
   VITE_FIREBASE_API_KEY=tu_api_key
   VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=tu-proyecto
   VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
   VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
   ```
   *(Como alternativa fuera de Vite, también podés copiar `src/data/firebaseConfig.example.js` a `src/data/firebaseConfig.local.js`).*

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

*(Nota: Para correr la simulación de consola con `HistorialMemoria` no hace falta conexión a Firebase).*

### 4. Cómo ejecutar el proyecto
Para correr la simulación por consola que ejecuta **3 partidas** de prueba e imprime los eventos y el desglose línea por línea:

```bash
npm run demo
```

O directamente con Node:

```bash
node tests/demo-consola.js
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
    historialMemoria.js            (Implementación en memoria para pruebas y consola)
    historialFirestore.js          (Implementación Firestore filtrada por { db, uid })
    firebaseClient.js              (Exporta iniciarFirebase() con signInAnonymously y VITE_FIREBASE_*)
    firebaseConfig.example.js      (Plantilla pública de configuración de Firebase)
    firebaseConfig.local.js        (Credenciales reales locales - ignorado en .gitignore)
  /ui                              (Reservado para vistas y controlador web)
  /config
    pesos.js                       (Pesos pA, pE, pG, pAb y penalizacionHistorial)
    umbral.js                      (Umbral de puntaje para GANADO / PERDIDO)
/data-seed
  cartas.json                      (Catálogo de cartas ficticias)
  jueces.json                      (Perfiles de jueces ficticios)
  modulos-casos.json               (Módulos de acusados, cargos, contextos y parámetros base)
/tests
  demo-consola.js                  (Simulación de 3 partidas por consola con desglose completo)
/docs
  prompts-log.md                   (Registro de evolución e iteraciones del proyecto)
```

---

## Reglas y Patrones de Arquitectura

1. **Aislamiento del Motor (`/src/engine`)**:
   - Escrito 100% en JavaScript puro. No importa ni conoce el DOM, Firebase ni la carpeta `/src/ui`.
2. **Aislamiento de Datos y Firebase (`/src/data`)**:
   - Solo `/src/data` conoce al SDK de Firebase (`firebase/app`, `firebase/auth` y `firebase/firestore`).
   - `iniciarFirebase()` autentica anónimamente al jugador (`signInAnonymously`) y entrega `{ db, uid }` a `HistorialFirestore`, aislando las partidas por usuario.
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

---

## Modelo Matemático y Parámetros Actuales

### 1. Entidades y Dimensiones (Rango `0` a `10`)

- **Caso** (`GeneradorCasos`):
  - `gravedad` (`0` a `10`)
  - `absurdo` (`0` a `10`)
  - `evidencia_disponible` (`0` a `10`)
- **Juez** (`PerfilJuez`):
  - `formalidad` (`0` a `10`)
  - `tolerancia_ironia` (`0` a `10`)
  - `teatralidad` (`0` a `10`)
- **Alegato** (`AlegatoBase` decorado por `2` o `3` cartas):
  - `formalidad` (`0` a `10`, con clamp tras cada carta)
  - `ironia` (`0` a `10`, con clamp tras cada carta)
  - `teatralidad` (`0` a `10`, con clamp tras cada carta)
  - `bonusEvidencia` (acumulado por las cartas jugadas)

### 2. Fórmula del Veredicto

1. **Afinidad por dimensión** (`formalidad`, `ironia`/`tolerancia_ironia`, `teatralidad`):
   $$\text{afinidad}_d = 10 - |\text{valor\_juez}_d - \text{valor\_alegato}_d|$$
2. **Penalización por absurdo del caso**:
   $$\text{penalización\_absurdo} = p_{Ab} \cdot \max(0, \text{absurdo\_caso} - \text{tolerancia\_ironia\_juez})$$
3. **Puntaje Final**:
   $$\text{puntaje} = p_A \cdot \sum \text{afinidades} + p_E \cdot (\text{evidencia\_disponible} + \text{bonus}) - p_G \cdot \text{gravedad} - \text{penalización\_absurdo} - \text{penalización\_historial}$$
4. **Resultado**:
   - `GANADO` si $\text{puntaje} \ge \text{UMBRAL\_VEREDICTO}$
   - `PERDIDO` si $\text{puntaje} < \text{UMBRAL\_VEREDICTO}$
   - Incluye una frase temática acorde al fallo del juez.

### 3. Desglose Exacto

El método `calcular()` devuelve `lineasDesglose`, donde cada término de la fórmula es una fila con su aporte positivo o negativo:
1. `Afinidad en Formalidad`
2. `Afinidad en Ironía`
3. `Afinidad en Teatralidad`
4. `Evidencia (disponible + bonus)`
5. `Gravedad del caso`
6. `Absurdo del caso vs. tolerancia del juez`
7. `penalización por historial` *(solo se incluye si el repositorio indica que el jugador repitió un tipo de carta con ese juez)*

El `puntajeFinal` es **exactamente la suma de las líneas mostradas** en el desglose.

---

## Historial de Modificaciones y Evolución

1. **Iteración 1 — Estructura base y patrones**:
   - Creación de la arquitectura de carpetas (`/src/engine`, `/src/data`, `/src/config`, `/data-seed`, `/tests`).
   - Implementación inicial de los patrones Decorator, Strategy, Observer e Inyección de Dependencias con datos ficticios y script de consola.
2. **Iteración 2 — Refactorización a requerimientos del cliente**:
   - **Caso**: reemplazo de atributos iniciales por `gravedad`, `absurdo` y `evidencia_disponible` (`0` a `10`), eliminando `Solidez` y `Credibilidad`.
   - **Juez**: reemplazo de afinidades y etiquetas favoritas/odiadas por `formalidad`, `tolerancia_ironia` y `teatralidad` (`0` a `10`).
   - **Alegato y Cartas**: adopción de dimensiones `formalidad`, `ironia`, `teatralidad` y `bonusEvidencia`; eliminación de combos y efectos especiales entre cartas.
   - **Veredicto y Desglose**: implementación de la fórmula ponderada con `pA`, `pE`, `pG` y `penalizacionHistorial`, resultado binario `GANADO` / `PERDIDO` y suma exacta de líneas en el desglose.
3. **Iteración 3 — Ajustes de absurdo, clamp y caso grave de derrota**:
   - **Penalización por absurdo del caso**: incorporación del peso `pAb` en `/src/config/pesos.js` y del término `pAb * max(0, absurdo_caso - tolerancia_ironia_juez)` con su línea `"Absurdo del caso vs. tolerancia del juez"` en el desglose.
   - **Clamp en `CartaDecorator`**: limitación al rango `[0, 10]` de `formalidad`, `ironia` y `teatralidad` inmediatamente después de aplicar cada carta.
   - **Demo de 3 partidas**: ampliación de `tests/demo-consola.js` para demostrar victoria, penalización por historial y derrota en caso grave.
4. **Iteración 4 — Conexión con Firebase Firestore, `.gitignore` y Seguridad**:
   - Instalación del SDK de `firebase` vía npm.
   - Implementación de `src/data/firebaseClient.js` y `src/data/historialFirestore.js` respetando que solo `/src/data` conozca a Firebase mientras `/src/engine` permanece intacto.
   - Separación de credenciales sensibles en `.gitignore`.
5. **Iteración 5 — Autenticación Anónima (`uid`), soporte para Vite y aislamiento por usuario**:
   - `firebaseClient.js` exporta `iniciarFirebase()`, lee `import.meta.env.VITE_FIREBASE_*`, ejecuta `signInAnonymously` y retorna `{ db, uid }`.
   - `HistorialFirestore` recibe `{ db, uid }` en el constructor, adjunta `uid` a cada partida, filtra todas las consultas por `uid` y `limpiar()` elimina únicamente las partidas de ese `uid`.
   - Reemplazo de `structuredClone` por `JSON.parse(JSON.stringify(...))` en `/src/data`.
