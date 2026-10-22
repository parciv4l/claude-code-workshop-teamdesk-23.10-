import type { Database } from "@repo/db";
import { drizzle } from "drizzle-orm/sql-js";
import type { Database as SqlJsDatabase } from "sql.js";
// The asm.js build: no WebAssembly, so it runs under a strict CSP.
import initSqlJs from "sql.js/dist/sql-asm.js";
import notesSql from "../../../packages/db/migrations/0000_notes.sql?raw";
import teamSql from "../../../packages/db/migrations/0001_team.sql?raw";
import seedSql from "../../../packages/db/seed.sql?raw";

const STORAGE_KEY = "teamdesk.demo.db.v1";

let raw: SqlJsDatabase | null = null;

const toBase64 = (bytes: Uint8Array) => {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x80_00) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x80_00));
  }
  return btoa(s);
};

const fromBase64 = (b64: string) =>
  Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));

const iso = (d: Date) => d.toISOString();

/** Upcoming bookings, tasks and announcements, dated from today. */
function demoData(): string {
  const now = new Date();
  const day = (offset: number, hour: number, minute = 0) => {
    const d = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + offset,
        hour,
        minute
      )
    );
    return iso(d);
  };
  const dateOnly = (offset: number) => day(offset, 0).slice(0, 10);
  const created = iso(new Date(now.getTime() - 86_400_000));
  return `
INSERT INTO members (id, email, name, role, joined_at) VALUES
  (4, 'priya@example.com', 'Priya Shah', 'member', '2026-08-04T00:00:00.000Z');
INSERT INTO bookings (attendees, cancelled_at, created_at, ends_at, member_id, room_id, starts_at, title) VALUES
  (2, NULL, '${created}', '${day(0, 23)}', 3, 2, '${day(0, 22)}', 'Interview: senior designer'),
  (6, NULL, '${created}', '${day(1, 1)}', 1, 1, '${day(1, 0)}', 'Weekly team sync'),
  (2, NULL, '${created}', '${day(1, 4, 30)}', 2, 2, '${day(1, 4)}', 'Design review: onboarding flow'),
  (4, NULL, '${created}', '${day(2, 3)}', 3, 3, '${day(2, 2)}', 'Client prep: Harbourside fit-out'),
  (8, NULL, '${created}', '${day(3, 6)}', 1, 1, '${day(3, 5)}', 'Quarterly planning'),
  (2, NULL, '${created}', '${day(4, 23, 30)}', 4, 2, '${day(4, 23)}', '1:1 Kim / Priya');
INSERT INTO tasks (assignee_id, completed_at, created_at, created_by_id, due_on, title) VALUES
  (2, NULL, '${created}', 1, '${dateOnly(2)}', 'Draft the Q4 roadmap one-pager'),
  (3, NULL, '${created}', 1, '${dateOnly(5)}', 'Restock the Harbour room whiteboard markers'),
  (NULL, NULL, '${created}', 2, NULL, 'Pick a date for the team lunch'),
  (4, NULL, '${created}', 3, '${dateOnly(-1)}', 'Send the client the revised floor plan'),
  (1, '${created}', '${created}', 1, '${dateOnly(-2)}', 'Book the projector repair');
INSERT INTO announcements (author_id, body, created_at, pinned) VALUES
  (1, 'Welcome to Teamdesk. Book rooms, share tasks and post updates here. This demo runs entirely in your browser.', '${created}', 1),
  (2, 'The Bridge room only seats two, so please book Quay for anything bigger.', '${created}', 0);
INSERT INTO notes (created_at, text) VALUES
  ('${created}', 'Remember to bring the AV adaptor for Harbour.');
`;
}

function freshDatabase(SQL: Awaited<ReturnType<typeof initSqlJs>>) {
  const db = new SQL.Database();
  for (const sql of [notesSql, teamSql]) {
    for (const statement of sql.split("--> statement-breakpoint")) {
      if (statement.trim()) {
        db.run(statement);
      }
    }
  }
  db.run(seedSql);
  db.run(demoData());
  return db;
}

const ready: Promise<Database> = (async () => {
  const SQL = await initSqlJs();
  let stored: string | null = null;
  try {
    stored = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: start fresh each load.
  }
  try {
    raw = stored ? new SQL.Database(fromBase64(stored)) : freshDatabase(SQL);
  } catch {
    raw = freshDatabase(SQL);
  }
  return drizzle(raw) as unknown as Database;
})();

export const getDatabase = () => ready;

export function saveDatabase() {
  if (!raw) {
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, toBase64(raw.export()));
  } catch {
    // Storage blocked or full: changes last until reload.
  }
}

export function resetDatabase() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.localStorage.removeItem("teamdesk.actingMember");
  } catch {
    // ignore
  }
  window.location.reload();
}
