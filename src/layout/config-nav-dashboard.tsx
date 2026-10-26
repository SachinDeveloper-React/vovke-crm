import { paths } from './paths';
import { Iconify } from '../components/iconify/iconify';
import { NavGroupData } from '../components/nav-section/types';

/**
 * The sidebar, in the order the questions get asked: what is happening, what
 * is broken, who is this, and who is cheating — then the two decisions an
 * operator makes rather than reads.
 *
 * The Guide sits above all of it, because the one reader the rest of this
 * order does not serve is somebody opening the panel for the first time: the
 * captions here say where a page is, and the guide says what happens if you
 * press the thing. Every page carries the same text at the top of itself
 * (`layout/section-guides.ts`), so the entry is a way to read it all at once
 * rather than the only place it exists.
 */
export const navData: NavGroupData[] = [
  {
    subheader: 'Start here',
    items: [
      {
        title: 'Guide',
        path: paths.dashboard.guide,
        icon: <Iconify icon="solar:notebook-bookmark-bold-duotone" />,
        caption: 'What every page is for, end to end',
      },
    ],
  },
  {
    subheader: 'Watch',
    items: [
      {
        title: 'Analytics',
        path: paths.dashboard.analytics,
        icon: <Iconify icon="solar:chart-2-bold-duotone" />,
        caption: 'Growth, use, steps, coins',
      },
      {
        title: 'Diagnose',
        path: paths.dashboard.diagnose,
        icon: <Iconify icon="solar:stethoscope-bold-duotone" />,
        caption: 'What is broken, worst first',
      },
    ],
  },
  {
    subheader: 'Members',
    items: [
      {
        title: 'Members',
        path: paths.dashboard.users.root,
        icon: <Iconify icon="solar:users-group-rounded-bold-duotone" />,
        caption: 'Find an account and read it',
      },
      {
        title: 'Orders',
        path: paths.dashboard.orders,
        icon: <Iconify icon="solar:bag-4-bold-duotone" />,
        caption: 'Pack, cancel, refund, re-address',
      },
      {
        title: 'Fraud queue',
        path: paths.dashboard.fraud.root,
        icon: <Iconify icon="solar:shield-warning-bold-duotone" />,
        caption: 'Flags to confirm or dismiss',
      },
    ],
  },
  {
    subheader: 'Shop',
    items: [
      {
        title: 'Catalogue',
        path: paths.dashboard.catalogue,
        icon: <Iconify icon="solar:box-bold-duotone" />,
        caption: 'Items, prices, coins or money, stock',
      },
      {
        title: 'Categories',
        path: paths.dashboard.categories,
        icon: <Iconify icon="solar:widget-4-bold-duotone" />,
        caption: 'What each shelf carries, and its subcategories',
      },
      {
        title: 'Coupons',
        path: paths.dashboard.coupons,
        icon: <Iconify icon="solar:ticket-sale-bold-duotone" />,
        caption: 'Campaigns, and what each has given away',
      },
      {
        title: 'Baskets',
        path: paths.dashboard.baskets,
        icon: <Iconify icon="solar:cart-large-minimalistic-bold-duotone" />,
        caption: 'Nobody checked out — and what they want',
      },
      {
        title: 'Reviews',
        path: paths.dashboard.reviews,
        icon: <Iconify icon="solar:star-bold-duotone" />,
        caption: 'What members wrote, worst first',
      },
      {
        title: 'Messages',
        path: paths.dashboard.messages,
        icon: <Iconify icon="solar:plain-bold-duotone" />,
        caption: 'Tell a segment something',
      },
    ],
  },
  {
    subheader: 'Fitness & food',
    items: [
      {
        title: 'Challenges',
        path: paths.dashboard.challenges,
        icon: <Iconify icon="solar:flag-2-bold-duotone" />,
        caption: 'What each pays, and what it has paid',
      },
      {
        title: 'Achievements',
        path: paths.dashboard.achievements,
        icon: <Iconify icon="solar:medal-ribbons-star-bold-duotone" />,
        caption: 'Badges, who holds them, what unlocks them',
      },
      {
        title: 'Workouts',
        path: paths.dashboard.workouts,
        icon: <Iconify icon="solar:dumbbell-large-bold-duotone" />,
        caption: 'Exercises, and the templates built from them',
      },
      {
        title: 'Nutrition',
        path: paths.dashboard.nutrition,
        icon: <Iconify icon="solar:heart-pulse-bold-duotone" />,
        caption: 'The targets a member starts with',
      },
      {
        title: 'Food library',
        path: paths.dashboard.foods,
        icon: <Iconify icon="solar:donut-bitten-bold-duotone" />,
        caption: 'What they search, quick-add — and a sheet to import',
      },
      {
        title: 'Diet plans',
        path: paths.dashboard.dietPlans,
        icon: <Iconify icon="solar:clipboard-list-bold-duotone" />,
        caption: 'Programmes of days and meals',
      },
    ],
  },
  {
    subheader: 'System',
    items: [
      {
        title: 'Notifications',
        path: paths.dashboard.notifications,
        icon: <Iconify icon="solar:bell-bing-bold-duotone" />,
        caption: 'What was sent, and what became of it',
      },
      {
        title: 'Support',
        path: paths.dashboard.support,
        icon: <Iconify icon="solar:chat-round-dots-bold-duotone" />,
        caption: 'Who is waiting for an answer',
      },
      {
        title: 'Help centre',
        path: paths.dashboard.faq,
        icon: <Iconify icon="solar:book-bookmark-bold-duotone" />,
        caption: 'Articles and the app guide',
      },
      {
        title: 'Leaderboard',
        path: paths.dashboard.leaderboard,
        icon: <Iconify icon="solar:cup-star-bold-duotone" />,
        caption: 'The prize ladder and its words',
      },
      {
        title: 'Quotes & tips',
        path: paths.dashboard.quotes,
        icon: <Iconify icon="solar:quote-up-square-bold-duotone" />,
        caption: 'The lines each screen says',
      },
      {
        title: 'App config',
        path: paths.dashboard.config,
        icon: <Iconify icon="solar:tuning-square-bold-duotone" />,
        caption: 'Every other knob, section by section',
      },
    ],
  },
  {
    subheader: 'Decide',
    items: [
      {
        title: 'Steps config',
        path: paths.dashboard.steps,
        icon: <Iconify icon="solar:settings-bold-duotone" />,
        caption: 'Counting, nudges, thresholds, rate',
      },
      {
        title: 'Step economy',
        path: paths.dashboard.economy,
        icon: <Iconify icon="solar:wallet-money-bold-duotone" />,
        caption: 'What minting steps would cost',
      },
      {
        title: 'Releases',
        path: paths.dashboard.releases,
        icon: <Iconify icon="solar:cloud-upload-bold-duotone" />,
        caption: 'Builds and the update wall',
      },
    ],
  },
];
