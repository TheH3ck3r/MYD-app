import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isDailyScheduledOn,
  validateDailySchedule,
} from "../src/utils/dailyRecurrence.ts";

const weekly = {
  frequency: "weekly",
  startDate: "2026-01-01",
  anchorWeekStart: "2025-12-29",
  intervalWeeks: 1,
  daysOfWeek: [1, 4],
};

const monthly = {
  frequency: "monthly",
  startDate: "2020-01-01",
  dayOfMonth: 31,
};

test("weekly selection and start boundary across the year", () => {
  for (const [date, expected] of [
    ["2025-12-29", false],
    ["2026-01-01", true],
    ["2026-01-02", false],
    ["2026-01-04", false],
    ["2026-01-05", true],
    ["2026-01-08", true],
  ]) {
    assert.equal(isDailyScheduledOn(weekly, date), expected, date);
  }
});

test("biweekly reference weeks include Sunday and do not drift", () => {
  const schedule = { ...weekly, intervalWeeks: 2, daysOfWeek: [0, 1, 4] };
  for (const [date, expected] of [
    ["2026-01-01", true],
    ["2026-01-04", true],
    ["2026-01-05", false],
    ["2026-01-11", false],
    ["2026-01-12", true],
    ["2026-12-28", true],
    ["2027-01-04", false],
  ]) {
    assert.equal(isDailyScheduledOn(schedule, date), expected, date);
  }
});

test("anchor is a reference, not an implicit start or current date", () => {
  const schedule = {
    ...weekly,
    startDate: "2025-12-01",
    anchorWeekStart: "2026-01-12",
    intervalWeeks: 3,
  };
  assert.equal(isDailyScheduledOn(schedule, "2025-12-22"), true);
  assert.equal(isDailyScheduledOn(schedule, "2025-12-29"), false);
  assert.equal(isDailyScheduledOn(schedule, "2026-02-02"), true);
});

test("all weekdays and empty selection are deterministic", () => {
  for (let day = 1; day <= 7; day++) {
    const date = `2026-06-0${day}`;
    assert.equal(
      isDailyScheduledOn(
        { ...weekly, daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
        date,
      ),
      true,
    );
    assert.equal(
      isDailyScheduledOn({ ...weekly, daysOfWeek: [] }, date),
      false,
    );
  }
});

test("monthly fallback includes leap years and century rules", () => {
  for (const date of [
    "2026-01-31",
    "2026-02-28",
    "2028-02-29",
    "2026-04-30",
    "2026-12-31",
    "2027-01-31",
    "2100-02-28",
    "2400-02-29",
  ]) {
    assert.equal(isDailyScheduledOn(monthly, date), true, date);
  }
  for (const date of ["2026-01-30", "2028-02-28", "2026-04-29", "2027-01-01"]) {
    assert.equal(isDailyScheduledOn(monthly, date), false, date);
  }
  assert.equal(
    isDailyScheduledOn({ ...monthly, dayOfMonth: 1 }, "2026-04-01"),
    true,
  );
  assert.equal(
    isDailyScheduledOn({ ...monthly, dayOfMonth: 15 }, "2026-04-15"),
    true,
  );
  assert.equal(
    isDailyScheduledOn({ ...monthly, startDate: "2026-05-01" }, "2026-04-30"),
    false,
  );
});

test("calendar matching across DST boundaries uses calendar components", () => {
  const sunday = { ...weekly, daysOfWeek: [0] };
  for (const date of ["2026-03-08", "2026-03-29", "2026-10-25", "2026-11-01"]) {
    assert.equal(isDailyScheduledOn(sunday, date), true, date);
  }
});

test("invalid dates and malformed schedules are rejected", () => {
  for (const date of [
    "2026-02-29",
    "2026-04-31",
    "2026-00-01",
    "0000-01-01",
    "2026-1-01",
    "2026-01-01T00:00:00Z",
    "invalid",
  ]) {
    assert.throws(() => isDailyScheduledOn(weekly, date), RangeError, date);
    assert.throws(
      () => validateDailySchedule({ ...weekly, startDate: date }),
      RangeError,
    );
  }
  for (const intervalWeeks of [
    0,
    -1,
    1.5,
    NaN,
    Infinity,
    Number.MAX_SAFE_INTEGER + 1,
  ]) {
    assert.throws(
      () => validateDailySchedule({ ...weekly, intervalWeeks }),
      RangeError,
    );
  }
  for (const dayOfMonth of [0, 32, 1.5, NaN]) {
    assert.throws(
      () => validateDailySchedule({ ...monthly, dayOfMonth }),
      RangeError,
    );
  }
  for (const daysOfWeek of [[-1], [7], [1.5], [NaN], null]) {
    assert.throws(
      () => validateDailySchedule({ ...weekly, daysOfWeek }),
      RangeError,
    );
  }
  assert.throws(
    () => validateDailySchedule({ ...weekly, anchorWeekStart: "2026-01-06" }),
    RangeError,
  );
  assert.throws(
    () => validateDailySchedule({ ...monthly, frequency: "daily" }),
    RangeError,
  );
});

test("schedule inputs remain unchanged", () => {
  const schedule = Object.freeze({
    ...weekly,
    daysOfWeek: Object.freeze([1, 4]),
  });
  assert.equal(isDailyScheduledOn(schedule, "2026-01-01"), true);
  assert.deepEqual(schedule.daysOfWeek, [1, 4]);
});
