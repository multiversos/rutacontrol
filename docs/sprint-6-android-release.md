# Sprint 6 Android Release Interno

## Objetivo

Cerrar la fase Android dejando RutaControl lista para pruebas reales internas con Capacitor, web remota y rutas moviles dedicadas bajo `/mobile`, sin reescribir a React Native, sin offline real y sin abrir modulos grandes de negocio.

## Arquitectura aplicada

- Android usa Capacitor como contenedor nativo.
- La web remota se carga desde `server.url` como origen y arranca con `server.appStartPath=/mobile`.
- `server.errorPath=index.html` deja un fallback local recuperable si falla la carga inicial de la web remota.
- `/mobile` reutiliza SSR, Supabase Auth, Server Actions, validadores y reglas existentes.
- `daily_records` sigue siendo la tabla operativa principal.
- `expenses` sigue como detalle complementario.
- Desktop sigue en `/dashboard` y no depende del guard movil.

## Pulido nativo aplicado

- Status bar Android con color base `#0F4A73`, sin superponer la WebView.
- Safe areas preservadas con `viewport-fit=cover` y variables CSS existentes.
- Teclado Android en modo `resize: body`.
- La tab bar movil se oculta mientras el teclado esta abierto.
- El input enfocado se desplaza al centro cuando aparece el teclado.
- Back button Android:
  - vuelve en historial cuando existe;
  - desde subrutas `/mobile/*` cae a una ruta movil padre;
  - desde `/mobile` o login movil minimiza la app.
- Guard movil de red y errores con `@capacitor/network`, reintento y acceso directo a login.
- Fallback local de carga remota con estado de conexion y reintento a `https://rutacontrol.vercel.app/mobile`.
- Middleware reconoce sesion/token vencido y muestra mensaje claro en login.

## Identidad Android

- Nombre visible: `RutaControl`.
- Application ID: `com.multiversos.rutacontrol`.
- Version name por defecto: `0.6.0-internal.1`.
- Version code por defecto: `60001`.
- Color primario: `#0F4A73`.
- Color splash: `#F5F8FB`.
- Icono y splash actuales: bus vectorial de RutaControl.

Rutas para reemplazo exacto de assets:

- Icono foreground: `android/app/src/main/res/drawable/ic_launcher_foreground.xml`.
- Splash foreground: `android/app/src/main/res/drawable/ic_splash_foreground.xml`.
- Splash layer: `android/app/src/main/res/drawable/rutacontrol_splash.xml`.
- Colores Android: `android/app/src/main/res/values/colors.xml`.
- Nombre de app: `android/app/src/main/res/values/strings.xml`.

## Build interno

Requisitos en la maquina que genere Android:

- Node >= 20.9.
- JDK instalado y `JAVA_HOME` configurado. Capacitor Android genero `JavaVersion.VERSION_21`, asi que usar JDK 21 evita friccion.
- Android Studio con Android SDK Platform 36.
- `ANDROID_HOME` o `ANDROID_SDK_ROOT` apuntando al SDK.
- `platform-tools` en PATH para `adb` si se va a validar emulador/dispositivo.
- En esta maquina se detecto Android Studio JBR en `C:\Program Files\Android\Android Studio\jbr`.
- En esta maquina se detecto Android SDK en `C:\Users\parra\AppData\Local\Android\Sdk` y se dejo `android/local.properties` apuntando a esa ruta.

Comandos base en Windows:

```powershell
npm.cmd install
set CAPACITOR_SERVER_URL=https://rutacontrol.vercel.app/mobile
npm.cmd run android:sync
npm.cmd run android:open
```

Emulador local contra Next dev:

```powershell
set CAPACITOR_SERVER_URL=http://10.0.2.2:3000/mobile
npm.cmd run dev
npm.cmd run android:sync
npm.cmd run android:run
```

APK debug:

```powershell
cd android
.\gradlew.bat assembleDebug
```

AAB release:

```powershell
cd android
.\gradlew.bat bundleRelease
```

APK release:

```powershell
cd android
.\gradlew.bat assembleRelease
```

Firma release opcional por variables de entorno o propiedades Gradle:

```powershell
set RUTACONTROL_RELEASE_STORE_FILE=C:\ruta\segura\rutacontrol-internal.jks
set RUTACONTROL_RELEASE_STORE_PASSWORD=<password>
set RUTACONTROL_RELEASE_KEY_ALIAS=rutacontrol-internal
set RUTACONTROL_RELEASE_KEY_PASSWORD=<password>
set RUTACONTROL_VERSION_NAME=0.6.0-internal.1
set RUTACONTROL_VERSION_CODE=60001
```

Keystore pendiente:

```powershell
keytool -genkeypair -v -keystore rutacontrol-internal.jks -alias rutacontrol-internal -keyalg RSA -keysize 2048 -validity 10000
```

No se debe commitear el keystore ni las contrasenas.

## Validacion ejecutada

- `npm.cmd run typecheck`: PASS.
- `npm.cmd run lint`: PASS.
- `npm.cmd run build`: PASS.
- `npm.cmd run android:doctor`: PASS.
- `npm.cmd run android:sync`: PASS.
- `.\gradlew.bat assembleDebug`: PASS usando Android Studio JBR y SDK local detectados.

Limitaciones de este entorno:

- `JAVA_HOME`, `ANDROID_HOME` y `ANDROID_SDK_ROOT` no estan definidos globalmente.
- `java`, `adb` y `emulator` no estan en PATH global, aunque existen dentro de Android Studio y Android SDK.
- `emulator -list-avds` no lista AVDs persistentes en esta maquina.
- En la revision del 10 de abril de 2026 se detecto `emulator-5554` como dispositivo activo para pruebas puntuales.
- No se detectaron `sdkmanager.bat`, `avdmanager.bat` ni system images instaladas para crear un AVD por consola.
- PowerShell bloquea `npm.ps1`; usar `npm.cmd` funciona.

## Riesgos detectados

- La app depende de la web remota; no hay offline real ni cache operativa.
- El fallback local apunta a produccion; para staging hay que resincronizar con `CAPACITOR_SERVER_URL`.
- Falta keystore real para firmar release interno.
- La validacion en emulador queda condicionada a tener `next dev` activo para builds locales o un deploy remoto con `/mobile` disponible.
- Si Vercel/Supabase caen, la UX informa y permite reintento, pero no permite operar offline.

## Diagnostico de arranque remoto

El 10 de abril de 2026 se reprodujo el fallo del emulador y se confirmo:

- El APK instalado que falla intenta cargar `https://rutacontrol.vercel.app/mobile`.
- `https://rutacontrol.vercel.app/mobile` responde `404 Not Found`, con `X-Matched-Path: /404`.
- Al fallar esa carga remota, Capacitor cae al fallback local `https://localhost/index.html`.
- La rama local si tiene `/mobile`: `next build` lista la ruta y `next start` responde `307` de `/mobile` a `/login?redirectTo=%2Fmobile`.
- El emulador si carga el login cuando se resincroniza con `CAPACITOR_SERVER_URL=http://10.0.2.2:3000/mobile` y hay servidor local en `localhost:3000`.

Conclusion: el problema observado antes del login no esta en middleware, auth ni routing local; la causa mas probable es que Vercel produccion no tiene desplegada esta rama Android/Sprint 6 o esta sirviendo un deploy anterior sin `/mobile`.

## Diagnostico de redirect post-login

El 10 de abril de 2026 se reviso el bug de pantalla blanca despues del login movil:

- La ruta local `/mobile` responde correctamente: sin sesion redirige a `/login?redirectTo=%2Fmobile`.
- El login local con `?redirectTo=/mobile` renderiza el formulario con `redirectTo="/mobile"` y el texto "Entrar a la experiencia movil".
- En el codigo local, `signInAction` toma ese `redirectTo`, lo pasa por `sanitizeRedirectPath` con el rol real del perfil y redirige a `/mobile`; no hay una rama que produzca `/m` ni una ruta truncada.
- En produccion, `https://rutacontrol.vercel.app/mobile` sigue respondiendo `404 Not Found` con `X-Matched-Path: /404`.
- En produccion, `https://rutacontrol.vercel.app/login?redirectTo=/mobile` renderiza el formulario con `redirectTo="/dashboard"` y texto de dashboard, lo que confirma que Vercel no esta sirviendo el build local que contiene las rutas y redirects moviles.

Conclusion: el bug post-login observado contra la URL remota no viene de `redirectTo`, `sanitizeRedirectPath`, `requireAuth` ni `proxy` en la rama local; viene de un deploy remoto faltante o desactualizado. Desplegar esta rama debe hacer que `/mobile` exista y que el login remoto conserve `redirectTo="/mobile"`.

## Checklist QA manual

- Login admin redirige a `/mobile`.
- Login registrador redirige a `/mobile/register`.
- Sesion persiste al cerrar y reabrir la app.
- Logout desde `Mas` vuelve a `/login?redirectTo=/mobile`.
- Registro diario crea borrador si faltan datos.
- Registro diario cierra automaticamente si los datos estan completos.
- Gasto complementario se guarda solo sobre borradores permitidos.
- Deudas y abonos funcionan para admin.
- Deudas quedan restringidas para registrador.
- Alertas cargan para admin y permiten marcar lectura.
- Alertas quedan restringidas para registrador.
- Buses carga catalogo admin y filtros.
- Perfil de bus abre vista semanal.
- Perfil de bus cambia a vista mensual.
- Back button vuelve desde gastos/deudas/buses/alertas a rutas moviles esperadas.
- Teclado no tapa acciones principales del formulario.
- Tab bar se oculta al abrir teclado y vuelve al cerrarlo.
- Sin conexion muestra aviso y reintento.
- Falla inicial de carga remota muestra fallback local.
- Sesion vencida o token invalido vuelve a login con mensaje claro.
- Desktop `/dashboard` mantiene login, navegacion y formularios existentes.
