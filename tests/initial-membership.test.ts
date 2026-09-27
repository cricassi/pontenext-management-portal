import assert from "node:assert/strict";
import { test } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadModule } from "./load-module";
import { addInitialMembershipMonths, getInitialMembershipDefaults } from "@/utils/initial-membership";
import { NewMemberMembershipPrompt } from "@/components/members/NewMemberMembershipPrompt";
import { MembershipHistoryPanel } from "@/components/memberships/MembershipHistoryPanel";
import type { MembershipPlan } from "@/types/membership";

const memberId = "40000000-0000-4000-8000-000000000001";
const membershipId = "50000000-0000-4000-8000-000000000001";
const member = { id: memberId, firstName: "Ada", lastName: "Demo", status: "active", archivedAt: null };
const plan = (months: number, extra: Partial<MembershipPlan> = {}): MembershipPlan => ({
  id: `60000000-0000-4000-8000-${String(months).padStart(12, "0")}`, name: `Piano ${months}`,
  description: null, minimumFee: 30, defaultDurationMonths: months, isActive: true,
  sortOrder: months, createdAt: "2026-01-01T00:00:00Z", updatedAt: "2026-01-01T00:00:00Z", archivedAt: null, ...extra,
});
const navigation = {
  redirect: (href: string): never => { throw new Error(`redirect:${href}`); },
  notFound: (): never => { throw new Error("notFound"); },
  unstable_rethrow: () => undefined,
};

test("annual defaults use the Italian day, active annual plan and its fee", () => {
  const plans = [plan(6), plan(12, { isActive: false }), plan(12, { archivedAt: "2026-01-01" }), plan(12, { minimumFee: 45 })];
  for (const now of ["2026-09-26T22:30:00Z", "2026-09-27T12:00:00Z"]) {
    assert.deepEqual(getInitialMembershipDefaults(plans, new Date(now)), {
      membershipPlanId: plans[3].id, startDate: "2026-09-27", endDate: "2027-09-27", minimumFee: 45, expectedFee: 45,
    });
  }
  assert.equal(getInitialMembershipDefaults([], new Date("2026-12-31T23:30:00Z")).startDate, "2027-01-01");
});

test("no annual plan means custom annual duration, without silently choosing a six-month plan", () => {
  const defaults = getInitialMembershipDefaults([plan(6)], new Date("2026-09-27T12:00:00Z"));
  assert.equal(defaults.membershipPlanId, undefined);
  assert.equal(defaults.endDate, "2027-09-27");
  assert.equal(defaults.expectedFee, 0);
});

test("calendar years/months clamp leap day and end of month, not +365 days", () => {
  assert.equal(addInitialMembershipMonths("2028-02-29", 12), "2029-02-28");
  assert.equal(addInitialMembershipMonths("2027-03-01", 12), "2028-03-01");
  assert.equal(addInitialMembershipMonths("2028-01-31", 1), "2028-02-29");
  assert.equal(addInitialMembershipMonths("2026-08-31", 6), "2027-02-28");
  assert.equal(addInitialMembershipMonths("", 12), "");
});

test("prompt contains two navigations, no form or automatic mutation", () => {
  const html = renderToStaticMarkup(createElement(NewMemberMembershipPrompt, { memberId }));
  assert.match(html, /Socio creato correttamente/);
  assert.match(html, /Crea iscrizione/);
  assert.match(html, /Non ora/);
  assert.match(html, new RegExp(`href="/members/${memberId}"`));
  assert.match(html, /mode=initial/);
  assert.doesNotMatch(html, /<form|type="submit"/);
});

test("an empty membership history lets the admin resume the same first-membership flow later", () => {
  const html = renderToStaticMarkup(createElement(MembershipHistoryPanel, { memberId, memberships: [] }));
  assert.equal((html.match(/mode=initial/g) ?? []).length, 2);
  assert.match(html, /Nuova iscrizione/);
});

test("only a successful member INSERT redirects to the prompt; edit remains unchanged", async () => {
  for (const outcome of ["success", "invalid", "failure"]) {
    const events: string[] = [];
    const actions = loadModule<typeof import("@/app/(admin)/members/actions")>("src/app/(admin)/members/actions.ts", {
      "next/cache": { revalidatePath: () => events.push("revalidate") }, "next/navigation": navigation,
      "@/services/admin-auth.service": { requireActiveAdmin: async () => { events.push("guard"); } },
      "@/services/members.service": {
        createMember: async () => { events.push("insert"); if (outcome === "failure") throw new Error("internal details"); return outcome === "success" ? { ok: true, member } : { ok: false, message: "invalid", errors: { firstName: "required" } }; },
        updateMember: async () => ({ ok: true }),
      },
      "@/services/member-roles.service": {},
    });
    if (outcome === "success") {
      await assert.rejects(actions.createMemberAction({ errors: {} }, new FormData()), { message: `redirect:/members/${memberId}?created=1` });
      await assert.rejects(actions.updateMemberAction(memberId, "version", { errors: {} }, new FormData()), { message: `redirect:/members/${memberId}` });
    } else {
      const result = await actions.createMemberAction({ errors: {} }, new FormData());
      assert.ok(result.message);
      assert.doesNotMatch(result.message, /internal details/);
      assert.ok(!events.includes("revalidate"));
    }
    assert.deepEqual(events.slice(0, 2), ["guard", "insert"]);
  }
});

function actionFixture(options: { denied?: boolean; exists?: boolean; archived?: boolean; readFailure?: boolean; writeFailure?: boolean; invalid?: boolean } = {}) {
  const events: string[] = [];
  let inserted = false;
  const actions = loadModule<typeof import("@/app/(admin)/memberships/actions")>("src/app/(admin)/memberships/actions.ts", {
    "next/cache": { revalidatePath: () => events.push("revalidate") }, "next/navigation": navigation,
    "@/services/admin-auth.service": { requireActiveAdmin: async () => { events.push("guard"); if (options.denied) throw new Error("denied"); } },
    "@/services/members.service": { getMemberById: async () => { events.push("member-read"); return { ...member, archivedAt: options.archived ? "2026-01-01" : null }; } },
    "@/services/memberships.service": {
      getMembershipsByMemberId: async () => { events.push("history"); if (options.readFailure) throw new Error("sensitive read failure"); return options.exists || inserted ? [{ id: membershipId }] : []; },
      validateMembershipFormData: () => options.invalid ? { ok: false, message: "invalid", errors: { endDate: "invalid" } } : { ok: true, values: { memberId } },
      createMembership: async () => { events.push("membership-insert"); if (options.writeFailure) throw new Error("Impossibile creare l'iscrizione."); inserted = true; return { id: membershipId }; },
    },
    "@/services/payments.service": { createPayment: () => { throw new Error("No payment allowed"); } },
  });
  const form = new FormData(); form.set("memberId", memberId);
  return { actions, events, form };
}

test("first membership authenticates before business reads and rejects a tampered member", async () => {
  const denied = actionFixture({ denied: true });
  await assert.rejects(denied.actions.createInitialMembershipAction(memberId, { errors: {} }, denied.form), /denied/);
  assert.deepEqual(denied.events, ["guard"]);
  for (const mutate of ["other", "duplicate"]) {
    const f = actionFixture();
    if (mutate === "other") f.form.set("memberId", membershipId); else f.form.append("memberId", memberId);
    assert.ok((await f.actions.createInitialMembershipAction(memberId, { errors: {} }, f.form)).message);
    assert.deepEqual(f.events, ["guard"]);
  }
});

test("existing/archived records, validation failure and failed reads never insert a membership", async () => {
  for (const options of [{ exists: true }, { archived: true }, { invalid: true }, { readFailure: true }]) {
    const f = actionFixture(options);
    const result = await f.actions.createInitialMembershipAction(memberId, { errors: {} }, f.form);
    assert.ok(result.message);
    assert.doesNotMatch(result.message, /sensitive/);
    assert.ok(!f.events.includes("membership-insert"));
  }
});

test("confirmed first membership inserts once; a sequential retry is refused, without touching the member/payment", async () => {
  const f = actionFixture();
  await assert.rejects(f.actions.createInitialMembershipAction(memberId, { errors: {} }, f.form), { message: `redirect:/memberships/${membershipId}` });
  const retry = await f.actions.createInitialMembershipAction(memberId, { errors: {} }, f.form);
  assert.match(retry.message!, /gia'/);
  assert.equal(f.events.filter((event) => event === "membership-insert").length, 1);
});

test("membership insertion errors keep the already-created member intact", async () => {
  const f = actionFixture({ writeFailure: true });
  const result = await f.actions.createInitialMembershipAction(memberId, { errors: {} }, f.form);
  assert.ok(result.message);
  assert.ok(!f.events.includes("revalidate"));
  assert.equal(f.events.filter((event) => event === "membership-insert").length, 1);
});

function pageFixture(options: { denied?: boolean; exists?: boolean } = {}) {
  const events: string[] = [];
  const page = loadModule<typeof import("@/app/(admin)/memberships/new/page")>("src/app/(admin)/memberships/new/page.tsx", {
    "next/navigation": navigation,
    "@/services/admin-auth.service": { requireActiveAdmin: async () => { events.push("guard"); if (options.denied) throw new Error("denied"); } },
    "@/services/members.service": { getMembers: async () => { events.push("all-members"); return [member]; }, getMemberById: async () => { events.push("one-member"); return member; } },
    "@/services/membership-plans.service": { getActiveMembershipPlans: async () => { events.push("plans"); return [plan(6), plan(12)]; } },
    "@/services/memberships.service": { getMembershipsByMemberId: async () => options.exists ? [{ id: membershipId }] : [], getNextMembershipStartDate: async () => "2030-10-01" },
    "@/services/expirations.service": { getQuickRenewalDefaults: async () => ({ memberId, memberName: "Ada Demo", membershipPlanId: plan(6).id, startDate: "2030-10-01", endDate: "2031-04-01", minimumFee: 15, expectedFee: 20, previousEndDate: "2030-09-30", sourceMembershipId: membershipId }) },
    "@/app/(admin)/memberships/actions": { createInitialMembershipAction: async () => ({ errors: {} }), createMembershipAction: async () => ({ errors: {} }), renewMembershipAction: async () => ({ errors: {} }) },
  });
  return { page: page.default, events };
}

test("first membership page is protected, uses one member, annual plan and cancel-to-member", async () => {
  const f = pageFixture();
  const html = renderToStaticMarkup(await f.page({ searchParams: Promise.resolve({ mode: "initial", memberId }) }));
  assert.equal(f.events[0], "guard");
  assert.ok(!f.events.includes("all-members"));
  assert.match(html, /Prima iscrizione/);
  assert.match(html, /Crea iscrizione/);
  assert.match(html, new RegExp(`href="/members/${memberId}"`));
  assert.match(html, new RegExp(`value="${plan(12).id}" selected=""`));
  assert.doesNotMatch(html, /Registra rinnovo/);
  const denied = pageFixture({ denied: true });
  await assert.rejects(denied.page({ searchParams: Promise.resolve({ mode: "initial", memberId }) }), /denied/);
  assert.deepEqual(denied.events, ["guard"]);
});

test("initial URL cannot reopen a completed membership or accept missing/malformed IDs", async () => {
  const f = pageFixture({ exists: true });
  await assert.rejects(f.page({ searchParams: Promise.resolve({ mode: "initial", memberId }) }), { message: `redirect:/members/${memberId}` });
  for (const params of [{ mode: "initial" }, { mode: "initial", memberId: "bad" }, { mode: "initial", memberId, renewFrom: membershipId }]) {
    await assert.rejects(pageFixture().page({ searchParams: Promise.resolve(params) }), /notFound/);
  }
});

test("standard and quick renewals retain their original dates, fees and actions", async () => {
  const standard = renderToStaticMarkup(await pageFixture().page({ searchParams: Promise.resolve({ memberId }) }));
  assert.match(standard, /Rinnovo iscrizione/);
  assert.match(standard, /value="2030-10-01"/);
  assert.match(standard, /value="2031-04-01"/);
  const quick = renderToStaticMarkup(await pageFixture().page({ searchParams: Promise.resolve({ mode: "quick", memberId, renewFrom: membershipId }) }));
  assert.match(quick, /Registra rinnovo rapido/);
  assert.match(quick, /value="2031-04-01"/);
  assert.match(quick, /value="20"/);
  assert.match(quick, /href="\/expirations"/);
});
