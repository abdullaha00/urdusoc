-- Replace the launch placeholder with the dated events announced on the
-- Michaelmas 2026 term card. A bare date is stored at noon with show_time false
-- so it sorts on the right day without claiming an hour the card does not give.

UPDATE "events"
SET "published" = false, "updated_at" = now()
WHERE "slug" = 'an-evening-of-urdu-poetry'
  AND "published" = true
  AND "sheet_row_key" IS NULL;--> statement-breakpoint

INSERT INTO "events" (
  "slug",
  "title",
  "kind",
  "category",
  "is_collaboration",
  "collaborators",
  "summary",
  "starts_at",
  "ends_at",
  "show_time",
  "venue",
  "published"
) VALUES
  (
    'chai-and-chat-2026-10-11',
    'Chai and Chat',
    'social',
    'social',
    false,
    '{}',
    'An afternoon of chai and conversation in the Munby Room.',
    '2026-10-11 14:00:00+00',
    '2026-10-11 17:00:00+00',
    true,
    'Munby Room, King''s College',
    true
  ),
  (
    'cambridge-south-asia-tour-2026-10-16',
    'Cambridge South Asia Tour',
    'social',
    'cultural',
    false,
    '{}',
    'A walking tour of Cambridge''s South Asian history.',
    '2026-10-16 15:00:00+00',
    '2026-10-16 16:00:00+00',
    true,
    'Meet outside King''s College',
    true
  ),
  (
    'jinn-o-ween-2026-10-29',
    'Jinn-o-ween',
    'mushaira',
    'cultural',
    true,
    '{Majlis}',
    'A Jinn-o-ween gathering with Majlis.',
    '2026-10-29 12:00:00+00',
    NULL,
    false,
    NULL,
    true
  ),
  (
    'iqbal-and-the-poetics-of-awakening-2026-11-22',
    'Iqbal and the Poetics of Awakening',
    'talk',
    'academic',
    false,
    '{}',
    'A speaker event with Walid Iqbal on Iqbal''s poetics of awakening.',
    '2026-11-22 12:00:00+00',
    NULL,
    false,
    NULL,
    true
  ),
  (
    'talk-with-dr-hina-khalid-2026-11-26',
    'Talk with Dr Hina Khalid',
    'talk',
    'academic',
    false,
    '{}',
    'A talk with the author of Words of Witness: Divine Call and Human Response in Iqbal and Tagore.',
    '2026-11-26 12:00:00+00',
    NULL,
    false,
    NULL,
    true
  )
ON CONFLICT ("slug") DO UPDATE SET
  "title" = EXCLUDED."title",
  "kind" = EXCLUDED."kind",
  "category" = EXCLUDED."category",
  "is_collaboration" = EXCLUDED."is_collaboration",
  "collaborators" = EXCLUDED."collaborators",
  "summary" = EXCLUDED."summary",
  "starts_at" = EXCLUDED."starts_at",
  "ends_at" = EXCLUDED."ends_at",
  "show_time" = EXCLUDED."show_time",
  "venue" = EXCLUDED."venue",
  "published" = EXCLUDED."published",
  "updated_at" = now();
