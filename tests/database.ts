import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
async function main() {
  const db = new PGlite();
  await db.exec(`create role anon;create role authenticated;create schema auth;create schema storage;
 create table auth.users(id uuid primary key,raw_user_meta_data jsonb default '{}');
 create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
 grant usage on schema public,auth,storage to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
 create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
 alter table storage.objects enable row level security;grant select,insert on storage.objects to authenticated;
 create function storage.foldername(text) returns text[] language sql as $$ select string_to_array($1,'/') $$;`);
  // PGlite has built-in gen_random_uuid; pgcrypto extension is omitted only in this harness.
  await db.exec(
    readFileSync("supabase/migrations/001_fixihub.sql", "utf8").replace(
      "create extension if not exists pgcrypto;",
      "",
    ),
  );
  await db.exec(readFileSync("supabase/seed.sql", "utf8"));
  const a = "10000000-0000-4000-8000-000000000001",
    b = "10000000-0000-4000-8000-000000000002",
    admin = "10000000-0000-4000-8000-000000000003";
  await db.exec(
    `insert into auth.users(id) values('${a}'),('${b}'),('${admin}');update profiles set role='admin' where id='${admin}';`,
  );
  const as = async (id: string, role = "authenticated") =>
    db.exec(
      `reset role;set role ${role};select set_config('request.jwt.claim.sub','${id}',false);`,
    );
  const val = async (sql: string, args: unknown[] = []) => {
    const r = await db.query<Record<string, unknown>>(sql, args);
    return Object.values(r.rows[0])[0];
  };
  const fail = async (sql: string, args: unknown[] = []) => {
    let failed = false;
    try {
      await db.query(sql, args);
    } catch {
      failed = true;
    }
    assert.ok(failed, "Expected denial: " + sql);
  };
  await as("", "anon");
  assert.equal(Number(await val("select count(*) from catalog")), 8);
  await fail("select checkout($1,$2,$3)", [
    JSON.stringify([
      { book_id: "00000000-0000-4000-8000-000000000001", quantity: 1 },
    ]),
    "Address in Kuala Lumpur",
    "90000000-0000-4000-8000-000000000001",
  ]);
  await as(a);
  await fail("update profiles set role='admin' where id=$1", [a]);
  await fail("update books set price=1");
  const items = JSON.stringify([
    {
      book_id: "00000000-0000-4000-8000-000000000001",
      quantity: 2,
      unit_price: 1,
    },
    { book_id: "00000000-0000-4000-8000-000000000008", quantity: 1 },
  ]);
  const request = "90000000-0000-4000-8000-000000000002";
  const oid = (await val("select checkout($1,$2,$3)", [
    items,
    "Demo address 123, Kuala Lumpur",
    request,
  ])) as string;
  assert.equal(
    Number(await val("select book_total from orders where id=$1", [oid])),
    62,
  );
  assert.equal(
    Number(await val("select shipping_total from orders where id=$1", [oid])),
    8,
  );
  assert.equal(
    await val("select checkout($1,$2,$3)", [
      items,
      "Demo address 123, Kuala Lumpur",
      request,
    ]),
    oid,
  );
  assert.equal(
    Number(
      await val(
        "select stock from books where id='00000000-0000-4000-8000-000000000001'",
      ),
    ),
    78,
  );
  await as(b);
  assert.equal(Number(await val("select count(*) from orders")), 0);
  assert.equal(Number(await val("select count(*) from order_items")), 0);
  await fail("select submit_receipt($1,$2,$3)", [
    oid,
    "book",
    a + "/" + oid + "/fake.png",
  ]);
  await fail("select record_ebook_access(gen_random_uuid())");
  await as(a);
  await fail("select submit_receipt($1,$2,$3)", [
    oid,
    "book",
    a + "/" + oid + "/missing.png",
  ]);
  const path = a + "/" + oid + "/book.png";
  await db.query(
    "insert into storage.objects(bucket_id,name) values('receipts',$1)",
    [path],
  );
  const pay = await val("select submit_receipt($1,$2,$3)", [oid, "book", path]);
  await fail("select review_payment($1,true,$2)", [pay, "Self approve"]);
  await fail("select submit_receipt($1,$2,$3)", [oid, "book", path]);
  await as(admin);
  await fail("select review_payment($1,false,$2)", [pay, ""]);
  await db.query("select review_payment($1,true,$2)", [
    pay,
    "Checked bank record",
  ]);
  assert.equal(Number(await val("select count(*) from ebook_entitlements")), 1);
  await fail("select review_payment($1,true,$2)", [pay, "Repeat"]);
  await fail("select fulfill_order($1,$2,false)", [oid, "TRACK123"]);
  await as(a);
  const spath = a + "/" + oid + "/shipping.png";
  await db.query(
    "insert into storage.objects(bucket_id,name) values('receipts',$1)",
    [spath],
  );
  const sp = await val("select submit_receipt($1,$2,$3)", [
    oid,
    "shipping",
    spath,
  ]);
  const eid = await val("select id from ebook_entitlements");
  await db.query("select record_ebook_access($1)", [eid]);
  assert.equal(
    Number(await val("select count(*) from ebook_access_records")),
    1,
  );
  await as(b);
  assert.equal(Number(await val("select count(*) from storage.objects")), 0);
  await fail("select record_ebook_access($1)", [eid]);
  await as(admin);
  await db.query("select review_payment($1,true,$2)", [sp, "Verified postage"]);
  await db.query("select fulfill_order($1,$2,false)", [oid, "TRACK123"]);
  assert.equal(
    await val("select status from orders where id=$1", [oid]),
    "shipped",
  );
  await db.query("select fulfill_order($1,$2,true)", [oid, ""]);
  assert.equal(
    await val("select status from orders where id=$1", [oid]),
    "completed",
  );
  await as(a);
  await fail("select checkout($1,$2,gen_random_uuid())", [
    JSON.stringify([
      { book_id: "00000000-0000-4000-8000-000000000001", quantity: 1 },
      { book_id: "00000000-0000-4000-8000-000000000007", quantity: 1 },
    ]),
    "Demo full delivery address",
  ]);
  assert.equal(
    Number(
      await val(
        "select stock from books where id='00000000-0000-4000-8000-000000000001'",
      ),
    ),
    78,
  );
  await fail("select checkout($1,$2,gen_random_uuid())", [
    JSON.stringify([
      { book_id: "00000000-0000-4000-8000-000000000001", quantity: 0 },
    ]),
    "Demo delivery address",
  ]);
  await db.exec("reset role");
  await db.exec(
    "update preorder_campaigns set opens_at=now()-interval '1 day',closes_at=now()+interval '1 day',release_at=now()+interval '2 days',capacity=1",
  );
  await as(a);
  const pre = JSON.stringify([
    {
      book_id: "00000000-0000-4000-8000-000000000007",
      quantity: 1,
      campaign_id: "00000000-0000-4000-8000-000000000200",
    },
  ]);
  await db.query("select checkout($1,$2,gen_random_uuid())", [
    pre,
    "Demo preorder delivery address",
  ]);
  await fail("select checkout($1,$2,gen_random_uuid())", [
    pre,
    "Demo preorder delivery address",
  ]);
  await as(admin);
  await db.query("select save_book($1)", [
    JSON.stringify({
      id: "20000000-0000-4000-8000-000000000001",
      title: "Test book",
      author: "Test author",
      category: "Test genre",
      price: 20,
      stock: 5,
      color: "#b9d559",
      description: "Test",
      format: "physical",
      provenance: "demo",
      active: true,
    }),
  ]);
  assert.equal(
    Number(await val("select count(*) from catalog where title='Test book'")),
    1,
  );
  console.log(
    "PASS: migration + seed, RLS isolation, role escalation denial, price integrity, idempotency, stock rollback, receipt ownership, payment authorization, postage gate, ebook access and preorder capacity.",
  );
  await db.close();
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
