import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260820153003 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shipping_settings" drop constraint if exists "shipping_settings_singleton_unique";`);
    this.addSql(`alter table if exists "shipping_settings" add column if not exists "singleton" boolean not null default true;`);
    // Any database that ran the old check-then-create path can already hold
    // more than one live row, and the unique index below cannot be built over
    // them. Keep the oldest — the one every reader has been using since
    // getActiveSettings started ordering by created_at — and soft-delete the
    // rest, so the values in use are the ones that survive.
    this.addSql(`
      update "shipping_settings"
      set "deleted_at" = now(), "updated_at" = now()
      where "deleted_at" is null
        and "id" <> (
          select "id" from "shipping_settings"
          where "deleted_at" is null
          order by "created_at" asc
          limit 1
        );
    `);

    this.addSql(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_shipping_settings_singleton_unique" ON "shipping_settings" ("singleton") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop index if exists "IDX_shipping_settings_singleton_unique";`);
    this.addSql(`alter table if exists "shipping_settings" drop column if exists "singleton";`);
  }

}
