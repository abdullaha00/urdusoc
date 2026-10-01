CREATE TABLE "event_sync_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"trigger" text NOT NULL,
	"triggered_by_email" text,
	"ok" boolean NOT NULL,
	"rows_read" integer DEFAULT 0 NOT NULL,
	"created" integer DEFAULT 0 NOT NULL,
	"updated" integer DEFAULT 0 NOT NULL,
	"unpublished" integer DEFAULT 0 NOT NULL,
	"skipped" integer DEFAULT 0 NOT NULL,
	"problems" text[] DEFAULT '{}' NOT NULL,
	"error_message" text,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "sheet_row_key" text;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "sheet_synced_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_sheet_row_key_unique" UNIQUE("sheet_row_key");