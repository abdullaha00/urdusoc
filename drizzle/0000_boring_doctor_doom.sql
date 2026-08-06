CREATE TYPE "public"."admin_role" AS ENUM('owner', 'editor');--> statement-breakpoint
CREATE TYPE "public"."event_kind" AS ENUM('mushaira', 'social', 'workshop', 'talk', 'collaboration');--> statement-breakpoint
CREATE TYPE "public"."member_status" AS ENUM('pending', 'active', 'expired');--> statement-breakpoint
CREATE TYPE "public"."membership_type" AS ENUM('student', 'alumni', 'friend');--> statement-breakpoint
CREATE TYPE "public"."registration_status" AS ENUM('reserved', 'paid', 'cancelled', 'checked_in');--> statement-breakpoint
CREATE TYPE "public"."subscriber_status" AS ENUM('pending', 'confirmed', 'unsubscribed');--> statement-breakpoint
CREATE TYPE "public"."ticketing_mode" AS ENUM('none', 'rsvp', 'paid');--> statement-breakpoint
CREATE TABLE "account" (
	"user_id" text NOT NULL,
	"type" text NOT NULL,
	"provider" text NOT NULL,
	"provider_account_id" text NOT NULL,
	"refresh_token" text,
	"access_token" text,
	"expires_at" integer,
	"token_type" text,
	"scope" text,
	"id_token" text,
	"session_state" text,
	CONSTRAINT "account_provider_provider_account_id_pk" PRIMARY KEY("provider","provider_account_id")
);
--> statement-breakpoint
CREATE TABLE "admins" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"role" "admin_role" DEFAULT 'editor' NOT NULL,
	"added_by_email" text,
	"last_sign_in_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "admins_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "albums" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"event_id" uuid,
	"taken_on" timestamp with time zone,
	"motif" text,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "albums_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "committee" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"name_urdu" text,
	"role" text NOT NULL,
	"bio" text,
	"email" text,
	"photo_url" text,
	"academic_year" text NOT NULL,
	"is_current" boolean DEFAULT true NOT NULL,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"title_urdu" text,
	"kind" "event_kind" DEFAULT 'mushaira' NOT NULL,
	"kind_urdu" text,
	"summary" text NOT NULL,
	"body" text,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone,
	"venue" text NOT NULL,
	"capacity" integer,
	"ticketing" "ticketing_mode" DEFAULT 'none' NOT NULL,
	"price_pence" integer DEFAULT 0 NOT NULL,
	"published" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"crsid" text,
	"type" "membership_type" DEFAULT 'student' NOT NULL,
	"status" "member_status" DEFAULT 'pending' NOT NULL,
	"price_pence" integer DEFAULT 0 NOT NULL,
	"stripe_session_id" text,
	"stripe_customer_id" text,
	"expires_at" timestamp with time zone,
	"joined_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "members_email_unique" UNIQUE("email"),
	CONSTRAINT "members_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "photos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"album_id" uuid NOT NULL,
	"url" text NOT NULL,
	"width" integer NOT NULL,
	"height" integer NOT NULL,
	"alt" text NOT NULL,
	"caption" text,
	"order_index" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"quantity" integer DEFAULT 1 NOT NULL,
	"reference" text NOT NULL,
	"status" "registration_status" DEFAULT 'reserved' NOT NULL,
	"stripe_session_id" text,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"checked_in_at" timestamp with time zone,
	CONSTRAINT "registrations_reference_unique" UNIQUE("reference"),
	CONSTRAINT "registrations_stripe_session_id_unique" UNIQUE("stripe_session_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"session_token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscribers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"status" "subscriber_status" DEFAULT 'pending' NOT NULL,
	"token" text NOT NULL,
	"source" text,
	"confirmed_at" timestamp with time zone,
	"unsubscribed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "subscribers_email_unique" UNIQUE("email"),
	CONSTRAINT "subscribers_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"image" text
);
--> statement-breakpoint
CREATE TABLE "verification_token" (
	"identifier" text NOT NULL,
	"token" text NOT NULL,
	"expires" timestamp NOT NULL,
	CONSTRAINT "verification_token_identifier_token_pk" PRIMARY KEY("identifier","token")
);
--> statement-breakpoint
CREATE TABLE "verses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"urdu_lines" text[] NOT NULL,
	"transliteration_lines" text[] NOT NULL,
	"translation" text NOT NULL,
	"poet_name" text NOT NULL,
	"poet_urdu" text,
	"poet_years" text,
	"note" text,
	"featured" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "albums" ADD CONSTRAINT "albums_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "photos" ADD CONSTRAINT "photos_album_id_albums_id_fk" FOREIGN KEY ("album_id") REFERENCES "public"."albums"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "committee_year_idx" ON "committee" USING btree ("academic_year","order_index");--> statement-breakpoint
CREATE INDEX "events_starts_at_idx" ON "events" USING btree ("starts_at");--> statement-breakpoint
CREATE INDEX "members_status_idx" ON "members" USING btree ("status");--> statement-breakpoint
CREATE INDEX "photos_album_idx" ON "photos" USING btree ("album_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "registrations_event_email_idx" ON "registrations" USING btree ("event_id","email");--> statement-breakpoint
CREATE INDEX "registrations_event_idx" ON "registrations" USING btree ("event_id");