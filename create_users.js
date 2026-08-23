// create_users.js
//
// Recree les 12 comptes dans auth.users avec des UUID fixes,
// en se connectant DIRECTEMENT à Postgres (pas via l'Admin API,
// qui ne permet pas de choisir l'id).
// Le trigger on_auth_user_created remplira automatiquement profiles.
//
// ⚠️ Manipulation directe de auth.users : non officiellement supportée
// par Supabase. À utiliser en dev/test uniquement.
//
// USAGE:
//   1. npm install pg dotenv
//   2. Renseigne DATABASE_URL dans .env.server (Project Settings > Database > Connection string > URI)
//   3. node create_users.js

import { config } from 'dotenv';
import pg from 'pg';

config({ path: '.env.server' });

const { DATABASE_URL } = process.env;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL manquant. Vérifie ton fichier .env.server');
  process.exit(1);
}

const client = new pg.Client({ connectionString: DATABASE_URL, ssl: { rejectUnauthorized: false } });

const TEMP_PASSWORD = 'ChangeMe123!'; // à changer / faire reset au 1er login
const TIMESTAMP = '2026-08-23 12:31:57.886273+00';

const users = [
  { id: '38e0982f-307e-4593-a82b-b17e9828d3cf', email: 'admin@creatorhub.com',         role: 'ADMIN',   name: 'Admin',         username: 'admin' },
  { id: '2bc19137-3af9-4077-a04f-20d81c8608b4', email: 'sarah.manager@creatorhub.com', role: 'MANAGER', name: 'Sarah Manager', username: 'sarah_manager' },
  { id: 'd5867e75-32a7-4256-9567-6884127ceba1', email: 'david.manager@creatorhub.com', role: 'MANAGER', name: 'David Manager', username: 'david_manager' },
  { id: '499f751a-6fb4-4d34-8de0-0f50820882fb', email: 'emma.model@creatorhub.com',    role: 'MODEL',   name: 'Emma',          username: 'emma_model' },
  { id: 'ee5b8cb8-77c2-45ba-895c-8b0602d01128', email: 'luna.model@creatorhub.com',    role: 'MODEL',   name: 'Luna',          username: 'luna_model' },
  { id: '9bffab25-8c61-4742-8541-40502ee0fd12', email: 'aria.model@creatorhub.com',    role: 'MODEL',   name: 'Aria',          username: 'aria_model' },
  { id: '37167bfb-83c2-4a2d-beab-d8a599051fb1', email: 'sophia.model@creatorhub.com',  role: 'MODEL',   name: 'Sophia',        username: 'sophia_model' },
  { id: 'b97e134e-3bd5-4b30-925d-a235485cc225', email: 'mia.model@creatorhub.com',     role: 'MODEL',   name: 'Mia',           username: 'mia_model' },
  { id: 'aef92e9d-9463-44e0-a67d-f87280454633', email: 'john.user@email.com',          role: 'USER',    name: 'John',          username: 'john_user' },
  { id: '1e66e652-0616-4fe0-9f6f-1411a468a87b', email: 'alex.user@email.com',          role: 'USER',    name: 'Alex',          username: 'alex_user' },
  { id: '8793a34a-19ec-4a4d-b84a-7b290ef6a008', email: 'sam.user@email.com',           role: 'USER',    name: 'Sam',           username: 'sam_user' },
  { id: '45511d33-fbf0-49b0-8235-4d3652f28444', email: 'chris.user@email.com',         role: 'USER',    name: 'Chris',         username: 'chris_user' },
];

const INSERT_USER_SQL = `
  INSERT INTO auth.users (
    instance_id, id, aud, role, email, encrypted_password,
    email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at,
    recovery_token, recovery_sent_at, email_change_token_new, email_change,
    email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data,
    is_super_admin, created_at, updated_at, phone, phone_confirmed_at,
    phone_change, phone_change_token, phone_change_sent_at,
    email_change_token_current, email_change_confirm_status, banned_until,
    reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at,
    is_anonymous
  ) VALUES (
    '00000000-0000-0000-0000-000000000000', $1::uuid, 'authenticated', 'authenticated', $2,
    crypt($3, gen_salt('bf')), $4::timestamptz, NULL, '', NULL, '', NULL, '', '', NULL, NULL,
    '{"provider":"email","providers":["email"]}'::jsonb, $5::jsonb,
    false, $4::timestamptz, $4::timestamptz, NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false
  )
  ON CONFLICT (id) DO NOTHING
`;

const INSERT_IDENTITY_SQL = `
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) VALUES (
    gen_random_uuid(), $1::uuid, $1::text,
    jsonb_build_object('sub', $1::text, 'email', $2, 'email_verified', true),
    'email', NULL, $3, $3
  )
  ON CONFLICT DO NOTHING
`;

async function main() {
  await client.connect();
  await client.query('CREATE EXTENSION IF NOT EXISTS pgcrypto');

  for (const u of users) {
    try {
      const metadata = JSON.stringify({ role: u.role, name: u.name, username: u.username });
      await client.query(INSERT_USER_SQL, [u.id, u.email, TEMP_PASSWORD, TIMESTAMP, metadata]);
      await client.query(INSERT_IDENTITY_SQL, [u.id, u.email, TIMESTAMP]);
      console.log(`✅ ${u.email} — id: ${u.id}`);
    } catch (err) {
      console.error(`❌ ${u.email} — ${err.message}`);
    }
  }

  await client.end();
}

main();