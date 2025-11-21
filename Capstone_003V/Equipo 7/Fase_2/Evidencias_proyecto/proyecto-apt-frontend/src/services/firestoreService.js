import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy, where } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Servicio para interactuar con las colecciones de datos en Firestore
 */

// ==================== PROVEEDORES ====================

export const proveedoresFirebase = {
  async listar() {
    try {
      const querySnapshot = await getDocs(collection(db, 'proveedores'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al listar proveedores:', error);
      return [];
    }
  },

  async crear(datos) {
    try {
      const docRef = await addDoc(collection(db, 'proveedores'), {
        ...datos,
        creado_en: new Date().toISOString()
      });
      return { id: docRef.id, ...datos };
    } catch (error) {
      console.error('Error al crear proveedor:', error);
      throw error;
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'proveedores', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar proveedor:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'proveedores', id));
      return true;
    } catch (error) {
      console.error('Error al eliminar proveedor:', error);
      throw error;
    }
  }
};

// ==================== PRODUCTOS ====================

export const productosFirebase = {
  async listar() {
    try {
      const querySnapshot = await getDocs(collection(db, 'productos'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al listar productos:', error);
      return [];
    }
  },

  async crear(datos) {
    try {
      const docRef = await addDoc(collection(db, 'productos'), {
        ...datos,
        creado_en: new Date().toISOString()
      });
      return { id: docRef.id, ...datos };
    } catch (error) {
      console.error('Error al crear producto:', error);
      throw error;
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'productos', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar producto:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'productos', id));
      return true;
    } catch (error) {
      console.error('Error al eliminar producto:', error);
      throw error;
    }
  }
};

// ==================== INVENTARIO ====================

export const inventarioFirebase = {
  async listar() {
    try {
      const q = query(collection(db, 'inventario'), orderBy('fecha_ingreso', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al listar inventario:', error);
      return [];
    }
  },

  async crear(datos) {
    try {
      const docRef = await addDoc(collection(db, 'inventario'), {
        ...datos,
        creado_en: new Date().toISOString()
      });
      return { id: docRef.id, ...datos };
    } catch (error) {
      console.error('Error al crear inventario:', error);
      throw error;
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'inventario', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar inventario:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'inventario', id));
      return true;
    } catch (error) {
      console.error('Error al eliminar inventario:', error);
      throw error;
    }
  }
};

// ==================== PRODUCCIÓN ====================

export const produccionFirebase = {
  async listar() {
    try {
      const q = query(collection(db, 'produccion'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al listar producción:', error);
      return [];
    }
  },

  async crear(datos) {
    try {
      const docRef = await addDoc(collection(db, 'produccion'), {
        ...datos,
        creado_en: new Date().toISOString()
      });
      return { id: docRef.id, ...datos };
    } catch (error) {
      console.error('Error al crear producción:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'produccion', id));
      return true;
    } catch (error) {
      console.error('Error al eliminar producción:', error);
      throw error;
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'produccion', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar producción:', error);
      throw error;
    }
  }
};

// ==================== CHECKLISTS ====================

export const checklistsFirebase = {
  async listar() {
    try {
      const q = query(collection(db, 'checklists'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al listar checklists:', error);
      return [];
    }
  },

  async crear(datos) {
    try {
      const docRef = await addDoc(collection(db, 'checklists'), {
        ...datos,
        creado_en: new Date().toISOString()
      });
      return { id: docRef.id, ...datos };
    } catch (error) {
      console.error('Error al crear checklist:', error);
      throw error;
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'checklists', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar checklist:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'checklists', id));
      return true;
    } catch (error) {
      console.error('Error al eliminar checklist:', error);
      throw error;
    }
  }
};

// ==================== ALERTAS ====================

export const alertasFirebase = {
  async listar() {
    try {
      // Obtener todas las alertas y filtrar en el cliente para evitar necesitar índice compuesto
      const q = query(collection(db, 'alertas'), orderBy('fecha', 'desc'));
      const querySnapshot = await getDocs(q);
      const todasAlertas = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Filtrar solo las activas
      return todasAlertas.filter(a => a.estado === 'activa');
    } catch (error) {
      console.error('Error al listar alertas:', error);
      return [];
    }
  },

  async contar() {
    try {
      const alertas = await this.listar();
      return { total_alertas: alertas.length };
    } catch (error) {
      console.error('Error al contar alertas:', error);
      return { total_alertas: 0 };
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'alertas', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar alerta:', error);
      throw error;
    }
  },

  async resolver(id) {
    try {
      await updateDoc(doc(db, 'alertas', id), {
        estado: 'resuelta',
        fecha_resolucion: new Date().toISOString()
      });
      return true;
    } catch (error) {
      console.error('Error al resolver alerta:', error);
      throw error;
    }
  }
};

// ==================== RECETAS ====================

export const recetasFirebase = {
  async listar() {
    try {
      const q = query(collection(db, 'recetas'), orderBy('nombre', 'asc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error al listar recetas:', error);
      return [];
    }
  },

  async crear(datos) {
    try {
      const docRef = await addDoc(collection(db, 'recetas'), {
        ...datos,
        creado_en: new Date().toISOString()
      });
      return { id: docRef.id, ...datos };
    } catch (error) {
      console.error('Error al crear receta:', error);
      throw error;
    }
  },

  async actualizar(id, datos) {
    try {
      await updateDoc(doc(db, 'recetas', id), datos);
      return { id, ...datos };
    } catch (error) {
      console.error('Error al actualizar receta:', error);
      throw error;
    }
  },

  async eliminar(id) {
    try {
      await deleteDoc(doc(db, 'recetas', id));
      return true;
    } catch (error) {
      console.error('Error al eliminar receta:', error);
      throw error;
    }
  }
};

