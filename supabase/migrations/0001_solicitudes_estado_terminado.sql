-- Quinto estado para una solicitud: `terminado`.
--
-- Es el estado en el que queda un prospecto que ya se convirtió en paciente. No
-- es lo mismo que `descartada`: descartada es "no siguió adelante", terminado es
-- "siguió adelante y su ficha ahora vive en pacientes". Distinguirlos es lo que
-- permite medir cuántos prospectos acaban en tratamiento.
--
-- La solicitud NO se borra al convertirla: conserva el mensaje que escribió la
-- persona, la fecha de consentimiento y la versión del aviso de privacidad que
-- aceptó. Eso último es un dato legal y no se puede reconstruir después.
--
-- Ampliar un CHECK es una operación de metadatos: valida las filas existentes
-- una vez y no reescribe la tabla. Con un enum de Postgres esto habría requerido
-- ALTER TYPE, que en versiones antiguas no se puede hacer dentro de una
-- transacción. Ese es el motivo de que los estados sean texto con CHECK.

alter table public.solicitudes
  drop constraint solicitudes_estado_check;

alter table public.solicitudes
  add constraint solicitudes_estado_check
  check (estado = any (array['nueva', 'contactada', 'agendada', 'descartada', 'terminado']));
