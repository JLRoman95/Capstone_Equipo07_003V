import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Servicio de autenticación usando Firebase
 */
const firebaseAuthService = {
  
  /**
   * Registrar nuevo usuario
   */
  async register(nombre, email, password, rol = 'admin') {
    try {
      console.log('🔥 Iniciando registro en Firebase...');
      console.log('Email:', email, 'Rol:', rol);
      
      // Crear usuario en Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      console.log('✅ Usuario creado en Firebase Auth:', firebaseUser.uid);
      
      // Actualizar perfil con el nombre
      await updateProfile(firebaseUser, {
        displayName: nombre
      });
      console.log('✅ Perfil actualizado');
      
      // Intentar guardar en Firestore (no bloqueante si falla)
      const userData = {
        id_usuario: firebaseUser.uid,
        nombre: nombre,
        email: email,
        rol: rol,
        activo: true,
        fecha_creacion: serverTimestamp(),
        ultimo_acceso: serverTimestamp()
      };
      
      // Guardar en background sin bloquear
      setDoc(doc(db, 'usuarios', firebaseUser.uid), userData)
        .then(() => console.log('✅ Datos guardados en Firestore'))
        .catch(err => console.warn('⚠️ No se pudo guardar en Firestore (opcional):', err.message));
      
      // Retornar inmediatamente sin esperar Firestore
      return {
        success: true,
        message: 'Usuario registrado exitosamente',
        user: {
          id_usuario: firebaseUser.uid,
          nombre: nombre,
          email: email,
          rol: rol,
          activo: true
        }
      };
      
    } catch (error) {
      console.error('❌ Error completo al registrar usuario:', error);
      console.error('Código de error:', error.code);
      console.error('Mensaje:', error.message);
      
      // Mensajes de error personalizados
      let errorMessage = 'Error al registrar usuario';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'El correo electrónico ya está registrado';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      } else if (error.code === 'permission-denied') {
        errorMessage = 'Error de permisos. Verifica que Firestore esté habilitado y las reglas configuradas';
      } else if (error.message.includes('Firebase')) {
        errorMessage = `Error de Firebase: ${error.message}`;
      }
      
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Iniciar sesión
   */
  async login(email, password) {
    try {
      // Autenticar con Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Cargar datos de Firestore (ESPERAR para obtener el rol correcto)
      let userData = {
        nombre: firebaseUser.displayName || 'Usuario',
        email: firebaseUser.email,
        rol: 'cocinero', // rol por defecto si falla Firestore
        activo: true
      };
      
      try {
        // IMPORTANTE: Esperar a cargar datos de Firestore para obtener el rol correcto
        const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
        
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          userData = {
            nombre: firestoreData.nombre || firebaseUser.displayName || 'Usuario',
            email: firestoreData.email || firebaseUser.email,
            rol: firestoreData.rol || 'cocinero',
            activo: firestoreData.activo !== false
          };
          
          console.log('✅ Datos cargados de Firestore:', userData);
          
          // Actualizar último acceso en background
          setDoc(doc(db, 'usuarios', firebaseUser.uid), {
            ultimo_acceso: serverTimestamp()
          }, { merge: true }).catch(err => console.warn('No se pudo actualizar último acceso'));
        } else {
          console.warn('⚠️ Usuario no existe en Firestore, usando datos de Auth');
        }
      } catch (firestoreError) {
        console.warn('⚠️ Error al cargar Firestore:', firestoreError.message);
      }
      
      // Generar token
      const token = await firebaseUser.getIdToken();
      
      // Guardar en localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify({
        id_usuario: firebaseUser.uid,
        nombre: userData.nombre,
        email: userData.email,
        rol: userData.rol,
        activo: userData.activo
      }));
      
      console.log('✅ Login exitoso. Rol del usuario:', userData.rol);
      
      return {
        success: true,
        token: token,
        user: {
          id_usuario: firebaseUser.uid,
          nombre: userData.nombre,
          email: userData.email,
          rol: userData.rol,
          activo: userData.activo
        }
      };
      
    } catch (error) {
      console.error('Error al iniciar sesión:', error);
      
      let errorMessage = 'Error al iniciar sesión';
      
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Correo electrónico inválido';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Demasiados intentos fallidos. Intente más tarde';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Credenciales incorrectas';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      throw new Error(errorMessage);
    }
  },
  
  /**
   * Cerrar sesión
   */
  async logout() {
    try {
      await signOut(auth);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return { success: true };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      throw new Error('Error al cerrar sesión');
    }
  },
  
  /**
   * Obtener usuario actual del localStorage
   */
  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },
  
  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Observar cambios en el estado de autenticación
   */
  onAuthStateChange(callback) {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Usuario autenticado
        const userDoc = await getDoc(doc(db, 'usuarios', firebaseUser.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          callback({
            id_usuario: firebaseUser.uid,
            nombre: userData.nombre,
            email: userData.email,
            rol: userData.rol,
            activo: userData.activo
          });
        } else {
          callback(null);
        }
      } else {
        // Usuario no autenticado
        callback(null);
      }
    });
  },
  
  /**
   * Refrescar token de Firebase
   */
  async refreshToken() {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const token = await currentUser.getIdToken(true);
        localStorage.setItem('token', token);
        return token;
      }
      return null;
    } catch (error) {
      console.error('Error al refrescar token:', error);
      return null;
    }
  }
};

export default firebaseAuthService;
