-- Cover payment foreign keys used by reconciliation, cleanup and provider lookups.

create index if not exists link_payment_intents_command_idx
  on public.link_payment_intents(command_id);
create index if not exists link_payment_intents_operational_payment_idx
  on public.link_payment_intents(operational_payment_id);
create index if not exists link_payment_intents_provider_account_idx
  on public.link_payment_intents(provider_account_id);
create index if not exists link_payment_intents_sales_quote_idx
  on public.link_payment_intents(sales_quote_id);
create index if not exists link_payment_intents_tax_profile_idx
  on public.link_payment_intents(tax_profile_id);
create index if not exists link_payment_intents_transaction_idx
  on public.link_payment_intents(transaction_id);
