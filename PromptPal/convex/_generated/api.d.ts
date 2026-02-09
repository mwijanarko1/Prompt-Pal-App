/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as achievements from "../achievements.js";
import type * as ai from "../ai.js";
import type * as analytics from "../analytics.js";
import type * as apps from "../apps.js";
import type * as crons from "../crons.js";
import type * as levels_data from "../levels_data.js";
import type * as mutations from "../mutations.js";
import type * as queries from "../queries.js";
import type * as rankings from "../rankings.js";
import type * as seed from "../seed.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  achievements: typeof achievements;
  ai: typeof ai;
  analytics: typeof analytics;
  apps: typeof apps;
  crons: typeof crons;
  levels_data: typeof levels_data;
  mutations: typeof mutations;
  queries: typeof queries;
  rankings: typeof rankings;
  seed: typeof seed;
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
