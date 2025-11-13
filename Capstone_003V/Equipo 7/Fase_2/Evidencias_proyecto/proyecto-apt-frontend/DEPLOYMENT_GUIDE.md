# 🚀 Guía de Despliegue - Sistema APT en Firebase Hosting

## ✅ Pre-requisitos

Antes de desplegar, asegúrate de tener:

- [x] Node.js instalado (v16 o superior)
- [x] npm instalado
- [x] Firebase CLI instalado globalmente
- [x] Cuenta de Firebase configurada
- [x] Proyecto Firebase creado (`control-de-cosina`)

---

## 📦 Paso 1: Instalar Firebase CLI

Si aún no tienes Firebase CLI instalado:

```bash
npm install -g firebase-tools
```

Verificar instalación:
```bash
firebase --version
```

---

## 🔐 Paso 2: Login en Firebase

Inicia sesión con tu cuenta de Google:

```bash
firebase login
```

Esto abrirá tu navegador para autenticarte.

Verificar que estés autenticado:
```bash
firebase projects:list
```

Deberías ver tu proyecto `control-de-cosina` en la lista.

---

## ⚙️ Paso 3: Configuración del Proyecto

Los archivos ya están configurados:

### ✅ `firebase.json` (Creado)
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  }
}
```

### ✅ `.firebaserc` (Creado)
```json
{
  "projects": {
    "default": "control-de-cosina"
  }
}
```

### ✅ `vite.config.js` (Actualizado)
- Optimización de build
- Code splitting automático
- Minificación habilitada

---

## 🏗️ Paso 4: Build del Proyecto

### Opción A: Build Normal (Recomendado)
```bash
npm run build
```

Esto generará la carpeta `dist/` con los archivos optimizados.

### Opción B: Build + Verificación Local
```bash
npm run build
npm run preview
```

Abre http://localhost:4173 para ver la versión de producción localmente.

---

## 🚀 Paso 5: Desplegar a Firebase Hosting

### Opción 1: Despliegue Simple
```bash
npm run deploy
```

Este comando ejecuta:
1. `npm run build` - Construye el proyecto
2. `firebase deploy --only hosting` - Despliega a Firebase

### Opción 2: Despliegue con Datos Iniciales
```bash
npm run deploy:full
```

Este comando ejecuta:
1. `npm run build` - Construye el proyecto
2. `npm run init-datos` - Carga datos de prueba en Firestore
3. `firebase deploy --only hosting` - Despliega a Firebase

### Opción 3: Despliegue Manual (Paso a Paso)
```bash
# 1. Instalar dependencias
npm install

# 2. Build del proyecto
npm run build

# 3. (Opcional) Cargar datos de prueba
npm run init-datos

# 4. Desplegar
firebase deploy --only hosting
```

---

## 🌐 Paso 6: Verificar Despliegue

Después del despliegue, Firebase mostrará:

```
✔  Deploy complete!

Project Console: https://console.firebase.google.com/project/control-de-cosina/overview
Hosting URL: https://control-de-cosina.web.app
```

### URLs del Proyecto:

- **Hosting URL Principal**: https://control-de-cosina.web.app
- **Hosting URL Alternativa**: https://control-de-cosina.firebaseapp.com
- **Firebase Console**: https://console.firebase.google.com/project/control-de-cosina

---

## 🔍 Paso 7: Verificación Post-Despliegue

### 1. Verificar la aplicación
Abre: https://control-de-cosina.web.app

### 2. Verificar login
- Usuario: `admin@apt.com`
- Contraseña: `admin123`

### 3. Verificar módulos
- [ ] Dashboard carga correctamente
- [ ] Proveedores muestra datos
- [ ] Productos muestra datos
- [ ] Inventario muestra datos
- [ ] Producción funciona
- [ ] Checklists funciona
- [ ] Alertas muestra notificaciones
- [ ] Import/Export funciona

### 4. Verificar Firebase Console
1. Ve a: https://console.firebase.google.com/project/control-de-cosina
2. Verifica Analytics → Eventos en tiempo real
3. Verifica Hosting → Historial de despliegues
4. Verifica Firestore → Colecciones con datos

---

## 🔄 Actualizaciones Futuras

### Despliegue de Actualizaciones:

```bash
# 1. Hacer cambios en el código
# 2. Build y desplegar
npm run deploy
```

### Ver Historial de Despliegues:
```bash
firebase hosting:channel:list
```

### Rollback a Versión Anterior:
```bash
firebase hosting:clone SOURCE_SITE_ID:SOURCE_CHANNEL_ID TARGET_SITE_ID:live
```

---

## 🎯 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Modo desarrollo local (puerto 3000) |
| `npm run build` | Construir para producción |
| `npm run preview` | Preview local del build |
| `npm run init-datos` | Cargar datos de prueba en Firestore |
| `npm run deploy` | Build + Deploy |
| `npm run deploy:full` | Build + Init datos + Deploy |
| `firebase serve` | Servir localmente desde `dist/` |
| `firebase hosting:sites:list` | Listar sitios de hosting |
| `firebase deploy --only hosting` | Solo desplegar hosting |

---

## 📊 Optimizaciones de Build

### Code Splitting Automático:
- **vendor.js** - React, React-DOM, React-Router
- **firebase.js** - Firebase SDK
- **pdf.js** - jsPDF + jsPDF-autoTable
- **excel.js** - XLSX

### Caché Headers Configurados:
- Imágenes (jpg, png, svg, etc.): 1 año
- JS/CSS: 1 año
- JSON/TXT/XML: Sin caché

### Minificación:
- ✅ HTML minificado
- ✅ CSS minificado
- ✅ JS minificado con Terser
- ✅ Source maps deshabilitados (producción)

---

## 🔒 Seguridad Post-Despliegue

### 1. Actualizar Firestore Rules

Ve a Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Función helper para verificar autenticación
    function isAuthenticated() {
      return request.auth != null;
    }
    
    // Función helper para verificar rol
    function hasRole(role) {
      return isAuthenticated() && 
             request.auth.token.rol == role;
    }
    
    // Proveedores
    match /proveedores/{proveedorId} {
      allow read: if isAuthenticated();
      allow create, update: if hasRole('admin') || hasRole('cocinero');
      allow delete: if hasRole('admin');
    }
    
    // Productos
    match /productos/{productoId} {
      allow read: if isAuthenticated();
      allow create, update: if hasRole('admin') || hasRole('cocinero');
      allow delete: if hasRole('admin');
    }
    
    // Inventario
    match /inventario/{inventarioId} {
      allow read: if isAuthenticated();
      allow create, update: if hasRole('admin') || hasRole('cocinero');
      allow delete: if hasRole('admin');
    }
    
    // Producción
    match /produccion/{produccionId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('cocinero');
    }
    
    // Checklists
    match /checklists/{checklistId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('cocinero') || hasRole('auditor');
    }
    
    // Alertas
    match /alertas/{alertaId} {
      allow read: if isAuthenticated();
      allow write: if hasRole('admin') || hasRole('auditor');
    }
  }
}
```

### 2. Configurar Custom Claims para Roles

En Firebase Console → Authentication → Users:
- Editar cada usuario
- Agregar Custom Claims con el rol correspondiente

O usar el script de creación de usuarios que incluye roles.

---

## 🎨 Personalización del Dominio (Opcional)

### Conectar Dominio Personalizado:

1. Ve a Firebase Console → Hosting
2. Click en "Add custom domain"
3. Sigue las instrucciones para:
   - Verificar propiedad del dominio
   - Configurar DNS records
   - Esperar propagación SSL

Ejemplo: `apt.tuempresa.com`

---

## 📈 Monitoreo

### Analytics en Tiempo Real:
https://console.firebase.google.com/project/control-de-cosina/analytics

### Performance Monitoring:
```bash
# Instalar Performance Monitoring
npm install firebase

# Ya está configurado en src/config/firebase.js
```

### Crashlytics (Opcional):
Para reportar errores en producción.

---

## 🐛 Troubleshooting

### Error: "Firebase project not found"
```bash
firebase use control-de-cosina
```

### Error: "No se puede acceder a Firestore"
- Verifica reglas de Firestore
- Verifica que el usuario esté autenticado
- Revisa Firebase Console → Firestore → Data

### Error: "Build failed"
```bash
# Limpiar caché
rm -rf node_modules dist
npm install
npm run build
```

### Error: "Permission denied"
```bash
firebase login --reauth
```

### La app no carga después del despliegue
- Verifica la consola del navegador (F12)
- Verifica que las credenciales de Firebase sean correctas
- Verifica Firebase Console → Hosting → Files

---

## 📋 Checklist de Despliegue

Antes de desplegar a producción:

- [ ] `npm run build` funciona sin errores
- [ ] `npm run preview` muestra la app correctamente
- [ ] Firebase CLI está instalado y autenticado
- [ ] Credenciales de Firebase son correctas
- [ ] Firestore tiene datos de prueba (opcional)
- [ ] Usuarios de prueba creados en Authentication
- [ ] Reglas de Firestore configuradas
- [ ] Custom claims de roles configurados
- [ ] Analytics habilitado
- [ ] .gitignore configurado (no subir .env)

Durante el despliegue:

- [ ] `firebase login` exitoso
- [ ] `firebase use control-de-cosina` configurado
- [ ] `npm run deploy` ejecutado sin errores
- [ ] URL de hosting recibida

Post-despliegue:

- [ ] App accesible en https://control-de-cosina.web.app
- [ ] Login funciona
- [ ] Todos los módulos cargan
- [ ] Import/Export funciona
- [ ] No hay errores en consola del navegador
- [ ] Analytics registrando eventos
- [ ] Firestore con datos correctos

---

## 🎉 ¡Listo para Producción!

Tu aplicación estará disponible en:

### 🌐 URL Principal:
**https://control-de-cosina.web.app**

### 📱 Responsive:
Funciona en móviles, tablets y desktop

### 🔒 Seguro:
HTTPS automático por Firebase Hosting

### ⚡ Rápido:
CDN global de Firebase

### 📊 Monitoreado:
Analytics y Performance tracking habilitados

---

## 📞 Soporte

- **Firebase Docs**: https://firebase.google.com/docs/hosting
- **Vite Docs**: https://vitejs.dev/guide/build.html
- **React Docs**: https://react.dev/

---

## 🚀 Comando Rápido de Despliegue

```bash
# Todo en uno (recomendado)
npm run deploy
```

**¡Ya estás listo para desplegar!** 🎉
