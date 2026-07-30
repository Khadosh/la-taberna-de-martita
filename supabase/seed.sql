-- Seed de desarrollo — La Taberna de Martita
--
-- Se aplica automáticamente con `supabase start` y `supabase db reset`.
-- Deja una campaña jugable: un DM, dos jugadores, tres personajes con inventario
-- y equipo puesto, PNJs, un encuentro sobre el tablero y notas de sesión.
--
-- Cuentas (contraseña única para todas: taberna123)
--   martita@taberna.test  — DM
--   thorin@taberna.test   — jugador
--   lyra@taberna.test     — jugadora
--
-- Los UUID son fijos a propósito: hacen el seed reproducible y permiten
-- referenciar entidades entre bloques sin subconsultas.

-- ─── Usuarios ────────────────────────────────────────────────────────────────
-- El trigger `on_auth_user_created` crea el `profiles` correspondiente.
--
-- Las columnas de token van en cadena vacía y no en NULL: GoTrue las lee como
-- string de Go y un NULL hace fallar el login entero con "Database error
-- querying schema", que no dice nada sobre la causa real.

INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new,
  email_change_token_current, phone_change, phone_change_token, reauthentication_token
) VALUES
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111',
   'authenticated', 'authenticated', 'martita@taberna.test',
   crypt('taberna123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222',
   'authenticated', 'authenticated', 'thorin@taberna.test',
   crypt('taberna123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333',
   'authenticated', 'authenticated', 'lyra@taberna.test',
   crypt('taberna123', gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(),
   '', '', '', '', '', '', '', '');

INSERT INTO auth.identities (
  id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
) VALUES
  (gen_random_uuid(), '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111',
   '{"sub":"11111111-1111-1111-1111-111111111111","email":"martita@taberna.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222',
   '{"sub":"22222222-2222-2222-2222-222222222222","email":"thorin@taberna.test","email_verified":true}',
   'email', now(), now(), now()),
  (gen_random_uuid(), '33333333-3333-3333-3333-333333333333', '33333333-3333-3333-3333-333333333333',
   '{"sub":"33333333-3333-3333-3333-333333333333","email":"lyra@taberna.test","email_verified":true}',
   'email', now(), now(), now());

UPDATE public.profiles SET username = 'Martita' WHERE id = '11111111-1111-1111-1111-111111111111';
UPDATE public.profiles SET username = 'Joaco'   WHERE id = '22222222-2222-2222-2222-222222222222';
UPDATE public.profiles SET username = 'Ana'     WHERE id = '33333333-3333-3333-3333-333333333333';

-- ─── Campaña ─────────────────────────────────────────────────────────────────

INSERT INTO public.campaigns (id, name, dm_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', 'The Curse of Waterdeep',
   '11111111-1111-1111-1111-111111111111');

INSERT INTO public.campaign_players (campaign_id, user_id) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333');

-- ─── Personajes ──────────────────────────────────────────────────────────────
-- Tres clases con mecánicas distintas: guerrero (equipo pesado), maga (ranuras de
-- conjuro), pícara (experticia). Entre las tres ejercitan casi toda la hoja.

INSERT INTO public.characters (
  id, user_id, campaign_id, name, race, class, level, stats, backstory,
  current_hp, experience_points, armor_class, conditions, sheet_json
) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '22222222-2222-2222-2222-222222222222',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'Thorin Ironshield', 'dwarf', 'fighter', 3,
   '{"str":16,"dex":12,"con":16,"int":10,"wis":13,"cha":8}',
   'Veteran of the Bronzehold guard. He walked away from his post when his captain sold the city to the duergar. He is hunting for the evidence that will hang him.',
   28, 900, 18, '{}',
   '{"base_stats":{"str":15,"dex":12,"con":15,"int":10,"wis":13,"cha":8},
     "background":"soldier","background_bonuses":{"str":1,"con":1},
     "background_skills":["athletics","intimidation"],
     "skill_proficiencies":["athletics","intimidation","perception","survival"],
     "expertise":[],"weapon_proficiencies":["simple-weapons","martial-weapons"],
     "spells":[],"hit_die":10,"saving_throws":["str","con"],
     "max_hp":28,"hit_dice_used":0,"spell_slots_used":{},
     "fighting_style":"defense",
     "currency":{"gold":42,"silver":18,"copper":7},
     "equipped_items":["dddddddd-0000-0000-0000-000000000001","dddddddd-0000-0000-0000-000000000002","dddddddd-0000-0000-0000-000000000003","dddddddd-0000-0000-0000-000000000004"],
     "equipped_slots":{"main_hand":"dddddddd-0000-0000-0000-000000000001","chest":"dddddddd-0000-0000-0000-000000000002","off_hand":"dddddddd-0000-0000-0000-000000000003","head":"dddddddd-0000-0000-0000-000000000004"},
     "equipped_armor":{"name":"Chain Mail","base":16,"dex_bonus":false,"category":"Pesada"},
     "shield_bonus":2}'),

  ('bbbbbbbb-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'Lyra Windsong', 'elf', 'wizard', 3,
   '{"str":8,"dex":14,"con":12,"int":17,"wis":12,"cha":11}',
   'Copyist of the Candlemere Enclave. She was forbidden from reading the restricted wing; she read the restricted wing. Now something follows her from library to library.',
   17, 900, 12, '{}',
   '{"base_stats":{"str":8,"dex":14,"con":12,"int":16,"wis":11,"cha":11},
     "background":"sage","background_bonuses":{"int":1,"wis":1},
     "background_skills":["arcana","history"],
     "skill_proficiencies":["arcana","history","investigation","insight"],
     "expertise":[],"weapon_proficiencies":["daggers","quarterstaffs"],
     "spells":["fire-bolt","mage-hand","prestidigitation","magic-missile","shield","burning-hands","misty-step","scorching-ray"],
     "prepared_spells":["magic-missile","shield","burning-hands","misty-step"],
     "hit_die":6,"saving_throws":["int","wis"],
     "max_hp":17,"hit_dice_used":1,
     "spell_slots_used":{"1":1,"2":0},
     "currency":{"gold":75,"silver":4,"copper":12},
     "equipped_items":["dddddddd-0000-0000-0000-000000000011","dddddddd-0000-0000-0000-000000000012"],
     "equipped_slots":{"main_hand":"dddddddd-0000-0000-0000-000000000011","cloak":"dddddddd-0000-0000-0000-000000000012"}}'),

  ('bbbbbbbb-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222',
   'aaaaaaaa-0000-0000-0000-000000000001',
   'Pip Lightfinger', 'halfling', 'rogue', 3,
   '{"str":10,"dex":17,"con":13,"int":12,"wis":14,"cha":13}',
   'He has never stolen anything that was being properly looked after. It is his only rule, and he reads it generously.',
   21, 900, 14, '{"prone"}',
   '{"base_stats":{"str":10,"dex":16,"con":13,"int":12,"wis":13,"cha":13},
     "background":"criminal","background_bonuses":{"dex":1,"wis":1},
     "background_skills":["deception","stealth"],
     "skill_proficiencies":["deception","stealth","acrobatics","sleight-of-hand","perception"],
     "expertise":["stealth","sleight-of-hand"],
     "weapon_proficiencies":["simple-weapons","hand-crossbows","rapiers","shortswords"],
     "spells":[],"hit_die":8,"saving_throws":["dex","int"],
     "max_hp":21,"hit_dice_used":0,"spell_slots_used":{},
     "currency":{"gold":18,"silver":33,"copper":51},
     "equipped_items":["dddddddd-0000-0000-0000-000000000019","dddddddd-0000-0000-0000-000000000020","dddddddd-0000-0000-0000-000000000021","dddddddd-0000-0000-0000-000000000022"],
     "equipped_slots":{"main_hand":"dddddddd-0000-0000-0000-000000000019","chest":"dddddddd-0000-0000-0000-000000000020","boots":"dddddddd-0000-0000-0000-000000000021","ring_1":"dddddddd-0000-0000-0000-000000000022"},
     "equipped_armor":{"name":"Leather Armor","base":11,"dex_bonus":true,"category":"Ligera"}}');

-- ─── Inventarios ─────────────────────────────────────────────────────────────
-- Los nombres son del SRD en inglés a propósito: es lo que devuelve la API y lo
-- que resuelve la cascada de íconos. Cubren armas, armaduras, pociones,
-- contenedores, luz y equipo variado para ver el mapeo de íconos completo.

-- Los UUID de inventario también son fijos porque `equipped_slots` y
-- `equipped_items` de la ficha referencian el id de la fila, no el nombre.

INSERT INTO public.character_inventory (id, character_id, name, weight_lbs, quantity, notes) VALUES
  -- Thorin
  ('dddddddd-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'Longsword', 3, 1, 'Blade of the Bronzehold guard.'),
  ('dddddddd-0000-0000-0000-000000000002', 'bbbbbbbb-0000-0000-0000-000000000001', 'Chain Mail', 55, 1, 'CA 16'),
  ('dddddddd-0000-0000-0000-000000000003', 'bbbbbbbb-0000-0000-0000-000000000001', 'Shield', 6, 1, 'Shield +2'),
  ('dddddddd-0000-0000-0000-000000000004', 'bbbbbbbb-0000-0000-0000-000000000001', 'Helmet', 3, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000005', 'bbbbbbbb-0000-0000-0000-000000000001', 'Handaxe', 2, 2, 'Throwable.'),
  ('dddddddd-0000-0000-0000-000000000006', 'bbbbbbbb-0000-0000-0000-000000000001', 'Potion of Healing', 0.5, 3, 'Restores 2d4+2 hit points.'),
  ('dddddddd-0000-0000-0000-000000000007', 'bbbbbbbb-0000-0000-0000-000000000001', 'Rope, hempen (50 feet)', 10, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000008', 'bbbbbbbb-0000-0000-0000-000000000001', 'Torch', 1, 5, NULL),
  ('dddddddd-0000-0000-0000-000000000009', 'bbbbbbbb-0000-0000-0000-000000000001', 'Rations', 2, 4, NULL),
  ('dddddddd-0000-0000-0000-000000000010', 'bbbbbbbb-0000-0000-0000-000000000001', 'Backpack', 5, 1, NULL),
  -- Lyra
  ('dddddddd-0000-0000-0000-000000000011', 'bbbbbbbb-0000-0000-0000-000000000002', 'Quarterstaff', 4, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000012', 'bbbbbbbb-0000-0000-0000-000000000002', 'Cloak', 2, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000013', 'bbbbbbbb-0000-0000-0000-000000000002', 'Spellbook', 3, 1, 'Bound in eelskin.'),
  ('dddddddd-0000-0000-0000-000000000014', 'bbbbbbbb-0000-0000-0000-000000000002', 'Dagger', 1, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000015', 'bbbbbbbb-0000-0000-0000-000000000002', 'Scroll of Identify', 0, 2, NULL),
  ('dddddddd-0000-0000-0000-000000000016', 'bbbbbbbb-0000-0000-0000-000000000002', 'Ink', 0, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000017', 'bbbbbbbb-0000-0000-0000-000000000002', 'Lantern', 2, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000018', 'bbbbbbbb-0000-0000-0000-000000000002', 'Potion of Healing', 0.5, 1, 'Restores 2d4+2 hit points.'),
  -- Pip
  ('dddddddd-0000-0000-0000-000000000019', 'bbbbbbbb-0000-0000-0000-000000000003', 'Rapier', 2, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000020', 'bbbbbbbb-0000-0000-0000-000000000003', 'Leather Armor', 10, 1, 'AC 11 + DEX'),
  ('dddddddd-0000-0000-0000-000000000021', 'bbbbbbbb-0000-0000-0000-000000000003', 'Boots', 1, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000022', 'bbbbbbbb-0000-0000-0000-000000000003', 'Ring of Protection', 0, 1, '+1 a la CA y a las salvaciones.'),
  ('dddddddd-0000-0000-0000-000000000023', 'bbbbbbbb-0000-0000-0000-000000000003', 'Thieves Tools', 1, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000024', 'bbbbbbbb-0000-0000-0000-000000000003', 'Shortbow', 2, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000025', 'bbbbbbbb-0000-0000-0000-000000000003', 'Arrow', 0.05, 20, NULL),
  ('dddddddd-0000-0000-0000-000000000026', 'bbbbbbbb-0000-0000-0000-000000000003', 'Caltrops', 2, 1, NULL),
  ('dddddddd-0000-0000-0000-000000000027', 'bbbbbbbb-0000-0000-0000-000000000003', 'Lute', 2, 1, 'Stolen. He still has not learned to play it.');

-- ─── PNJs ────────────────────────────────────────────────────────────────────

INSERT INTO public.npcs (
  id, campaign_id, name, race, class, level, role, stats,
  current_hp, max_hp, armor_class, attack_bonus, damage, conditions, backstory
) VALUES
  ('cccccccc-0000-0000-0000-000000000001', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Grishnak the Ripper', 'half-orc', 'barbarian', 4, 'antagonist',
   '{"str":18,"dex":13,"con":16,"int":8,"wis":10,"cha":9}',
   45, 45, 15, 6, '1d12+4', '{}',
   'Leads the band that raids the caravans on the pass. He collects his toll in fingers.'),
  ('cccccccc-0000-0000-0000-000000000002', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Sister Valda', 'human', 'cleric', 5, 'ally',
   '{"str":12,"dex":10,"con":14,"int":13,"wis":17,"cha":14}',
   33, 33, 18, 5, '1d8+1', '{}',
   'Keeps the wayside shrine. She heals anyone and never asks which side they fight for.'),
  ('cccccccc-0000-0000-0000-000000000003', 'aaaaaaaa-0000-0000-0000-000000000001',
   'Goblin Scout', 'goblin', NULL, 1, 'antagonist',
   '{"str":8,"dex":14,"con":10,"int":10,"wis":8,"cha":8}',
   7, 7, 13, 4, '1d6+2', '{}',
   NULL);

-- ─── Tablero de combate ──────────────────────────────────────────────────────
-- Un encuentro armado: los tres PJ enfrentando a Grishnak y dos goblins.
--
-- `x`/`y` son FRACCIONES del lienzo, entre 0 y 1 — no píxeles ni celdas de
-- grilla. El tablero guarda `x / rect.width` al soltar una ficha y multiplica
-- por el ancho al cargarla (`use-board-interaction.ts`), para que las posiciones
-- sobrevivan a un cambio de tamaño de ventana. Un valor en píxeles se multiplica
-- por el ancho otra vez y manda la ficha a ~300.000 px: sigue en el DOM, pero
-- fuera de la pantalla.

INSERT INTO public.board_tokens (campaign_id, entity_id, kind, label, current_hp, max_hp, x, y) VALUES
  -- El centro del lienzo se deja libre a propósito: el popup de combate nace ahí
  -- y taparía justo a las fichas del ataque que las capturas tienen que mostrar.
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000001', 'player', 'Thorin', 28, 28, 0.13, 0.28),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000002', 'player', 'Lyra',   17, 17, 0.08, 0.55),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'bbbbbbbb-0000-0000-0000-000000000003', 'player', 'Pip',    21, 21, 0.17, 0.74),
  -- Goblin A queda pegado a Thorin: a una celda de distancia el cálculo de
  -- ataque cuerpo a cuerpo da un resultado válido en vez del aviso de fuera de
  -- alcance. Los otros dos quedan atrás, que es la forma real de un encuentro.
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000003', 'npc', 'Goblin A',   7,  7, 0.18, 0.29),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'cccccccc-0000-0000-0000-000000000001', 'npc', 'Grishnak',  45, 45, 0.74, 0.40),
  ('aaaaaaaa-0000-0000-0000-000000000001', 'goblin-b',                             'npc', 'Goblin B',   7,  7, 0.86, 0.70);

-- ─── Objeto de campaña ───────────────────────────────────────────────────────

INSERT INTO public.custom_items (
  campaign_id, created_by, name, description, rarity, item_type, weight_lbs, properties
) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Widow''s Fang',
   'Torn from the spider matriarch of the crypts. It still drips, and what drips never dries.',
   'rare', 'weapon', 2,
   '{"attack_bonus":2,"damage_resistances":["poison"],"is_cursed":true,
     "curse_description":"The first time you grip it your hand closes. Remove Curse is the only way to let go."}');

-- ─── Notas de sesión ─────────────────────────────────────────────────────────

INSERT INTO public.session_notes (campaign_id, author_id, title, body, is_private, session_date) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Session 1 — Hollowstone Pass',
   E'The caravan hired them to cross the pass. Goblin ambush at the third mile: the goblins lost, but one got away north.\n\nThorin recognised the emblem on the shields. It belongs to the Bronzehold guard.',
   false, now() - interval '21 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Session 2 — The wayside shrine',
   E'Sister Valda healed them and warned them about Grishnak. In exchange she asked them to carry a parcel to Waterdeep — she did not say what is inside and nobody asked.\n\nLyra tried to open it while they slept. The parcel was warm.',
   false, now() - interval '14 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111',
   'Open threads',
   E'- The goblin that got away knows where they are headed\n- The Bronzehold captain believes Thorin is dead\n- Valda lied about the parcel\n- Pip still has not given the lute back',
   true, now() - interval '14 days'),
  ('aaaaaaaa-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333',
   'What I saw in the parcel',
   E'I have not told anyone. Inside there is a seal bearing the same symbol I saw in the restricted wing of the Enclave.\n\nIf Valda knows what I am, this was not chance.',
   true, now() - interval '13 days');
