import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260819055442 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "so_warehouse" drop column if exists "stock_location_id";`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "so_warehouse" add column if not exists "stock_location_id" text null;`);
  }

}
