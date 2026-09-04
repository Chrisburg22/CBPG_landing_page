#!/usr/bin/env node
/**
 * Alta y baja de cuentas del panel /admin.
 *
 * El acceso son DOS barreras independientes y hay que mover las dos:
 *   1. La variable ADMIN_EMAILS — quién puede intentar entrar.
 *   2. La tabla public.admins  — quién ve datos una vez dentro (lo impone RLS).
 * Con una sola, la persona entra y ve el panel vacío, o no entra aunque tenga
 * fila. Este script se ocupa de Supabase (usuario + tabla) y te dice al final
 * exactamente qué poner en ADMIN_EMAILS, que hay que cambiar a mano en el .env
 * y en Vercel: editarlo aquí y olvidarlo allá deja un estado a medias difícil
 * de diagnosticar.
 *
 *   node scripts/admin.mjs listar
 *   node scripts/admin.mjs alta  <correo> [contraseña]
 *   node scripts/admin.mjs baja  <correo>
 */
import { config as cargarEnv } from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';

cargarEnv();

const URL = process.env.SUPABASE_URL;
const SECRETA = process.env.SUPABASE_SECRET_KEY;
if (!URL || !SECRETA) {
  console.error('Faltan SUPABASE_URL o SUPABASE_SECRET_KEY. ¿Existe el .env?');
  process.exit(1);
}

const supabase = createClient(URL, SECRETA, { auth: { persistSession: false } });
const [accion, correoBruto, passwordDada] = process.argv.slice(2);
const correo = correoBruto?.trim().toLowerCase();

/** Contraseña larga y aleatoria: nadie tiene por qué inventarse una. */
const generarPassword = () => randomBytes(12).toString('base64url');

async function pedirAuth(ruta, opciones = {}) {
  const r = await fetch(`${URL}/auth/v1/${ruta}`, {
    ...opciones,
    headers: {
      apikey: SECRETA,
      Authorization: `Bearer ${SECRETA}`,
      'Content-Type': 'application/json',
      ...(opciones.headers ?? {}),
    },
  });
  const cuerpo = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(cuerpo.msg || cuerpo.error_description || `HTTP ${r.status}`);
  return cuerpo;
}

async function buscarUsuario(email) {
  const { users } = await pedirAuth(`admin/users?per_page=200`);
  return users?.find((u) => u.email?.toLowerCase() === email) ?? null;
}

async function listar() {
  const { data, error } = await supabase.from('admins').select('email, creado_en, user_id');
  if (error) throw new Error(error.message);

  const enVariable = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
  const enTabla = data.map((f) => f.email.toLowerCase());

  console.log('\nCuentas del panel\n');
  for (const email of new Set([...enVariable, ...enTabla])) {
    const variable = enVariable.includes(email) ? 'ADMIN_EMAILS ✓' : 'ADMIN_EMAILS ✗';
    const tabla = enTabla.includes(email) ? 'admins ✓' : 'admins ✗';
    const completo = enVariable.includes(email) && enTabla.includes(email);
    console.log(`  ${completo ? '●' : '○'} ${email.padEnd(34)} ${variable}   ${tabla}`);
  }
  if (![...enVariable].every((e) => enTabla.includes(e)) ||
      ![...enTabla].every((e) => enVariable.includes(e))) {
    console.log('\n  ○ = a medias: esa cuenta no funciona hasta estar en las dos listas.');
  }
  console.log();
}

async function alta() {
  let usuario = await buscarUsuario(correo);
  let password = passwordDada;

  if (usuario) {
    console.log(`El usuario ${correo} ya existía en Supabase Auth.`);
    if (password) {
      await pedirAuth(`admin/users/${usuario.id}`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      });
      console.log('Contraseña actualizada.');
    }
  } else {
    password = password ?? generarPassword();
    usuario = await pedirAuth('admin/users', {
      method: 'POST',
      // email_confirm: no hay envío de correo en este proyecto, así que la
      // cuenta se confirma en el acto o nunca podría entrar.
      body: JSON.stringify({ email: correo, password, email_confirm: true }),
    });
    console.log(`Usuario creado en Supabase Auth.`);
  }

  const { error } = await supabase
    .from('admins')
    .upsert({ user_id: usuario.id, email: correo }, { onConflict: 'user_id' });
  if (error) throw new Error(error.message);
  console.log('Fila añadida a la tabla `admins`.');

  const actuales = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map((v) => v.trim()).filter(Boolean);
  const nuevos = [...new Set([...actuales, correo])].join(',');

  console.log('\n─────────────────────────────────────────────────────');
  console.log('FALTA UN PASO, y sin él esta cuenta no entra.');
  console.log('Pon esto en el .env y en Vercel (Preview y Production):\n');
  console.log(`  ADMIN_EMAILS=${nuevos}\n`);
  if (password) {
    console.log(`Contraseña de ${correo}:\n\n  ${password}\n`);
    console.log('Se muestra una sola vez. Pásasela por un canal seguro y que la cambie.');
  }
  console.log('─────────────────────────────────────────────────────\n');
}

async function baja() {
  const usuario = await buscarUsuario(correo);

  const { error } = await supabase.from('admins').delete().eq('email', correo);
  if (error) throw new Error(error.message);
  console.log('Fila eliminada de `admins`: ya no puede ver datos.');

  if (usuario) {
    await pedirAuth(`admin/users/${usuario.id}`, { method: 'DELETE' });
    console.log('Usuario eliminado de Supabase Auth: la sesión queda invalidada.');
  }

  const restantes = (process.env.ADMIN_EMAILS ?? '')
    .split(',').map((v) => v.trim()).filter((v) => v && v.toLowerCase() !== correo);

  console.log('\n─────────────────────────────────────────────────────');
  console.log('Quita también el correo del .env y de Vercel:\n');
  console.log(`  ADMIN_EMAILS=${restantes.join(',')}\n`);
  console.log('─────────────────────────────────────────────────────\n');
}

const acciones = { listar, alta, baja };
if (!acciones[accion] || (accion !== 'listar' && !correo)) {
  console.error(
    'Uso:\n' +
      '  node scripts/admin.mjs listar\n' +
      '  node scripts/admin.mjs alta <correo> [contraseña]\n' +
      '  node scripts/admin.mjs baja <correo>'
  );
  process.exit(1);
}

try {
  await acciones[accion]();
} catch (e) {
  console.error(`\nFalló: ${e.message}\n`);
  process.exit(1);
}
