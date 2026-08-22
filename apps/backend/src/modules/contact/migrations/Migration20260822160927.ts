import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260822160927 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "contact_message" ("id" text not null, "name" text not null, "email" text not null, "topic" text check ("topic" in ('sales', 'order', 'warranty', 'parts', 'other')) not null default 'other', "order_number" text null, "message" text not null, "status" text check ("status" in ('new', 'open', 'answered', 'archived')) not null default 'new', "note" text null, "source" text not null default 'storefront', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "contact_message_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_message_deleted_at" ON "contact_message" ("deleted_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_message_status_created_at" ON "contact_message" ("status", "created_at") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_contact_message_topic" ON "contact_message" ("topic") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "contact_message" cascade;`);
  }

}
