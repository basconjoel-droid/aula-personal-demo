# Sincronización de Aula Personal — infraestructura inicial

**Estado: código preparado, NO desplegado ni conectado al lector.** La aplicación sigue usando su biblioteca local y las copias manuales. No se ha creado una base D1 ni configurado ningún secreto.

## Diseño de seguridad
- Worker separado del servicio de IA, con binding D1 `DB` y secreto exclusivo `SYNC_ACCESS_TOKEN`.
- Solo acepta el origen de GitHub Pages, pero **CORS no sustituye la autenticación**.
- Revisión obligatoria `If-Match` para evitar sobrescribir cambios simultáneos (HTTP 409).
- El Worker solo acepta cadenas con prefijo `apenc1:`; **el cifrado AES-GCM con contraseña y Web Crypto debe implementarse y probarse en el cliente antes de habilitar la sincronización**. El prefijo por sí solo NO demuestra que los datos estén cifrados.
- Límite por objeto de 200 KB. Los PDF requieren una estrategia separada de almacenamiento (por ejemplo, R2), cuotas y cifrado antes de sincronizarlos.
- Token compartido = una sola cuenta personal. No habilitar para varios usuarios; para ello se necesita autenticación individual real.

## Pasos pendientes para activarlo
1. Crear una base D1 en Cloudflare y ejecutar `sync/schema.sql`.
2. Crear un Worker **nuevo**, separado del de IA, con `sync/worker.js`, binding `DB` y secreto `SYNC_ACCESS_TOKEN`.
3. Implementar en el lector cifrado local AES-GCM, derivación de clave y flujo de recuperación, sin guardar la contraseña en GitHub ni enviarla al servidor.
4. Añadir una interfaz de conexión y sincronización **opt-in**, primero solo de datos pequeños, con vista previa y resolución de conflictos.
5. Probar restauración, fallos de red, dispositivos simultáneos y recuperación; después estudiar sincronización de PDF con R2.

No desplegar esta infraestructura ni activar sincronización hasta completar los pasos de seguridad y las pruebas.
