# Pruebas obligatorias antes de publicar reglas de EntreDos

Estado: borrador de revisión. No indica que Firebase haya sido probado ni autoriza publicar las reglas.

## Mantener siempre
- Reglas raíz `.read: false` y `.write: false`.
- No compartir ubicaciones hasta que `status == active`, ambos consentimientos sean `true` y existan `ownerUid` y `partnerUid`.
- La persona invitada entra con Firebase Anonymous Auth; la propietaria debe tener correo verificado.
- El enlace se acepta una sola vez; un UID distinto no puede sustituir a `partnerUid`.
- Una invitación `revoked` nunca vuelve a `pending` ni `active`; para volver a compartir se crea un nuevo `pairId`.

## Matriz de pruebas en el simulador

| # | Operación | Identidad/estado | Resultado esperado |
|---|---|---|---|
| 1 | set `/pairs/p1` | propietaria verificada; registro inicial válido | PERMITIR |
| 2 | set `/pairs/p1` | anónimo o correo no verificado | DENEGAR |
| 3 | get `/pairs/p1` | anónimo, pendiente y sin partnerUid, conoce el ID del enlace | PERMITIR lectura del registro de invitación solamente |
| 4 | set `/pairs/p1/partnerUid` | anónimo; invitación pendiente y sin pareja | PERMITIR su UID |
| 5 | set `/pairs/p1/partnerUid` | segundo UID distinto después de aceptar | DENEGAR |
| 6 | set `/pairs/p1/ownerConsent` | propietaria; pendiente; valor true | PERMITIR |
| 7 | set `/pairs/p1/partnerConsent` | invitado vinculado; pendiente; valor true | PERMITIR |
| 8 | set `/pairs/p1/status` a active | falta uno de los consentimientos | DENEGAR |
| 9 | get `/locations/p1` | falta consentimiento o status no active | DENEGAR |
| 10 | set `/locations/p1/<otroUid>` | UID autenticado no coincide con el UID de la ruta | DENEGAR |
| 11 | set `/locations/p1/<miUid>` | pareja activa, ambos consentimientos true, coordenadas válidas | PERMITIR |
| 12 | set `/pairs/p1/status` a active | status actual revoked | DENEGAR |
| 13 | revocar y borrar `/locations/p1` | propietario o invitado vinculado | PERMITIR revocación; ubicación no accesible después |
| 14 | get o set en raíz `/` | cualquier identidad | DENEGAR |

## Criterio de salida
- Ejecutar y documentar todos los casos en Firebase Rules Simulator.
- Comprobar además la creación, aceptación y revocación desde dos sesiones/navegadores distintos.
- No publicar si algún caso no coincide con el resultado esperado.
- Confirmar que las reglas de `invitations` heredadas no abren permisos de forma accidental.

## Hallazgos a revisar en el borrador actual
- La página de prueba usa `pairs` y `locations`; las reglas activas actuales solo tienen `invitations`.
- El flujo de consentimiento retira el consentimiento y marca `revoked` mediante una actualización multipath; esa operación debe probarse expresamente.
- Firebase Realtime Database no permite que una regla hija quite un permiso concedido por una regla `.write` en un nodo padre. Mantener los permisos de escritura en nodos específicos.
- No se ha ejecutado todavía una prueba real ni se debe afirmar que la configuración está lista para producción.