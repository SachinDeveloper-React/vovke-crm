const ROOTS = {
  AUTH: '/auth',
  DASHBOARD: '/dashboard',
} as const;

/**
 * Every address in the panel, in one place.
 *
 * The member reads are grouped under one id on purpose: support arrives with
 * an account and then asks six questions of it, so the six are tabs of one
 * page rather than six searches.
 */
export const paths = {
  auth: {
    signIn: `${ROOTS.AUTH}/sign-in`,
  },

  dashboard: {
    root: ROOTS.DASHBOARD,
    /** What every page of this panel is for, end to end (`section-guides.ts`). */
    guide: `${ROOTS.DASHBOARD}/guide`,
    /** Growth, use, steps, coins, orders. */
    analytics: `${ROOTS.DASHBOARD}/analytics`,
    /** The fleet's faults, worst first — the list of what to fix next. */
    diagnose: `${ROOTS.DASHBOARD}/diagnose`,
    /** Every knob the step pipeline has (RULES A1–A28). */
    steps: `${ROOTS.DASHBOARD}/steps`,
    users: {
      root: `${ROOTS.DASHBOARD}/users`,
      detail: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}` as const,
      problems: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/problems` as const,
      installs: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/installs` as const,
      health: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/health` as const,
      activity: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/activity` as const,
      logins: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/logins` as const,
      fraud: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/fraud` as const,
      /** Their own goal, zone, notification switches — and what we have told them. */
      config: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/config` as const,
      /** What they have walked, what they hold, what they earned, what they bought. */
      steps: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/steps` as const,
      timeline: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/timeline` as const,
      coins: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/coins` as const,
      badges: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/badges` as const,
      orders: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/orders` as const,
      /** What they are about to buy, and what they saved for later (RULES R14). */
      basket: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/basket` as const,
    },
    /** The review queue, and one account's case file. */
    fraud: {
      root: `${ROOTS.DASHBOARD}/fraud`,
      case: (userId: string) => `${ROOTS.DASHBOARD}/users/${encodeURIComponent(userId)}/fraud` as const,
    },
    /** The order book, and one order in full. */
    orders: `${ROOTS.DASHBOARD}/orders`,
    order: (orderId: string) => `${ROOTS.DASHBOARD}/orders/${encodeURIComponent(orderId)}` as const,
    /** What switching step coins on would cost (D-05). */
    economy: `${ROOTS.DASHBOARD}/economy`,
    /** The shelf: what is on it, and how each thing may be bought. */
    catalogue: `${ROOTS.DASHBOARD}/catalogue`,
    /** One product in full: its fields, its sales, who wants it, what they said. */
    catalogueItem: (itemId: string) => `${ROOTS.DASHBOARD}/catalogue/${encodeURIComponent(itemId)}` as const,
    /**
     * The four shelves and the free text under them. Deliberately not
     * `/catalogue/categories`: a static segment under the catalogue would
     * shadow a product whose slug happened to be `categories`.
     */
    categories: `${ROOTS.DASHBOARD}/categories`,
    /** Campaigns (RULES R16), and what each one has given away. */
    coupons: `${ROOTS.DASHBOARD}/coupons`,
    coupon: (code: string) => `${ROOTS.DASHBOARD}/coupons/${encodeURIComponent(code)}` as const,
    /** Baskets nobody checked out, and what people want that is not in stock. */
    baskets: `${ROOTS.DASHBOARD}/baskets`,
    /** What members wrote on the product pages (RULES R15). */
    reviews: `${ROOTS.DASHBOARD}/reviews`,
    /** The challenge board: what each one pays and what it has paid (RULES C1–C5). */
    challenges: `${ROOTS.DASHBOARD}/challenges`,
    /** The badge shelf, who holds each one and what unlocks it (RULES C7). */
    achievements: `${ROOTS.DASHBOARD}/achievements`,
    /** What the nutrition side is made of, and the targets a member starts with (RULES N4). */
    nutrition: `${ROOTS.DASHBOARD}/nutrition`,
    /** The food library every member searches and quick-adds from (RULES N8). */
    foods: `${ROOTS.DASHBOARD}/foods`,
    /** The gym: exercises, and the workout templates built from them. */
    workouts: `${ROOTS.DASHBOARD}/workouts`,
    /** The diet plan library, days and meals (RULES N10). */
    dietPlans: `${ROOTS.DASHBOARD}/diet-plans`,
    dietPlan: (planId: string) => `${ROOTS.DASHBOARD}/diet-plans/${encodeURIComponent(planId)}` as const,
    /** Telling a segment something. */
    messages: `${ROOTS.DASHBOARD}/messages`,
    /** The weekly board: the prize ladder and the words about it (RULES §L). */
    leaderboard: `${ROOTS.DASHBOARD}/leaderboard`,
    /** Releases, and the line below which a build is refused (RULES DV12). */
    releases: `${ROOTS.DASHBOARD}/releases`,
    /** What the app has told everybody, and what became of it. */
    notifications: `${ROOTS.DASHBOARD}/notifications`,
    /** The support queue, and one conversation in full. */
    support: `${ROOTS.DASHBOARD}/support`,
    ticket: (ticketId: string) => `${ROOTS.DASHBOARD}/support/${encodeURIComponent(ticketId)}` as const,
    /** The help centre's own articles and the app guide (RULES P12). */
    faq: `${ROOTS.DASHBOARD}/faq`,
    /** The quotes and tips the app says in its own voice (BACKEND §6.15). */
    quotes: `${ROOTS.DASHBOARD}/quotes`,
    /** Every other config key, section by section. */
    config: `${ROOTS.DASHBOARD}/config`,
  },
} as const;
