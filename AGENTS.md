/src
  /engine        ← JS puro, sin DOM ni Firebase
    alegato.js         (base del Decorator)
    cartas/            (CartaDecorator, evidencia, ley, testigo)
    jueces/            (perfiles)
    veredicto/         (estrategia de fórmula, desglose)
    casos/             (generador por módulos)
    eventos.js         (Observer)
    motor.js           (recibe todo por inyección)
  /data
    repositorioHistorial.js    (interfaz)
    historialMemoria.js        (para pruebas)
    historialFirestore.js
  /ui            ← vistas y controlador
  /config        pesos.js, umbral.js
/data-seed       cartas.json, jueces.json, modulos-casos.json
/tests
/docs