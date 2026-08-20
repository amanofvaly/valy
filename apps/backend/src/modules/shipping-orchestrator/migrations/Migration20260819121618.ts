import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260819121618 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shipping_settings" add column if not exists "fallback_enabled" boolean not null default true, add column if not exists "fallback_rate_per_500g" integer not null default 45;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shipping_settings" drop column if exists "fallback_enabled", drop column if exists "fallback_rate_per_500g";`);
  }

}
