# vokve-crm — the operator's panel

The read side of Vokve, for the people who have to answer for it: what grew,
what is broken, who a member is, and who is cheating. It talks to
`vokve-backend`'s own operator surface (`/v1/admin/*`) and to nothing else.

Next.js 16 (App Router, Cache Components) · MUI 9 · TypeScript.

## Run it

```sh
# 1. the API, in another terminal
cd ../vokve-backend && npm run dev:memory       # or npm run dev against your Mongo

# 2. this panel
npm install
cp .env.example .env        # point VOKVE_API_URL at the API
npm run dev                 # http://localhost:7000
```

On macOS, port 7000 is taken by AirPlay Receiver (it answers `403` with an
`AirTunes` server header). Either turn that off in System Settings → General →
AirDrop & Handoff, or run `npx next dev -p 7010`.

Then open the panel and paste the API's `ADMIN_API_KEY`. During local
development you can set `VOKVE_ADMIN_API_KEY` in `.env` instead and skip the
sign-in page; that fallback is ignored in production builds.

## What each page answers

| Page | The question it answers |
|---|---|
| **Analytics** | Did it grow, is it being used, what did members walk, and what did it cost? Members, installs, active accounts, steps and their verified share, coins in and out, orders, flags — over a window you pick, bucketed in your own timezone. |
| **Diagnose** | What should we fix next? Every install asked the same questions as one member: who has gone quiet, whose counter the OS killed, which OEM, which build, and the faults themselves worst first. |
| **Members** | Who is this, what have they done, and what is wrong for them? Search by id, email, phone or part of a name, narrow by state (frozen, unverified, deleting, deleted), trust tier, platform and sort, then **twelve tabs** on one account. |
| **Member → Overview** | The profile hub: the account in full, every phone, the wallet and orders in a line each, links into the tabs below — plus the two writes that belong to an account (freeze, legal hold) and the audit receipt of everything ever done to it, by an operator or by the member. |
| **Member → Steps & activity** | Day by day: steps, verified steps, what was credited, distance, active minutes, calories, workouts, which phone counted it, the layer verdict, and whether the day hit the goal *they* set. |
| **Member → Coins** | The wallet, the escrow and the daily ceilings, the totals by source, and the append-only ledger with direction and source filters — plus a goodwill credit or a clawback, as a new row. |
| **Member → Badges** | The whole shelf with their unlocks on it (locked ones included, because "why have I not got that badge" is the question), what each is worth, whether badge coins are switched on, every challenge period they finished with what it actually paid — and granting one by hand. |
| **Member → Orders** | Order history with totals and a status filter, and one order in full on its own page: every line's coins/money split, the address as it was, the gateway's references, the order's own history, and the three things support does to an order. |
| **Fraud queue** | Who has something to answer for? Flagged accounts worst first, with the coins a confirmation would void — and the two verdicts. |
| **Orders** | What needs packing, what is stuck unpaid, what was put right. Filter by status and by **how it was paid** — coins, money, or both — then open one to move it along, cancel it, refund it, or fix the address somebody read out wrong. |
| **Catalogue** | The shelf: list something, change a price, switch an item between **coins-only / money-only / coins+money**, set stock, retire it or put it back. Every name opens the product below. |
| **Catalogue → Product** | One product in full: every field it has (photos, colours, key facts, features, specifications), what it has sold in coins and in money, who is waiting for it, what members wrote about it with the delete beside each, and who changed it last. Two ways to end a product's life sit on this page and only one is reversible — retiring leaves every order that holds it readable; **deleting is refused outright for anything an order holds**, and the refusal says to retire it instead. |
| **Categories** | What each of the four shelves is carrying — items, stock at selling price, units and goods sold, and what people *want* that is not an order yet — with every subcategory under it. The categories themselves are a zod enum the app validates against, so they are reported and not editable; the free text under them is renamed, merged and cleared across the items in bulk, and items are moved between shelves a hundred at a time. |
| **Coupons** | Campaigns (RULES R16), and what each has actually given away — summed from the orders' own snapshots, not recomputed. Write one in rupees and percent, cap it, limit it per member and overall, open and close it on a date, switch it off, or delete one that never ran. `state` is the till's own verdict, so "switched off" never reads as "expired". |
| **Coupons → one code** | What it does as the till reads it, the per-member counter the limit is actually held by (which is the answer to "the code will not work for me"), and every order holding it with the discount as it was placed with. |
| **Baskets** | What nobody checked out — dearest or most recent first, at today's prices — and which of those **cannot** check out. Plus the demand report: saves and basket units beside stock, sorted by the wanting, which is the one thing sales figures cannot show. |
| **Member → Basket & saved** | Their basket as stored *and* as they see it, with the quote from the same call their app makes — so the coupon and its problem text are the words on their screen. Take a line out, the code off, or the lot; unsave something; and see what they had before their basket dropped it. |
| **Reviews** | What members wrote, worst first, because a one-star review is either a product problem to fix or a review to take down. Filter by rating, by whether they had bought it, or by item; taking one down recounts the item at once. |
| **Messages** | Tell a segment something: pick the filters, read the count, then send. The count goes back with the send, so a segment that has moved is refused rather than messaged. |
| **Notifications** | What the app has actually told everybody, and what became of each message: read, pushed, held by quiet hours, or feed-only because the member has that category switched off. Plus every broadcast with the open rate the send itself could not know — and a retraction that takes back the rows nobody has opened and says how many it could not touch. |
| **Support** | Who is waiting for an answer, longest wait first. “Waiting on us” is read off the thread's last message, so it cannot disagree with the conversation; the subject breakdown doubles as the list of articles worth writing. |
| **Support → one ticket** | The whole thread, the phone it was opened from (the first thing support asks and the last thing a member wants to type), their other tickets, and the reply — which tells them through the same path every job uses, and sets the state in the same write. |
| **Help centre** | The articles members search and the guide they follow, written here and read by them with no app release. Names the shelves with nothing active on them, because a help-page row that opens an empty list is a tile leading nowhere. |
| **App config** | Every other knob the server holds, section by section: what is in force, what the code ships, and the way back. One row per key, and the API refuses an unknown path, a value of the wrong kind, and anything the cross-field validator would reject — before it is written. |
| **Steps config** | How is everyone's walking handled? Every knob the step pipeline has, grouped: what the phone is told to count, how long a day stays sendable and when the server chases it, the goal range, what makes a day verified, what the layers refuse, where steps may come from, the rate and the caps, the trust tiers, and where the diagnosis draws its lines. Each field sits next to the value the code ships, and a changed one can be put back. |
| **Member → Config & messages** | What does all that mean for this member, and what have we told them? Their goal and timezone (both editable), the ceiling their trust tier puts on a day, each phone's reporting and reachability, their notification switches and quiet hours, the feed with what became of every push — plus the two buttons support needs: *ask their phones to sync now* and *tell them something*. |
| **Step economy** | Should step coins be switched on? The shadow figure: what today's rate would have held, and how much of what members walked the layers actually verified (judge it against ~0.65). |
| **Releases** | Which build is the store serving, and which builds are refused? Recording a release is a knock; raising the minimum is the wall, and they are separate on purpose. |

Almost everything about a member is read-only. The writes in the whole panel
are: the verdict on a fraud flag, a re-score of one day, a release and the
update policy, the step config, a member's step goal and timezone, silencing
one of their notification categories, sending them a message, asking their
phones to sync, freezing an account or putting a legal hold on it, a coin
credit or clawback, a badge granted by hand, the four order verbs (advance,
cancel, refund, re-address), the shop's own CRUD — products (including a
guarded hard delete), stock, subcategories, bulk recategorising, coupons,
somebody's basket and saved items, and taking a review down — a broadcast,
and the four System writes: answering a support ticket (or moving its state,
or deleting a spam one), writing and hiding help articles and guide chapters,
turning any config key or putting it back, and removing a notification or
retracting a broadcast. The API writes every one of them to its audit log with the
operator's note — and the member's own Overview tab shows that log, so the
next person can see who did what.

**Everything that deletes asks for the name to be typed, and each one is
refused where it would take something away from a member.** A product may be
deleted when no order holds it — the mistake
case, a slug typed wrong or a draft listed by accident — and it takes its
stock row, basket lines, saves and reviews with it, because a basket line
pointing at a row that has gone is one the member can neither see nor remove.
A coupon may be deleted when nothing ever used it. A support ticket may be
deleted only while nobody has answered it — once we have replied, deleting
the thread would take away the member's copy of what we told them, so closing
it is the way a conversation ends. A help article has nothing holding a
snapshot of it and so really can be deleted, and hiding it is the other
option. And a notification can be removed from a feed, which also cancels a
push quiet hours were still holding — but a push already delivered cannot be
unrung, and the panel says which of the two it was. Everything else ends by
being switched off: retiring a product and deactivating a coupon both stop it
reaching a member while leaving every order that holds it readable.

A coin adjustment is a **new ledger row, never an edit**: a clawback reads in
the member's own wallet as a line they can see. It is refused rather than
clamped when the balance will not cover it, and 10,000 coins in one go is the
most this panel will decide.

Two rules the panel inherits from the API and does not try to work around. **A
notification switch can be turned off here and not back on** — silencing
somebody who asked to be silenced is support; consent is theirs to give, in
the app. And **an operator cannot talk past a switch**: a message to a member
who has that category off is written to their notification centre, not pushed,
and the panel says so rather than pretending it rang. That holds for a support
reply as well — the notification goes through the same `notify()` every job
uses, and the answer after sending says where it went.

## How it is put together

- **`src/lib/api.ts`** is the only way out. It is `server-only`: the admin key
  is read from an httpOnly cookie on the server and sent as `x-admin-key`, so
  neither the key nor the API's address is ever in a client bundle. Reads are
  `no-store` — an operator's dashboard showing a cached number is showing a
  wrong number.
- **Three answers are somewhere to go, not errors to show.** A 401 or a
  missing key redirects to sign-in; a 404 *for the subject* renders the
  nearest `not-found.tsx` ("no such account", with the member search), which
  is what a saved link to a deleted account or to a restarted development
  database deserves instead of a stack trace. A 404 from an API with no
  `ADMIN_API_KEY` set is a different thing entirely — every `/admin` route
  answers 404 then — so the client asks the cheapest admin route to tell the
  two apart and says which it was. Everything else reaches
  `dashboard/error.tsx`, which shows the sentence and an *Ask again* button.
  `adminTry` deliberately bypasses all of that except the redirect: a panel
  that wanted to show its own fault inline gets the error back, because
  `notFound()` would throw past it and take the whole route.
- **`src/lib/types.ts`** mirrors the admin API's answers by hand. Every field
  is read by a page, so a rename in the API shows up here as a compile error.
- **Pages are a static title plus a `<Suspense>` boundary.** With Cache
  Components a page that reads cookies or fetches outside a boundary is a
  build error, and streaming is what keeps navigation instant.
- **Filters live in the URL**, never in local state, so every view is a link
  you can send to whoever has to act on it.
- **The steps config is one spec, not nine forms.** `src/sections/steps/fields.ts`
  mirrors the API's closed list of writable keys; one client form renders any
  group of it and sends a patch of *only* what was touched, so two operators
  editing two sections cannot overwrite each other.
- **A switch that must be able to go off sends a hidden `off` first.** An
  unchecked checkbox submits nothing, so a form built the obvious way can turn
  a flag on and never off again; `toggle()` in the actions reads the last value
  of the repeated field.
- **An order paid in coins is never shown a rupee figure.** The API computes
  `paidWith` once (`coins` / `money` / `mixed`), and a coins-only order's
  `inCoins` figures *are* its price — the paise behind them are the till's
  conversion, not a bill. The order book row, the member's history and the
  order page all read that one field, so they cannot disagree.
- **A refused write shows the reason.** The API answers a 422 with "Check the
  highlighted fields" and the real sentence in `details`
  ("coins.sourceCaps.steps (900) exceeds coins.dailyCap (300)"), so
  `readableError` in `src/lib/api.ts` is what every form displays.
- **Charts are inline SVG and CSS** (`src/components/charts`), no chart
  library. Two series at most: the two hues are the theme's own
  `primary.main` and `secondary.main`, which were run through a palette
  validator against this panel's light and dark surfaces and clear every gate
  on all pairs. A third dimension becomes a second chart or a ranked list —
  never a third colour.
- **`component={Link}` only inside client components.** Passing MUI the `Link`
  function from a server component hands a function across the RSC boundary;
  React refuses it and the element silently renders as nothing. `LinkButton`
  and `TextLink` in `src/components/ui/nav.tsx` are the two shapes that need
  it.
- **`src/proxy.ts`** (Next 16's middleware) carries the security headers, the
  rate limiter, and the operator gate: no key cookie, no dashboard — redirected
  before a page renders or an API call is made.

## Deploying it

- Serve it over HTTPS. The session cookie holds the operator's key; it is
  `httpOnly`, `sameSite=strict` and `secure` in production, and HTTPS is what
  keeps it off the wire in the clear.
- Set `CANONICAL_HOST`, `ALLOWED_HOSTS` and `ALLOWED_ORIGINS` so the proxy can
  refuse host-header games and cross-origin writes.
- Put the panel behind whatever your team already uses — a VPN, an SSO proxy,
  an IP allowlist. The admin key is a single shared secret: it is the API's
  own model, not this panel's choice, and one more door in front of it is
  cheap.
- `ADMIN_API_KEY` unset on the API means the admin surface answers `404` to
  everything. The sign-in page says so rather than blaming the key.

## Not built yet

- Per-member *config overrides* — the API has no such thing. What a member has
  of their own is their goal, their zone, their trust tier and their
  notification switches; everything else about how steps are handled is the
  one config on the Steps config page.
- Editing a challenge's definition or its reward (the API has no route; the
  seed owns them).
- Taking a badge back — that is the rule, not a missing screen.
- Changing the help page's own rows (⚙ `support.topics`) is done as JSON on
  the App config page rather than with a row editor, and the four FAQ
  *shelves* are a zod enum the app validates against, like the shop's
  categories.
- Replying to a ticket by email or SMS — the reply reaches the member through
  their notification centre and the thread, which is where they opened it.
- Uploading a product photo. The product form takes image URLs, one per line;
  there is no upload endpoint to post a file to.
- Adding a *fifth* top-level shop category. It is a zod enum the app validates
  every shop response against, so inventing one here would make the lists
  holding it fail to parse on a member's phone — it is a contract change and
  an app release. Subcategories, which are free text on the item, are fully
  editable on the Categories page.
- Replying to a review, or hiding one without deleting it — the API has no
  reply or visibility field.
- The nutrition content tools (`/admin/foods`, `/admin/diet-plans`) — the API
  has full CRUD for the food library and diet plans; nothing here reads it.
- Scheduling a broadcast for later, or templates for one: a send is immediate
  and typed each time.
- Every list that the API can page is paged: members, the order book, the
  catalogue, coupons, baskets, reviews, notifications, support tickets and
  help articles by offset (with a total), the ledger, the trail and a member's
  orders by cursor. The rest are server-capped reads — the fleet's faults, a
  member's holds, the badge shelf — and each says what its cap is rather than
  pretending to be the whole book. Tables scroll inside their own card.
- **A card never shrinks.** Two CSS rules in `components/ui/panel.tsx` earn
  their keep, and both were bugs first. A flex child defaults to
  `min-width: auto`, so a 640px table stretched its card instead of scrolling
  inside it — hence `minWidth: 0` on the table's scroll box, the card and the
  dashboard container. And because the dashboard is a column of flex boxes up
  to a root that is the viewport's height, every card on a page taller than
  the window was a flex item being asked to *shrink*: with MUI's `Card` being
  `overflow: hidden`, what it gave up was not scrolled, it was gone — a
  table's last rows sliced through the middle with no way to reach them
  (measured: 259px of the member's phones table, 46px of their installs).
  `flexShrink: 0` fixes it. The `height: 100%` that makes two cards in a grid
  row end level is scoped to exactly that case (`.MuiGrid-root > &`), because
  in a vertical `Stack` the parent is the whole page and 100% of it made one
  card as tall as everything.
- The per-product figures on a product page (recent orders, reviews, the
  change trail) are server-capped at twenty rows each rather than paged: they
  are there to answer a question about the product, and the order book and the
  Reviews page are where the whole list lives.
# vovke-crm
