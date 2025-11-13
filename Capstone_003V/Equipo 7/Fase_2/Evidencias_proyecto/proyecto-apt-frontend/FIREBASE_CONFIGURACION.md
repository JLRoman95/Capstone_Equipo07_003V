# 🔥 Configuración de Firebase

## 📋 Índice
1. [Crear Proyecto Firebase](#crear-proyecto-firebase)
2. [Configurar Autenticación](#configurar-autenticación)
3. [Configurar Firestore](#configurar-firestore)
4. [Configurar Storage](#configurar-storage)
5. [Actualizar Credenciales](#actualizar-credenciales)
6. [Funcionalidades Integradas](#funcionalidades-integradas)
7. [Uso de Hooks](#uso-de-hooks)

---

## 🚀 Crear Proyecto Firebase

### Paso 1: Acceder a Firebase Console
1. Ir a [https://console.firebase.google.com/](https://console.firebase.google.com/)
2. Iniciar sesión con cuenta de Google
3. Click en **"Agregar proyecto"** o **"Create a project"**

### Paso 2: Configurar Proyecto
1. **Nombre del proyecto**: `sistema-apt` (o el nombre que prefieras)
2. **Google Analytics**: Puedes habilitarlo o deshabilitarlo según necesites
3. Click en **"Crear proyecto"**
4. Esperar a que se complete la creación

### Paso 3: Registrar Aplicación Web
1. En la página principal del proyecto, click en el icono **Web** (`</>`)
2. **Alias de la app**: `sistema-apt-frontend`
3. **Firebase Hosting**: NO marcar (usaremos nuestro propio hosting)
4. Click en **"Registrar app"**

### Paso 4: Copiar Configuración
Verás un código similar a este:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "sistema-apt.firebaseapp.com",
  projectId: "sistema-apt",
  storageBucket: "sistema-apt.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef1234567890"
};
```

**¡GUARDA ESTA INFORMACIÓN!** La necesitarás en el paso de actualizar credenciales.

---

## 🔐 Configurar Autenticación

### Paso 1: Habilitar Authentication
1. En el menú lateral, click en **"Authentication"**
2. Click en **"Comenzar"** o **"Get started"**
3. Se habilitará el servicio

### Paso 2: Configurar Método de Autenticación
1. Ir a pestaña **"Sign-in method"**
2. Click en **"Correo electrónico/contraseña"**
3. **Habilitar** el primer switch (Email/Password)
4. Click en **"Guardar"**

> **Nota**: No usaremos Firebase Auth para login de usuarios, pero sí para registrar actividad anónima.

---

## 📊 Configurar Firestore

### Paso 1: Crear Base de Datos Firestore
1. En el menú lateral, click en **"Firestore Database"**
2. Click en **"Crear base de datos"**
3. Seleccionar modo:
   - **Modo de producción**: Más seguro (recomendado)
   - **Modo de prueba**: Menos restricciones (solo para desarrollo)
4. Seleccionar ubicación: **us-central1** (o la más cercana a tu región)
5. Click en **"Habilitar"**

### Paso 2: Configurar Reglas de Seguridad
1. Ir a pestaña **"Reglas"**
2. Reemplazar las reglas con:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Logs - Solo escritura para usuarios autenticados
    match /logs/{logId} {
      allow read: if request.auth != null;
      allow write: if true; // Permitir registro de actividad
    }
    
    // Notificaciones - Usuarios pueden ver sus propias notificaciones
    match /notifications/{notificationId} {
      allow read: if request.auth != null || resource.data.userId == request.auth.uid;
      allow write: if true;
    }
    
    // Sesiones de usuario
    match /user_sessions/{sessionId} {
      allow read, write: if true;
    }
    
    // Analytics
    match /analytics/{analyticsId} {
      allow read: if request.auth != null;
      allow write: if true;
    }
    
    // Cache
    match /cache_data/{cacheId} {
      allow read, write: if true;
    }
  }
}
```

3. Click en **"Publicar"**

### Paso 3: Crear Colecciones Iniciales (Opcional)
Firestore creará las colecciones automáticamente cuando insertes el primer documento, pero puedes crearlas manualmente:

1. Click en **"Iniciar colección"**
2. ID de colección: `logs`
3. Agregar un documento de prueba:
   - **ID de documento**: Auto-ID
   - Campo: `test` | Tipo: `string` | Valor: `inicial`
4. Click en **"Guardar"**

Repetir para las colecciones:
- `notifications`
- `user_sessions`
- `analytics`
- `cache_data`

---

## 💾 Configurar Storage

### Paso 1: Habilitar Firebase Storage
1. En el menú lateral, click en **"Storage"**
2. Click en **"Comenzar"**
3. Leer las reglas de seguridad
4. Click en **"Siguiente"**
5. Seleccionar ubicación (misma que Firestore)
6. Click en **"Listo"**

### Paso 2: Configurar Reglas de Storage
1. Ir a pestaña **"Reglas"**
2. Reemplazar con:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if true; // Para desarrollo
      // Para producción, cambiar a:
      // allow read: if request.auth != null;
      // allow write: if request.auth != null;
    }
  }
}
```

3. Click en **"Publicar"**

---

## 🔑 Actualizar Credenciales

### Paso 1: Abrir archivo .env
Ubicación: `proyecto-apt-frontend/.env`

### Paso 2: Reemplazar Valores
Usando la configuración que copiaste en el Paso 4 de "Crear Proyecto Firebase":

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=sistema-apt.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=sistema-apt
VITE_FIREBASE_STORAGE_BUCKET=sistema-apt.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef1234567890

# Backend API
VITE_API_BASE_URL=http://localhost:4000/api
```

### Paso 3: Guardar y Reiniciar
1. Guardar el archivo `.env`
2. Detener el servidor de desarrollo (Ctrl + C)
3. Iniciar nuevamente: `npm run dev`

---

## ✨ Funcionalidades Integradas

### 1. 📝 Registro de Actividad (Logs)
**Ubicación**: `src/services/firebaseService.js`

**Funciones**:
- `logActivity(userId, action, details)`: Registra una actividad
- `getUserLogs(userId, limit)`: Obtiene logs de un usuario
- `getSystemLogs(limit)`: Obtiene logs del sistema

**Uso Automático**:
- Login/Logout de usuarios
- Registro de nuevos usuarios
- Actualización de sesiones

**Ejemplo Manual**:
```javascript
import { logActivity } from '../services/firebaseService';

await logActivity(userId, 'crear_producto', { 
  producto: 'Arroz', 
  cantidad: 100 
});
```

### 2. 🔔 Notificaciones en Tiempo Real
**Ubicación**: 
- Servicio: `src/services/firebaseService.js`
- Hook: `src/hooks/useNotifications.js`
- Componente: `src/components/NotificationBell.jsx`

**Funciones**:
- `createNotification(userId, title, message, type)`: Crea notificación
- `subscribeToNotifications(userId, callback)`: Suscripción en tiempo real
- `markNotificationAsRead(notificationId)`: Marcar como leída

**Uso en Dashboard**:
El componente `NotificationBell` ya está integrado y muestra:
- Contador de notificaciones no leídas
- Lista de notificaciones recientes
- Botón para marcar como leídas

**Ejemplo de Crear Notificación**:
```javascript
import { createNotification } from '../services/firebaseService';

await createNotification(
  userId,
  'Alerta de Stock',
  'El producto "Arroz" tiene stock bajo',
  'warning'
);
```

### 3. 🖥️ Sesiones de Usuario
**Ubicación**: `src/services/firebaseService.js`

**Funciones**:
- `registerUserSession(userId, sessionData)`: Registra nueva sesión
- `updateSession(sessionId, updates)`: Actualiza sesión activa
- `closeSession(sessionId)`: Cierra sesión

**Uso Automático**:
- Se registra automáticamente al hacer login
- Se actualiza cada 5 minutos (vía `useAnalytics`)
- Se cierra al hacer logout

### 4. 📊 Analytics y Tracking
**Ubicación**: `src/hooks/useAnalytics.js`

**Funciones**:
- `track(eventName, data)`: Registra evento personalizado
- `trackPageView(pageName)`: Registra vista de página
- `trackAction(action, data)`: Registra acción de usuario
- `trackError(error, context)`: Registra errores

**Uso en Dashboard**:
```javascript
import useAnalytics from '../hooks/useAnalytics';

const { track, trackPageView } = useAnalytics();

// Al cargar la página
useEffect(() => {
  trackPageView('Dashboard');
}, []);

// Al hacer click en un módulo
const handleModuleClick = (moduleName) => {
  track('navigate_module', { module: moduleName });
  navigate(`/${moduleName.toLowerCase()}`);
};
```

### 5. 💾 Sistema de Caché
**Ubicación**: `src/services/firebaseService.js`

**Funciones**:
- `setCacheData(key, value, ttlMinutes)`: Guarda en caché
- `getCacheData(key)`: Obtiene datos en caché
- `clearExpiredCache()`: Limpia caché expirado

**Ejemplo de Uso**:
```javascript
import { setCacheData, getCacheData } from '../services/firebaseService';

// Guardar datos por 60 minutos
await setCacheData('productos_list', productos, 60);

// Obtener datos
const cachedData = await getCacheData('productos_list');
if (cachedData) {
  setProductos(cachedData);
} else {
  // Llamar a la API
}
```

---

## 🎯 Uso de Hooks

### Hook: `useNotifications`
**Archivo**: `src/hooks/useNotifications.js`

**Retorna**:
- `notifications`: Array de notificaciones
- `unreadCount`: Número de notificaciones no leídas
- `markAsRead(id)`: Función para marcar como leída
- `markAllAsRead()`: Función para marcar todas como leídas

**Ejemplo**:
```javascript
import useNotifications from '../hooks/useNotifications';

const MyComponent = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications(user?.id_usuario);
  
  return (
    <div>
      <p>Tienes {unreadCount} notificaciones</p>
      {notifications.map(n => (
        <div key={n.id}>{n.message}</div>
      ))}
    </div>
  );
};
```

### Hook: `useAnalytics`
**Archivo**: `src/hooks/useAnalytics.js`

**Retorna**:
- `track(event, data)`: Registrar evento
- `trackPageView(page)`: Registrar vista de página
- `trackAction(action, data)`: Registrar acción
- `trackError(error, context)`: Registrar error

**Ejemplo**:
```javascript
import useAnalytics from '../hooks/useAnalytics';

const ProductosPage = () => {
  const { trackPageView, trackAction, trackError } = useAnalytics();
  
  useEffect(() => {
    trackPageView('Productos');
  }, []);
  
  const handleCreate = async (producto) => {
    try {
      await api.crear(producto);
      trackAction('crear_producto', { nombre: producto.nombre });
    } catch (error) {
      trackError(error, { page: 'Productos', action: 'crear' });
    }
  };
};
```

---

## 🔍 Verificar Integración

### 1. Ver Logs en Firebase Console
1. Ir a **Firestore Database**
2. Abrir colección `logs`
3. Deberías ver registros de login/logout

### 2. Ver Notificaciones
1. Crear una notificación de prueba desde la consola del navegador:
```javascript
import { createNotification } from './src/services/firebaseService';
createNotification(1, 'Test', 'Notificación de prueba', 'info');
```
2. Ver el contador en el Dashboard actualizarse en tiempo real

### 3. Ver Analytics
1. Ir a colección `analytics` en Firestore
2. Navegar por el Dashboard
3. Verificar que se registran las vistas de página

---

## 🛡️ Seguridad - Producción

Antes de pasar a producción:

### 1. Actualizar Reglas de Firestore
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /logs/{logId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /notifications/{notificationId} {
      allow read: if resource.data.userId == request.auth.uid;
      allow write: if request.auth != null;
    }
    
    match /user_sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    
    match /analytics/{analyticsId} {
      allow read, write: if request.auth != null;
    }
    
    match /cache_data/{cacheId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 2. Actualizar Reglas de Storage
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Proteger Variables de Entorno
- Nunca commitear el archivo `.env` a Git
- Usar variables de entorno en el servidor de producción
- El archivo `.env.example` es seguro para Git

---

## ❓ Troubleshooting

### Error: "Firebase App not initialized"
**Solución**: Verificar que el archivo `.env` tiene las variables correctas y reiniciar el servidor.

### Error: "Missing or insufficient permissions"
**Solución**: Revisar las reglas de Firestore y asegurarse de que permiten las operaciones necesarias.

### No se ven notificaciones en tiempo real
**Solución**: 
1. Verificar que Firestore está habilitado
2. Verificar que las reglas permiten lectura
3. Abrir la consola del navegador y verificar errores

### Analytics no se registra
**Solución**:
1. Verificar que `useAnalytics` está siendo usado en el componente
2. Verificar que el usuario está autenticado
3. Verificar en Firestore que la colección `analytics` existe

---

## 📚 Recursos Adicionales

- [Documentación Firebase](https://firebase.google.com/docs)
- [Firestore Guía de Inicio](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Storage Guía](https://firebase.google.com/docs/storage/web/start)
- [Reglas de Seguridad](https://firebase.google.com/docs/rules)

---

**¡Firebase está listo para usarse! 🎉**

Ahora tu aplicación tiene:
- ✅ Registro de actividad en tiempo real
- ✅ Sistema de notificaciones
- ✅ Tracking de sesiones
- ✅ Analytics integrado
- ✅ Sistema de caché
