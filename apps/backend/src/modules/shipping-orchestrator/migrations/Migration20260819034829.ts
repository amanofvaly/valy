import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260819034829 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shipping_settings" add column if not exists "api_settings" jsonb not null default '{}';`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shipping_settings" drop column if exists "api_settings";`);
  }

}
