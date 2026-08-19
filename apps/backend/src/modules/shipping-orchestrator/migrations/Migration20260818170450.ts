import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260818170450 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`create table if not exists "so_box_config" ("id" text not null, "name" text not null, "length_cm" integer not null, "width_cm" integer not null, "height_cm" integer not null, "max_weight_grams" integer not null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "so_box_config_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_so_box_config_deleted_at" ON "so_box_config" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "so_rto_risk_pincode" ("id" text not null, "pincode" text not null, "risk_level" text check ("risk_level" in ('high', 'medium')) not null default 'medium', "block_cod" boolean not null default false, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "so_rto_risk_pincode_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_so_rto_risk_pincode_deleted_at" ON "so_rto_risk_pincode" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`create table if not exists "so_warehouse" ("id" text not null, "name" text not null, "pincode" text not null, "city" text not null default '', "state" text not null default '', "is_primary" boolean not null default false, "is_drop_ship" boolean not null default false, "vendor_webhook_url" text null, "stock_location_id" text null, "created_at" timestamptz not null default now(), "updated_at" timestamptz not null default now(), "deleted_at" timestamptz null, constraint "so_warehouse_pkey" primary key ("id"));`);
    this.addSql(`CREATE INDEX IF NOT EXISTS "IDX_so_warehouse_deleted_at" ON "so_warehouse" ("deleted_at") WHERE deleted_at IS NULL;`);

    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_target_type_check";`);
    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_rule_type_check";`);

    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_target_type_check" check("target_type" in ('category', 'product', 'pincode', 'customer_group'));`);
    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_rule_type_check" check("rule_type" in ('block_pincode', 'block_service', 'force_flat_rate', 'force_surface_only', 'hyperlocal_bypass', 'free_shipping_exclusion', 'cod_block', 'cod_premium', 'b2b_override'));`);

    this.addSql(`alter table if exists "shipping_settings" add column if not exists "hyperlocal_enabled" boolean not null default false, add column if not exists "hyperlocal_radius_km" integer not null default 10, add column if not exists "hyperlocal_flat_rate" integer not null default 0, add column if not exists "surcharge_enabled" boolean not null default false, add column if not exists "surcharge_type" text check ("surcharge_type" in ('flat', 'percentage')) not null default 'flat', add column if not exists "surcharge_value" integer not null default 0, add column if not exists "surcharge_label" text not null default '', add column if not exists "carrier_blacklist" jsonb not null default '[]', add column if not exists "courier_display_map" jsonb not null default '{}', add column if not exists "cod_premium_enabled" boolean not null default false, add column if not exists "cod_premium_value" integer not null default 0, add column if not exists "reverse_pickup_fee" integer not null default 0;`);
  }

  override async down(): Promise<void> {
    this.addSql(`drop table if exists "so_box_config" cascade;`);

    this.addSql(`drop table if exists "so_rto_risk_pincode" cascade;`);

    this.addSql(`drop table if exists "so_warehouse" cascade;`);

    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_target_type_check";`);
    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_rule_type_check";`);

    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_target_type_check" check("target_type" in ('category', 'pincode_zone', 'customer_group'));`);
    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_rule_type_check" check("rule_type" in ('block_service', 'force_flat_rate', 'force_surface_only', 'hyperlocal_bypass'));`);

    this.addSql(`alter table if exists "shipping_settings" drop column if exists "hyperlocal_enabled", drop column if exists "hyperlocal_radius_km", drop column if exists "hyperlocal_flat_rate", drop column if exists "surcharge_enabled", drop column if exists "surcharge_type", drop column if exists "surcharge_value", drop column if exists "surcharge_label", drop column if exists "carrier_blacklist", drop column if exists "courier_display_map", drop column if exists "cod_premium_enabled", drop column if exists "cod_premium_value", drop column if exists "reverse_pickup_fee";`);
  }

}
