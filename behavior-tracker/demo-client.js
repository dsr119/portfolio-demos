// Demo stand-in for the tracker's database client.
//
// The real pages call window.supabase.createClient(...).from(table) and chain
// select / insert / update / delete / eq / gte / lte / order / limit / single,
// including joins written as "alias:fk_column(col,col)". This file answers all
// of that from in-memory tables filled with invented classrooms, staff and
// students. There is no network code here. Refreshing starts over.
(function (global) {
  'use strict';
  var MODE = global.__TRACKER_MODE__ || 'goals'; // 'goals' (two treatment goals) or 'questions' (per-student questions)

  // ------------------------------------------------------------ sample data
  var seed = MODE === 'goals' ? 41 : 73;
  function rand() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
  function pick(a) { return a[Math.floor(rand() * a.length)]; }
  function pad(n) { return String(n).padStart(2, '0'); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  var T = { classrooms: [], staff: [], students: [], submissions: [], point_bank: [] };
  var ids = { classrooms: 0, staff: 0, students: 0, submissions: 0, point_bank: 0 };
  function add(table, row) { row.id = ++ids[table]; T[table].push(row); return row; }

  ['101', '104', '112'].forEach(function (r) { add('classrooms', { room_number: r }); });
  ['Ms. Sample', 'Mr. Example', 'Ms. Tester', 'Mr. Demo', 'Ms. Placeholder', 'Mr. Fakely'].forEach(function (n) {
    add('staff', { name: n, active: true });
  });
  var NAMES = ['Alex R.', 'Bailey T.', 'Casey M.', 'Devon P.', 'Emery L.', 'Finley S.', 'Gray W.', 'Harper K.',
               'Indy B.', 'Jules N.', 'Kai D.', 'Logan F.', 'Morgan H.', 'Nico V.'];
  var GOALS = [
    ['Use a calm-down strategy when frustrated', 'Follow adult directions the first time'],
    ['Stay in the assigned area during work time', 'Use kind words with peers'],
    ['Ask for a break instead of leaving the room', 'Complete independent work for 15 minutes'],
    ['Raise hand and wait to be called on', 'Accept feedback without arguing'],
  ];
  var QUESTIONS = [
    ['Times used a coping strategy', 'Minutes on task during reading', 'Breaks requested appropriately'],
    ['Assignments completed', 'Times followed directions first ask', 'Positive peer interactions'],
    ['Minutes of independent work', 'Times used safe hands'],
  ];
  NAMES.forEach(function (name, i) {
    var s = { classroom_id: (i % 3) + 1, name: name, active: i !== 13, use_pbis: true, use_points: i % 3 !== 2, use_step_day: i % 4 === 0 };
    if (MODE === 'goals') { var g = GOALS[i % GOALS.length]; s.tx_goal_1_name = g[0]; s.tx_goal_2_name = g[1]; }
    else { var q = QUESTIONS[i % QUESTIONS.length]; for (var k = 1; k <= 20; k++) s['question_' + k] = q[k - 1] || null; }
    add('students', s);
  });

  // About six weeks of school days, one entry per student per day.
  var today = new Date(); today.setHours(12, 0, 0, 0);
  var trend = T.students.map(function () { return 0.55 + rand() * 0.3; });
  for (var back = 42; back >= 0; back--) {
    var day = new Date(today); day.setDate(day.getDate() - back);
    if (day.getDay() === 0 || day.getDay() === 6) continue;
    T.students.forEach(function (s, idx) {
      if (!s.active && back < 10) return;
      var status = rand() < 0.08 ? 'absent' : rand() < 0.02 ? 'suspended' : 'yes';
      var base = Math.min(0.97, trend[idx] + (42 - back) * 0.004);
      function score() { return status === 'yes' ? Math.max(0, Math.min(10, Math.round((base + (rand() - 0.5) * 0.35) * 10))) : 0; }
      var row = {
        entry_date: iso(day), staff_id: ((idx + back) % 6) + 1, classroom_id: s.classroom_id, student_id: s.id,
        attendance_status: status,
        practice_points: score(), practice_possible: status === 'yes' ? 10 : 0,
        act_points: score(), act_possible: status === 'yes' ? 10 : 0,
        work_points: score(), work_possible: status === 'yes' ? 10 : 0,
        respect_points: score(), respect_possible: status === 'yes' ? 10 : 0,
        notes: status === 'yes' && rand() < 0.15 ? pick(['Great focus during morning group.', 'Needed one break before math.', 'Helped a peer clean up.', 'Struggled after lunch, recovered well.']) : null,
        created_at: new Date(day.getTime() + 5 * 3600e3).toISOString(),
      };
      if (MODE === 'goals') {
        [1, 2].forEach(function (g) {
          var sc = status === 'yes' ? Math.max(1, Math.min(10, Math.round(base * 10 + (rand() - 0.5) * 3))) : null;
          row['tx_goal_' + g + '_score'] = sc;
          row['tx_goal_' + g + '_progress'] = sc == null ? null : sc >= 7 ? 'yes' : sc >= 4 ? 'partial' : 'no';
          row['tx_goal_' + g + '_comment'] = sc != null && rand() < 0.2 ? pick(['Used the strategy with one reminder.', 'Independent today.', 'Needed staff support twice.']) : null;
        });
      } else {
        for (var k = 1; k <= 20; k++) {
          row['custom_q' + k] = s['question_' + k] && status === 'yes' ? String(Math.round(base * (k === 2 ? 30 : 6) + rand() * 3)) : null;
        }
      }
      add('submissions', row);
    });
    if (day.getDay() === 5) {
      T.students.forEach(function (s) {
        if (!s.use_points) return;
        add('point_bank', { date: iso(day), student_id: s.id, points: 20 + Math.round(rand() * 25), description: 'Weekly PAWS points' });
        if (rand() < 0.35) add('point_bank', { date: iso(day), student_id: s.id, points: -pick([15, 20, 30]), description: pick(['Spent: prize box', 'Spent: extra recess', 'Spent: lunch with staff']) });
      });
    }
  }

  // ------------------------------------------------------------ query engine
  var FK = { staff_id: 'staff', classroom_id: 'classrooms', student_id: 'students' };
  function splitCols(s) {
    var out = [], depth = 0, cur = '';
    for (var i = 0; i < s.length; i++) { var c = s[i];
      if (c === '(') depth++; if (c === ')') depth--;
      if (c === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += c; }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function project(row, cols) {
    if (!cols || cols === '*') return Object.assign({}, row);
    var out = {};
    splitCols(cols).forEach(function (c) {
      var m = c.match(/^(\w+):(\w+)\((.*)\)$/);
      if (m) { var target = (T[FK[m[2]]] || []).find(function (r) { return r.id === row[m[2]]; }); out[m[1]] = target ? project(target, m[3]) : null; }
      else if (c === '*') Object.assign(out, row);
      else out[c] = row[c] === undefined ? null : row[c];
    });
    return out;
  }
  function same(a, b) { return a === b || String(a) === String(b); }
  function clone(v) { return v == null ? v : JSON.parse(JSON.stringify(v)); }

  function Query(table) { this.t = table; this.action = 'select'; this.filters = []; this.orders = []; this.cols = '*'; this.lim = null; this.one = false; }
  Query.prototype.select = function (c) { this.cols = c || '*'; this.returning = true; return this; };
  Query.prototype.insert = function (v) { this.action = 'insert'; this.values = v; return this; };
  Query.prototype.update = function (v) { this.action = 'update'; this.values = v; return this; };
  Query.prototype.delete = function () { this.action = 'delete'; return this; };
  Query.prototype.eq = function (c, v) { this.filters.push(function (r) { return same(r[c], v); }); return this; };
  Query.prototype.gte = function (c, v) { this.filters.push(function (r) { return r[c] != null && String(r[c]) >= String(v); }); return this; };
  Query.prototype.lte = function (c, v) { this.filters.push(function (r) { return r[c] != null && String(r[c]) <= String(v); }); return this; };
  Query.prototype.order = function (c, o) { this.orders.push({ c: c, asc: !o || o.ascending !== false }); return this; };
  Query.prototype.limit = function (n) { this.lim = n; return this; };
  Query.prototype.single = function () { this.one = true; return this; };
  Query.prototype.run = function () {
    var self = this, rows = T[this.t];
    if (!rows) return { data: null, error: { message: 'Unknown table ' + this.t } };
    var hit;
    if (this.action === 'insert') {
      hit = (Array.isArray(this.values) ? this.values : [this.values]).map(function (v) {
        var row = Object.assign({}, v);
        if (self.t === 'submissions' && !row.created_at) row.created_at = new Date().toISOString();
        if ((self.t === 'students' || self.t === 'staff') && row.active == null) row.active = true;
        return add(self.t, row);
      });
    } else {
      hit = rows.filter(function (r) { return self.filters.every(function (f) { return f(r); }); });
      if (this.action === 'update') hit.forEach(function (r) { Object.assign(r, self.values); });
      if (this.action === 'delete') T[this.t] = rows.filter(function (r) { return hit.indexOf(r) < 0; });
    }
    var out = hit.slice();
    if (this.orders.length) out.sort(function (a, b) {
      for (var i = 0; i < self.orders.length; i++) { var o = self.orders[i], x = a[o.c], y = b[o.c];
        if (x == y) continue; if (x == null) return 1; if (y == null) return -1;
        var d = typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), undefined, { numeric: true });
        if (d) return o.asc ? d : -d; }
      return 0; });
    if (this.lim != null) out = out.slice(0, this.lim);
    var data = out.map(function (r) { return project(r, self.cols); });
    if (this.one) data = data[0] || null;
    return { data: clone(data), error: null };
  };
  Query.prototype.then = function (ok, bad) {
    var self = this;
    return new Promise(function (res) { setTimeout(function () { res(self.run()); }, 30); }).then(ok, bad);
  };

  global.supabase = { createClient: function () { return { from: function (t) { return new Query(t); } }; } };

  // ---------------------------------------------------------------- banner
  function banner() {
    if (!document.body || document.getElementById('demoBanner')) return;
    var bar = document.createElement('div');
    bar.id = 'demoBanner'; bar.setAttribute('role', 'note');
    bar.style.cssText = 'position:sticky;top:0;z-index:99999;background:#fff4d6;color:#5a4300;border-bottom:1px solid #e6c766;font:600 13px/1.4 system-ui,sans-serif;padding:7px 14px;text-align:center';
    bar.innerHTML = 'Demo with invented students and staff. Nothing is saved: changes reset on refresh. <a href="../" style="color:inherit">All demos</a>';
    document.body.insertBefore(bar, document.body.firstChild);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', banner); else banner();
})(window);
