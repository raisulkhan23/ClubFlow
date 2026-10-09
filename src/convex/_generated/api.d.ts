/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as accounts from "../accounts.js";
import type * as announcements from "../announcements.js";
import type * as auth from "../auth.js";
import type * as auth_emailOtp from "../auth/emailOtp.js";
import type * as certificates from "../certificates.js";
import type * as clubs from "../clubs.js";
import type * as dashboard from "../dashboard.js";
import type * as events from "../events.js";
import type * as feedback from "../feedback.js";
import type * as festSeed from "../festSeed.js";
import type * as fests from "../fests.js";
import type * as helpers from "../helpers.js";
import type * as http from "../http.js";
import type * as notifications from "../notifications.js";
import type * as registrations from "../registrations.js";
import type * as resources from "../resources.js";
import type * as results from "../results.js";
import type * as seed from "../seed.js";
import type * as tasks from "../tasks.js";
import type * as users from "../users.js";
import type * as volunteers from "../volunteers.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  accounts: typeof accounts;
  announcements: typeof announcements;
  auth: typeof auth;
  "auth/emailOtp": typeof auth_emailOtp;
  certificates: typeof certificates;
  clubs: typeof clubs;
  dashboard: typeof dashboard;
  events: typeof events;
  feedback: typeof feedback;
  festSeed: typeof festSeed;
  fests: typeof fests;
  helpers: typeof helpers;
  http: typeof http;
  notifications: typeof notifications;
  registrations: typeof registrations;
  resources: typeof resources;
  results: typeof results;
  seed: typeof seed;
  tasks: typeof tasks;
  users: typeof users;
  volunteers: typeof volunteers;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
