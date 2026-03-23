import { Platform } from 'react-native';
import Purchases, { LOG_LEVEL, PurchasesPackage } from 'react-native-purchases';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ENTITLEMENT_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_KEY || 'pro';
const MONTHLY_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RC_MONTHLY_PRODUCT_ID || 'com.mikhailspeaks.promptpal.pro.monthly';
const YEARLY_PRODUCT_ID =
  process.env.EXPO_PUBLIC_RC_YEARLY_PRODUCT_ID || 'com.mikhailspeaks.promptpal.pro.yearly';

let isConfigured = false;

export type SubscriptionPlanId = 'monthly' | 'yearly';

export async function configureRevenueCat(appUserId?: string | null): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    return false;
  }

  if (!IOS_API_KEY) {
    console.warn('[RevenueCat] Missing EXPO_PUBLIC_REVENUECAT_IOS_API_KEY');
    return false;
  }

  if (!isConfigured) {
    Purchases.setLogLevel(LOG_LEVEL.WARN);
    await Purchases.configure({
      apiKey: IOS_API_KEY,
      appUserID: appUserId || undefined,
    });
    isConfigured = true;
    return true;
  }

  if (appUserId) {
    try {
      await Purchases.logIn(appUserId);
    } catch {
      // If user is already linked or unchanged, this can fail safely.
    }
  }
  return true;
}

export function isProEntitled(customerInfo: any): boolean {
  if (!customerInfo) return false;
  return Boolean(customerInfo.entitlements.active[ENTITLEMENT_KEY]);
}

export async function getCustomerInfo() {
  if (!isConfigured) return null;
  return Purchases.getCustomerInfo();
}

export async function purchasePlan(planId: SubscriptionPlanId) {
  if (!isConfigured) {
    throw new Error('RevenueCat is not configured');
  }

  const offerings = await Purchases.getOfferings();
  const current = offerings.current;
  if (!current) {
    throw new Error('No current offering available');
  }

  const targetProductId = planId === 'monthly' ? MONTHLY_PRODUCT_ID : YEARLY_PRODUCT_ID;
  const normalizedTarget = targetProductId.replace('.-', '.').toLowerCase();
  const preferredPackageId = planId === 'monthly' ? '$rc_monthly' : '$rc_annual';

  const pkg = current.availablePackages.find(
    (candidate: PurchasesPackage) => candidate.identifier === preferredPackageId
  ) ?? current.availablePackages.find(
    (candidate: PurchasesPackage) =>
      candidate.product.identifier.toLowerCase() === targetProductId.toLowerCase() ||
      candidate.product.identifier.replace('.-', '.').toLowerCase() === normalizedTarget
  );

  if (!pkg) {
    const available = current.availablePackages
      .map((candidate: PurchasesPackage) => `${candidate.identifier}:${candidate.product.identifier}`)
      .join(', ');
    throw new Error(`No package found for product: ${targetProductId}. Available: ${available}`);
  }

  const purchaseResult = await Purchases.purchasePackage(pkg);
  return purchaseResult.customerInfo;
}

export async function restorePurchases() {
  if (!isConfigured) {
    throw new Error('RevenueCat is not configured');
  }
  return Purchases.restorePurchases();
}
