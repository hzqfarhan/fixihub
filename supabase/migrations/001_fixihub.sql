-- FIXIHUB: Supabase PostgreSQL migration. No service-role key in the client.
create extension if not exists pgcrypto;
create table public.profiles (
 id uuid primary key references auth.users on delete cascade,
 display_name text not null check(length(display_name) between 1 and 100),
 role text not null default 'customer' check(role in ('customer','admin'))
);
create function public.is_admin() returns boolean language sql stable security definer set search_path=public
as $$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;
create function public.handle_user() returns trigger language plpgsql security definer set search_path=public as $$
begin insert into profiles(id,display_name) values(new.id,left(coalesce(nullif(new.raw_user_meta_data->>'display_name',''),'Reader'),100));return new;end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_user();

create table public.publishers(id uuid primary key default gen_random_uuid(),name text not null unique,website text,established_year integer,source_url text);
create table public.authors(id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.categories(id uuid primary key default gen_random_uuid(),name text not null unique);
create table public.books(
 id uuid primary key default gen_random_uuid(),publisher_id uuid not null references publishers,
 title text not null check(length(title) between 1 and 160),slug text not null unique,
 price numeric(10,2) not null check(price>0),stock integer not null default 0 check(stock>=0),
 color text not null default '#b9d559' check(color ~ '^#[0-9A-Fa-f]{6}$'),
 description text not null default '',format text not null check(format in ('physical','ebook')),
 source_url text,provenance text not null check(provenance in ('public_metadata','demo')),active boolean not null default true
);
create table public.book_authors(book_id uuid references books on delete cascade,author_id uuid references authors,primary key(book_id,author_id));
create table public.book_categories(book_id uuid references books on delete cascade,category_id uuid references categories,primary key(book_id,category_id));
create table public.preorder_campaigns(
 id uuid primary key default gen_random_uuid(),book_id uuid not null references books,title text not null,
 opens_at timestamptz not null,closes_at timestamptz not null,release_at timestamptz not null,
 capacity integer not null check(capacity>0),reserved integer not null default 0 check(reserved between 0 and capacity),active boolean not null default true,
 check(opens_at<closes_at and closes_at<=release_at)
);
create unique index one_active_campaign on preorder_campaigns(book_id) where active;
create table public.orders(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references profiles,request_id uuid not null,
 customer_name text not null,created_at timestamptz not null default now(),
 status text not null default 'awaiting_payment' check(status in ('awaiting_payment','processing','shipped','completed')),
 book_total numeric(10,2) not null check(book_total>0),shipping_total numeric(10,2) not null check(shipping_total>=0),
 address text not null default '',unique(customer_id,request_id)
);
create table public.order_items(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references orders,book_id uuid not null references books,
 campaign_id uuid references preorder_campaigns,quantity integer not null check(quantity between 1 and 10),
 unit_price numeric(10,2) not null check(unit_price>0),title text not null,format text not null check(format in ('physical','ebook')),
 unique(order_id,book_id)
);
create table public.payments(
 id uuid primary key default gen_random_uuid(),order_id uuid not null references orders,
 kind text not null check(kind in ('book','shipping')),amount numeric(10,2) not null check(amount>0),
 status text not null default 'pending' check(status in ('pending','verified','rejected')),
 receipt_path text not null unique,note text not null default '',created_at timestamptz not null default now(),
 reviewed_by uuid references profiles,reviewed_at timestamptz
);
create unique index one_pending_payment on payments(order_id,kind) where status='pending';
create unique index one_verified_payment on payments(order_id,kind) where status='verified';
create table public.shipments(
 order_id uuid primary key references orders,tracking_number text not null check(length(tracking_number) between 3 and 120),
 shipped_at timestamptz not null default now(),delivered_at timestamptz
);
create table public.ebook_entitlements(
 id uuid primary key default gen_random_uuid(),customer_id uuid not null references profiles,book_id uuid not null references books,
 order_id uuid not null references orders,active boolean not null default true,created_at timestamptz not null default now(),
 unique(order_id,book_id)
);
create table public.ebook_access_records(
 id uuid primary key default gen_random_uuid(),entitlement_id uuid not null references ebook_entitlements,
 created_at timestamptz not null default now(),outcome text not null default 'metadata_only_no_licensed_file'
);
create table public.audit_events(
 id bigint generated always as identity primary key,actor_id uuid references profiles,action text not null,record_id uuid,
 detail jsonb not null default '{}',created_at timestamptz not null default now()
);
create index orders_customer on orders(customer_id);
create index items_order on order_items(order_id);
create index payments_order on payments(order_id);
create index entitlements_customer on ebook_entitlements(customer_id);
create index access_entitlement on ebook_access_records(entitlement_id);

-- All exposed tables have RLS. Writes go through narrowly authorized transactions.
do $$ declare t text;begin
 foreach t in array array['profiles','publishers','authors','categories','books','book_authors','book_categories','preorder_campaigns','orders','order_items','payments','shipments','ebook_entitlements','ebook_access_records','audit_events']
 loop execute format('alter table public.%I enable row level security',t);execute format('revoke all on public.%I from anon, authenticated',t);execute format('grant select on public.%I to authenticated',t);end loop;
 foreach t in array array['publishers','authors','categories','books','book_authors','book_categories','preorder_campaigns']
 loop execute format('grant select on public.%I to anon',t);end loop;end $$;
create policy profile_read on profiles for select to authenticated using(id=auth.uid() or is_admin());
create policy publisher_read on publishers for select using(true);
create policy author_read on authors for select using(true);
create policy category_read on categories for select using(true);
create policy book_read on books for select using(active or is_admin());
create policy ba_read on book_authors for select using(exists(select 1 from books where id=book_id));
create policy bc_read on book_categories for select using(exists(select 1 from books where id=book_id));
create policy campaign_read on preorder_campaigns for select using(active or is_admin());
create policy order_read on orders for select to authenticated using(customer_id=auth.uid() or is_admin());
create policy item_read on order_items for select to authenticated using(exists(select 1 from orders where id=order_id));
create policy payment_read on payments for select to authenticated using(exists(select 1 from orders where id=order_id));
create policy shipment_read on shipments for select to authenticated using(exists(select 1 from orders where id=order_id));
create policy entitlement_read on ebook_entitlements for select to authenticated using(customer_id=auth.uid() or is_admin());
create policy access_read on ebook_access_records for select to authenticated using(exists(select 1 from ebook_entitlements where id=entitlement_id));
create policy audit_read on audit_events for select to authenticated using(is_admin());

create view public.catalog with (security_invoker=true) as
select b.*,coalesce((select string_agg(a.name,', ' order by a.name) from authors a join book_authors ba on ba.author_id=a.id where ba.book_id=b.id),'') author,
coalesce((select string_agg(c.name,', ' order by c.name) from categories c join book_categories bc on bc.category_id=c.id where bc.book_id=b.id),'Fiction') category from books b;
grant select on catalog to anon,authenticated;

create function public.checkout(p_items jsonb,p_address text,p_request_id uuid) returns uuid
language plpgsql security definer set search_path=public as $$
declare oid uuid; b books%rowtype;c preorder_campaigns%rowtype;r jsonb; q int;bid uuid;cid uuid;total numeric:=0;physical boolean:=false;uname text;
begin
 if auth.uid() is null then raise exception 'Sign in to place an order';end if;
 -- Serialize requests per customer for idempotent retries.
 perform 1 from profiles where id=auth.uid() for update;
 select id into oid from orders where customer_id=auth.uid() and request_id=p_request_id;if found then return oid;end if;
 if jsonb_typeof(p_items)<>'array' or jsonb_array_length(p_items) not between 1 and 30 then raise exception 'Invalid bag';end if;
 if (select count(distinct x->>'book_id') from jsonb_array_elements(p_items)x)<>jsonb_array_length(p_items) then raise exception 'Duplicate book';end if;
 select display_name into uname from profiles where id=auth.uid();
 oid:=gen_random_uuid();
 -- Lock books in stable order, compute authoritative price, reserve atomically.
 for r in select value from jsonb_array_elements(p_items) order by value->>'book_id' loop
  bid:=(r->>'book_id')::uuid;q:=(r->>'quantity')::integer;cid:=(r->>'campaign_id')::uuid;
  if q is null or q not between 1 and 10 or (r->>'quantity')::numeric<>q then raise exception 'Invalid quantity';end if;
  select * into b from books where id=bid and active for update;if not found then raise exception 'Book unavailable';end if;
  if b.format='ebook' and q<>1 then raise exception 'One digital entitlement per order';end if;
  if cid is not null then
   select * into c from preorder_campaigns where id=cid and book_id=bid and active for update;
   if not found or now()<c.opens_at or now()>c.closes_at or c.reserved+q>c.capacity then raise exception 'Preorder unavailable';end if;
   update preorder_campaigns set reserved=reserved+q where id=cid;
  elsif b.format='physical' then
   if b.stock<q then raise exception 'Insufficient stock';end if;
   update books set stock=stock-q where id=bid;
  end if;
  physical:=physical or b.format='physical';total:=total+b.price*q;
 end loop;
 if physical and (p_address is null or length(trim(p_address)) not between 12 and 1000) then raise exception 'A complete delivery address is required';end if;
 insert into orders(id,customer_id,request_id,customer_name,book_total,shipping_total,address) values(oid,auth.uid(),p_request_id,uname,total,case when physical then 8 else 0 end,coalesce(p_address,''));
 for r in select value from jsonb_array_elements(p_items) loop
  select * into b from books where id=(r->>'book_id')::uuid;
  insert into order_items(order_id,book_id,campaign_id,quantity,unit_price,title,format) values(oid,b.id,(r->>'campaign_id')::uuid,(r->>'quantity')::int,b.price,b.title,b.format);
 end loop;
 insert into audit_events(actor_id,action,record_id) values(auth.uid(),'order.created',oid);return oid;
end $$;

create function public.submit_receipt(p_order_id uuid,p_kind text,p_path text) returns uuid language plpgsql security definer set search_path=public as $$
declare o orders%rowtype;amount_due numeric;pid uuid;
begin
 select * into o from orders where id=p_order_id and customer_id=auth.uid() for update;
 if not found then raise exception 'Order not found';end if;
 if p_kind not in ('book','shipping') or p_kind is null then raise exception 'Invalid payment type';end if;
 if exists(select 1 from payments where order_id=o.id and kind=p_kind and status in ('pending','verified')) then raise exception 'Payment already submitted or verified';end if;
 amount_due:=case when p_kind='book' then o.book_total else o.shipping_total end;
 if amount_due<=0 then raise exception 'No payment due';end if;
 if p_path not like auth.uid()::text||'/'||o.id::text||'/%' or not exists(select 1 from storage.objects where bucket_id='receipts' and name=p_path) then raise exception 'Upload receipt first';end if;
 insert into payments(order_id,kind,amount,receipt_path) values(o.id,p_kind,amount_due,p_path) returning id into pid;return pid;
end $$;

create function public.review_payment(p_id uuid,p_approve boolean,p_note text default '') returns void language plpgsql security definer set search_path=public as $$
declare p payments%rowtype;o orders%rowtype;
begin
 if not is_admin() then raise exception 'Administrator required';end if;
 if p_approve is null then raise exception 'Decision required';end if;
 select * into p from payments where id=p_id for update;
 if not found or p.status<>'pending' then raise exception 'Payment is no longer pending';end if;
 select * into o from orders where id=p.order_id for update;
 if not p_approve and length(trim(coalesce(p_note,'')))<3 then raise exception 'Give a rejection reason';end if;
 update payments set status=case when p_approve then 'verified' else 'rejected' end,note=left(coalesce(p_note,''),500),reviewed_by=auth.uid(),reviewed_at=now() where id=p_id;
 if p_approve and p.kind='book' then
  update orders set status=case when exists(select 1 from order_items where order_id=o.id and format='physical') then 'processing' else 'completed' end where id=o.id;
  insert into ebook_entitlements(customer_id,book_id,order_id) select o.customer_id,book_id,o.id from order_items where order_id=o.id and format='ebook' on conflict do nothing;
 end if;
 insert into audit_events(actor_id,action,record_id,detail) values(auth.uid(),'payment.reviewed',p_id,jsonb_build_object('approved',p_approve,'note',p_note));
end $$;

create function public.fulfill_order(p_id uuid,p_tracking text,p_delivered boolean default false) returns void language plpgsql security definer set search_path=public as $$
declare o orders%rowtype;
begin
 if not is_admin() then raise exception 'Administrator required';end if;
 select * into o from orders where id=p_id for update;if not found then raise exception 'Order not found';end if;
 if p_delivered then
  if o.status<>'shipped' then raise exception 'Order must be shipped first';end if;
  update shipments set delivered_at=now() where order_id=o.id;update orders set status='completed' where id=o.id;
 else
  if o.status<>'processing' or length(trim(coalesce(p_tracking,''))) not between 3 and 120 then raise exception 'Processing order and tracking number required';end if;
  if not exists(select 1 from payments where order_id=o.id and kind='book' and status='verified') or (o.shipping_total>0 and not exists(select 1 from payments where order_id=o.id and kind='shipping' and status='verified')) then raise exception 'Book and postage payments must be verified';end if;
  if exists(select 1 from order_items i join preorder_campaigns c on c.id=i.campaign_id where i.order_id=o.id and c.release_at>now()) then raise exception 'Preorder has not reached release date';end if;
  insert into shipments(order_id,tracking_number) values(o.id,trim(p_tracking));update orders set status='shipped' where id=o.id;
 end if;
 insert into audit_events(actor_id,action,record_id) values(auth.uid(),case when p_delivered then 'order.delivered' else 'order.shipped' end,o.id);
end $$;

create function public.record_ebook_access(p_id uuid) returns text language plpgsql security definer set search_path=public as $$
begin
 if not exists(select 1 from ebook_entitlements where id=p_id and customer_id=auth.uid() and active) then raise exception 'Active entitlement required';end if;
 insert into ebook_access_records(entitlement_id) values(p_id);
 return 'Access checked and recorded. No licensed ebook file is attached to this academic prototype.';
end $$;

create function public.update_profile(p_name text) returns void language plpgsql security definer set search_path=public as $$
begin if auth.uid() is null or length(trim(p_name)) not between 1 and 100 then raise exception 'Valid name required';end if;update profiles set display_name=trim(p_name) where id=auth.uid();end $$;

create function public.save_book(p_book jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare bid uuid;aid uuid;cid uuid;pub uuid;
begin
 if not is_admin() then raise exception 'Administrator required';end if;
 if length(trim(p_book->>'author')) not between 1 and 100 or length(trim(p_book->>'category')) not between 1 and 60 then raise exception 'Author and category required';end if;
 select id into pub from publishers order by name limit 1;
 bid:=coalesce(nullif(p_book->>'id','')::uuid,gen_random_uuid());
 insert into books(id,publisher_id,title,slug,price,stock,color,description,format,source_url,provenance,active)
 values(bid,pub,p_book->>'title',coalesce(nullif(p_book->>'slug',''),'book-'||bid::text),(p_book->>'price')::numeric,(p_book->>'stock')::int,p_book->>'color',coalesce(p_book->>'description',''),p_book->>'format',nullif(p_book->>'source_url',''),p_book->>'provenance',coalesce((p_book->>'active')::boolean,true))
 on conflict(id) do update set title=excluded.title,price=excluded.price,stock=excluded.stock,color=excluded.color,description=excluded.description,active=excluded.active;
 -- Format, provenance and source are immutable after creation.
 insert into authors(name) values(trim(p_book->>'author')) on conflict(name) do update set name=excluded.name returning id into aid;
 insert into categories(name) values(trim(p_book->>'category')) on conflict(name) do update set name=excluded.name returning id into cid;
 delete from book_authors where book_id=bid;delete from book_categories where book_id=bid;
 insert into book_authors values(bid,aid);insert into book_categories values(bid,cid);
 insert into audit_events(actor_id,action,record_id) values(auth.uid(),'book.saved',bid);return bid;
end $$;

create function public.save_campaign(p_campaign jsonb) returns uuid language plpgsql security definer set search_path=public as $$
declare cid uuid;
begin
 if not is_admin() then raise exception 'Administrator required';end if;
 cid:=coalesce(nullif(p_campaign->>'id','')::uuid,gen_random_uuid());
 insert into preorder_campaigns(id,book_id,title,opens_at,closes_at,release_at,capacity,active)
 values(cid,(p_campaign->>'book_id')::uuid,p_campaign->>'title',(p_campaign->>'opens_at')::timestamptz,(p_campaign->>'closes_at')::timestamptz,(p_campaign->>'release_at')::timestamptz,(p_campaign->>'capacity')::int,coalesce((p_campaign->>'active')::boolean,true))
 on conflict(id) do update set title=excluded.title,opens_at=excluded.opens_at,closes_at=excluded.closes_at,release_at=excluded.release_at,capacity=excluded.capacity,active=excluded.active;
 insert into audit_events(actor_id,action,record_id) values(auth.uid(),'campaign.saved',cid);return cid;
end $$;

-- Functions are not executable anonymously by default.
revoke execute on all functions in schema public from public,anon;
grant execute on function public.is_admin() to anon,authenticated;
grant execute on function public.checkout(jsonb,text,uuid),public.submit_receipt(uuid,text,text),public.review_payment(uuid,boolean,text),public.fulfill_order(uuid,text,boolean),public.record_ebook_access(uuid),public.update_profile(text),public.save_book(jsonb),public.save_campaign(jsonb) to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('receipts','receipts',false,5242880,array['image/jpeg','image/png','application/pdf']) on conflict(id) do nothing;
create policy receipt_upload on storage.objects for insert to authenticated with check(
 bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text
 and exists(select 1 from public.orders where id::text=(storage.foldername(name))[2] and customer_id=auth.uid())
);
create policy receipt_read on storage.objects for select to authenticated using(
 bucket_id='receipts' and ((storage.foldername(name))[1]=auth.uid()::text or public.is_admin())
);
-- No update/delete policies: receipts cannot be swapped after review.
