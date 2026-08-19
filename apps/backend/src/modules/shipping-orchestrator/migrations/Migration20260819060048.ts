import { Migration } from "@medusajs/framework/mikro-orm/migrations";

export class Migration20260819060048 extends Migration {

  override async up(): Promise<void> {
    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_target_type_check";`);
    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_rule_type_check";`);

    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_target_type_check" check("target_type" in ('category', 'product', 'variant', 'pincode', 'customer_group'));`);
    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_rule_type_check" check("rule_type" in ('block_pincode', 'block_service', 'force_flat_rate', 'force_surface_only', 'hyperlocal_bypass', 'free_shipping_exclusion', 'cod_block', 'cod_premium', 'b2b_override', 'add_surcharge_flat', 'add_surcharge_percent'));`);
  }

  override async down(): Promise<void> {
    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_target_type_check";`);
    this.addSql(`alter table if exists "shipping_rule" drop constraint if exists "shipping_rule_rule_type_check";`);

    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_target_type_check" check("target_type" in ('category', 'product', 'pincode', 'customer_group'));`);
    this.addSql(`alter table if exists "shipping_rule" add constraint "shipping_rule_rule_type_check" check("rule_type" in ('block_pincode', 'block_service', 'force_flat_rate', 'force_surface_only', 'hyperlocal_bypass', 'free_shipping_exclusion', 'cod_block', 'cod_premium', 'b2b_override'));`);
  }

}
