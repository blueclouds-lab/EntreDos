# Pruebas obligatorias antes de publicar reglas de EntreDos

Estado: revisión en curso. Las pruebas 1 y 2 se ejecutaron en el simulador el 19-10-2026. Esto no autoriza publicar las reglas.

## Mantener siempre
- Reglas raíz `.read: false` y `.write: false`.
- No compartir ubicaciones hasta que `status == active`, ambos consentimientos sean `true` y existan `ownerUid` y `partnerUid`.
- La persona invitada entra con Firebase Anonymous Auth; la propietaria debe tener correo verificado.
- El enlace se acepta una sola vez; un UID distinto no puede sustituir a `partnerUid`.
- Una invitación `revoked` nunca vuelve a `pending` ni `active`; para volver a compartir se crea un nuevo `pairId`.

## Matriz de pruebas

| # | Operación | Identidad/estado | Resultado esperado | Estado |
|---|---|---|---|---|
| 1 | set `/pairs/p1` | propietaria verificada; registro inicial válido | PERMITIR | **APROBADA en simulador** |
| 2 | set `/pairs/p1` | correo no verificado | DENEGAR | **APROBADA en simulador** |
| 3 | get `/pairs/p1` | anónimo, pendiente y sin partnerUid, conoce el ID del enlace | PERMITIR lectura del registro de invitación solamente | Pendiente |
| 4 | set `/pairs/p1/partnerUid` | anónimo; invitación pendiente y sin pareja | PERMITIR su UID | Pendiente |
| 5 | set `/pairs/p1/partnerUid` | segundo UID distinto después de aceptar | DENEGAR | Pendiente |
| 6 | set `/pairs/p1/ownerConsent` | propietaria; pendiente; valor true | PERMITIR | Pendiente |
| 7 | set `/pairs/p1/partnerConsent` | invitado vinculado; pendiente; valor true | PERMITIR | Pendiente |
| 8 | set `/pairs/p1/status` a active | falta uno de los consentimientos | DENEGAR | Pendiente |
| 9 | get `/locations/p1` | falta consentimiento o status no active | DENEGAR | Pendiente |
| 10 | set `/locations/p1/<otroUid>` | UID autenticado no coincide con el UID de la ruta | DENEGAR | Pendiente |
| 11 | set `/locations/p1/<miUid>` | pareja activa, ambos consentimientos true, coordenadas válidas | PERMITIR | Pendiente |
| 12 | set `/pairs/p1/status` a active | status actual revoked | DENEGAR | Pendiente |
| 13 | revocar y borrar `/locations/p1` | propietario o invitado vinculado | PERMITIR revocación; ubicación no accesible después | Pendiente |
| 14 | get o set en raíz `/` | cualquier identidad | DENEGAR | Pendiente |

## Limitaciones del simulador y siguiente paso
- El simulador de reglas de esta pantalla no ofrece un campo claro para preparar datos existentes. Las pruebas 3–13 requieren estado previo; no se deben improvisar con una operación de escritura inicial.
- Antes de publicar, hay que preparar un entorno de prueba aislado (preferiblemente Firebase Local Emulator Suite) o una base de datos de pruebas separada, y probar la creación, aceptación, consentimiento, lectura de ubicación y revocación.
- Los mensajes `write: false` de la regla raíz pueden aparecer en el diagnóstico aunque una regla descendiente permita una operación; el resultado global de la operación es el que determina si pasó. No cambiar los permisos raíz para eliminar esos mensajes.
- La página de prueba usa `pairs` y `locations`; las reglas activas anteriores solo tenían `invitations`.
- El flujo de consentimiento retira el consentimiento y marca `revoked` mediante una actualización multipath; esa operación debe probarse expresamente.
- Firebase Realtime Database no permite que una regla hija quite un permiso concedido por una regla `.write` en un nodo padre. Mantener los permisos de escritura en nodos específicos.
- No se ha probado el flujo real desde dos móviles. Las reglas no están aprobadas para producción y no deben publicarse aún.
