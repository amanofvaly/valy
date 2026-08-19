import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260819055411 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "so_shipping_option" drop constraint if exists "so_shipping_option_native_option_id_unique";`);
    this.addSql(`create table if not exists "so_shipping_option" ("id" text not null, "native_option_id" text not null, "tier" text not null default '', "display_name" text not null default '', "carrier_blacklist" jsonb not null default '[]', "surcharge_flat" integer not null default 0, "surcharge_percent" integer not null default 0, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "so_shipping_option_pkey" primary key ("id"));`);
    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_so_shipping_option_native_option_id_unique" ON "so_shipping_option" ("native_option_id") WHERE deleted_at IS NULL;`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_so_shipping_option_deleted_at" ON "so_shipping_option" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "so_shipping_option" cascade;`);
  }

}
