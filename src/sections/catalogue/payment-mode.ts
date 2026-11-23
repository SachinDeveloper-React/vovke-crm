import type { CatalogueItem, ShopSettings } from '@/src/lib/types';

/**
 * No payment gateway, no money products (D-109).
 *
 * While the API cannot take money it sells every product for coins, whatever
 * the product is set to, and refuses to make one a `money` or `mixed`
 * product — that would quietly become a real money product the day a
 * gateway is connected. The panel says the same before anyone tries: those
 * two modes are offered disabled. An API from before the flag existed sends
 * nothing, and is read as taking money, as it did.
 */
export const moneyOff = (shop: Pick<ShopSettings, 'moneyPayments'>): boolean => shop.moneyPayments === false;

/** The modes that need money collected, and so a gateway. */
export const needsGateway = (mode: string): boolean => mode === 'money' || mode === 'mixed';

/**
 * Where the mode in force comes from, in a few words. A product's own mode
 * only differs from the one in force while there is no gateway: set to
 * money, sold for coins.
 */
export function modeSource(item: Pick<CatalogueItem, 'paymentMode' | 'effectivePaymentMode'>): string {
  if (item.paymentMode && item.paymentMode !== item.effectivePaymentMode) return `set to ${item.paymentMode} · no payment gateway`;
  return item.paymentMode ? 'its own' : 'the shop’s';
}
