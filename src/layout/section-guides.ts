/**
 * What every page of this panel is for, in the operator's own words.
 *
 * The panel is a lot of pages, and most of them are a table of figures that
 * only makes sense to somebody who already knows what the server does with
 * them. A caption in the sidebar is not enough to act on: "Campaigns, and
 * what each has given away" says where you are, not what happens if you
 * press the thing. So each page carries its own short guide — what it is,
 * how it is used, what can be changed from it, and what it refuses — and
 * `/dashboard/guide` is the same text end to end, for somebody being handed
 * the panel for the first time.
 *
 * One registry rather than a paragraph per page, for two reasons. The tour
 * has to be readable in one sitting, in the sidebar's own order, which means
 * the text has to exist somewhere other than inside 42 components. And the
 * guide on the page is matched by route, so a page that grows a guide does
 * not have to be edited: `PageHeader` and the member frame look the entry up
 * themselves.
 *
 * Writing one: `careful` is the part worth the effort. Every other field can
 * be worked out by reading the screen for a minute — what cannot is which
 * writes are refused, which cannot be undone, and which figure means
 * something other than it appears to.
 */

export interface SectionGuide {
  /**
   * The route it belongs to. A `:name` segment matches any one segment, so
   * `/dashboard/users/:userId/coins` covers every member's Coins tab.
   */
  pattern: string;
  /** The sidebar group, which is the order the tour reads in. */
  group: string;
  /** What the page is called, matching its own title. */
  title: string;
  /** The question somebody arrives with. One line, in their words. */
  question: string;
  /** What the page is, and where its figures come from. */
  what: string;
  /** How it is used, in the order the steps come in. */
  how: string[];
  /** What can be changed from here. Empty where the page only reads. */
  writes: string[];
  /** What is refused, what cannot be undone, what is easy to misread. */
  careful: string[];
}

/** The sidebar's groups, in its own order — the order the tour reads in. */
export const GUIDE_GROUPS = [
  'Watch',
  'Members',
  'One member',
  'Shop',
  'Fitness & food',
  'System',
  'Decide',
] as const;

export const sectionGuides: SectionGuide[] = [
  // ── Watch ───────────────────────────────────────────────────────────────
  {
    pattern: '/dashboard/analytics',
    group: 'Watch',
    title: 'Analytics',
    question: 'Did it grow, is it being used, and what did that cost us?',
    what:
      'The whole product over a window you choose, bucketed in the admin timezone: members and installs, how many accounts were active, what everybody walked and how much of it the layers verified, coins in and out, orders, and flags raised. Every figure is counted from the server\'s own collections at the moment you load the page — nothing here is cached.',
    how: [
      'Pick the window first. Every panel below re-reads against it, so a figure only means something once you know how many days it covers.',
      'Read the verified share beside the steps rather than the steps alone: steps members claim and steps the server would pay for are two different numbers.',
      'Coins in and coins out are the cost side. Compare them with orders to see whether what was minted is being spent or piling up.',
      'When something looks wrong rather than just low, Diagnose is the page that names the fault; this one only shows the shape of it.',
    ],
    writes: [],
    careful: [
      'Active accounts counts accounts that did something in the window, not accounts that exist. A flat line here with members still rising is churn, not a bug.',
      'The window is in the admin timezone, not each member\'s, so a day boundary here is not the day boundary their phone used.',
    ],
  },
  {
    pattern: '/dashboard/diagnose',
    group: 'Watch',
    title: 'Diagnose',
    question: 'What should we fix next?',
    what:
      'Every install asked the same questions this panel asks about one member, and the answers worst first: who has gone quiet, whose step counter the OS killed, which phone makers it happens on, which app builds, and the faults themselves ranked. It is the fleet\'s fault list, not a list of people.',
    how: [
      'Start at the top. The list is already ordered by how much it is costing, so the first row is the next thing to fix.',
      'Open a fault to see which installs it covers, then follow one into that member to see what it did to them.',
      'Check the OEM and build breakdowns before changing anything: a fault concentrated on one manufacturer or one build is a different job from one spread evenly.',
      'Faults about reporting rather than counting are usually answered from a member\'s Config & messages tab — ask their phones to sync, and see whether it arrives.',
    ],
    writes: [],
    careful: [
      'Each read is capped by the server rather than paged, and every panel says what its cap is. A capped list is a sample of the fleet, not all of it.',
      '"Gone quiet" is about reporting, not walking. A phone can be counting perfectly and still be in this list.',
    ],
  },

  // ── Members ─────────────────────────────────────────────────────────────
  {
    pattern: '/dashboard/users',
    group: 'Members',
    title: 'Members',
    question: 'Who is this, and what is wrong for them?',
    what:
      'The way into one account. Search by id, email, phone or part of a name; narrow by state (frozen, unverified, deleting, deleted), trust tier and platform. Opening a row gives you fourteen tabs on that one account, which is where every other answer about a member lives.',
    how: [
      'Search with whatever support was given. A partial name works; an id, email or phone is exact and faster.',
      'Use the state filter to answer "why can they not sign in" before reading anything else — frozen, unverified and deleting each explain it on their own.',
      'The Silenced filter lists the members who switched one notification subject off. It is the drill-down from the consent report on Notifications.',
      'Open the account, then pick the tab that matches the question. Overview first if you do not know yet; it links into the rest.',
      'Every filter is in the URL, so the list you are looking at is a link you can send to whoever has to act on it.',
    ],
    writes: [],
    careful: [
      'Deleted accounts are still listed, because "they say they deleted it and still got an email" is a real question. Read the state column before concluding anything from a row.',
      'Trust tier is the server\'s verdict on an account, not a label anybody set by hand here.',
      'Silenced lists a deliberate refusal, not a default: a preferences row is written at sign-up, so a member who never touched the screen is not in it.',
    ],
  },
  {
    pattern: '/dashboard/orders',
    group: 'Members',
    title: 'Orders',
    question: 'What needs packing, what is stuck, and what was put right?',
    what:
      'The order book. Filter by status and by how it was paid — coins, money, or both — and open one to move it along. The four things support does to an order live on the order\'s own page, each with the member\'s copy of it kept readable afterwards.',
    how: [
      'Filter to the status you are working through: unpaid orders are a payments problem, paid ones are a packing queue.',
      'Open an order to advance it, cancel it, refund it, or fix an address somebody read out wrong.',
      'Read the paid-with column before quoting any figure back to a member — a coins-only order has no rupee price to quote.',
      'The order\'s own history at the bottom of its page is the record of everything already done to it, by us or by them.',
    ],
    writes: [
      'Advance an order to its next state',
      'Cancel an order',
      'Refund an order',
      'Correct the delivery address',
    ],
    careful: [
      'An order paid in coins is never shown a rupee figure: its coin figures are the price, and the paise behind them are the till\'s conversion rather than a bill.',
      'Every one of the four verbs is written to the audit log with your note, and the member\'s own Overview tab shows that log.',
    ],
  },
  {
    pattern: '/dashboard/orders/:orderId',
    group: 'Members',
    title: 'One order',
    question: 'What exactly did they buy, and what can I do about it?',
    what:
      'One order in full: every line with its coins and money split, the address as it was at the time, the gateway\'s references, and the order\'s own history. The four support verbs are here rather than in the list, because each needs the order in front of you.',
    how: [
      'Read the lines and the paid-with split first; it decides what you can offer.',
      'Check the history before acting — somebody may already have refunded or re-addressed it.',
      'Use the gateway references when the member\'s bank is involved; they are what a payments query needs.',
      'Advance, cancel, refund or re-address, and say why in the note: the note is what the next person reads.',
    ],
    writes: [
      'Advance, cancel or refund this order',
      'Correct the delivery address',
    ],
    careful: [
      'The address shown is the one captured when the order was placed, not the member\'s current one. Correcting it here changes this order, not their address book.',
      'A refund is a write to the ledger as well as the order. It cannot be taken back from this page.',
    ],
  },
  {
    pattern: '/dashboard/fraud',
    group: 'Members',
    title: 'Fraud queue',
    question: 'Who has something to answer for?',
    what:
      'Flagged accounts worst first, with the coins a confirmation would void shown beside each. The layers have been flagging days since the first snapshot arrived; this is the queue where somebody decides what the flags meant.',
    how: [
      'Work from the top: the order is by what a confirmation is worth, so the costliest case is first.',
      'Open the account\'s Fraud case tab to read the evidence behind the flag before deciding.',
      'Confirm the flag when the evidence holds, which voids the coins it names; dismiss it when it does not.',
      'A flag you dismiss is still on the record, so a pattern across several dismissals is still visible later.',
    ],
    writes: ['Confirm a flag', 'Dismiss a flag'],
    careful: [
      'Confirming voids coins. It is a decision about somebody\'s balance, and the queue puts the amount in front of you for that reason.',
      'A flag is the layers\' suspicion, not a finding. Dismissing one is a normal outcome, not an admission that detection failed.',
    ],
  },

  // ── One member ──────────────────────────────────────────────────────────
  {
    pattern: '/dashboard/users/:userId',
    group: 'One member',
    title: 'Member → Overview',
    question: 'Who is this account, and what has been done to it?',
    what:
      'The profile hub: the account in full, every phone it has been used on, the wallet and orders in a line each, and links into the thirteen tabs beside it. The writes that belong to an account as a whole are here, and so is the audit receipt of everything ever done to it — by an operator or by the member.',
    how: [
      'Read the state line first: frozen, unverified or deleting explains most "it is not working" tickets on its own.',
      'Use the one-line summaries to decide which tab to open rather than reading all fourteen.',
      'Scroll to the trail when somebody asks why something changed; it names who did it and when.',
      'Freeze or put a legal hold on the account only when the case calls for it, and leave a note saying why.',
      'Verify a contact detail when the member cannot — the SMS does not arrive on their carrier, so they can never pass the code and redeeming stays shut.',
    ],
    writes: ['Freeze the account', 'Place a legal hold', 'Verify their phone or email by hand'],
    careful: [
      'Almost everything about a member is read-only here on purpose. The writes that exist are listed above, and each is logged with your note.',
      'Verifying a contact detail unlocks redeeming, payouts and addresses, and there is no route that undoes it. The value is typed back before it will go, and freezing the account is how a verification given in error is answered.',
      'The trail shows the member\'s own actions as well as ours, so a change with no operator beside it was theirs.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/steps',
    group: 'One member',
    title: 'Member → Steps & activity',
    question: 'What have they actually walked, and what did we credit?',
    what:
      'Day by day: steps, verified steps, what was credited, distance, active minutes, calories, workouts, which phone counted it, the layer verdict, and whether the day hit the goal they set. Each day names the source its figure came from — the phone\'s own counter, or the Health Connect app that answered — with what the apps it did not believe wrote beside it.',
    how: [
      'Compare steps with verified steps row by row: the gap is the layers\' doing, and the verdict column says which layer.',
      'Read the source column when the member says the figure is wrong. A watch answering through Health Connect and the phone\'s own counter are different claims about the same day.',
      'Open a day\'s date to see its hours, which is where a single impossible stretch shows up.',
      'The last-steps panel at the bottom is the freshest thing we have, with the phone and the sync behind it.',
    ],
    writes: ['Re-score one day'],
    careful: [
      'The goal each day is measured against is the goal they had that day, not their current one.',
      'A re-score re-runs the layers over one day. It can lower a day as easily as raise it.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/timeline',
    group: 'One member',
    title: 'Member → Day timeline',
    question: 'What did one day look like hour by hour?',
    what:
      'One day of a member\'s walking opened out: the hours, what arrived in each, and which install sent it. It is the page a disputed day ends on, because a day\'s total can look reasonable while the hours behind it cannot.',
    how: [
      'Arrive here from a date on the Steps & activity tab, so the day is the one in question.',
      'Look for the shape rather than the total: a flat day with one enormous hour is the pattern the layers refuse.',
      'Check which install each stretch came from when a member uses more than one phone.',
    ],
    writes: [],
    careful: [
      'Hours are in the member\'s own timezone, which is the clock their phone counted on and not the admin one.',
      'A gap is not necessarily a problem: a phone with the service killed reports its steps in a batch when it comes back.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/coins',
    group: 'One member',
    title: 'Member → Coins',
    question: 'What do they hold, and where did it come from?',
    what:
      'The wallet, the escrow and the daily ceilings, the totals by source, and the append-only ledger with direction and source filters. A goodwill credit or a clawback is made here, as a new row.',
    how: [
      'Read the balance with the ceilings beside it: a member at their daily cap is a different complaint from a member with no coins.',
      'Filter the ledger by source to answer "where did these come from" without reading every row.',
      'Credit or claw back when the case calls for it, and say why — the note is on the row forever.',
    ],
    writes: ['Credit coins as goodwill', 'Claw coins back'],
    careful: [
      'An adjustment is a new ledger row, never an edit: a clawback reads in the member\'s own wallet as a line they can see.',
      'A clawback is refused rather than clamped when the balance will not cover it, and 10,000 coins in one go is the most this panel will decide.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/badges',
    group: 'One member',
    title: 'Member → Badges',
    question: 'Why have I not got that badge?',
    what:
      'The whole shelf with their unlocks on it — locked ones included, because that is the question — what each is worth, whether badge coins are switched on at all, and every challenge period they finished with what it actually paid. A badge can also be granted by hand from here.',
    how: [
      'Find the badge they are asking about on the shelf and read what unlocks it.',
      'Check whether badge coins are switched on before promising a payout: a badge can unlock and pay nothing.',
      'Read the finished challenge periods when the question is about money rather than the badge itself.',
      'Grant one by hand only where the member earned it and something in our pipeline lost it.',
    ],
    writes: ['Grant a badge by hand'],
    careful: [
      'A badge cannot be taken back. That is the rule, not a missing screen, so a grant made in error stays on their shelf.',
      'Granting a badge and paying its coins are separate things; the shelf says what each one is worth.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/orders',
    group: 'One member',
    title: 'Member → Orders',
    question: 'What have they bought, and what happened to it?',
    what:
      'Their order history with totals and a status filter. Each row opens the order in full, which is where the four support verbs are.',
    how: [
      'Filter by status to find the order being asked about.',
      'Open it rather than acting from the list: everything that changes an order needs the order in front of you.',
    ],
    writes: [],
    careful: [
      'Coins-only orders show coin figures and no rupee price. Quoting a rupee figure from somewhere else will not match their screen.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/basket',
    group: 'One member',
    title: 'Member → Basket & saved',
    question: 'Why can they not check out?',
    what:
      'Their basket as it is stored and as they see it, with the quote from the same call their app makes — so the coupon and its problem text are the words on their screen rather than a reconstruction. Saved items are below, and so is what their basket dropped.',
    how: [
      'Read the quote first: the problem text there is what the member is looking at.',
      'Take out a line, take the code off, or empty the basket when that is what unblocks them.',
      'Check the dropped items when they say something vanished — a line pointing at a retired product cannot stay.',
    ],
    writes: ['Remove a basket line', 'Remove the coupon', 'Empty the basket', 'Unsave an item'],
    careful: [
      'Changing somebody\'s basket changes what they see immediately. Say what you are doing before you do it.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/problems',
    group: 'One member',
    title: 'Member → Diagnosis',
    question: 'Why is the app failing this member?',
    what:
      'The same questions Diagnose asks of the fleet, asked of one account: what is wrong on each of their installs, worst first. It is the first tab to open on "it does not work" with nothing more specific attached.',
    how: [
      'Read the faults in order; the first is the one worth answering.',
      'Follow a fault about counting into Installs or Health, and a fault about reporting into Config & messages.',
      'Where the fix is on the phone rather than the server, the fault says which permission or setting it is.',
    ],
    writes: [],
    careful: [
      'A fault here describes an install, not the person. Two phones on one account can disagree completely.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/installs',
    group: 'One member',
    title: 'Member → Installs',
    question: 'Which phones is this account on?',
    what:
      'Every install the account has registered: the device, the build, when it was first and last seen, whether it is counting now, and whether the server has a push token for it. It is also where "is their phone even reporting" is answered.',
    how: [
      'Find the install the member is actually using — last seen is the column that says so.',
      'Check counting and reporting separately: an install can be counting and not reporting, which is the common fault.',
      'Read the build when a fault is known to be fixed in a later one.',
    ],
    writes: [],
    careful: [
      'A push token belongs to the install, not the account: it is cleared from every other account the moment a new one claims it, which is how one phone stops carrying two accounts\' notifications.',
      'An install signed out has no open counting period, so its steps after that point are nobody\'s.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/health',
    group: 'One member',
    title: 'Member → Health',
    question: 'What is their phone letting us see?',
    what:
      'The permissions and platform signals each of their installs reported: notifications, activity recognition, Health Connect, battery optimisation and the rest. It is what turns "the app is broken" into a specific thing the member can change.',
    how: [
      'Read the install the member is using, not the first in the list.',
      'A refused permission is the answer to most "nothing happens" tickets; tell them which switch, in their own settings.',
      'Where Health Connect is involved, check both the read and the write side — they are separate grants.',
    ],
    writes: [],
    careful: [
      'An unknown or unreported permission is not a refusal. It is an install that has not answered yet, and guessing "no" would silence somebody who never said it.',
      'Health Connect here is about steps and distance only. Every vital the member holds — heart rate, blood pressure, weight — is typed in by them; nothing reads those from a device.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/activity',
    group: 'One member',
    title: 'Member → Trail',
    question: 'What has been done to this account, and by whom?',
    what:
      'The audit log for this account end to end: every operator write with its note, and the member\'s own actions beside them. It is the page that answers "who changed this".',
    how: [
      'Search the trail by the time the member says it happened.',
      'Read the actor column: an entry with no operator was the member\'s own doing.',
      'Follow a write to the page that made it when you need the detail rather than the fact.',
    ],
    writes: [],
    careful: [
      'The trail is append-only and the member can see the same log. Anything written here is written for them to read too.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/logins',
    group: 'One member',
    title: 'Member → Sign-ins',
    question: 'Who has been signing in, from where?',
    what:
      'Sign-ins and sessions for the account: when, from which install, and what became of each session. It is where account-sharing and "somebody else is in my account" are both answered.',
    how: [
      'Look at the installs behind the sign-ins rather than the count: one account on five phones is the pattern worth noticing.',
      'A session bound to a device that no longer matches is refused by the server, and that refusal is in this list.',
    ],
    writes: [],
    careful: [
      'Signing somebody out from here ends their session on that phone immediately, including the one they are holding.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/config',
    group: 'One member',
    title: 'Member → Config & messages',
    question: 'What do our settings mean for this member, and what have we told them?',
    what:
      'Their goal and timezone — both editable — the ceiling their trust tier puts on a day, each phone\'s reporting and reachability, their notification switches and quiet hours, and the feed with what became of every push. The two buttons support actually needs are here: ask their phones to sync now, and tell them something.',
    how: [
      'Fix the goal or the timezone when the member\'s days are landing on the wrong date; the timezone is the usual culprit.',
      'Press sync when their steps are not reaching us and you want to know within a minute whether the phone answers.',
      'Send them a message when they need telling something, and read where it went afterwards.',
      'Check their notification switches before promising that a message will ring.',
    ],
    writes: [
      'Change their step goal',
      'Change their timezone',
      'Silence one notification category',
      'Ask their phones to sync now',
      'Send them a message',
    ],
    careful: [
      'A notification switch can be turned off here and not back on. Consent is theirs to give, in the app.',
      'An operator cannot talk past a switch: a message to a member with that category off is written to their notification centre and not pushed, and the answer after sending says so rather than pretending it rang.',
      'There are no per-member config overrides. Everything else about how their steps are handled is the one config on Steps config.',
    ],
  },
  {
    pattern: '/dashboard/users/:userId/fraud',
    group: 'One member',
    title: 'Member → Fraud case',
    question: 'What is the case against this account?',
    what:
      'The flags raised against the account with the evidence behind each, and the coins a confirmation would void. The two verdicts are here, which is where the Fraud queue sends you.',
    how: [
      'Read the evidence before the verdict. Each flag names which layer raised it and on what day.',
      'Cross-check a suspicious day against the Day timeline tab when the evidence is about shape rather than size.',
      'Confirm or dismiss, and leave the note that explains it.',
    ],
    writes: ['Confirm a flag', 'Dismiss a flag'],
    careful: [
      'Confirming voids the coins the flag names, and that is visible to the member in their own wallet.',
      'Freezing the account is a separate decision, made on the Overview tab.',
    ],
  },

  // ── Shop ────────────────────────────────────────────────────────────────
  {
    pattern: '/dashboard/catalogue',
    group: 'Shop',
    title: 'Catalogue',
    question: 'What is on the shelf, and how is it bought?',
    what:
      'The shop\'s own list. List something new, change a price, switch an item between coins-only, money-only and coins-plus-money, set stock, retire it or put it back. Every name opens the product in full.',
    how: [
      'Search or filter to the item, then open it rather than editing from the list where the change needs context.',
      'Set how it is bought before setting a price: the price fields follow from it.',
      'Retire an item to take it off the shelf. Everything that already holds it stays readable.',
      'Stock is edited here and is what the till checks at checkout.',
    ],
    writes: ['List a product', 'Change price or stock', 'Change how it is bought', 'Retire or restore a product'],
    careful: [
      'Retiring and deleting are not the same thing. Retiring is reversible; deleting is refused outright for anything an order holds.',
      'A price change applies from now on. Orders already placed keep the price they were placed at.',
    ],
  },
  {
    pattern: '/dashboard/catalogue/:itemId',
    group: 'Shop',
    title: 'Catalogue → Product',
    question: 'Everything about one product, and what to do with it.',
    what:
      'One product in full: every field it has (photos, colours, key facts, features, specifications), what it has sold in coins and in money, who is waiting for it, what members wrote about it with the delete beside each review, and who changed it last.',
    how: [
      'Edit the fields that are wrong and save; the trail at the bottom records who did it.',
      'Read the waiting list — saves and basket lines — before retiring something: it is the demand that sales figures cannot show.',
      'Take down a review from here when it is abuse rather than a complaint.',
      'Retire the product when it is finished. Delete only a product that never should have existed.',
    ],
    writes: ['Edit any product field', 'Set stock', 'Retire or restore it', 'Delete it', 'Take down a review'],
    careful: [
      'Deleting is refused for anything an order holds, and the refusal says to retire it instead. Where it is allowed, it takes the stock row, basket lines, saves and reviews with it.',
      'Photos are URLs, one per line. There is no upload here to post a file to.',
      'The per-product tables are capped at twenty rows each: they answer a question about the product, and the whole lists live on Orders and Reviews.',
    ],
  },
  {
    pattern: '/dashboard/categories',
    group: 'Shop',
    title: 'Categories',
    question: 'What is each shelf carrying, and what do people want from it?',
    what:
      'The four top-level shelves with what each holds — items, stock at selling price, units and goods sold — and what people want that is not an order yet, with every subcategory under it. Subcategories are free text on the item and fully editable; the four categories themselves are not.',
    how: [
      'Read the wanting column beside the selling: it is the one thing sales figures cannot tell you.',
      'Rename, merge or clear a subcategory across every item holding it in one write.',
      'Move items between shelves a hundred at a time when something is filed wrong.',
    ],
    writes: ['Rename, merge or clear a subcategory', 'Move items between shelves in bulk'],
    careful: [
      'A fifth top-level category cannot be added here. It is a zod enum the app validates every shop response against, so inventing one would make the lists holding it fail to parse on a member\'s phone — a contract change and an app release.',
      'A bulk move is one write over up to a hundred items. Check the filter before running it.',
    ],
  },
  {
    pattern: '/dashboard/coupons',
    group: 'Shop',
    title: 'Coupons',
    question: 'What are we giving away, and what has it cost?',
    what:
      'Campaigns, the limits that decide what each one costs, and what they have actually given away — summed from the orders\' own snapshots rather than recomputed. Write one in rupees or percent, cap it, limit it per member and overall, open and close it on a date, switch it off, or delete one that never ran.',
    how: [
      'Set the caps and the limits with the discount: an uncapped percentage is the one that gets expensive.',
      'Read state rather than the dates. It is the till\'s own verdict, so "switched off" never reads as "expired".',
      'Open a code to see the per-member counter, which is what the limit is actually held by.',
      'Deactivate a campaign to end it. Deleting is for one that never ran.',
    ],
    writes: ['Create a coupon', 'Edit its limits and window', 'Deactivate it', 'Delete an unused one'],
    careful: [
      'A coupon may be deleted only when nothing ever used it. One that has been redeemed is switched off instead, so every order holding it stays readable.',
      'The given-away figure comes from the orders\' snapshots. It is what was actually discounted, not what the current rules would discount.',
    ],
  },
  {
    pattern: '/dashboard/coupons/:code',
    group: 'Shop',
    title: 'Coupons → one code',
    question: 'Why will this code not work for them?',
    what:
      'What the code does as the till reads it, the per-member counter the limit is actually held by, and every order holding it with the discount as it was placed. The per-member counter is the answer to the question in the title: at the limit is a different problem from expired, and the row says which.',
    how: [
      'Find the member in the usage table. A row marked at-limit is the answer.',
      'Where they are not in the table at all, read the state at the top: expired, scheduled, exhausted and switched off each explain it.',
      'Check whether coupons are on shop-wide; the page says so when they are not.',
    ],
    writes: ['Edit this coupon', 'Deactivate it', 'Delete it if unused'],
    careful: [
      'The per-member counter is incremented under a conditional write at checkout. It is the limit, not a report of it.',
    ],
  },
  {
    pattern: '/dashboard/baskets',
    group: 'Shop',
    title: 'Baskets',
    question: 'What did people nearly buy?',
    what:
      'Baskets nobody checked out, dearest or most recent first at today\'s prices, and which of them cannot check out. Below that, the demand report: saves and basket units beside stock, sorted by the wanting.',
    how: [
      'Sort by value to find the baskets worth chasing, or by recency to find the ones still live.',
      'Read the cannot-check-out column first: those are our fault, not a change of mind.',
      'Use the demand report to decide what to restock — it is the only place wanting is visible.',
    ],
    writes: [],
    careful: [
      'Basket values are at today\'s prices, not the price when the line was added, so a repriced item moves the figure.',
    ],
  },
  {
    pattern: '/dashboard/reviews',
    group: 'Shop',
    title: 'Reviews',
    question: 'What are members saying, and is any of it abuse?',
    what:
      'What members wrote on the product pages, worst first — because a one-star review is either a product problem to fix or a review to take down. Filter by rating, by whether they had bought the item, or by item.',
    how: [
      'Read the one-stars first and decide which kind each is.',
      'Filter to reviews from members who did not buy the item when you suspect abuse.',
      'Take a review down where it is abuse; the item\'s rating recounts at once.',
    ],
    writes: ['Take a review down'],
    careful: [
      'There is no reply and no hide: the API has neither field, so taking it down is the only action, and it is permanent.',
    ],
  },
  {
    pattern: '/dashboard/messages',
    group: 'Shop',
    title: 'Messages',
    question: 'How do I tell a group of members something?',
    what:
      'A broadcast. Pick the filters, read the count the filters produce, then write the words and send. The count goes back with the send, so a segment that has moved since you read it is refused rather than messaged.',
    how: [
      'Build the segment with the filters and read the count before writing anything.',
      'Set Governed by to the switch a member should be able to silence this with. A promotion belongs to offers; left on "the topic decides" it would go out under announcements, which is not what anybody switched off.',
      'Write the message, then send. Nothing is scheduled and nothing is templated: a send is immediate and typed each time.',
      'Check the result afterwards on Notifications, which has the open rate the send itself could not know.',
    ],
    writes: ['Send a broadcast'],
    careful: [
      'A broadcast cannot be unsent. It can be retracted from Notifications, which takes back the rows nobody has opened and says how many it could not touch.',
      'Members with that category switched off get a feed row, not a push. The count includes them; the ringing does not — the consent report on Notifications is where the difference is visible before you send.',
    ],
  },

  // ── Fitness & food ──────────────────────────────────────────────────────
  {
    pattern: '/dashboard/challenges',
    group: 'Fitness & food',
    title: 'Challenges',
    question: 'What is each challenge paying, and what has it paid?',
    what:
      'The challenge board: what each one asks for, what it pays, and what it has actually paid out. Every member is enrolled in every open challenge, so a reward here is a cost across the whole base rather than an opt-in.',
    how: [
      'Read what each asks for beside what it pays: the ratio is what decides the cost.',
      'Compare paid-out with the reward to see which challenges people are actually finishing.',
      'Where a member says a challenge did not pay, their Badges tab has the periods they finished and what each one paid.',
    ],
    writes: [],
    careful: [
      'A challenge\'s definition and its reward cannot be edited here — the API has no route for it, and the seed owns them.',
    ],
  },
  {
    pattern: '/dashboard/achievements',
    group: 'Fitness & food',
    title: 'Achievements',
    question: 'What badges exist, what unlocks them, and who holds them?',
    what:
      'The badge shelf: what each badge stands for, what unlocks it, what it is worth and who holds it. A badge is never taken back, which is the rule the page is designed around.',
    how: [
      'Read what unlocks a badge when a member asks why they have not got it; their own Badges tab shows their side of the same shelf.',
      'Check whether badge coins are switched on before telling anyone a badge pays.',
    ],
    writes: [],
    careful: [
      'Granting a badge is done on the member\'s own Badges tab, and it cannot be undone.',
    ],
  },
  {
    pattern: '/dashboard/workouts',
    group: 'Fitness & food',
    title: 'Workouts',
    question: 'What can members train with?',
    what:
      'The exercise list, and the workout templates built from it. Both are read live by the app, so a change here reaches members without a release — and a workout somebody already finished keeps its own copy of what it was.',
    how: [
      'Edit an exercise when its detail is wrong; every template using it follows.',
      'Build a template out of exercises that already exist rather than duplicating one.',
      'Check what a template contains before changing an exercise it depends on.',
    ],
    writes: ['Add or edit an exercise', 'Add or edit a workout template'],
    careful: [
      'The app reads these live. An edit is visible to members as soon as it saves.',
      'A finished workout keeps its own copy, so changing a template does not rewrite anybody\'s history.',
    ],
  },
  {
    pattern: '/dashboard/nutrition',
    group: 'Fitness & food',
    title: 'Nutrition',
    question: 'What targets does a member start with?',
    what:
      'The defaults the nutrition side runs on: the targets a member gets before they change anything, what members are eating by, and where the food library and the diet plans live.',
    how: [
      'Read the starting targets before answering "why does the app say I should eat this much".',
      'Follow through to Food library or Diet plans for the content itself; this page is the settings and the signposts.',
    ],
    writes: [],
    careful: [
      'These are starting targets. A member who has changed theirs is not running on these numbers.',
    ],
  },
  {
    pattern: '/dashboard/foods',
    group: 'Fitness & food',
    title: 'Food library',
    question: 'What can members search and quick-add?',
    what:
      'Every food in the library members search, browse and quick-add from. A spreadsheet goes in whole, matched by name, which is how a few hundred rows arrive at once.',
    how: [
      'Search before adding: the library is matched by name, and two rows for one food is the usual mistake.',
      'Edit a food when its figures are wrong; members see it immediately.',
      'Import a sheet for bulk work, and read what the match did before accepting it.',
    ],
    writes: ['Add or edit a food', 'Import a spreadsheet'],
    careful: [
      'An import matches by name. Check the matches it proposes, because a wrong match overwrites a food members are already logging.',
    ],
  },
  {
    pattern: '/dashboard/diet-plans',
    group: 'Fitness & food',
    title: 'Diet plans',
    question: 'What plans can a member follow?',
    what:
      'Programmes of days and meals that a member either picks by name or is given. The days run in rotation, so a seven-day plan repeats rather than ending.',
    how: [
      'Open a plan to see its days and the meals in each.',
      'Build the meals out of the food library rather than typing figures in twice.',
      'Check the rotation length: it is how often a member sees the same day again.',
    ],
    writes: ['Add or edit a diet plan, its days and its meals'],
    careful: [
      'Days rotate. A plan with three days is a three-day loop, not a three-day course.',
    ],
  },

  // ── System ──────────────────────────────────────────────────────────────
  {
    pattern: '/dashboard/notifications',
    group: 'System',
    title: 'Notifications',
    question: 'What have we told everybody, and did it arrive?',
    what:
      'Every message the app has sent and what became of each one: read, pushed, held by quiet hours, or feed-only because the member has that category switched off. Broadcasts are here too, with the open rate the send itself could not know — and the consent report, which is the base\'s eight switches counted: who a push on each one reaches, who turned it off, and how many of those were decisions rather than defaults.',
    how: [
      'Read the consent panel before planning a send: it is the only honest answer to "how many people will this actually reach".',
      'Follow "Who" on a switch to the members who silenced it; the Silenced filter on Members is the same list.',
      'Check what a switch governs. One marked "only when a send names it" silences nothing unless the broadcast names it, which is what the Governed by field on Messages is for.',
      'Filter to the message in question and read its outcome column: delivered and read are different answers.',
      'Where it says feed-only, the member silenced that category — that is consent, not a fault.',
      'Retract a broadcast that should not have gone, and read how many rows it could not touch.',
      'Remove a single notification from a feed when it was wrong for one member.',
    ],
    writes: ['Remove a notification from a feed', 'Retract a broadcast'],
    careful: [
      'A push already delivered cannot be unrung. Retracting takes back the rows nobody has opened and cancels a push quiet hours were still holding — the panel says which of the two it was.',
      'Quiet hours hold a push rather than dropping it: a message shown as deferred has not failed, it is waiting.',
      '"Switched off" is a refusal the member made in the app. It can be set from their own tab and never unset — consent is theirs to give — so the report is a thing to plan around, not to change.',
    ],
  },
  {
    pattern: '/dashboard/support',
    group: 'System',
    title: 'Support',
    question: 'Who is waiting for an answer?',
    what:
      'The support queue, longest wait first. "Waiting on us" is read off the thread\'s last message, so it cannot disagree with the conversation. The subject breakdown doubles as the list of help articles worth writing.',
    how: [
      'Work from the top: the order is by how long somebody has been waiting.',
      'Open a ticket to read the thread and reply; the reply and the state change are one write.',
      'Read the subject breakdown when the same question keeps arriving — that is a Help centre article, not a ticket.',
    ],
    writes: [],
    careful: [
      'Waiting-on-us is derived from the thread, not set by hand. If it looks wrong, the last message is why.',
    ],
  },
  {
    pattern: '/dashboard/support/:ticketId',
    group: 'System',
    title: 'Support → one ticket',
    question: 'What did they ask, and what do I say back?',
    what:
      'The whole thread, the phone it was opened from — the first thing support asks and the last thing a member wants to type — their other tickets, and the reply box. Replying tells them through the same path every job uses, and sets the state in the same write.',
    how: [
      'Read the install details before asking the member anything about their phone; they are already here.',
      'Check their other tickets for the same question answered before.',
      'Reply, which also moves the state. Move the state on its own when there is nothing to say.',
    ],
    writes: ['Reply to the ticket', 'Move its state', 'Delete a spam ticket'],
    careful: [
      'A ticket may be deleted only while nobody has answered it. Once we have replied, deleting would take away the member\'s copy of what we told them, so closing it is how a conversation ends.',
      'The reply goes through the same notify() every job uses, so a member with that category off gets it in their notification centre rather than as a push — the answer after sending says where it went.',
      'There is no email or SMS reply. The thread and their notification centre are where it lands.',
    ],
  },
  {
    pattern: '/dashboard/faq',
    group: 'System',
    title: 'Help centre',
    question: 'What can members read for themselves?',
    what:
      'The articles members search and the guide they follow, written here and read by them with no app release. The page also names the shelves with nothing active on them, because a help-page row that opens an empty list is a tile leading nowhere.',
    how: [
      'Write the article the support queue keeps asking for; the subject breakdown on Support is the list.',
      'File it on a shelf with something else on it, or expect the shelf to read as empty.',
      'Hide an article that is wrong but worth keeping; delete one that should never have existed.',
    ],
    writes: ['Write or edit an article', 'Write or edit a guide chapter', 'Hide one', 'Delete one'],
    careful: [
      'The four shelves are a zod enum the app validates against, like the shop\'s categories, so a fifth is an app release.',
      'The help page\'s own rows are edited as JSON on App config, not here.',
    ],
  },
  {
    pattern: '/dashboard/config',
    group: 'System',
    title: 'App config',
    question: 'Where is every other setting?',
    what:
      'Every knob the server holds that is not on a page of its own, section by section: what is in force, what the code ships as the default, and the way back to it. One row per key.',
    how: [
      'Find the section, then the key. Each row shows the live value beside the shipped one.',
      'Change the value and save. A changed key can be put back to the shipped default from the same row.',
      'Read the error when a write is refused: the real sentence is in it, naming the fields that clashed.',
    ],
    writes: ['Set any config key', 'Put a key back to its shipped default'],
    careful: [
      'The API refuses an unknown path, a value of the wrong kind, and anything the cross-field validator rejects — before it is written. A refusal is the server protecting itself, not a panel bug.',
      'These settings reach every member. There is no per-member override anywhere in this panel.',
    ],
  },

  // ── Decide ──────────────────────────────────────────────────────────────
  {
    pattern: '/dashboard/steps',
    group: 'Decide',
    title: 'Steps config',
    question: 'How is everyone\'s walking handled?',
    what:
      'Every knob the step pipeline has, grouped: what the phone is told to count, how long a day stays sendable and when the server chases it, the goal range, what makes a day verified, what the layers refuse, where steps may come from, the rate and the caps, the trust tiers, and where the diagnosis draws its lines. Each field sits next to the value the code ships.',
    how: [
      'Find the group your question belongs to rather than scrolling the whole spec.',
      'Compare the live value with the shipped one before changing it; a field that already differs was changed by somebody for a reason.',
      'Change only what you touched and save — the form sends a patch of exactly that, so two operators editing two sections cannot overwrite each other.',
      'Put a field back to the shipped value from its own row when a change did not help.',
    ],
    writes: ['Set any step config key', 'Put one back to its shipped default'],
    careful: [
      'These change how every member\'s steps are counted, verified and paid. A tightened threshold applies to days still open to re-scoring, not only to tomorrow.',
      'A refused write says which fields clashed, in the server\'s own words — a source cap above the daily cap, for instance.',
    ],
  },
  {
    pattern: '/dashboard/economy',
    group: 'Decide',
    title: 'Step economy',
    question: 'Should step coins be switched on?',
    what:
      'The shadow figure: what today\'s rate would have held if steps were paying, and how much of what members walked the layers actually verified. Nothing here is live spending — it is the cost of a decision that has not been made.',
    how: [
      'Read the verified share first and judge it against roughly 0.65. Below that, the pipeline is refusing more than it should.',
      'Read the shadow cost beside it: that is what the current rate would have minted.',
      'Change the rate on Steps config, then come back and read what it would have cost.',
    ],
    writes: [],
    careful: [
      'These are shadow figures, not a ledger. No coins were minted by anything on this page.',
    ],
  },
  {
    pattern: '/dashboard/releases',
    group: 'Decide',
    title: 'Releases',
    question: 'Which build is the store serving, and which are refused?',
    what:
      'The builds the server knows about and the line below which one is refused. Recording a release is a knock; raising the minimum is a wall, and the two are separate decisions on purpose.',
    how: [
      'Record the release first, with its version and build, so the server knows it exists.',
      'Raise the minimum only once the new build is actually available to members, because everything below it is refused outright.',
      'Mark a build blocked when it must not be used at all, which is narrower than raising the floor.',
    ],
    writes: ['Record a release', 'Set the minimum version', 'Block a build'],
    careful: [
      'Raising the minimum stops every older build working. A member who cannot update is a member who cannot use the app.',
      'The endpoint a blocked build calls to find out what to tell its member is deliberately exempt from the gate — so a wall still has a message behind it.',
    ],
  },
];

/** The guide index page itself, which needs no guide of its own. */
const GUIDE_PATH = '/dashboard/guide';

/**
 * The guide for a route, or null where there is none.
 *
 * Matched segment by segment against patterns of the same length, so
 * `/dashboard/users/usr_1/coins` finds the Coins tab rather than the member
 * list — and a pattern is preferred over another of the same length when more
 * of its segments are literal. Length has to be equal rather than a prefix:
 * a member tab must not fall back to the member search's guide, which would
 * tell somebody to search for an account they are already looking at.
 */
export function guideFor(pathname: string | null | undefined): SectionGuide | null {
  if (!pathname || pathname === GUIDE_PATH) return null;
  const segments = pathname.replace(/\/+$/, '').split('/').filter(Boolean);

  let best: SectionGuide | null = null;
  let bestLiterals = -1;

  for (const guide of sectionGuides) {
    const pattern = guide.pattern.split('/').filter(Boolean);
    if (pattern.length !== segments.length) continue;

    let literals = 0;
    let matches = true;
    for (let i = 0; i < pattern.length; i += 1) {
      if (pattern[i].startsWith(':')) continue;
      if (pattern[i] !== segments[i]) {
        matches = false;
        break;
      }
      literals += 1;
    }
    if (matches && literals > bestLiterals) {
      best = guide;
      bestLiterals = literals;
    }
  }

  return best;
}

/** The whole tour, in the sidebar's order — what `/dashboard/guide` reads. */
export function guidesByGroup(): { group: string; guides: SectionGuide[] }[] {
  return GUIDE_GROUPS.map(group => ({
    group,
    guides: sectionGuides.filter(guide => guide.group === group),
  })).filter(entry => entry.guides.length > 0);
}
