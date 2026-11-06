// Connect Team demo: the app's screens rebuilt as a small single-page app.
// Same layout and classes as the real Next.js app; data is made up and lives
// in memory in this file. Nothing is sent anywhere. Refreshing starts over.

(() => {
  // ------------------------------------------------------------------ helpers
  const $ = (s, el = document) => el.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const HOUR = 3600e3, DAY = 24 * HOUR;
  const now = () => new Date();
  const fmtDate = (d) => new Date(d).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const fmtTime = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const fmtDateTime = (d) => `${fmtDate(d)}, ${fmtTime(d)}`;
  const hoursBetween = (a, b) => Math.max(0, (new Date(b) - new Date(a)) / HOUR);
  const fmtHours = (h) => `${Math.floor(h)}h ${String(Math.round((h % 1) * 60)).padStart(2, "0")}m`;
  const money = (n) => n.toLocaleString("en-US", { style: "currency", currency: "USD" });
  const startOfWeek = (d = now()) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
  const addDays = (d, n) => new Date(new Date(d).getTime() + n * DAY);
  const at = (dayOffset, h, m = 0) => { const d = addDays(startOfWeek(), dayOffset); d.setHours(h, m, 0, 0); return d; };
  const dateInput = (d) => { const x = new Date(d); return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`; };
  let seq = 0;
  const id = (p) => `${p}${++seq}`;

  // -------------------------------------------------------------- sample data
  const people = [
    { id: "u1", name: "Olivia Owner", title: "Clinical Director", role: "OWNER", rate: 60, phone: "555-0100" },
    { id: "u2", name: "Adam Admin", title: "Office Manager", role: "ADMIN", rate: 30, phone: "555-0101" },
    { id: "u3", name: "Sam Staff", title: "Behavior Technician", role: "STAFF", rate: 22, phone: "555-0102" },
    { id: "u4", name: "Taylor Therapist", title: "Speech Therapist", role: "STAFF", rate: 45, phone: "555-0103" },
    { id: "u5", name: "Jordan Jones", title: "Occupational Therapist", role: "STAFF", rate: 42, phone: "555-0104" },
    { id: "u6", name: "Riley Reyes", title: "Behavior Technician", role: "STAFF", rate: 22, phone: "555-0105" },
    { id: "u7", name: "Casey Chen", title: "Front Desk", role: "STAFF", rate: 19, phone: "555-0106" },
  ];
  const services = [
    { id: "s1", name: "Admin / Documentation", rate: null },
    { id: "s2", name: "Evaluation", rate: 55 },
    { id: "s3", name: "Group Session", rate: 35 },
    { id: "s4", name: "Individual Session", rate: null },
  ];
  const kids = [["Ava", "M"], ["Ben", "T"], ["Chloe", "R"], ["Eli", "S"], ["Maya", "K"], ["Noah", "P"]]
    .map(([firstName, lastInitial], i) => ({ id: `k${i + 1}`, name: `${firstName} ${lastInitial}.`, active: true }));
  const person = (uid) => people.find((p) => p.id === uid);
  const svc = (sid) => services.find((s) => s.id === sid);
  const kid = (kid_) => kids.find((k) => k.id === kid_);
  const rateFor = (e) => svc(e.serviceId)?.rate ?? person(e.userId).rate;

  const entries = [];
  const shift = (userId, day, h1, h2, serviceId, kidId, extra = {}) =>
    entries.push({ id: id("e"), userId, clockIn: at(day, h1), clockOut: at(day, h2), serviceId, kidId, note: null, source: "CLOCK", status: "APPROVED", ...extra });
  for (const w of [-14, -7, 0]) {
    for (let d = 0; d < 5; d++) {
      if (w === 0 && d > (now().getDay() + 6) % 7 - 1) break;
      shift("u3", w + d, 8, 12, "s4", kids[d % 6].id);
      shift("u3", w + d, 13, 15, "s3", kids[(d + 2) % 6].id);
      shift("u4", w + d, 9, 12, "s4", kids[(d + 1) % 6].id);
      if (d % 2 === 0) shift("u5", w + d, 10, 14, d === 0 ? "s2" : "s4", kids[(d + 3) % 6].id);
      shift("u6", w + d, 12, 17, "s4", kids[(d + 4) % 6].id);
      shift("u7", w + d, 8, 16, "s1", null);
    }
  }
  shift("u6", -2, 9, 12, "s4", "k2", { source: "MANUAL", status: "PENDING", note: "Forgot to clock in, phone died" });
  shift("u5", -3, 8, 19, "s2", "k5", { status: "PENDING", note: "Long eval day" });
  const changeRequests = [];
  const ce = entries.find((e) => e.userId === "u4" && e.status === "APPROVED");
  changeRequests.push({ id: id("c"), entryId: ce.id, requestedBy: "u4", proposedIn: new Date(ce.clockIn.getTime() - 30 * 60e3), proposedOut: ce.clockOut,
    proposedServiceId: ce.serviceId, proposedKidId: ce.kidId, reason: "Started 30 minutes early with parent check-in", status: "PENDING" });
  const timeOff = [
    { id: id("t"), userId: "u3", start: dateInput(addDays(now(), 12)), end: dateInput(addDays(now(), 14)), reason: "Family trip", status: "PENDING", reviewNote: null },
    { id: id("t"), userId: "u3", start: dateInput(addDays(now(), -20)), end: dateInput(addDays(now(), -20)), reason: "Dentist", status: "APPROVED", reviewNote: "Enjoy!" },
    { id: id("t"), userId: "u6", start: dateInput(addDays(now(), 30)), end: dateInput(addDays(now(), 31)), reason: null, status: "PENDING", reviewNote: null },
  ];
  const updates = [
    { id: id("a"), authorId: "u1", title: "New parking spots out back", body: "The lot behind the building is ours starting Monday. Front spots are for families.", at: addDays(now(), -1) },
    { id: id("a"), authorId: "u2", title: "Payroll runs Friday", body: "Please submit any missed punches by Thursday at 5 so they can be approved in time.", at: addDays(now(), -3) },
    { id: id("a"), authorId: "u4", title: "Sensory room restocked", body: "New fidgets and weighted lap pads are in the cabinet by the window.", at: addDays(now(), -6) },
  ];
  const convos = [
    { id: "g1", name: "Behavior team", isGroup: true, members: ["u1", "u3", "u6", "u4"] },
    { id: "d1", name: null, isGroup: false, members: ["u3", "u4"] },
    { id: "d2", name: null, isGroup: false, members: ["u3", "u2"] },
    { id: "d3", name: null, isGroup: false, members: ["u2", "u1"] },
  ];
  const messages = [
    ["g1", "u1", -1, 9, "Reminder: team huddle at 8:15 tomorrow."],
    ["g1", "u6", -1, 9.2, "Got it 👍"],
    ["g1", "u3", 0, 7.8, "Running 5 min late, traffic on 81"],
    ["d1", "u4", -2, 15, "Can you cover my 2pm group on Thursday?"],
    ["d1", "u3", -2, 15.3, "Yes, I can do that."],
    ["d1", "u4", -2, 15.4, "Thank you!!"],
    ["d2", "u2", -1, 11, "Your manual entry from Tuesday is approved."],
    ["d3", "u1", -1, 16, "Can you pull last week's hours for the board meeting?"],
  ].map(([c, s, d, h, body]) => ({ id: id("m"), convoId: c, senderId: s, at: new Date(addDays(now(), d).setHours(Math.floor(h), (h % 1) * 60)), body }));
  const lastRead = {}; // `${convo}:${user}` -> Date
  convos.forEach((c) => c.members.forEach((u) => (lastRead[`${c.id}:${u}`] = addDays(now(), -1))));
  lastRead["g1:u3"] = addDays(now(), -2);

  // --------------------------------------------------------------- the viewer
  const ROLES = { STAFF: "u3", ADMIN: "u2", OWNER: "u1" };
  let me = person("u3");
  const isAdmin = () => me.role !== "STAFF";

  const convoTitle = (c) => c.isGroup ? c.name : person(c.members.find((m) => m !== me.id) ?? me.id).name;
  const unreadIn = (c) => messages.filter((m) => m.convoId === c.id && m.senderId !== me.id && m.at > (lastRead[`${c.id}:${me.id}`] ?? 0)).length;
  const myConvos = () => convos.filter((c) => c.members.includes(me.id))
    .map((c) => ({ ...c, last: messages.filter((m) => m.convoId === c.id).sort((a, b) => b.at - a.at)[0], unread: unreadIn(c) }))
    .sort((a, b) => (b.last?.at ?? 0) - (a.last?.at ?? 0));
  const pendingCount = () => entries.filter((e) => e.status === "PENDING").length
    + changeRequests.filter((c) => c.status === "PENDING").length + timeOff.filter((t) => t.status === "PENDING").length;
  const openEntry = () => entries.find((e) => e.userId === me.id && !e.clockOut);

  // ------------------------------------------------------------------ pieces
  const ICONS = {
    home: "M3 10.5 12 3l9 7.5V21h-6v-6H9v6H3z", clock: "M12 6v6l4 2M12 22a10 10 0 1 1 0-20 10 10 0 0 1 0 20z",
    chat: "M4 5h16v11H8l-4 4z", megaphone: "M3 11v2a1 1 0 0 0 1 1h2l5 4V6L6 10H4a1 1 0 0 0-1 1zM15 8a5 5 0 0 1 0 8",
    people: "M16 11a4 4 0 1 0-8 0M4 21a8 8 0 0 1 16 0", check: "M5 13l4 4L19 7", table: "M3 5h18v14H3zM3 10h18M9 5v14",
    dollar: "M12 3v18M17 7H9.5a3 3 0 0 0 0 6h5a3 3 0 0 1 0 6H6", download: "M12 4v12m0 0-4-4m4 4 4-4M4 20h16",
    calendar: "M4 6h16v14H4zM4 10h16M8 3v4M16 3v4", user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0",
    menu: "M4 6h16M4 12h16M4 18h16", close: "M6 6l12 12M18 6 6 18", logout: "M15 12H3m0 0 4-4m-4 4 4 4M13 4h6v16h-6",
    child: "M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 22v-6l-3-4 7-2 7 2-3 4v6",
  };
  const icon = (n, cls = "h-5 w-5") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" class="${cls}" aria-hidden="true"><path d="${ICONS[n]}"/></svg>`;
  const COLORS = ["bg-teal-600", "bg-sky-600", "bg-violet-600", "bg-amber-600", "bg-rose-600", "bg-emerald-600"];
  const initials = (n) => n.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0].toUpperCase()).join("");
  const avatar = (name, size = "md") => `<span class="inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length]} ${size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm"}" aria-hidden="true">${esc(initials(name))}</span>`;
  const STATUS = { PENDING: "bg-amber-100 text-amber-800", APPROVED: "bg-emerald-100 text-emerald-800", DENIED: "bg-rose-100 text-rose-800" };
  const badge = (s) => `<span class="badge ${STATUS[s]}">${s[0] + s.slice(1).toLowerCase()}</span>`;
  const svcKid = (e) => [svc(e.serviceId)?.name, kid(e.kidId)?.name].filter(Boolean).join(" · ");
  const selects = (required = false, sid = "", kidId = "") => `
    <div class="grid gap-3 sm:grid-cols-2">
      <div><label class="label" for="serviceId">Service</label>
        <select class="input" id="serviceId" name="serviceId" ${required ? "required" : ""}>
          <option value="">${required ? "Choose a service" : "No service selected"}</option>
          ${services.map((s) => `<option value="${s.id}" ${s.id === sid ? "selected" : ""}>${esc(s.name)}</option>`).join("")}
        </select></div>
      <div><label class="label" for="clientId">Kid</label>
        <select class="input" id="clientId" name="clientId" ${required ? "required" : ""}>
          <option value="">${required ? "Choose a kid" : "No kid selected"}</option>
          ${kids.map((k) => `<option value="${k.id}" ${k.id === kidId ? "selected" : ""}>${esc(k.name)}</option>`).join("")}
        </select></div>
    </div>`;

  function toast(text) {
    const t = document.createElement("div");
    t.className = "fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-slate-900 px-4 py-2 text-sm text-white shadow-lg md:bottom-6";
    t.textContent = text;
    document.body.append(t);
    setTimeout(() => t.remove(), 2200);
  }

  // ------------------------------------------------------------------ shell
  function nav(path) {
    const unread = myConvos().reduce((s, c) => s + c.unread, 0);
    const pending = isAdmin() ? pendingCount() : 0;
    const main = [["/", "Home", "home"], ["/time", "Time", "clock"], ["/chat", "Chat", "chat", unread], ["/updates", "Updates", "megaphone"], ["/directory", "Directory", "people"]];
    const more = [["/time-off", "Request time off", "calendar"]];
    const admin = isAdmin() ? [["/admin/approvals", "Approvals", "check", pending], ["/admin/hours", "All hours", "table"], ["/admin/export", "Payroll export", "download"], ["/admin/kids", "Kids", "child"],
      ...(me.role === "OWNER" ? [["/admin/rates", "Rates & services", "dollar"], ["/admin/people", "People", "user"]] : [])] : [];
    const active = (h) => (h === "/" ? path === "/" : path.startsWith(h));
    const b = (n) => (n ? `<span class="ml-auto rounded-full bg-rose-600 px-1.5 text-xs font-semibold text-white">${n > 99 ? "99+" : n}</span>` : "");
    const link = ([h, l, i, n]) => `<a href="#${h}" class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${active(h) ? "bg-brand-50 text-brand-700" : "text-slate-600 hover:bg-slate-100"}">${icon(i)}${l}${b(n)}</a>`;
    const section = (label, items) => items.length ? `<div class="mt-4 px-3 text-xs font-semibold tracking-wide text-slate-400 uppercase">${label}</div>${items.map(link).join("")}` : "";
    const signOut = `<button data-act="signout" class="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100">${icon("logout")}Sign out</button>`;
    return `
      <aside class="fixed inset-y-0 left-0 top-[var(--bar)] hidden w-60 flex-col border-r border-slate-200 bg-white p-4 md:flex">
        <div class="mb-6 flex items-center gap-2 px-2"><img src="icon.svg" alt="" class="h-8 w-8"><span class="text-lg font-semibold text-brand-700">Connect Team</span></div>
        <nav class="flex flex-1 flex-col gap-1 overflow-y-auto">${main.map(link).join("")}${section("More", more)}${section("Admin", admin)}</nav>
        <div class="border-t border-slate-200 pt-3"><div class="truncate px-3 pb-2 text-sm text-slate-500">${esc(me.name)}</div>${signOut}</div>
      </aside>
      <header class="sticky top-[var(--bar)] z-20 flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 md:hidden">
        <span class="flex items-center gap-2 font-semibold text-brand-700"><img src="icon.svg" alt="" class="h-7 w-7">Connect Team</span>
        <button data-act="menu" aria-label="Open menu" class="relative rounded-lg p-1 text-slate-600">${icon("menu", "h-6 w-6")}${pending ? '<span class="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-rose-600"></span>' : ""}</button>
      </header>
      <div id="drawer" hidden class="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
        <div class="absolute inset-0 bg-slate-900/40" data-act="close"></div>
        <div class="absolute inset-y-0 right-0 flex w-72 flex-col bg-white p-4 shadow-xl">
          <div class="mb-4 flex items-center justify-between"><span class="truncate font-medium">${esc(me.name)}</span><button data-act="close" aria-label="Close menu" class="p-1 text-slate-500">${icon("close")}</button></div>
          <nav class="flex flex-1 flex-col gap-1 overflow-y-auto">${more.map(link).join("")}${section("Admin", admin)}</nav>
          <div class="border-t border-slate-200 pt-3">${signOut}</div>
        </div>
      </div>
      <nav class="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t border-slate-200 bg-white md:hidden">
        ${main.map(([h, l, i, n]) => `<a href="#${h}" class="relative flex flex-col items-center gap-0.5 py-2 text-[11px] font-medium ${active(h) ? "text-brand-700" : "text-slate-500"}">${icon(i, "h-6 w-6")}${l}${n ? '<span class="absolute top-1 right-[calc(50%-18px)] h-2.5 w-2.5 rounded-full bg-rose-600"></span>' : ""}</a>`).join("")}
      </nav>`;
  }

  // ------------------------------------------------------------------ pages
  function clockCard() {
    const open = openEntry();
    if (open) return `
      <section class="card border-brand-100 bg-brand-50">
        <div class="flex items-baseline justify-between"><h2 class="font-semibold text-brand-700">Clocked in</h2><span class="text-sm text-slate-500">since ${fmtTime(open.clockIn)}</span></div>
        <div class="my-3 text-4xl font-semibold text-slate-900" data-ticker="${open.clockIn.getTime()}">0:00:00</div>
        <p class="mb-3 text-sm text-slate-600">${esc([svc(open.serviceId)?.name, kid(open.kidId)?.name].filter(Boolean).join(" with ") || "No service or kid picked yet")}</p>
        <form data-form="clockout" class="space-y-3">${selects(false, open.serviceId, open.kidId)}
          <div><label class="label" for="note">Shift note (optional)</label><textarea class="input" id="note" name="note" rows="2" maxlength="1000">${esc(open.note)}</textarea></div>
          <button class="btn-danger w-full py-3 text-base">Clock out</button></form>
      </section>`;
    return `<section class="card"><h2 class="mb-3 font-semibold text-slate-900">Time clock</h2>
      <form data-form="clockin" class="space-y-3">${selects()}<button class="btn-primary w-full py-3 text-base">Clock in</button></form></section>`;
  }

  const pages = {
    "/": () => {
      const week = entries.filter((e) => e.userId === me.id && e.clockIn >= startOfWeek() && e.status !== "DENIED")
        .reduce((s, e) => s + hoursBetween(e.clockIn, e.clockOut ?? now()), 0);
      const pending = isAdmin() ? pendingCount() : 0;
      return `<div class="space-y-4">
        <h1 class="page-title">Hi, ${esc(me.name.split(" ")[0])}</h1>
        ${pending ? `<a href="#/admin/approvals" class="card flex items-center justify-between border-amber-200 bg-amber-50"><span class="font-medium text-amber-900">${pending} item${pending === 1 ? "" : "s"} waiting for approval</span><span class="text-sm text-amber-800">Review</span></a>` : ""}
        <div class="grid gap-4 md:grid-cols-2">${clockCard()}
          <div class="space-y-4">
            <section class="card"><div class="text-sm text-slate-500">This week</div><div class="text-2xl font-semibold">${fmtHours(week)}</div><a href="#/time" class="text-sm text-brand-700 hover:underline">See my time</a></section>
            <section class="card"><div class="mb-2 flex items-center justify-between"><h2 class="font-semibold">Latest updates</h2><a href="#/updates" class="text-sm text-brand-700 hover:underline">All</a></div>
              <ul class="space-y-3">${updates.slice(0, 3).map((u) => `<li><div class="font-medium">${esc(u.title)}</div><div class="text-xs text-slate-500">${esc(person(u.authorId).name)} · ${fmtDate(u.at)}</div></li>`).join("")}</ul></section>
          </div></div></div>`;
    },

    "/time": () => {
      const mine = entries.filter((e) => e.userId === me.id && e.clockIn >= addDays(startOfWeek(), -14)).sort((a, b) => b.clockIn - a.clockIn);
      return `<div class="space-y-4"><h1 class="page-title">My time</h1>
        <div class="grid gap-4 md:grid-cols-2">${clockCard()}
          <section class="card"><h2 class="mb-1 font-semibold">Add time manually</h2><p class="mb-3 text-sm text-slate-500">Forgot to clock in? Enter the shift here and an admin will approve it.</p>
            <form data-form="manual" class="space-y-3">
              <div class="grid gap-3 sm:grid-cols-2"><div><label class="label" for="m-in">Start</label><input class="input" id="m-in" name="clockIn" type="datetime-local" required></div>
                <div><label class="label" for="m-out">End</label><input class="input" id="m-out" name="clockOut" type="datetime-local" required></div></div>
              ${selects(true)}
              <div><label class="label" for="m-note">Shift note (optional)</label><textarea class="input" id="m-note" name="note" rows="2" maxlength="1000"></textarea></div>
              <button class="btn-primary w-full">Submit for approval</button></form></section></div>
        <section class="card"><h2 class="mb-3 font-semibold">Recent shifts</h2>
          ${mine.length ? "" : '<p class="text-sm text-slate-500">No shifts in the last few weeks.</p>'}
          <ul class="divide-y divide-slate-100">${mine.map((e) => {
            const pendingChange = changeRequests.some((c) => c.entryId === e.id && c.status === "PENDING");
            return `<li class="flex flex-wrap items-start justify-between gap-2 py-3"><div>
              <div class="font-medium">${fmtDate(e.clockIn)} · ${fmtTime(e.clockIn)} to ${e.clockOut ? fmtTime(e.clockOut) : "now"}</div>
              <div class="text-sm text-slate-500">${esc(svcKid(e) || "No service")}${e.source === "MANUAL" ? " · entered manually" : ""}</div>
              ${e.note ? `<div class="mt-1 text-sm text-slate-600">${esc(e.note)}</div>` : ""}</div>
              <div class="flex flex-col items-end gap-1 text-sm"><span class="font-medium">${fmtHours(hoursBetween(e.clockIn, e.clockOut ?? now()))}</span>${badge(e.status)}
              ${pendingChange ? '<span class="text-xs text-amber-700">Change pending</span>' : e.clockOut ? `<button data-act="change" data-id="${e.id}" class="text-xs text-brand-700 hover:underline">Request a change</button>` : ""}</div></li>`;
          }).join("")}</ul></section></div>`;
    },

    "/chat": () => {
      const list = myConvos();
      const today = fmtDate(now());
      return `<div class="space-y-4"><div class="flex items-center justify-between"><h1 class="page-title mb-0">Chat</h1>
        <div class="flex gap-2"><a href="#/directory" class="btn-secondary">New message</a></div></div>
        <ul class="card divide-y divide-slate-100 p-0">${list.map((c) => `<li><a href="#/chat/${c.id}" class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50">${avatar(convoTitle(c))}
          <div class="min-w-0 flex-1"><div class="flex items-baseline justify-between gap-2"><span class="truncate ${c.unread ? "font-semibold" : "font-medium"}">${esc(convoTitle(c))}</span>
            ${c.last ? `<span class="shrink-0 text-xs text-slate-400">${fmtDate(c.last.at) === today ? fmtTime(c.last.at) : fmtDate(c.last.at)}</span>` : ""}</div>
            <div class="flex items-center gap-2"><span class="truncate text-sm text-slate-500">${esc(c.last ? `${c.isGroup ? person(c.last.senderId).name.split(" ")[0] + ": " : ""}${c.last.body}` : c.isGroup ? `${c.members.length} members` : "Say hello")}</span>
            ${c.unread ? `<span class="ml-auto rounded-full bg-brand-600 px-2 text-xs font-semibold text-white">${c.unread}</span>` : ""}</div></div></a></li>`).join("")}</ul></div>`;
    },

    "/chat/:id": (cid) => {
      const c = convos.find((x) => x.id === cid && x.members.includes(me.id));
      if (!c) return notFound();
      lastRead[`${c.id}:${me.id}`] = now();
      const title = convoTitle(c);
      let lastDay = "";
      const msgs = messages.filter((m) => m.convoId === c.id).sort((a, b) => a.at - b.at);
      return `<div class="flex flex-col gap-3"><div class="flex items-center gap-3"><a href="#/chat" class="text-sm text-brand-700 hover:underline">Chat</a>${avatar(title, "sm")}
        <div class="min-w-0 flex-1"><h1 class="truncate font-semibold">${esc(title)}</h1>${c.isGroup ? `<div class="truncate text-xs text-slate-500">${esc(c.members.map((m) => person(m).name).join(", "))}</div>` : ""}</div></div>
        <div class="flex flex-col gap-2 pb-2">${msgs.length ? "" : '<p class="py-8 text-center text-sm text-slate-500">No messages yet.</p>'}${msgs.map((m) => {
          const mine = m.senderId === me.id, day = fmtDate(m.at), show = day !== lastDay; lastDay = day;
          return `<div>${show ? `<div class="my-2 text-center text-xs text-slate-400">${day}</div>` : ""}<div class="flex ${mine ? "justify-end" : "justify-start"}">
            <div class="max-w-[80%] rounded-2xl px-3 py-2 text-sm ${mine ? "bg-brand-600 text-white" : "border border-slate-200 bg-white"}">
            ${!mine && c.isGroup ? `<div class="mb-0.5 text-xs font-semibold text-brand-700">${esc(person(m.senderId).name)}</div>` : ""}
            <div class="break-words whitespace-pre-wrap">${esc(m.body)}</div><div class="mt-0.5 text-right text-[10px] ${mine ? "text-brand-100" : "text-slate-400"}">${fmtTime(m.at)}</div></div></div></div>`;
        }).join("")}</div>
        <div class="sticky bottom-16 border-t border-slate-200 bg-slate-50 py-2 md:bottom-0"><form data-form="send" data-id="${c.id}" class="flex items-end gap-2">
          <textarea name="body" rows="1" maxlength="4000" required placeholder="Message" aria-label="Message" class="input max-h-40 min-h-10 flex-1 resize-y"></textarea>
          <button class="btn-primary">Send</button></form></div></div>`;
    },

    "/updates": () => `<div class="max-w-2xl space-y-4"><h1 class="page-title">Updates</h1>
      <details class="card"><summary class="cursor-pointer font-medium text-brand-700">Post an update</summary>
        <form data-form="post" class="mt-3 space-y-3"><input class="input" name="title" maxlength="120" required placeholder="Title" aria-label="Title">
          <textarea class="input" name="body" rows="4" maxlength="5000" required placeholder="What does the team need to know?" aria-label="Update"></textarea>
          <p class="text-xs text-slate-500">Everyone at the clinic sees updates. Don't include client details.</p><button class="btn-primary">Post</button></form></details>
      ${updates.map((p) => `<article class="card"><header class="mb-2 flex items-center gap-3">${avatar(person(p.authorId).name, "sm")}
        <div class="flex-1"><div class="text-sm font-medium">${esc(person(p.authorId).name)}</div><div class="text-xs text-slate-500">${fmtDateTime(p.at)}</div></div>
        ${p.authorId === me.id || isAdmin() ? `<button data-act="delpost" data-id="${p.id}" class="text-xs text-slate-400 hover:text-rose-600">Delete</button>` : ""}</header>
        <h2 class="font-semibold">${esc(p.title)}</h2><p class="mt-1 text-sm whitespace-pre-wrap text-slate-700">${esc(p.body)}</p></article>`).join("")}</div>`,

    "/directory": (_, q = "") => {
      const term = q.trim().toLowerCase();
      const list = people.filter((p) => !term || p.name.toLowerCase().includes(term) || p.title.toLowerCase().includes(term)).sort((a, b) => a.name.localeCompare(b.name));
      return `<div class="max-w-2xl space-y-4"><h1 class="page-title text-center md:text-left">Directory</h1>
        <div class="relative"><input class="input rounded-full pr-10" id="dir-q" value="${esc(q)}" placeholder="Search directory" aria-label="Search directory"></div>
        <section><div class="px-1 pb-2 text-sm text-slate-500">Users</div><ul class="card divide-y divide-slate-100 p-0">
          ${list.length ? "" : `<li class="px-4 py-3 text-sm text-slate-500">No one matches “${esc(q)}”.</li>`}
          ${list.map((p) => `<li class="flex items-center gap-3 px-4 py-3">${avatar(p.name)}<div class="min-w-0 flex-1"><div class="truncate font-medium">${esc(p.name)}${p.id === me.id ? '<span class="text-slate-400"> (you)</span>' : ""}</div><div class="truncate text-sm text-slate-500">${esc(p.title)}</div></div>
            <button data-act="call" data-name="${esc(p.name)}" aria-label="Call ${esc(p.name)}" class="flex h-9 w-9 items-center justify-center rounded-full border border-brand-500 text-brand-600 hover:bg-brand-50"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg></button>
            ${p.id !== me.id ? `<button data-act="dm" data-id="${p.id}" aria-label="Message ${esc(p.name)}" class="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-white hover:bg-brand-700"><svg viewBox="0 0 24 24" class="h-4 w-4" fill="currentColor" aria-hidden="true"><path d="M4 5h16v11H8l-4 4z"/></svg></button>` : '<span class="h-9 w-9"></span>'}</li>`).join("")}
        </ul></section></div>`;
    },

    "/time-off": () => {
      const mine = timeOff.filter((t) => t.userId === me.id).sort((a, b) => b.start.localeCompare(a.start));
      const d = (s) => fmtDate(s + "T12:00");
      return `<div class="max-w-xl space-y-4"><h1 class="page-title">Time off</h1>
        <form data-form="timeoff" class="card space-y-3"><h2 class="font-semibold">Request time off</h2>
          <div class="grid gap-3 sm:grid-cols-2"><div><label class="label" for="startDate">First day off</label><input class="input" type="date" id="startDate" name="start" min="${dateInput(now())}" required></div>
            <div><label class="label" for="endDate">Last day off</label><input class="input" type="date" id="endDate" name="end" min="${dateInput(now())}" required></div></div>
          <div><label class="label" for="reason">Note for your admin (optional)</label><textarea class="input" id="reason" name="reason" rows="2" maxlength="500"></textarea></div>
          <button class="btn-primary w-full">Send request</button></form>
        <section class="card"><h2 class="mb-2 font-semibold">My requests</h2>${mine.length ? "" : '<p class="text-sm text-slate-500">No requests yet.</p>'}
          <ul class="divide-y divide-slate-100">${mine.map((r) => `<li class="flex items-start justify-between gap-2 py-2"><div><div class="font-medium">${d(r.start)}${r.end !== r.start ? ` to ${d(r.end)}` : ""}</div>
            ${r.reason ? `<div class="text-sm text-slate-500">${esc(r.reason)}</div>` : ""}${r.reviewNote ? `<div class="text-sm text-slate-600">Admin: ${esc(r.reviewNote)}</div>` : ""}</div>
            <div class="flex flex-col items-end gap-1">${badge(r.status)}${r.status === "PENDING" ? `<button data-act="canceloff" data-id="${r.id}" class="text-xs text-slate-500 hover:text-rose-600">Cancel</button>` : ""}</div></li>`).join("")}</ul></section></div>`;
    },

    "/admin/approvals": () => {
      if (!isAdmin()) return notFound();
      const review = (kind, rid) => `<form data-form="review" data-kind="${kind}" data-id="${rid}" class="flex flex-wrap items-center gap-2">
        <input class="input max-w-56 py-1.5" name="reviewNote" placeholder="Note (optional)" maxlength="500" aria-label="Review note">
        <button name="decision" value="APPROVED" class="btn-primary py-1.5">Approve</button><button name="decision" value="DENIED" class="btn-secondary py-1.5">Deny</button></form>`;
      const pe = entries.filter((e) => e.status === "PENDING"), pc = changeRequests.filter((c) => c.status === "PENDING"), pt = timeOff.filter((t) => t.status === "PENDING");
      const empty = '<p class="text-sm text-slate-500">Nothing waiting.</p>';
      return `<div class="space-y-6"><h1 class="page-title">Approvals</h1>
        <section class="space-y-3"><h2 class="font-semibold">Hours entered manually (${pe.length})</h2>${pe.length ? "" : empty}
          ${pe.map((e) => `<div class="card space-y-2"><div class="flex items-center gap-3">${avatar(person(e.userId).name, "sm")}<div class="flex-1"><div class="font-medium">${esc(person(e.userId).name)}</div>
            <div class="text-sm text-slate-500">${fmtDate(e.clockIn)}, ${fmtTime(e.clockIn)} to ${fmtTime(e.clockOut)} · ${fmtHours(hoursBetween(e.clockIn, e.clockOut))}</div></div>
            <span class="badge bg-slate-100 text-slate-600">${e.source === "MANUAL" ? "Manual" : "Long shift"}</span></div>
            <div class="text-sm">${esc(svcKid(e))}${e.note ? `<span class="text-slate-500"> · “${esc(e.note)}”</span>` : ""}</div>${review("entry", e.id)}</div>`).join("")}</section>
        <section class="space-y-3"><h2 class="font-semibold">Requested time changes (${pc.length})</h2>${pc.length ? "" : empty}
          ${pc.map((c) => { const e = entries.find((x) => x.id === c.entryId); return `<div class="card space-y-2"><div class="flex items-center gap-3">${avatar(person(c.requestedBy).name, "sm")}<div class="font-medium">${esc(person(c.requestedBy).name)}</div></div>
            <div class="grid gap-2 text-sm sm:grid-cols-2"><div class="rounded-lg bg-slate-50 p-2"><div class="text-xs font-semibold text-slate-400 uppercase">Now</div>${fmtDateTime(e.clockIn)} to ${fmtTime(e.clockOut)}<div class="text-slate-500">${esc(svcKid(e))}</div></div>
            <div class="rounded-lg bg-brand-50 p-2"><div class="text-xs font-semibold text-brand-700 uppercase">Requested</div>${fmtDateTime(c.proposedIn)} to ${fmtTime(c.proposedOut)}<div class="text-slate-500">${esc(svcKid({ serviceId: c.proposedServiceId, kidId: c.proposedKidId }))}</div></div></div>
            <div class="text-sm text-slate-600">Reason: ${esc(c.reason)}</div>${review("change", c.id)}</div>`; }).join("")}</section>
        <section class="space-y-3"><h2 class="font-semibold">Time off requests (${pt.length})</h2>${pt.length ? "" : empty}
          ${pt.map((t) => `<div class="card space-y-2"><div class="flex items-center gap-3">${avatar(person(t.userId).name, "sm")}<div><div class="font-medium">${esc(person(t.userId).name)}</div>
            <div class="text-sm text-slate-500">${fmtDate(t.start + "T12:00")} to ${fmtDate(t.end + "T12:00")}</div></div></div>${t.reason ? `<div class="text-sm text-slate-600">${esc(t.reason)}</div>` : ""}${review("timeoff", t.id)}</div>`).join("")}</section></div>`;
    },

    "/admin/hours": (_, q, params) => {
      if (!isAdmin()) return notFound();
      const from = params.get("from") || dateInput(startOfWeek()), to = params.get("to") || dateInput(addDays(startOfWeek(), 6));
      const who = params.get("user") || "", status = params.get("status") || "";
      const rows = entries.filter((e) => dateInput(e.clockIn) >= from && dateInput(e.clockIn) <= to && (!who || e.userId === who) && (!status || e.status === status))
        .sort((a, b) => b.clockIn - a.clockIn);
      const approved = rows.filter((r) => r.status === "APPROVED" && r.clockOut);
      const hours = approved.reduce((s, r) => s + hoursBetween(r.clockIn, r.clockOut), 0);
      const pay = approved.reduce((s, r) => s + hoursBetween(r.clockIn, r.clockOut) * rateFor(r), 0);
      return `<div class="space-y-4"><h1 class="page-title">All hours</h1>
        <form data-form="hoursfilter" class="card grid gap-3 sm:grid-cols-5 sm:items-end">
          <div><label class="label" for="from">From</label><input class="input" type="date" id="from" name="from" value="${from}"></div>
          <div><label class="label" for="to">To</label><input class="input" type="date" id="to" name="to" value="${to}"></div>
          <div><label class="label" for="user">Staff</label><select class="input" id="user" name="user"><option value="">Everyone</option>${people.map((p) => `<option value="${p.id}" ${p.id === who ? "selected" : ""}>${esc(p.name)}</option>`).join("")}</select></div>
          <div><label class="label" for="status">Status</label><select class="input" id="status" name="status"><option value="">Any</option>${["PENDING", "APPROVED", "DENIED"].map((s) => `<option value="${s}" ${s === status ? "selected" : ""}>${s[0] + s.slice(1).toLowerCase()}</option>`).join("")}</select></div>
          <button class="btn-secondary">Filter</button></form>
        <div class="grid grid-cols-2 gap-4"><div class="card"><div class="text-sm text-slate-500">Approved hours</div><div class="text-2xl font-semibold">${hours.toFixed(2)}</div></div>
          <div class="card"><div class="text-sm text-slate-500">Approved pay</div><div class="text-2xl font-semibold">${money(pay)}</div></div></div>
        <div class="card overflow-x-auto p-0"><table class="data-table"><thead><tr><th>Staff</th><th>Date</th><th>Time</th><th>Service · Kid</th><th class="text-right">Hours</th><th class="text-right">Rate</th><th class="text-right">Pay</th><th>Status</th></tr></thead><tbody>
          ${rows.length ? "" : '<tr><td colspan="8" class="text-center text-slate-500">No shifts in this range.</td></tr>'}
          ${rows.map((r) => { const h = r.clockOut ? hoursBetween(r.clockIn, r.clockOut) : 0; return `<tr><td class="font-medium whitespace-nowrap">${esc(person(r.userId).name)}</td><td class="whitespace-nowrap">${fmtDate(r.clockIn)}</td>
            <td class="whitespace-nowrap">${fmtTime(r.clockIn)} to ${r.clockOut ? fmtTime(r.clockOut) : "now"}</td><td>${esc(svcKid(r) || "—")}${r.source === "MANUAL" ? '<span class="text-slate-400"> (manual)</span>' : ""}</td>
            <td class="text-right tabular-nums">${r.clockOut ? h.toFixed(2) : "—"}</td><td class="text-right tabular-nums">${money(rateFor(r))}</td><td class="text-right tabular-nums">${money(h * rateFor(r))}</td><td>${badge(r.status)}</td></tr>`; }).join("")}
        </tbody></table></div></div>`;
    },

    "/admin/export": () => {
      if (!isAdmin()) return notFound();
      const lw = addDays(startOfWeek(), -7), pending = entries.filter((e) => e.status === "PENDING").length;
      return `<div class="max-w-xl space-y-4"><h1 class="page-title">Payroll export</h1>
        <p class="text-sm text-slate-600">Download approved hours as a spreadsheet to enter into QuickBooks. Only approved shifts are included.</p>
        ${pending ? `<p class="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">${pending} shift${pending === 1 ? " is" : "s are"} still waiting for approval and won't be in the export.</p>` : ""}
        <form data-form="export" class="card space-y-3"><div class="grid gap-3 sm:grid-cols-2">
          <div><label class="label" for="from">From</label><input class="input" type="date" id="from" name="from" value="${dateInput(lw)}" required></div>
          <div><label class="label" for="to">To</label><input class="input" type="date" id="to" name="to" value="${dateInput(addDays(lw, 6))}" required></div></div>
          <fieldset class="space-y-2"><legend class="label">Layout</legend>
            <label class="flex items-center gap-2 text-sm"><input type="radio" name="kind" value="summary" checked> Summary: total hours per person and service</label>
            <label class="flex items-center gap-2 text-sm"><input type="radio" name="kind" value="detail"> Detail: one row per shift</label>
            <label class="ml-6 flex items-center gap-2 text-sm text-slate-600"><input type="checkbox" name="kids" value="1"> Include kid names in the detail file</label></fieldset>
          <button class="btn-primary w-full">Download CSV</button>
          <p class="text-xs text-slate-500">Payroll files leave the app, so kid names are off by default. Store downloads only on approved, encrypted devices.</p></form></div>`;
    },

    "/admin/kids": () => !isAdmin() ? notFound() : `<div class="max-w-xl space-y-4"><h1 class="page-title">Kids</h1>
      <p class="text-sm text-slate-600">Kids are stored as first name and last initial only, so the time clock never shows a full name.</p>
      <ul class="card divide-y divide-slate-100 p-0">${kids.map((k) => `<li class="flex items-center gap-3 px-4 py-3">${avatar(k.name, "sm")}<span class="flex-1 font-medium">${esc(k.name)}</span><span class="badge bg-emerald-100 text-emerald-800">Active</span></li>`).join("")}</ul></div>`,

    "/admin/rates": () => me.role !== "OWNER" ? notFound() : `<div class="space-y-4"><h1 class="page-title">Rates &amp; services</h1>
      <div class="grid gap-4 md:grid-cols-2">
        <section class="card overflow-x-auto p-0"><table class="data-table"><thead><tr><th>Service</th><th class="text-right">Rate</th></tr></thead><tbody>
          ${services.map((s) => `<tr><td class="font-medium">${esc(s.name)}</td><td class="text-right tabular-nums">${s.rate == null ? '<span class="text-slate-400">Staff base rate</span>' : money(s.rate)}</td></tr>`).join("")}</tbody></table></section>
        <section class="card overflow-x-auto p-0"><table class="data-table"><thead><tr><th>Staff</th><th class="text-right">Base rate</th></tr></thead><tbody>
          ${people.map((p) => `<tr><td class="font-medium">${esc(p.name)}</td><td class="text-right tabular-nums">${money(p.rate)}</td></tr>`).join("")}</tbody></table></section></div>
      <p class="text-sm text-slate-500">A service with its own rate pays that rate to anyone; otherwise the person's base rate applies.</p></div>`,

    "/admin/people": () => me.role !== "OWNER" ? notFound() : `<div class="space-y-4"><h1 class="page-title">People</h1>
      <div class="card overflow-x-auto p-0"><table class="data-table"><thead><tr><th>Name</th><th>Title</th><th>Role</th><th>Phone</th></tr></thead><tbody>
        ${people.map((p) => `<tr><td class="font-medium">${esc(p.name)}</td><td>${esc(p.title)}</td><td><span class="badge bg-slate-100 text-slate-700">${p.role[0] + p.role.slice(1).toLowerCase()}</span></td><td class="tabular-nums">${esc(p.phone)}</td></tr>`).join("")}</tbody></table></div></div>`,
  };
  const notFound = () => `<div class="card"><h1 class="page-title">Not found</h1><a class="text-brand-700 hover:underline" href="#/">Back home</a></div>`;

  // ----------------------------------------------------------------- router
  function route() {
    const raw = location.hash.slice(1) || "/";
    const [path, query = ""] = raw.split("?");
    const params = new URLSearchParams(query);
    let html;
    const m = path.match(/^\/chat\/([^/]+)$/);
    if (m) html = pages["/chat/:id"](m[1]);
    else html = (pages[path] ?? notFound)(null, params.get("q") ?? "", params);
    $("#app").innerHTML = `<div class="min-h-screen md:pl-60">${nav(path)}<main class="mx-auto max-w-5xl px-4 pt-4 pb-24 md:px-8 md:pt-8 md:pb-8">${html}</main></div>`;
    if (m) window.scrollTo(0, document.body.scrollHeight);
    tick();
  }
  function tick() {
    const el = $("[data-ticker]");
    if (!el) return;
    const s = Math.floor((Date.now() - Number(el.dataset.ticker)) / 1000);
    el.textContent = `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }
  setInterval(tick, 1000);

  // ---------------------------------------------------------------- actions
  const forms = {
    clockin(f) { entries.push({ id: id("e"), userId: me.id, clockIn: now(), clockOut: null, serviceId: f.get("serviceId") || null, kidId: f.get("clientId") || null, note: null, source: "CLOCK", status: "APPROVED" }); toast("Clocked in"); },
    clockout(f) { Object.assign(openEntry(), { clockOut: now(), serviceId: f.get("serviceId") || null, kidId: f.get("clientId") || null, note: f.get("note") || null }); toast("Clocked out"); },
    manual(f) {
      const a = new Date(f.get("clockIn")), b = new Date(f.get("clockOut"));
      if (!(b > a)) return toast("End has to be after start"), false;
      if (b > now()) return toast("That shift hasn't ended yet"), false;
      entries.push({ id: id("e"), userId: me.id, clockIn: a, clockOut: b, serviceId: f.get("serviceId"), kidId: f.get("clientId"), note: f.get("note") || null, source: "MANUAL", status: "PENDING" });
      toast("Sent for approval");
    },
    send(f, form) {
      const body = String(f.get("body")).trim();
      if (!body) return false;
      messages.push({ id: id("m"), convoId: form.dataset.id, senderId: me.id, at: now(), body });
    },
    post(f) { updates.unshift({ id: id("a"), authorId: me.id, title: f.get("title"), body: f.get("body"), at: now() }); toast("Posted"); },
    timeoff(f) {
      if (f.get("end") < f.get("start")) return toast("Last day can't be before the first"), false;
      timeOff.push({ id: id("t"), userId: me.id, start: f.get("start"), end: f.get("end"), reason: f.get("reason") || null, status: "PENDING", reviewNote: null });
      toast("Request sent");
    },
    review(f, form, submitter) {
      const decision = submitter?.value ?? "APPROVED", note = f.get("reviewNote") || null;
      if (form.dataset.kind === "entry") Object.assign(entries.find((e) => e.id === form.dataset.id), { status: decision });
      if (form.dataset.kind === "timeoff") Object.assign(timeOff.find((t) => t.id === form.dataset.id), { status: decision, reviewNote: note });
      if (form.dataset.kind === "change") {
        const c = changeRequests.find((x) => x.id === form.dataset.id);
        c.status = decision;
        if (decision === "APPROVED") Object.assign(entries.find((e) => e.id === c.entryId), { clockIn: c.proposedIn, clockOut: c.proposedOut, serviceId: c.proposedServiceId, kidId: c.proposedKidId });
      }
      toast(decision === "APPROVED" ? "Approved" : "Denied");
    },
    hoursfilter(f) { location.hash = "#/admin/hours?" + new URLSearchParams([...f].filter(([, v]) => v)).toString(); return false; },
    export(f) {
      const from = f.get("from"), to = f.get("to"), detail = f.get("kind") === "detail", withKids = !!f.get("kids");
      const rows = entries.filter((e) => e.status === "APPROVED" && e.clockOut && dateInput(e.clockIn) >= from && dateInput(e.clockIn) <= to);
      const q = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const email = (p) => p.name.split(" ")[0].toLowerCase() + "@example.com";
      let lines;
      if (detail) {
        lines = [["Employee", "Email", "Date", "Start", "End", "Service", ...(withKids ? ["Kid"] : []), "Hours", "Rate", "Amount", "Source"],
          ...rows.map((r) => { const p = person(r.userId), h = hoursBetween(r.clockIn, r.clockOut); return [p.name, email(p), dateInput(r.clockIn), fmtTime(r.clockIn), fmtTime(r.clockOut), svc(r.serviceId)?.name ?? "", ...(withKids ? [kid(r.kidId)?.name ?? ""] : []), h.toFixed(2), rateFor(r).toFixed(2), (h * rateFor(r)).toFixed(2), r.source === "MANUAL" ? "Manual" : "Clock"]; })];
      } else {
        const sums = {};
        rows.forEach((r) => { const k = `${r.userId}|${r.serviceId ?? ""}`; sums[k] ??= { r, h: 0 }; sums[k].h += hoursBetween(r.clockIn, r.clockOut); });
        lines = [["Employee", "Email", "Service", "Hours", "Rate", "Amount"],
          ...Object.values(sums).map(({ r, h }) => { const p = person(r.userId); return [p.name, email(p), svc(r.serviceId)?.name ?? "", h.toFixed(2), rateFor(r).toFixed(2), (h * rateFor(r)).toFixed(2)]; })];
      }
      const blob = new Blob([lines.map((l) => l.map(q).join(",")).join("\r\n")], { type: "text/csv" });
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `payroll-${from}-to-${to}-${detail ? "detail" : "summary"}.csv` });
      a.click();
      URL.revokeObjectURL(a.href);
      toast(`Downloaded ${lines.length - 1} row${lines.length === 2 ? "" : "s"} (sample data)`);
      return false;
    },
  };

  document.addEventListener("submit", (e) => {
    const form = e.target.closest("form[data-form]");
    if (!form) return;
    e.preventDefault();
    const result = forms[form.dataset.form](new FormData(form), form, e.submitter);
    if (result !== false) route();
  });
  document.addEventListener("keydown", (e) => {
    if (e.target.matches('form[data-form="send"] textarea') && e.key === "Enter" && !e.shiftKey) { e.preventDefault(); e.target.form.requestSubmit(); }
  });
  document.addEventListener("input", (e) => {
    if (e.target.id !== "dir-q") return;
    const v = e.target.value, pos = e.target.selectionStart;
    history.replaceState(null, "", "#/directory" + (v ? "?q=" + encodeURIComponent(v) : ""));
    route();
    const el = $("#dir-q"); el.focus(); el.setSelectionRange(pos, pos);
  });
  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]");
    if (!b) return;
    const act = b.dataset.act;
    if (act === "menu") $("#drawer").hidden = false;
    else if (act === "close") $("#drawer").hidden = true;
    else if (act === "signout") toast("Sign-in is turned off in the demo");
    else if (act === "call") toast(`Calling is turned off in the demo`);
    else if (act === "delpost") { updates.splice(updates.findIndex((u) => u.id === b.dataset.id), 1); route(); }
    else if (act === "canceloff") { timeOff.splice(timeOff.findIndex((t) => t.id === b.dataset.id), 1); route(); }
    else if (act === "change") {
      const en = entries.find((x) => x.id === b.dataset.id);
      changeRequests.push({ id: id("c"), entryId: en.id, requestedBy: me.id, proposedIn: new Date(en.clockIn.getTime() - 15 * 60e3), proposedOut: en.clockOut,
        proposedServiceId: en.serviceId, proposedKidId: en.kidId, reason: "Started 15 minutes earlier", status: "PENDING" });
      toast("Change requested (demo: 15 minutes earlier)"); route();
    } else if (act === "dm") {
      let c = convos.find((x) => !x.isGroup && x.members.includes(me.id) && x.members.includes(b.dataset.id));
      if (!c) { c = { id: id("d"), name: null, isGroup: false, members: [me.id, b.dataset.id] }; convos.push(c); }
      location.hash = `#/chat/${c.id}`;
    } else if (act === "role") {
      me = person(ROLES[b.dataset.role]);
      document.querySelectorAll("[data-act=role]").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      if (!isAdmin() && location.hash.startsWith("#/admin")) location.hash = "#/"; else route();
    }
  });
  window.addEventListener("hashchange", route);
  route();
})();
