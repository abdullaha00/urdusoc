-- Splits the event "kind" enum into two independent axes, and adds the
-- committee archive.
--
-- Hand-edited after generation. drizzle-kit emitted the enum swap *before* the
-- new columns existed and with a bare `kind::event_kind` cast, which fails on
-- every row holding the removed 'collaboration' value. The order below adds the
-- columns first, carries the old value across into `is_collaboration`, and only
-- then rewrites the enum - so no row errors and no information is dropped.

CREATE TYPE "public"."event_category" AS ENUM('academic', 'cultural', 'social');--> statement-breakpoint

CREATE TABLE "committee_cohorts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"academic_year" text NOT NULL,
	"photo_url" text,
	"photo_alt" text,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "committee_cohorts_academic_year_unique" UNIQUE("academic_year")
);
--> statement-breakpoint

ALTER TABLE "committee" ADD COLUMN "college" text;--> statement-breakpoint
ALTER TABLE "committee" ADD COLUMN "course" text;--> statement-breakpoint

ALTER TABLE "events" ADD COLUMN "category" "event_category" DEFAULT 'cultural' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "is_collaboration" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "collaborators" text[] DEFAULT '{}' NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "priority" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "poster_url" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "poster_alt" text;--> statement-breakpoint

-- Carry the old single-axis value across before the enum loses it.
UPDATE "events" SET "is_collaboration" = true WHERE "kind"::text = 'collaboration';--> statement-breakpoint

-- Seed the colour axis from the closest match. Talks and workshops are the
-- teaching evenings; everything else reads as cultural unless it was already
-- filed as a social.
UPDATE "events" SET "category" = (
	CASE "kind"::text
		WHEN 'workshop' THEN 'academic'
		WHEN 'talk' THEN 'academic'
		WHEN 'social' THEN 'social'
		ELSE 'cultural'
	END
)::"public"."event_category";--> statement-breakpoint

-- Now the enum swap. 'collaboration' rows become 'social', which is the least
-- wrong shape for a joint evening; `is_collaboration` above holds the fact
-- that matters, and the admin can pick a better kind afterwards.
ALTER TABLE "events" ALTER COLUMN "kind" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE text;--> statement-breakpoint
UPDATE "events" SET "kind" = 'social' WHERE "kind" = 'collaboration';--> statement-breakpoint
DROP TYPE "public"."event_kind";--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('mushaira', 'social', 'workshop', 'talk');--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "kind" SET DATA TYPE "public"."event_kind" USING "kind"::"public"."event_kind";--> statement-breakpoint
ALTER TABLE "events" ALTER COLUMN "kind" SET DEFAULT 'mushaira'::"public"."event_kind";
