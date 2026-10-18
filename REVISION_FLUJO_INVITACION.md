# EntreDos — compatibilidad del flujo de invitación

Estado: revisión técnica en curso. No publicar todavía.

## Flujo confirmado en el HTML

La página de prueba usa estas rutas de Realtime Database:
- `pairs/{pairId}` para crear y mantener la invitación.
- `locations/{pairId}/{uid}` para las ubicaciones de cada persona.
- `?pareja={pairId}` como identificador incluido en el enlace.

La persona propietaria crea el registro con `ownerUid`, `status: pending`, `ownerConsent: false`, `partnerConsent: false`. La persona invitada entra anónimamente y reclama `partnerUid` mediante una transacción, si el registro sigue pendiente y no tiene otra persona vinculada.

## Operaciones que las reglas deben permitir exactamente

1. Crear un registro nuevo solo si quien lo crea tiene el correo verificado.
2. Permitir leer una invitación pendiente sin reclamar solo desde una sesión anónima y con el identificador exacto del enlace; no permitir leer ubicaciones en ese estado.
3. Permitir que la primera sesión invitada reclame `partnerUid` una sola vez. Rechazar cualquier intento posterior de cambiarlo.
4. Permitir que cada persona modifique únicamente su propio campo de consentimiento.
5. Activar el estado solo cuando exista `partnerUid` y ambos consentimientos sean verdaderos.
6. Permitir la revocación desde cualquiera de las dos sesiones mediante la actualización múltiple que usa el HTML: cambiar el consentimiento propio a falso, cambiar el estado a `revoked` y borrar `locations/{pairId}`.
7. Hacer permanente el estado `revoked`: ninguna regla debe permitir volver a `pending` o `active` ni sustituir `partnerUid`.
8. Permitir que una persona escriba solo `locations/{pairId}/{su propia UID}` y únicamente mientras el estado esté activo y ambos consentimientos sean verdaderos.
9. Validar latitud, longitud, marca temporal y rechazar campos inesperados.

## Riesgo de seguridad importante

En Realtime Database, un permiso `.write` concedido en un nodo padre se hereda por sus descendientes; una regla más restrictiva en un nodo hijo no puede retirar un permiso ya concedido por el padre. Por eso, las reglas candidatas no deben conceder escrituras amplias en `pairs/{pairId}` o `locations/{pairId}` salvo que la condición esté limitada a una operación concreta, como la creación inicial o el borrado completo para revocación.

## Estado de verificación

- [x] Confirmadas las rutas usadas por el HTML.
- [x] Confirmada la creación inicial y la reclamación mediante transacción.
- [x] Confirmada la revocación mediante actualización múltiple.
- [ ] Probar las reglas candidatas en el simulador de Firebase con operaciones de creación, transacción, actualización múltiple, lectura y borrado.
- [ ] Probar con dos sesiones distintas y dos UID reales de prueba.
- [ ] Solo tras superar las pruebas, considerar publicar reglas.

Este documento es una lista de compatibilidad; no significa que las reglas hayan sido probadas ni que la sincronización esté activa.