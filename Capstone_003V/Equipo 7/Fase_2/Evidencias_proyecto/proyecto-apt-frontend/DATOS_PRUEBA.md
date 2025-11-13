# 🚀 Inicialización de Datos de Prueba

Este documento explica cómo cargar datos de muestra en Firebase Firestore para el proyecto APT.

## 📋 Contenido

El script `init-datos.js` carga automáticamente:

- **5 Proveedores** (distribuidoras de alimentos, carnes, verduras, lácteos, panadería)
- **10 Productos** (arroz, pollo, carne, verduras, lácteos, pan, aceite)
- **8 Items de Inventario** (diferentes lotes con fechas de vencimiento)
- **5 Registros de Producción** (platos preparados en diferentes turnos)
- **3 Checklists** (verificaciones de limpieza e higiene por turno)
- **4 Alertas** (stock bajo, productos por vencer, checklist pendiente)

**Total: 35 documentos de muestra**

## 🎯 Cuándo usar

### ✅ Usar en estos casos:
1. **Primera vez desplegando** el proyecto en producción
2. **Ambiente de desarrollo** nuevo (otro desarrollador clona el repo)
3. **Ambiente de pruebas** que necesita datos consistentes
4. **Demo para clientes** que requiere datos realistas

### ❌ NO usar en estos casos:
1. Base de datos de producción con datos reales de clientes
2. Ambiente que ya tiene datos cargados manualmente
3. Migración desde otra base de datos

## 🛠️ Cómo usar

### Opción 1: Script NPM (Recomendado)

```bash
# Cargar solo datos (sin compilar)
npm run init-datos

# Compilar y cargar datos (para despliegue completo)
npm run deploy
```

### Opción 2: Ejecutar directamente

```bash
node scripts/init-datos.js
```

## 🔒 Seguridad

El script tiene **protección inteligente**:
- ✅ Solo carga datos en **colecciones vacías**
- ✅ No sobrescribe datos existentes
- ✅ Verifica cada colección antes de cargar

### Ejemplo de salida segura:

```
🚀 Iniciando carga de datos de muestra...

⏭️  proveedores: Ya contiene datos, omitiendo...
⏭️  productos: Ya contiene datos, omitiendo...
📦 Cargando inventario...
✅ 8 registros cargados en inventario
📦 Cargando produccion...
✅ 5 registros cargados en produccion
⏭️  checklists: Ya contiene datos, omitiendo...
⏭️  alertas: Ya contiene datos, omitiendo...

✨ Algunas colecciones ya tenían datos. Solo se cargaron las vacías.
```

## 🌐 Despliegue en Firebase Hosting

Si usas Firebase Hosting, puedes automatizar la carga de datos:

### 1. Instalar Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 2. Inicializar Firebase Hosting

```bash
firebase init hosting
```

Seleccionar:
- **Public directory:** `dist`
- **Single-page app:** `Yes`
- **Automatic builds:** `No` (por ahora)

### 3. Desplegar con datos

```bash
# Opción A: Dos pasos
npm run build
npm run init-datos
firebase deploy

# Opción B: Todo junto
npm run deploy
firebase deploy
```

### 4. Automatización con GitHub Actions (Opcional)

Crear `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Firebase

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Build and init data
        run: npm run deploy
        env:
          FIREBASE_API_KEY: ${{ secrets.FIREBASE_API_KEY }}
      
      - name: Deploy to Firebase
        uses: FirebaseExtended/action-hosting-deploy@v0
        with:
          repoToken: '${{ secrets.GITHUB_TOKEN }}'
          firebaseServiceAccount: '${{ secrets.FIREBASE_SERVICE_ACCOUNT }}'
          channelId: live
```

## 📝 Datos Incluidos

### Proveedores
- Distribuidora Alimentos S.A.
- Carnes Premium Ltda.
- Verduras Frescas del Sur
- Lácteos del Valle
- Panadería El Trigal

### Productos por Categoría
- **Granos:** Arroz
- **Carnes:** Pollo, Carne Molida
- **Verduras:** Lechuga, Tomate, Cebolla
- **Lácteos:** Leche, Queso
- **Panadería:** Pan
- **Aceites:** Aceite

### Inventario (Sistema FIFO)
- Lotes con fechas reales de ingreso y vencimiento
- Cantidades variables (30-300 unidades)
- Todos en estado "disponible"

### Producción
- Platos típicos chilenos (Cazuela, Pastel de Choclo, Empanadas, etc.)
- Diferentes turnos (Mañana, Tarde)
- Responsables asignados
- Cantidades de 60-150 porciones

### Checklists de Calidad
- Turnos: Mañana, Tarde, Noche
- Tareas: Limpieza, Temperatura, Higiene
- Estados: Completo / Pendiente

### Alertas Automáticas
- Stock bajo (Tomate)
- Productos por vencer (Leche, Queso)
- Checklists pendientes

## 🔄 Actualizar Datos

Si necesitas modificar los datos de muestra:

1. Editar `scripts/init-datos.js`
2. Modificar el objeto `DATOS_MUESTRA`
3. Guardar cambios
4. Ejecutar `npm run init-datos`

## 🧪 Verificar Datos Cargados

Puedes verificar los datos desde:

1. **Firebase Console:**
   - https://console.firebase.google.com
   - Ir a Firestore Database
   - Ver colecciones: proveedores, productos, inventario, etc.

2. **Desde la aplicación:**
   - Login con cuenta de administrador
   - Navegar a cada módulo (Inventario, Productos, etc.)
   - Verificar que aparecen los datos de muestra

3. **Script de verificación:**
   ```bash
   node verificar-roles.js  # También muestra datos de usuarios
   ```

## 🗑️ Limpiar Datos (Precaución)

Para eliminar todos los datos y empezar de cero:

**⚠️ ADVERTENCIA: Esto eliminará TODOS los datos. Usar solo en desarrollo.**

```javascript
// crear script: scripts/limpiar-datos.js
import { getFirestore, collection, getDocs, deleteDoc } from 'firebase/firestore';

async function limpiarTodo() {
  const db = getFirestore();
  const colecciones = ['proveedores', 'productos', 'inventario', 'produccion', 'checklists', 'alertas'];
  
  for (const col of colecciones) {
    const snapshot = await getDocs(collection(db, col));
    for (const doc of snapshot.docs) {
      await deleteDoc(doc.ref);
    }
    console.log(`✅ ${col} limpiada`);
  }
}

limpiarTodo();
```

Luego ejecutar: `npm run init-datos` para recargar datos frescos.

## 📞 Soporte

Si tienes problemas al cargar datos:

1. **Error de conexión:** Verifica que `firebaseConfig` en `init-datos.js` sea correcto
2. **Error de permisos:** Verifica reglas de Firestore (deben permitir escritura)
3. **Datos duplicados:** El script protege contra esto, pero verifica Firebase Console

## ✅ Checklist de Despliegue

- [ ] Firebase proyecto creado
- [ ] Authentication habilitado (Email/Password)
- [ ] Firestore Database creado
- [ ] Reglas de seguridad configuradas
- [ ] `npm install` ejecutado
- [ ] `npm run init-datos` ejecutado sin errores
- [ ] Datos verificados en Firebase Console
- [ ] Usuarios de prueba creados (admin, cocinero, auditor)
- [ ] Login funciona correctamente
- [ ] Roles se muestran correctamente en Dashboard

---

**¡Listo!** 🎉 Tu base de datos ahora tiene datos de muestra realistas para comenzar a trabajar.
