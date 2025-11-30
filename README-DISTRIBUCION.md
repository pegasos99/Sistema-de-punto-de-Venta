# Guía de Distribución - StoreManager Pro

## Opción 1: Aplicación Web Portable (Recomendado)

### Pasos para crear una versión distribuible:

1. **Construir la aplicación:**
   ```bash
   npm run build
   ```

2. **El resultado estará en la carpeta `dist/`**

3. **Para distribuir:**
   - Comprime la carpeta `dist/` en un archivo ZIP
   - Incluye un servidor web portable (ver opciones abajo)

### Opciones de servidor portable:

#### A) Con Node.js (si el PC tiene Node.js):
```bash
# Instalar servidor simple
npm install -g serve

# Ejecutar (dentro de la carpeta dist)
serve -s . -p 3000
```

#### B) Con Python (si el PC tiene Python):
```bash
# Python 3
python -m http.server 3000

# Python 2
python -m SimpleHTTPServer 3000
```

#### C) Servidor portable incluido:
- Descargar "Mongoose Web Server" o similar
- Colocar el ejecutable en la carpeta `dist/`
- Crear un archivo `.bat` para Windows:

```batch
@echo off
echo Iniciando StoreManager Pro...
mongoose.exe -document_root . -listening_port 3000
echo Abrir http://localhost:3000 en el navegador
pause
```

## Opción 2: Aplicación de Escritorio (Requiere desarrollo adicional)

Para crear un verdadero ejecutable, necesitarías:

### Con Electron:
```bash
npm install electron electron-builder
```

### Con Tauri (Rust):
```bash
npm install @tauri-apps/cli
```

### Con PWA (Progressive Web App):
- La aplicación ya está configurada como PWA
- Se puede "instalar" desde el navegador
- Funciona offline una vez instalada

## Instrucciones para el usuario final:

1. **Descomprimir** el archivo en cualquier carpeta
2. **Ejecutar** el servidor (archivo .bat o comando)
3. **Abrir** http://localhost:3000 en cualquier navegador
4. **Usar** la aplicación normalmente

## Ventajas de esta solución:

✅ **Multiplataforma**: Funciona en Windows, Mac, Linux
✅ **Sin instalación**: Solo descomprimir y ejecutar
✅ **Datos locales**: Todo se guarda en el navegador
✅ **Offline**: Funciona sin internet
✅ **Actualizable**: Fácil de actualizar reemplazando archivos

## Limitaciones:

❌ **Requiere navegador**: No es un ejecutable nativo
❌ **Puerto local**: Usa http://localhost:3000
❌ **Datos por navegador**: Los datos están ligados al navegador usado

## Recomendación:

Para la mayoría de casos de uso, la **Opción 1** es la mejor solución:
- Fácil de distribuir
- Funciona en cualquier PC
- Mantiene todas las funcionalidades
- No requiere conocimientos técnicos del usuario