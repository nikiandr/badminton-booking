CREATE TABLE "session_registration" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"user_id" text NOT NULL,
	"has_paid" boolean DEFAULT false NOT NULL,
	"registered_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "session_registration_session_id_user_id_unique" UNIQUE("session_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "session_registration" ADD CONSTRAINT "session_registration_session_id_badminton_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."badminton_session"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_registration" ADD CONSTRAINT "session_registration_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;