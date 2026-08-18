import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260818131523 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "gst_settings" ("id" text not null, "origin_state_code" text not null default '07', "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "gst_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_gst_settings_deleted_at" ON "gst_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "gst_settings" cascade;`);
  }

}
