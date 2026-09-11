alter table public.pricing_packages
  add column if not exists market_prices jsonb not null default '{}'::jsonb;

update public.pricing_packages
set market_prices = case name
  when 'Starter' then '{"KW":245,"SA":1250,"AE":1250,"EG":25000}'::jsonb
  when 'Growth' then '{"KW":425,"SA":2250,"AE":2250,"EG":45000}'::jsonb
  when 'Premium' then '{"KW":700,"SA":3750,"AE":3750,"EG":75000}'::jsonb
  else jsonb_build_object('KW', nullif(regexp_replace(price, '[^0-9.]', '', 'g'), '')::numeric)
end
where market_prices = '{}'::jsonb or market_prices is null;
