import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260818141907 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "gst_settings" add column if not exists "company_gstin" text null;`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "gst_settings" drop column if exists "company_gstin";`);
  }

}
