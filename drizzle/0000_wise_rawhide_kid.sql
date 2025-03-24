CREATE TABLE "detail_files" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "detail_files_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"cid" varchar(100) NOT NULL,
	"content" text NOT NULL,
	CONSTRAINT "detail_files_cid_unique" UNIQUE("cid")
);
--> statement-breakpoint
CREATE TABLE "test_results" (
	"id" integer PRIMARY KEY GENERATED BY DEFAULT AS IDENTITY (sequence name "test_results_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"session_id" varchar(15) NOT NULL,
	"is_succeed" boolean DEFAULT true NOT NULL,
	"raw" text DEFAULT '' NOT NULL,
	"result" json DEFAULT '{}'::json NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validations" (
	"session_id" varchar(15) PRIMARY KEY NOT NULL,
	"validator_id" integer NOT NULL,
	"started_at" timestamp DEFAULT now() NOT NULL,
	"finished_at" timestamp DEFAULT now() NOT NULL,
	"score" smallint DEFAULT 0 NOT NULL,
	"agreement_id" integer NOT NULL,
	"offer_id" integer NOT NULL,
	"provider_id" integer NOT NULL,
	"commit_hash" varchar(70),
	"is_revealed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "validators" (
	"id" integer PRIMARY KEY NOT NULL,
	"owner_address" varchar(65) NOT NULL,
	CONSTRAINT "validators_owner_address_unique" UNIQUE("owner_address")
);
--> statement-breakpoint
ALTER TABLE "test_results" ADD CONSTRAINT "test_results_session_id_validations_session_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."validations"("session_id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "validations" ADD CONSTRAINT "validations_validator_id_validators_id_fk" FOREIGN KEY ("validator_id") REFERENCES "public"."validators"("id") ON DELETE no action ON UPDATE no action;