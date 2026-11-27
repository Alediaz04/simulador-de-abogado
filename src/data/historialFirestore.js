import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { RepositorioHistorial } from './repositorioHistorial.js';

/**
 * Implementación de RepositorioHistorial conectada a Firebase Firestore.
 * Todo el conocimiento de Firebase queda encapsulado exclusivamente en src/data/.
 */
export class HistorialFirestore extends RepositorioHistorial {
  /**
   * @param {object} params
   * @param {import('firebase/firestore').Firestore} params.db
   * @param {string} params.uid
   * @param {string} [nombreColeccion='partidas']
   */
  constructor({ db, uid }, nombreColeccion = 'partidas') {
    super();
    if (!db || !uid) {
      throw new Error('HistorialFirestore requiere { db, uid } en el constructor.');
    }
    this.db = db;
    this.uid = uid;
    this.nombreColeccion = nombreColeccion;
    this.coleccionRef = collection(this.db, this.nombreColeccion);
  }

  /**
   * Guarda una partida en la colección de Firestore asociando el uid del usuario.
   * @param {object} partida
   * @returns {Promise<void>}
   */
  async guardarPartida(partida) {
    const copia = JSON.parse(JSON.stringify(partida));
    copia.uid = this.uid;
    await addDoc(this.coleccionRef, copia);
  }

  /**
   * Obtiene todas las partidas almacenadas en Firestore pertenecientes a este uid.
   * @returns {Promise<Array<object>>}
   */
  async obtenerTodas() {
    const consulta = query(this.coleccionRef, where('uid', '==', this.uid));
    const snapshot = await getDocs(consulta);
    return snapshot.docs.map((docSnap) => ({
      firestoreDocId: docSnap.id,
      ...docSnap.data()
    }));
  }

  /**
   * Verifica en Firestore (filtrando por uid y juezId) si el jugador repitió un tipo de carta
   * en partidas anteriores frente al mismo juez.
   * @param {string} juezId
   * @param {Array<string>} tiposCartasJugadas
   * @returns {Promise<boolean>}
   */
  async repitioTipoCartaConJuez(juezId, tiposCartasJugadas) {
    const consulta = query(
      this.coleccionRef,
      where('uid', '==', this.uid),
      where('juezId', '==', juezId)
    );
    const snapshot = await getDocs(consulta);

    const partidasConEsteJuez = snapshot.docs.map((docSnap) => docSnap.data());
    const tiposUsadosPreviamente = new Set(
      partidasConEsteJuez.flatMap((p) => (p.cartas ?? []).map((c) => c.tipo))
    );

    return tiposCartasJugadas.some((tipo) => tiposUsadosPreviamente.has(tipo));
  }

  /**
   * Elimina únicamente las partidas de la colección en Firestore que pertenecen a este uid.
   * @returns {Promise<void>}
   */
  async limpiar() {
    const consulta = query(this.coleccionRef, where('uid', '==', this.uid));
    const snapshot = await getDocs(consulta);
    const promesasBorrado = snapshot.docs.map((docSnap) => deleteDoc(docSnap.ref));
    await Promise.all(promesasBorrado);
  }
}
