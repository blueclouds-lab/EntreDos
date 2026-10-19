# EntreDos — revisión previa de reglas Firebase

Estado: **borrador de revisión; no publicar todavía**.

## Hallazgo confirmado

La página `EntreDos_prueba_invitacion.html` escribe en `pairs/{pairId}` y `locations/{pairId}/{uid}`. Las reglas actualmente publicadas se centran en `invitations/{code}`, por eso la creación de invitaciones falla con `PERMISSION_DENIED`.

## Decisiones de seguridad

- Mantener `.read` y `.write` cerrados en la raíz.
- La persona propietaria debe tener el correo verificado para crear una invitación.
- La otra persona entra con autenticación anónima y reclama el identificador una sola vez.
- No activar ubicación hasta que ambas cuentas estén vinculadas y ambos consentimientos sean verdaderos.
- Cada persona solo puede escribir su propia ubicación.
- Retirar el consentimiento cierra el vínculo, deja `ownerConsent` y `partnerConsent` en `false` y borra las ubicaciones; un vínculo revocado no se reactiva.
- La acción de revocación de la página de prueba actualiza esos cuatro valores en una sola operación multipath. Las reglas permiten escribir `false` en cada consentimiento mientras el vínculo aún está `pending` o `active`, incluso si uno ya estaba en `false`; el estado `revoked` no permite volver a aceptar ni activar.
- No publicar cambios en Firebase hasta pasar las pruebas de permiso y de flujo.

## Pruebas obligatorias antes de publicar

1. Propietaria verificada: crear un registro pendiente con ambos consentimientos en falso.
2. Sin sesión: no poder leer ni escribir el registro.
3. Sesión anónima con el enlace correcto: poder leer la invitación pendiente y reclamar `partnerUid`.
4. Segunda sesión anónima: no poder reclamar un enlace ya aceptado.
5. Persona ajena: no poder leer ubicaciones ni escribir en nombre de otra UID.
6. Una sola aceptación de consentimiento: no poder leer ni escribir ubicaciones.
7. Ambos consentimientos: activar el vínculo y permitir a cada UID escribir solo su propia ubicación.
8. Revocar desde cualquiera de los dos consentimientos: cerrar el vínculo y eliminar ubicaciones.
9. Vínculo revocado: no volver a activarse ni aceptar otra persona.

## Precaución técnica pendiente

Las reglas de Realtime Database tienen permisos heredados: cualquier permiso `.write` concedido en un nodo padre también permite escribir en sus descendientes. Por ello, las reglas finales deben revisarse como un conjunto y probarse con operaciones de creación, actualización, transacción y borrado, no solo leyendo las expresiones por separado.

Este archivo es documentación de revisión, no certifica que las reglas hayan pasado esas pruebas. La configuración publicada y la página principal no se modifican con esta rama.
