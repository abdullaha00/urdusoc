ALTER TABLE "events" ALTER COLUMN "venue" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "events" ADD COLUMN "show_time" boolean DEFAULT true NOT NULL;