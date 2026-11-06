// Demo stand-in for src/lib/supabase.ts (swapped in by demo/vite.config.ts).
//
// Exports the same names, but `supabase` is an in-memory fake: tables live in
// this module, filled with made-up bowlers when the page loads, and the
// database functions the app calls (search_customers, save_fit_revision, ...)
// are reimplemented here in a few lines each. There is no network code in this
// file and no Supabase URL or key in the demo build. Refreshing starts over.

import {
  FIELDS,
  draftToSnapshot,
  emptySnapshot,
  snapshotToDraft,
  validateDraft,
  type Draft,
  type FieldKey,
  type Snapshot,
} from '../src/measurements/schema';

export const supabaseUrl = 'demo://in-memory';
export const supabasePublicKey = 'demo';
export const isConfigured = true;
export const PHOTO_BUCKET = 'spec-photos';
export const INTAKE_BUCKET = 'intake-photos';

// GitHub Pages sends unknown paths to 404.html, which bounces /demo/... deep
// links back here as ?p=<path>. Put the path back before the router reads it.
{
  const p = new URLSearchParams(location.search).get('p');
  if (p) history.replaceState(null, '', import.meta.env.BASE_URL + p.replace(/^\//, ''));
}

type Row = Record<string, any>;
const SHOP_ID = 'demo-shop';
let n = 0;
const uid = (prefix: string) => `${prefix}-${(++n).toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const now = () => new Date().toISOString();
const daysAgo = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

// ------------------------------------------------------------------ sample data

/** A spec sheet from plain entered text, run through the app's own parser. */
function sheet(values: Partial<Record<FieldKey, string | [string, string]>>): Snapshot {
  const draft = snapshotToDraft(emptySnapshot()) as Draft;
  for (const [k, v] of Object.entries(values)) {
    draft[k as FieldKey] = Array.isArray(v) ? { text: v[0], dir: v[1] } : { text: v as string, dir: '' };
  }
  return draftToSnapshot(draft);
}

const BOWLERS: Array<[string, string, string | null]> = [
  ['Alex Sample', '570-555-0110', 'League Tue + Thu. Likes a little more forward on the ring.'],
  ['Jordan Example', '570-555-0111', null],
  ['Casey Demo', '570-555-0112', 'Two-hander, no thumb.'],
  ['Riley Tester', '570-555-0113', 'Tournament bowler'],
  ['Morgan Placeholder', '570-555-0114', null],
  ['Taylor Mockford', '570-555-0115', 'Lefty'],
  ['Sam Fakely', '570-555-0116', null],
  ['Jamie Notreal', '570-555-0117', 'Youth league, growing fast: recheck span each season'],
  ['Chris Pretendo', '570-555-0118', null],
  ['Pat Dummyson', '570-555-0119', 'Prefers JOPO thumb'],
  ['Drew Sample', '570-555-0120', null],
  ['Quinn Example', '570-555-0121', null],
];

function bowlerSheet(i: number, tweak = 0): Snapshot {
  const lefty = i === 5;
  const twoHand = i === 2;
  const span = ['4', '4 1/16', '4 1/8', '4 3/16', '4 1/4', '4 5/16'][(i + tweak) % 6];
  const ringSpan = ['4 1/16', '4 1/8', '4 3/16', '4 1/4', '4 5/16', '4 3/8'][(i + tweak) % 6];
  const base: Partial<Record<FieldKey, string | [string, string]>> = {
    hand: lefty ? 'left' : 'right',
    play_style: twoHand ? 'two_handed' : 'one_handed',
    thumb_mode: twoHand ? 'no_thumb' : 'fingertip',
    finger_grips: 'grips',
    grip_type: 'std',
    middle_grip_brand: 'Turbo',
    ring_grip_brand: 'Turbo',
    middle_grip_size: ['19/32', '5/8', '21/32'][i % 3],
    ring_grip_size: ['37/64', '19/32', '5/8'][i % 3],
    middle_hole: '31/32',
    ring_hole: '31/32',
    middle_lateral_pitch: ['1/8', lefty ? 'left' : 'right'],
    middle_fr_pitch: [tweak ? '3/8' : '1/4', 'forward'],
    ring_lateral_pitch: ['1/8', lefty ? 'left' : 'right'],
    ring_fr_pitch: ['1/4', 'forward'],
    bridge: '1/4',
    rev_rate: String(300 + ((i * 37) % 200)),
    axis_rotation: String(35 + ((i * 7) % 30)),
    axis_tilt: String(10 + ((i * 3) % 12)),
    speed: ['16', '17', '18'][i % 3],
    pap_horizontal: ['5', '5 1/4', '5 1/2'][i % 3],
    pap_vertical: ['1/2', 'up'],
    written_by: ['Kim', 'Amy', 'Doug'][i % 3],
    fitting_notes: tweak ? 'Added forward to the middle after a week of bowling.' : null as unknown as string,
  };
  if (!twoHand) {
    Object.assign(base, {
      span_type: 'cut_to_cut',
      middle_cut_to_cut: span,
      ring_cut_to_cut: ringSpan,
      thumb_lateral_pitch: ['1/8', lefty ? 'right' : 'left'],
      thumb_fr_pitch: ['3/8', 'reverse'],
      thumb_oval_angle: '15',
    });
    // A slug is sized by hole and outside diameter; interchangeable inserts are not.
    if (i % 3 === 0) Object.assign(base, { thumb_insert_type: 'Thumb Slug', thumb_hole: ['61/64', '1', '1 1/64'][i % 3], thumb_od: '1 1/8' });
    else Object.assign(base, { thumb_insert_type: i === 9 ? 'JOPO' : 'Turbo' });
  }
  for (const k of Object.keys(base)) if (base[k as FieldKey] == null) delete base[k as FieldKey];
  const snap = sheet(base);
  const problems = validateDraft(snapshotToDraft(snap));
  if (Object.keys(problems).length) console.warn('demo sample sheet', i, problems);
  return snap;
}

const T: Record<string, Row[]> = {
  shops: [{ id: SHOP_ID, name: 'Demo Pro Shop', open_access: true, created_at: daysAgo(400) }],
  staff_memberships: [],
  customers: [],
  fits: [],
  fit_revisions: [],
  bowling_balls: [],
  spec_photos: [],
  intake_items: [],
  intake_names: [],
};

const BALLS = ['Storm Phaze 6', 'Roto Grip Hustle Ink', 'Motiv Venom Shock', 'Hammer Black Widow 3.0', 'Brunswick Prism',
               'Storm IQ Tour', 'DV8 Hater', 'Track Kinetic Ruby'];

BOWLERS.forEach(([name, phone, notes], i) => {
  const created = daysAgo(300 - i * 20);
  const cid = uid('cust');
  const customer: Row = {
    id: cid, shop_id: SHOP_ID, name, phone, phone_mobile: true, email: null, address: null, city: null,
    state: null, zip: null, notes, last_spec_at: null, last_spec_by: null, current_photo_id: null,
    created_at: created, updated_at: created, removed_at: null, removed_by: null,
  };
  T.customers.push(customer);
  if (i === 11) return; // one bowler with no specs yet
  const fid = uid('fit');
  const fit: Row = { id: fid, customer_id: cid, shop_id: SHOP_ID, label: null, is_primary: true,
    current_revision_id: null, lock_version: 0, created_at: created,
    confirmed_revision_id: null, confirmed_at: null, confirmed_by: null };
  T.fits.push(fit);
  const versions = i % 4 === 0 ? 3 : i % 3 === 0 ? 2 : 1;
  for (let v = 0; v < versions; v++) {
    const at = daysAgo(250 - i * 15 - v * 40);
    const rev: Row = {
      id: uid('rev'), fit_id: fid, revision_number: v + 1, schema_version: 1,
      snapshot: bowlerSheet(i, v), change_note: v === 0 ? 'First fitting' : v === 1 ? 'Added forward pitch' : 'New span after season check',
      restored_from_revision_id: null, author_id: 'demo-user', author_name: ['Kim', 'Amy', 'Doug'][(i + v) % 3],
      created_at: at,
    };
    T.fit_revisions.push(rev);
    fit.current_revision_id = rev.id;
    fit.lock_version = v + 1;
    customer.last_spec_at = at;
    customer.last_spec_by = rev.author_name;
    customer.updated_at = at;
  }
  if (i % 2 === 0) { fit.confirmed_revision_id = fit.current_revision_id; fit.confirmed_at = customer.last_spec_at; fit.confirmed_by = 'Kim'; }
  for (let b = 0; b < (i % 3) + 1; b++) {
    T.bowling_balls.push({ id: uid('ball'), customer_id: cid, position: b, name: BALLS[(i + b) % BALLS.length],
      weight_lbs: [15, 15, 14, 16][(i + b) % 4], layout: ['50 x 4 1/2 x 30', '45 x 5 x 40', '60 x 4 x 25'][b % 3],
      notes: b === 0 && i % 2 ? 'Benchmark ball' : null, created_at: created, updated_at: created, removed_at: null });
  }
});

// ---------------------------------------------------------------- query engine

/** Reads "col", "a->b" (json) or "a->>b" (json as text). */
function get(row: Row, path: string): any {
  const parts = path.split(/->>?/);
  let v: any = row[parts[0]];
  for (const p of parts.slice(1)) v = v == null ? null : v[p];
  if (path.includes('->>') && v != null && typeof v === 'object') v = JSON.stringify(v);
  return v;
}

function compare(a: any, b: any): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
  return String(a).localeCompare(String(b));
}

type Pred = (r: Row) => boolean;
function opPred(col: string, op: string, val: any): Pred {
  const lit = (v: any) => (v === 'null' ? null : v === 'true' ? true : v === 'false' ? false : v);
  switch (op) {
    case 'eq': return (r) => get(r, col) != null && String(get(r, col)) === String(lit(val));
    case 'neq': return (r) => get(r, col) != null && String(get(r, col)) !== String(lit(val));
    case 'is': return (r) => (lit(val) === null ? get(r, col) == null : get(r, col) === lit(val));
    case 'gt': return (r) => get(r, col) != null && compare(get(r, col), val) > 0;
    case 'gte': return (r) => get(r, col) != null && compare(get(r, col), val) >= 0;
    case 'lt': return (r) => get(r, col) != null && compare(get(r, col), val) < 0;
    case 'lte': return (r) => get(r, col) != null && compare(get(r, col), val) <= 0;
    case 'in': {
      const list = Array.isArray(val) ? val.map(String) : String(val).replace(/^\(|\)$/g, '').split(',');
      return (r) => list.includes(String(get(r, col)));
    }
    case 'like':
    case 'ilike': {
      const re = new RegExp('^' + String(val).replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/[%*]/g, '.*') + '$', op === 'ilike' ? 'i' : '');
      return (r) => get(r, col) != null && re.test(String(get(r, col)));
    }
    default: throw new Error(`demo: filter "${op}" is not supported`);
  }
}

/** Shapes a row for a select list: "*", "a, b", "alias:path", and "shops(name)" joins. */
function project(table: string, row: Row, columns: string): Row {
  const cols = columns.split(',').map((c) => c.trim()).filter(Boolean);
  if (cols.length === 1 && cols[0] === '*') return { ...row };
  const out: Row = {};
  for (const c of cols) {
    if (c === '*') { Object.assign(out, row); continue; }
    const join = c.match(/^(\w+)\((.*)\)$/);
    if (join) {
      const [, rel, inner] = join;
      const fk = row[`${rel.replace(/s$/, '')}_id`];
      const target = T[rel]?.find((r) => r.id === fk);
      out[rel] = target ? project(rel, target, inner) : null;
      continue;
    }
    const [alias, path] = c.includes(':') ? c.split(':') : [c.split(/->>?/).pop()!, c];
    out[alias] = get(row, path) ?? null;
  }
  return out;
}

const clone = <V>(v: V): V => (v == null ? v : JSON.parse(JSON.stringify(v)));
const later = <V>(v: V) => new Promise<V>((res) => setTimeout(() => res(v), 40));
const err = (message: string, code = 'PT400') => ({ data: null, error: { message, code, details: null, hint: null }, count: null, status: 400, statusText: 'demo' });
const ok = (data: any, count: number | null = null) => ({ data: clone(data), error: null, count, status: 200, statusText: 'OK' });

class Query implements PromiseLike<any> {
  private preds: Pred[] = [];
  private orders: Array<{ col: string; asc: boolean; nullsFirst?: boolean }> = [];
  private lim: number | null = null;
  private from = 0;
  private to: number | null = null;
  private cols: string | null = null;
  private countMode = false;
  private headOnly = false;
  private mode: 'select' | 'insert' | 'update' | 'delete' | 'upsert' = 'select';
  private payload: any = null;
  private one: 'single' | 'maybe' | null = null;
  constructor(private table: string) {}

  select(columns = '*', opts?: { count?: string; head?: boolean }) {
    this.cols = columns;
    if (opts?.count) this.countMode = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }
  insert(rows: Row | Row[]) { this.mode = 'insert'; this.payload = rows; return this; }
  upsert(rows: Row | Row[]) { this.mode = 'upsert'; this.payload = rows; return this; }
  update(patch: Row) { this.mode = 'update'; this.payload = patch; return this; }
  delete() { this.mode = 'delete'; return this; }

  eq(c: string, v: any) { this.preds.push(opPred(c, 'eq', v)); return this; }
  neq(c: string, v: any) { this.preds.push(opPred(c, 'neq', v)); return this; }
  is(c: string, v: any) { this.preds.push(opPred(c, 'is', v === null ? 'null' : v)); return this; }
  gt(c: string, v: any) { this.preds.push(opPred(c, 'gt', v)); return this; }
  gte(c: string, v: any) { this.preds.push(opPred(c, 'gte', v)); return this; }
  lt(c: string, v: any) { this.preds.push(opPred(c, 'lt', v)); return this; }
  lte(c: string, v: any) { this.preds.push(opPred(c, 'lte', v)); return this; }
  in(c: string, v: any[]) { this.preds.push(opPred(c, 'in', v)); return this; }
  like(c: string, v: string) { this.preds.push(opPred(c, 'like', v)); return this; }
  ilike(c: string, v: string) { this.preds.push(opPred(c, 'ilike', v)); return this; }
  filter(c: string, op: string, v: any) { this.preds.push(opPred(c, op, v)); return this; }
  not(c: string, op: string, v: any) { const p = opPred(c, op, v === null ? 'null' : v); this.preds.push((r) => !p(r)); return this; }
  match(obj: Row) { for (const [k, v] of Object.entries(obj)) this.eq(k, v); return this; }
  order(col: string, opts?: { ascending?: boolean; nullsFirst?: boolean }) {
    this.orders.push({ col, asc: opts?.ascending !== false, nullsFirst: opts?.nullsFirst }); return this;
  }
  limit(k: number) { this.lim = k; return this; }
  range(a: number, b: number) { this.from = a; this.to = b; return this; }
  single() { this.one = 'single'; return this; }
  maybeSingle() { this.one = 'maybe'; return this; }
  abortSignal() { return this; }
  returns() { return this; }
  throwOnError() { return this; }

  private matching(): Row[] {
    const rows = T[this.table];
    if (!rows) throw new Error(`demo: no sample table "${this.table}"`);
    return rows.filter((r) => this.preds.every((p) => p(r)));
  }

  private run() {
    const rows = T[this.table];
    let affected: Row[];
    if (this.mode === 'insert' || this.mode === 'upsert') {
      const list = Array.isArray(this.payload) ? this.payload : [this.payload];
      affected = list.map((r: Row) => {
        const existing = this.mode === 'upsert' && r.id ? rows.find((x) => x.id === r.id) : null;
        if (existing) return Object.assign(existing, r, { updated_at: now() });
        const row = { id: uid(this.table), created_at: now(), updated_at: now(), removed_at: null, ...r };
        rows.push(row);
        return row;
      });
    } else if (this.mode === 'update') {
      affected = this.matching();
      affected.forEach((r) => Object.assign(r, this.payload, { updated_at: now() }));
    } else if (this.mode === 'delete') {
      affected = this.matching();
      T[this.table] = rows.filter((r) => !affected.includes(r));
    } else {
      affected = this.matching();
    }

    if (this.mode !== 'select' && this.cols == null) return ok(null);
    let out = affected.slice();
    if (this.orders.length) {
      out.sort((a, b) => {
        for (const o of this.orders) {
          const x = get(a, o.col), y = get(b, o.col);
          if (x == null && y == null) continue;
          const nullsFirst = o.nullsFirst ?? !o.asc;
          if (x == null) return nullsFirst ? -1 : 1;
          if (y == null) return nullsFirst ? 1 : -1;
          const c = compare(x, y);
          if (c) return o.asc ? c : -c;
        }
        return 0;
      });
    }
    const total = out.length;
    if (this.to != null) out = out.slice(this.from, this.to + 1);
    if (this.lim != null) out = out.slice(0, this.lim);
    const shaped = out.map((r) => project(this.table, r, this.cols ?? '*'));
    if (this.headOnly) return ok(null, total);
    if (this.one) {
      if (shaped.length === 1) return ok(shaped[0], this.countMode ? total : null);
      if (shaped.length === 0 && this.one === 'maybe') return ok(null);
      return err('JSON object requested, multiple (or no) rows returned', 'PGRST116');
    }
    return ok(shaped, this.countMode ? total : null);
  }

  then<A = any, B = never>(onOk?: ((v: any) => A | PromiseLike<A>) | null, onErr?: ((e: any) => B | PromiseLike<B>) | null) {
    let result;
    try { result = this.run(); } catch (e) { result = err(e instanceof Error ? e.message : String(e)); }
    return later(result).then(onOk, onErr);
  }
}

// ------------------------------------------------------------ database functions

const DEMO_NAME = 'Demo user';
const fitOf = (customerId: string) => T.fits.find((f) => f.customer_id === customerId && f.is_primary);
const revisionsOf = (fitId: string) => T.fit_revisions.filter((r) => r.fit_id === fitId);
const conflict = (fit: Row) => {
  const cur = T.fit_revisions.find((r) => r.id === fit.current_revision_id);
  const res = err('Someone else saved this sheet first.', 'PT409');
  (res.error as Row).details = JSON.stringify({ lock_version: fit.lock_version, revision_id: cur?.id ?? null,
    revision_number: cur?.revision_number ?? null, author_name: cur?.author_name ?? null, created_at: cur?.created_at ?? null });
  return res;
};

/** The app sends entered text + direction; parse it the same way the editor does. */
function fromPayload(payload: Row): Snapshot {
  const draft = snapshotToDraft(emptySnapshot()) as Draft;
  for (const f of FIELDS) {
    const v = payload[f.key];
    if (v == null) continue;
    draft[f.key] = typeof v === 'string' ? { text: v, dir: '' } : { text: v.entered ?? '', dir: v.dir ?? '' };
  }
  return draftToSnapshot(draft);
}

function addRevision(fit: Row, snapshot: Snapshot, note: string | null, restoredFrom: string | null = null) {
  const number = Math.max(0, ...revisionsOf(fit.id).map((r) => r.revision_number)) + 1;
  const rev = { id: uid('rev'), fit_id: fit.id, revision_number: number, schema_version: 1, snapshot,
    change_note: note, restored_from_revision_id: restoredFrom, author_id: 'demo-user', author_name: DEMO_NAME, created_at: now() };
  T.fit_revisions.push(rev);
  fit.current_revision_id = rev.id;
  fit.lock_version += 1;
  const c = T.customers.find((x) => x.id === fit.customer_id);
  if (c) Object.assign(c, { last_spec_at: rev.created_at, last_spec_by: DEMO_NAME, updated_at: rev.created_at });
  return rev;
}

function lastName(name: string) { const w = name.trim().split(/\s+/); return (w[w.length - 1] ?? '').toLowerCase(); }

const RPC: Record<string, (a: Row) => any> = {
  search_customers({ p_query = '', p_limit = 60, p_offset = 0, p_sort = 'last_name' }) {
    const q = String(p_query).trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    let rows = T.customers.filter((c) => !c.removed_at && (!q || c.name.toLowerCase().includes(q)
      || (digits.length >= 3 && (c.phone ?? '').replace(/\D/g, '').includes(digits))));
    const sorters: Record<string, (a: Row, b: Row) => number> = {
      last_name: (a, b) => lastName(a.name).localeCompare(lastName(b.name)) || a.name.localeCompare(b.name),
      name: (a, b) => a.name.localeCompare(b.name),
      phone: (a, b) => String(a.phone ?? '').localeCompare(String(b.phone ?? '')),
      created: (a, b) => b.created_at.localeCompare(a.created_at),
      updated: (a, b) => b.updated_at.localeCompare(a.updated_at),
    };
    rows = rows.sort(sorters[p_sort] ?? sorters.last_name);
    const total = rows.length;
    return rows.slice(p_offset, p_offset + p_limit).map((c) => {
      const fit = fitOf(c.id);
      const revs = fit ? revisionsOf(fit.id).length : 0;
      return { id: c.id, name: c.name, phone: c.phone, notes: c.notes, last_spec_at: c.last_spec_at, updated_at: c.updated_at,
        photo_count: T.spec_photos.filter((p) => p.customer_id === c.id && !p.removed_at).length,
        has_specs: !!fit?.current_revision_id, spec_sheet_count: revs,
        ball_count: T.bowling_balls.filter((b) => b.customer_id === c.id && !b.removed_at).length, total_count: total };
    });
  },
  find_possible_duplicates({ p_name = '', p_phone }) {
    const name = String(p_name).trim().toLowerCase();
    const phone = String(p_phone ?? '').replace(/\D/g, '');
    return T.customers.filter((c) => !c.removed_at && ((name && c.name.toLowerCase() === name)
      || (phone.length >= 7 && (c.phone ?? '').replace(/\D/g, '').endsWith(phone.slice(-7)))))
      .map((c) => ({ id: c.id, name: c.name, phone: c.phone, notes: c.notes,
        reason: c.name.toLowerCase() === name ? 'Same name' : 'Same phone' }));
  },
  remove_customer({ p_id, p_name }) { Object.assign(T.customers.find((c) => c.id === p_id) ?? {}, { removed_at: now(), removed_by: p_name ?? DEMO_NAME }); return null; },
  restore_customer({ p_id }) { Object.assign(T.customers.find((c) => c.id === p_id) ?? {}, { removed_at: null, removed_by: null }); return null; },
  list_removed_customers() {
    return T.customers.filter((c) => c.removed_at).map((c) => ({ id: c.id, name: c.name, phone: c.phone, removed_at: c.removed_at, removed_by: c.removed_by }));
  },
  save_fit_revision({ p_customer_id, p_expected_lock_version, p_snapshot, p_change_note }) {
    let fit = fitOf(p_customer_id);
    let created = false;
    if (!fit) {
      fit = { id: uid('fit'), customer_id: p_customer_id, shop_id: SHOP_ID, label: null, is_primary: true, current_revision_id: null,
        lock_version: 0, created_at: now(), confirmed_revision_id: null, confirmed_at: null, confirmed_by: null };
      T.fits.push(fit);
      created = true;
    } else if (fit.lock_version !== p_expected_lock_version) return conflict(fit);
    const rev = addRevision(fit, fromPayload(p_snapshot), p_change_note);
    return { created, fit_id: fit.id, revision_id: rev.id, revision_number: rev.revision_number, lock_version: fit.lock_version };
  },
  restore_fit_revision({ p_revision_id, p_expected_lock_version, p_change_note }) {
    const old = T.fit_revisions.find((r) => r.id === p_revision_id);
    const fit = old && T.fits.find((f) => f.id === old.fit_id);
    if (!old || !fit) return err('Not found', 'PT404');
    if (fit.lock_version !== p_expected_lock_version) return conflict(fit);
    const rev = addRevision(fit, clone(old.snapshot), p_change_note ?? `Restored version ${old.revision_number}`, old.id);
    return { created: false, fit_id: fit.id, revision_id: rev.id, revision_number: rev.revision_number, lock_version: fit.lock_version };
  },
  set_current_revision({ p_revision_id, p_expected_lock_version }) {
    const rev = T.fit_revisions.find((r) => r.id === p_revision_id);
    const fit = rev && T.fits.find((f) => f.id === rev.fit_id);
    if (!rev || !fit) return err('Not found', 'PT404');
    if (fit.lock_version !== p_expected_lock_version) return conflict(fit);
    fit.current_revision_id = rev.id;
    fit.lock_version += 1;
    return { created: false, fit_id: fit.id, revision_id: rev.id, revision_number: rev.revision_number, lock_version: fit.lock_version };
  },
  set_fit_confirmed({ p_fit_id, p_revision_id, p_confirmed }) {
    const fit = T.fits.find((f) => f.id === p_fit_id);
    if (!fit) return err('Not found', 'PT404');
    Object.assign(fit, p_confirmed
      ? { confirmed_revision_id: p_revision_id, confirmed_at: now(), confirmed_by: DEMO_NAME }
      : { confirmed_revision_id: null, confirmed_at: null, confirmed_by: null });
    return { confirmed_revision_id: fit.confirmed_revision_id, confirmed_at: fit.confirmed_at, confirmed_by: fit.confirmed_by };
  },
  save_bowling_balls({ p_customer_id, p_balls }) {
    const keep = new Set((p_balls as Row[]).map((b) => b.id).filter(Boolean));
    T.bowling_balls.forEach((b) => { if (b.customer_id === p_customer_id && !b.removed_at && !keep.has(b.id)) b.removed_at = now(); });
    (p_balls as Row[]).forEach((b, position) => {
      const fields = { name: b.name, weight_lbs: b.weight_lbs == null ? null : Number(b.weight_lbs), layout: b.layout, notes: b.notes, position, updated_at: now() };
      const hit = b.id && T.bowling_balls.find((x) => x.id === b.id);
      if (hit) Object.assign(hit, fields);
      else T.bowling_balls.push({ id: uid('ball'), customer_id: p_customer_id, created_at: now(), removed_at: null, ...fields });
    });
    return T.bowling_balls.filter((b) => b.customer_id === p_customer_id && !b.removed_at).sort((a, b) => a.position - b.position);
  },
  ball_finder_sheets({ p_entered_from, p_entered_to }) {
    return T.fit_revisions
      .filter((r) => (!p_entered_from || r.created_at >= p_entered_from) && (!p_entered_to || r.created_at < p_entered_to))
      .flatMap((r) => {
        const fit = T.fits.find((f) => f.id === r.fit_id);
        const c = fit && T.customers.find((x) => x.id === fit.customer_id && !x.removed_at);
        if (!fit || !c) return [];
        const specs = Object.fromEntries(Object.entries(r.snapshot).filter(([, v]) => v != null));
        return [{ revision_id: r.id, customer_id: c.id, name: c.name, phone: c.phone, revision_number: r.revision_number,
          is_current: fit.current_revision_id === r.id, specs, sheet_date: null, entered_at: r.created_at }];
      });
  },
  set_current_photo() { return null; },
  remove_photo() { return null; },
  restore_photo() { return null; },
  list_removed_intake() { return []; },
  intake_stats() { return []; },
};

class Rpc implements PromiseLike<any> {
  private from = 0;
  private to: number | null = null;
  constructor(private name: string, private args: Row) {}
  range(a: number, b: number) { this.from = a; this.to = b; return this; }
  abortSignal() { return this; }
  then<A = any, B = never>(onOk?: ((v: any) => A | PromiseLike<A>) | null, onErr?: ((e: any) => B | PromiseLike<B>) | null) {
    const fn = RPC[this.name];
    let res: any;
    if (!fn) res = err(`That isn't available in the demo.`);
    else {
      try {
        const out = fn(this.args ?? {});
        res = out && typeof out === 'object' && 'error' in out && out.error ? out
          : ok(Array.isArray(out) && this.to != null ? out.slice(this.from, this.to + 1) : out);
      } catch (e) {
        res = err(e instanceof Error ? e.message : String(e), 'PT422');
      }
    }
    return later(res).then(onOk, onErr);
  }
}

// ------------------------------------------------------------- auth & storage

const noSignIn = { data: { user: null, session: null }, error: { message: 'Signing in is turned off in the demo.', code: 'demo' } };
const off = () => Promise.resolve({ data: null, error: { message: 'Photo uploads are turned off in the demo.', code: 'demo' } });

export const supabase = {
  from: (table: string) => new Query(table),
  rpc: (name: string, args: Row = {}) => new Rpc(name, args),
  auth: {
    getSession: () => Promise.resolve({ data: { session: null }, error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: () => Promise.resolve({ error: null }),
    signInWithOtp: () => Promise.resolve(noSignIn),
    signInWithPassword: () => Promise.resolve(noSignIn),
    verifyOtp: () => Promise.resolve(noSignIn),
    updateUser: () => Promise.resolve(noSignIn),
  },
  storage: {
    from: () => ({
      upload: off,
      download: off,
      remove: () => Promise.resolve({ data: [], error: null }),
      createSignedUrls: (paths: string[]) => Promise.resolve({ data: paths.map((path) => ({ path, signedUrl: '', error: null })), error: null }),
      createSignedUrl: () => Promise.resolve({ data: { signedUrl: '' }, error: null }),
    }),
  },
  functions: { invoke: () => Promise.resolve({ data: null, error: { message: "That isn't available in the demo." } }) },
} as any;

// ---------------------------------------------------------------- demo banner

const bar = document.createElement('div');
bar.setAttribute('role', 'note');
bar.style.cssText = 'position:sticky;top:0;z-index:9999;background:#fff4d6;color:#5a4300;border-bottom:1px solid #e6c766;' +
  'font:600 13px/1.4 system-ui,sans-serif;padding:7px 14px;text-align:center';
bar.innerHTML = 'Demo with made-up sample data. Changes stay in this tab and reset on refresh. ' +
  '<a href="../" style="color:inherit">All demos</a>';
document.body.prepend(bar);
