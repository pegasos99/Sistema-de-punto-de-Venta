-- Prueba de integridad del esquema: nunca conserva datos de prueba.
-- Ejecutar sobre una base de desarrollo, con privilegios administrativos.
begin;
do $verify$
declare
  business_a uuid;
  business_b uuid;
  category_a uuid;
  product_a uuid;
begin
  insert into public.businesses(name) values ('POS schema test A') returning id into business_a;
  insert into public.businesses(name) values ('POS schema test B') returning id into business_b;
  insert into public.categories(business_id,name)
    values (business_a,'Test A') returning id into category_a;
  insert into public.products(business_id,category_id,name,price_amount,min_stock)
    values (business_a,category_a,'Test product A',100,0) returning id into product_a;
  insert into public.inventory_balances(business_id,product_id,location,quantity)
    values(business_a,product_a,'store',3);
  begin
    insert into public.products(business_id,category_id,name,price_amount,min_stock)
      values (business_b,category_a,'Cross-tenant invalid product',100,0);
    raise exception 'ERROR: cross-tenant category reference was accepted';
  exception when foreign_key_violation then null;
  end;
  begin
    update public.inventory_balances set quantity=-1
      where business_id=business_a and product_id=product_a;
    raise exception 'ERROR: negative inventory was accepted';
  exception when check_violation then null;
  end;
  begin
    insert into public.inventory_balances(business_id,product_id,location,quantity)
      values(business_a,product_a,'store',4);
    raise exception 'ERROR: duplicate stock balance was accepted';
  exception when unique_violation then null;
  end;
end
$verify$;
rollback;
