import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260820092606 extends Migration {

  override async up(): Promise<void> {
    // A warehouse is now the stock location itself. Everything else on the
    // table (name, pincode, city, state) already exists on the location and
    // its address; only these three flags have nowhere else to live, so they
    // move to the location's metadata before the table goes.
    //
    // The link table's name is generated, so it is looked up by shape rather
    // than hardcoded, and the whole carry-over is skipped if either side is
    // already gone (a fresh install has no data to move).
    this.addSql(`
      do $$
      declare
        link_table text;
      begin
        if to_regclass('so_warehouse') is null then
          return;
        end if;

        select c.relname into link_table
        from pg_class c
        join pg_namespace n on n.oid = c.relnamespace
        where n.nspname = 'public'
          and c.relkind = 'r'
          and exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = c.relname
              and column_name = 'so_warehouse_id'
          )
          and exists (
            select 1 from information_schema.columns
            where table_schema = 'public' and table_name = c.relname
              and column_name = 'stock_location_id'
          )
        limit 1;

        if link_table is null then
          return;
        end if;

        execute format($f$
          update stock_location sl
          set metadata = coalesce(sl.metadata, '{}'::jsonb) || jsonb_build_object(
                'is_primary', w.is_primary,
                'is_drop_ship', w.is_drop_ship,
                'vendor_webhook_url', w.vendor_webhook_url
              )
          from so_warehouse w
          join %I l on l.so_warehouse_id = w.id and l.deleted_at is null
          where sl.id = l.stock_location_id
            and w.deleted_at is null
            and sl.deleted_at is null
        $f$, link_table);

        -- The link existed only to tie the two records together. With one
        -- record there is nothing to link, so the table goes with it rather
        -- than lingering under a name that no longer means anything.
        execute format('drop table if exists %I cascade', link_table);
      end $$;
    `);

    this.addSql(`drop table if exists "so_warehouse" cascade;`);
  }

  override async down(): Promise<void> {
    this.addSql(`create table if not exists "so_warehouse" ("id" text not null, "name" text not null, "pincode" text not null, "city" text not null default '', "state" text not null default '', "is_primary" boolean not null default false, "is_drop_ship" boolean not null default false, "vendor_webhook_url" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "so_warehouse_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_so_warehouse_deleted_at" ON "so_warehouse" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

}
