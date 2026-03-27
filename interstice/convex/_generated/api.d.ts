/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as activity from "../activity.js";
import type * as agents from "../agents.js";
import type * as analytics_data from "../analytics_data.js";
import type * as approvals from "../approvals.js";
import type * as contacts from "../contacts.js";
import type * as content_outputs from "../content_outputs.js";
import type * as findings from "../findings.js";
import type * as goals from "../goals.js";
import type * as heartbeats from "../heartbeats.js";
import type * as leads from "../leads.js";
import type * as messages from "../messages.js";
import type * as omi_sessions from "../omi_sessions.js";
import type * as sessions from "../sessions.js";
import type * as storage from "../storage.js";
import type * as tasks from "../tasks.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  activity: typeof activity;
  agents: typeof agents;
  analytics_data: typeof analytics_data;
  approvals: typeof approvals;
  contacts: typeof contacts;
  content_outputs: typeof content_outputs;
  findings: typeof findings;
  goals: typeof goals;
  heartbeats: typeof heartbeats;
  leads: typeof leads;
  messages: typeof messages;
  omi_sessions: typeof omi_sessions;
  sessions: typeof sessions;
  storage: typeof storage;
  tasks: typeof tasks;
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
