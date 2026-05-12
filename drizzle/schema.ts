import { pgTable, text, uuid, timestamp, integer, jsonb, boolean, primaryKey } from 'drizzle-orm/pg-core';

// Perfil del usuario (extendiendo auth.users)
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().notNull(),
  username: text('username'),
  avatarUrl: text('avatar_url'),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Campañas
export const campaigns = pgTable('campaigns', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  dmId: uuid('dm_id').references(() => profiles.id).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Relación muchos a muchos entre campañas y jugadores
export const campaignPlayers = pgTable('campaign_players', {
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => ({
  pk: primaryKey({ columns: [table.campaignId, table.userId] }),
}));

// Personajes
export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => profiles.id).notNull(),
  campaignId: uuid('campaign_id').references(() => campaigns.id),
  name: text('name').notNull(),
  race: text('race').notNull(),
  class: text('class').notNull(),
  level: integer('level').default(1).notNull(),
  stats: jsonb('stats').notNull(), // { str, dex, con, int, wis, cha }
  backstory: text('backstory'),
  sheetJson: jsonb('sheet_json').notNull(), // Estado completo de la hoja
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Notas de sesión
export const sessionNotes = pgTable('session_notes', {
  id: uuid('id').defaultRandom().primaryKey(),
  campaignId: uuid('campaign_id').references(() => campaigns.id).notNull(),
  authorId: uuid('author_id').references(() => profiles.id).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  isPrivate: boolean('is_private').default(false).notNull(),
  sessionDate: timestamp('session_date').defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
});
