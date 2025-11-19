# 🚀 Configuración Rápida de Firebase Auth

## Paso 1: Crear Proyecto Firebase (5 minutos)

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Click "Agregar proyecto"
3. Nombre: `sistema-apt` (o el que prefieras)
4. Desactiva Google Analytics (opcional)
5. Click "Crear proyecto"

## Paso 2: Habilitar Authentication

1. En el menú lateral → **Authentication**
2. Click **"Comenzar"**
3. Selecciona **"Correo electrónico/contraseña"**
4. **Activa** el primer interruptor
5. Click **"Guardar"**

## Paso 3: Crear App Web

1. En la página principal del proyecto, click el icono **</> Web**
2. Nombre: `sistema-apt-frontend`
3. NO marcar Firebase Hosting
4. Click "Registrar app"

## Paso 4: Copiar Configuración

Verás algo así:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXX",
  authDomain: "sistema-apt-xxxxx.firebaseapp.com",
  projectId: "sistema-apt-xxxxx",
  storageBucket: "sistema-apt-xxxxx.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456"
};
```

## Paso 5: Actualizar .env 

Abre el archivo `.env` en `proyecto-apt-frontend/` y reemplaza:

```env
VITE_FIREBASE_API_KEY=TU_API_KEY_AQUI
VITE_FIREBASE_AUTH_DOMAIN=TU_AUTH_DOMAIN_AQUI
VITE_FIREBASE_PROJECT_ID=TU_PROJECT_ID_AQUI
VITE_FIREBASE_STORAGE_BUCKET=TU_STORAGE_BUCKET_AQUI
VITE_FIREBASE_MESSAGING_SENDER_ID=TU_MESSAGING_SENDER_ID_AQUI
VITE_FIREBASE_APP_ID=TU_APP_ID_AQUI
```

## Paso 6: Habilitar Firestore

1. En el menú lateral → **Firestore Database**
2. Click **"Crear base de datos"**
3. Modo: **"Empezar en modo de prueba"** (para desarrollo)
4. Ubicación: `us-central1` o la más cercana
5. Click **"Habilitar"**

## Paso 7: Configurar Reglas de Firestore

En la pestaña **"Reglas"**, pega esto:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuarios - Solo lectura/escritura para el propio usuario
    match /usuarios/{userId} {
      allow read, write: if true; // Para desarrollo
    }
    
    // Logs
    match /logs/{logId} {
      allow read, write: if true;
    }
    
    // Notificaciones
    match /notifications/{notificationId} {
      allow read, write: if true;
    }
    
    // Sesiones
    match /user_sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // Analytics
    match /analytics/{analyticsId} {
      allow read, write: if true;
    }
    
    // Cache
    match /cache_data/{cacheId} {
      allow read, write: if true;
    }
  }
}
```

Click **"Publicar"**

## Paso 8: Reiniciar Frontend

En la terminal, presiona `Ctrl+C` para detener el servidor y luego:

```bash
npm run dev
```

## ✅ ¡Listo!

Ahora puedes:
- ✅ Registrar nuevos usuarios
- ✅ Iniciar sesión
- ✅ Autenticación completamente funcional SIN PostgreSQL
- ✅ Datos de usuario guardados en Firebase Firestore

## 🔍 Verificar que Funciona

1. Ve a http://localhost:3000
2. Click "Crear Cuenta"
3. Completa el formulario
4. Deberías poder registrarte e iniciar sesión

En Firebase Console → Authentication verás los usuarios registrados.
En Firestore Database → usuarios verás los datos adicionales.

---

**Nota**: Para producción, cambia las reglas de Firestore para mayor seguridad.
