import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebaseClient.js';
import { RepositorioHistorial } from './repositorioHistorial.js';

/**
 * Implementación de RepositorioHistorial conectada a Firebase Firestore.
 * Todo el conocimiento de Firebase queda encapsulado exclusivamente en src/data/.
 */
export class HistorialFirestore extends RepositorioHistorial {
  /**
   * @param {string} [nombreColeccion='partidas']
   */
  constructor(nombreColeccion = 'partidas') {
    super();
    this.nombreColeccion = nombreColeccion;
    this.coleccionRef = collection(db, this.nombreColeccion);
  }

  /**
   * Guarda una partida en la colección de Firestore.
   * @param {object} partida
   * @returns {Promise<void>}
   */
  async guardarPartida(partida) {
    const copia = structuredClone ? structuredClone(partida) : JSON.parse(JSON.stringify(partida));
    await addDoc(this.coleccionRef, copia);
  }

  /**
   * Obtiene todas las partidas almacenadas en Firestore.
   * @returns {Promise<Array<object>>}
   */
  async obtenerTodas() {
    const snapshot = await getDocs(this.coleccionRef);
    return snapshot.docs.map((docSnap) => ({
      firestoreDocId: docSnap.id,
      ...docSnap.data()
    }));
  }

  /**
   * Verifica en Firestore si el jugador repitió un tipo de carta con ese juez
   * (ya sea respecto al historial almacenado en Firestore para ese juez o en la misma mano).
   * @param {string} juezId
   * @param {Array<string>} tiposCartasJugadas
   * @returns {Promise<boolean>}
   */
  async repitioTipoCartaConJuez(juezId, tiposCartasJugadas) {
    const consulta = query(this.coleccionRef, where('juezId', '==', juezId));
    const snapshot = await getDocs(consulta);

    const partidasConEsteJuez = snapshot.docs.map((docSnap) => docSnap.data());
    const tiposUsadosPreviamente = new Set(
      partidasConEsteJuez.flatMap((p) => (p.cartas ?? []).map((c) => c.tipo))
    );

    const repitioContraHistorialPrevio = tiposCartasJugadas.some((tipo) =>
      tiposUsadosPreviamente.has(tipo)
    );

    const repitioEnMismaMano = new Set(tiposCartasJugadas).size < tiposCartasJugadas.length;

    return repitioContraHistorialPrevio || repitioEnMismaMano;
  }

  /**
   * Elimina todos los documentos de la colección de partidas en Firestore.
   * @returns {Promise<void>}
   */
  async limpiar() {
    const snapshot = await getDocs(this.coleccionRef);
    const promesasBorrado = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(promesasBorrado);
  }
}
