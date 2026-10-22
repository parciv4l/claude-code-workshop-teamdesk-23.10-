// Demo replacement for src/integrations/trpc/client.ts: the same appRouter,
// called in-process in the browser against a sql.js database.
import { createAnnouncementsService } from "@repo/services/announcements";
import { createAvailabilityService } from "@repo/services/availability";
import { createBookingsService } from "@repo/services/bookings";
import { createMembersService } from "@repo/services/members";
import { createNotesService } from "@repo/services/notes";
import { createRoomsService } from "@repo/services/rooms";
import { createTasksService } from "@repo/services/tasks";
import {
  createTRPCClient,
  type TRPCLink,
  unstable_localLink,
} from "@trpc/client";
import { observable } from "@trpc/server/observable";
import type { Context } from "#/server/trpc/context";
import { type AppRouter, appRouter } from "#/server/trpc/router";
import { getDatabase, saveDatabase } from "./database";

const createContext = async (): Promise<Context> => {
  const db = await getDatabase();
  return {
    services: {
      announcements: createAnnouncementsService(db),
      availability: createAvailabilityService(db),
      bookings: createBookingsService(db),
      members: createMembersService(db),
      notes: createNotesService(db),
      rooms: createRoomsService(db),
      tasks: createTasksService(db),
    },
    userId: null,
  };
};

const persistLink: TRPCLink<AppRouter> =
  () =>
  ({ op, next }) =>
    observable((observer) =>
      next(op).subscribe({
        complete() {
          if (op.type === "mutation") {
            saveDatabase();
          }
          observer.complete();
        },
        error(err) {
          observer.error(err);
        },
        next(value) {
          observer.next(value);
        },
      })
    );

const client = createTRPCClient<AppRouter>({
  links: [
    persistLink,
    unstable_localLink({ createContext, router: appRouter }),
  ],
});

export const getTrpc = () => client;
