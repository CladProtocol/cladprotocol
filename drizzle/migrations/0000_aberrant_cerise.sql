CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" text,
	"owner" text,
	"message" text NOT NULL,
	"tag" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_instances" (
	"id" text PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"owner" text NOT NULL,
	"name" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"actions_count" integer DEFAULT 0 NOT NULL,
	"earnings" double precision DEFAULT 0 NOT NULL,
	"battery_level" double precision,
	"ros_connected" boolean,
	"manifest_version" text DEFAULT '1.0.0' NOT NULL,
	"region" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_activity_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "agent_reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"author" text NOT NULL,
	"address" text NOT NULL,
	"rating" integer NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "agent_versions" (
	"id" serial PRIMARY KEY NOT NULL,
	"agent_id" text NOT NULL,
	"version" text NOT NULL,
	"released_at" timestamp with time zone NOT NULL,
	"notes" text DEFAULT '' NOT NULL,
	"manifest_hash" text,
	"arweave_tx" text
);
--> statement-breakpoint
CREATE TABLE "agents" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"version" text DEFAULT '1.0.0' NOT NULL,
	"kind" text NOT NULL,
	"category" text NOT NULL,
	"creator" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"long_description" text DEFAULT '' NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"capabilities" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"price" double precision DEFAULT 0 NOT NULL,
	"currency" text DEFAULT 'USDC' NOT NULL,
	"royalty_pct" double precision DEFAULT 0 NOT NULL,
	"rating" double precision DEFAULT 0 NOT NULL,
	"fork_count" integer DEFAULT 0 NOT NULL,
	"win_rate" double precision,
	"uptime" double precision,
	"distance_navigated_km" double precision,
	"verified" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attestations" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"batch_number" integer NOT NULL,
	"arweave_tx" text,
	"sha256" text NOT NULL,
	"actions" integer DEFAULT 0 NOT NULL,
	"window_start" timestamp with time zone,
	"window_end" timestamp with time zone,
	"payload" text DEFAULT '{}' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instance_actions" (
	"id" text PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"label" text NOT NULL,
	"result" text NOT NULL,
	"value" double precision DEFAULT 0 NOT NULL,
	"batch_number" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "instance_daily_earnings" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" text NOT NULL,
	"idx" integer NOT NULL,
	"value" double precision NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"instance_id" text,
	"owner" text,
	"amount" double precision NOT NULL,
	"currency" text DEFAULT 'USDC' NOT NULL,
	"kind" text NOT NULL,
	"status" text DEFAULT 'settled' NOT NULL,
	"tx_hash" text,
	"counterparty" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"owner" text PRIMARY KEY NOT NULL,
	"notify_attestations" boolean DEFAULT true NOT NULL,
	"notify_settlements" boolean DEFAULT true NOT NULL,
	"notify_fleet_alerts" boolean DEFAULT true NOT NULL,
	"notify_weekly_digest" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"address" text PRIMARY KEY NOT NULL,
	"display_name" text,
	"ens" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_instance_id_agent_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."agent_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "activity" ADD CONSTRAINT "activity_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_instances" ADD CONSTRAINT "agent_instances_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_instances" ADD CONSTRAINT "agent_instances_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_reviews" ADD CONSTRAINT "agent_reviews_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "agent_versions" ADD CONSTRAINT "agent_versions_agent_id_agents_id_fk" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attestations" ADD CONSTRAINT "attestations_instance_id_agent_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."agent_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance_actions" ADD CONSTRAINT "instance_actions_instance_id_agent_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."agent_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "instance_daily_earnings" ADD CONSTRAINT "instance_daily_earnings_instance_id_agent_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."agent_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_instance_id_agent_instances_id_fk" FOREIGN KEY ("instance_id") REFERENCES "public"."agent_instances"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_settings" ADD CONSTRAINT "user_settings_owner_users_address_fk" FOREIGN KEY ("owner") REFERENCES "public"."users"("address") ON DELETE no action ON UPDATE no action;