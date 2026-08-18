import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260818145828 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "shipping_rule" ("id" text not null, "target_type" text check ("target_type" in ('category', 'pincode_zone', 'customer_group')) not null, "target_id" text not null, "rule_type" text check ("rule_type" in ('block_service', 'force_flat_rate', 'force_surface_only', 'hyperlocal_bypass')) not null, "value" jsonb null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_rule_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shipping_rule_deleted_at" ON "shipping_rule" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "shipping_settings" ("id" text not null, "active_provider" text check ("active_provider" in ('shiprocket', 'manual_slabs', 'hyperlocal')) not null default 'shiprocket', "free_shipping_threshold" integer not null default 0, "global_markup_type" text check ("global_markup_type" in ('flat', 'percentage', 'none')) not null default 'none', "global_markup_value" integer not null default 0, "volumetric_divisor" integer not null default 5000, "fallback_weight_grams" integer not null default 500, "absorb_cod_fee" boolean not null default false, "absorb_split_shipment_cost" boolean not null default true, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "shipping_settings_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_shipping_settings_deleted_at" ON "shipping_settings" ("deleted_at") WHERE deleted_at IS NULL;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "shipping_rule" cascade;`);

    this.addSql(`drop table if exists "shipping_settings" cascade;`);
  }

}
