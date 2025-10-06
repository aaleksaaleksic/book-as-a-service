// SUBSCRIPTION TYPES

export type SubscriptionType = 'MONTHLY' | 'SIX_MONTH' | 'YEARLY' | 'TRIAL';

export interface Subscription {
    id: number;
    userId: number;
    type: SubscriptionType; // Backend sends 'type' not 'planType'
    planType?: SubscriptionPlan; // Keep for backward compatibility
    status: SubscriptionStatus;
    startDate: string;
    endDate: string;
    autoRenew: boolean;
    priceInRsd: number; // Backend sends 'priceInRsd'
    priceRSD?: number; // Keep for backward compatibility
    trialEndDate?: string;
    cancelledAt?: string;
    canceledAt?: string; // Backend sends 'canceledAt'
    cancelReason?: string;
    createdAt: string;
    updatedAt: string;
    // Additional backend fields
    isActive?: boolean;
    isExpired?: boolean;
    isTrial?: boolean;
    isCanceled?: boolean;
    daysRemaining?: number;
    statusDescription?: string;
}

export type SubscriptionPlan = 'MONTHLY' | 'SIX_MONTH' | 'YEARLY';

export type SubscriptionStatus =
    | 'ACTIVE'
    | 'TRIAL'
    | 'EXPIRED'
    | 'CANCELED'
    | 'NONE'
    | 'PAST_DUE'
    | 'PENDING';

export interface SubscriptionPlanDetails {
    planType: SubscriptionPlan;
    name: string;
    description: string;
    priceRSD: number;
    discountPercentage?: number;
    features: string[];
    popular?: boolean;
    trialDays?: number;
}

// PAYMENT TYPES

export interface Payment {
    id: number;
    userId: number;
    subscriptionId: number;
    amountRSD: number;
    currency: 'RSD';
    status: PaymentStatus;
    paymentMethod: PaymentMethod;
    transactionId?: string;
    failureReason?: string;
    refundAmount?: number;
    createdAt: string;
    processedAt?: string;
    refundedAt?: string;
}

export type PaymentStatus =
    | 'PENDING'
    | 'COMPLETED'
    | 'FAILED'
    | 'REFUNDED'
    | 'PARTIALLY_REFUNDED'
    | 'CANCELED';

export type PaymentMethod =
    | 'NLB_PAY'
    | 'MOCK_PAYMENT'
    | 'CREDIT_CARD'
    | 'BANK_TRANSFER';

export interface PaymentIntent {
    id: string;
    amount: number;
    currency: 'RSD';
    planType: SubscriptionPlan;
    userId: number;
    clientSecret: string;
    status: PaymentIntentStatus;
    createdAt: string;
    expiresAt: string;
}

export type PaymentIntentStatus =
    | 'CREATED'
    | 'PROCESSING'
    | 'SUCCEEDED'
    | 'FAILED'
    | 'EXPIRED';

// BILLING TYPES


export interface BillingHistory {
    payments: Payment[];
    totalPaid: number;
    totalRefunded: number;
    nextBillingDate?: string;
    billingCycle: SubscriptionPlan;
}

export interface Invoice {
    id: number;
    paymentId: number;
    userId: number;
    invoiceNumber: string;
    amount: number;
    taxAmount: number;
    totalAmount: number;
    currency: 'RSD';
    issuedAt: string;
    dueDate: string;
    paidAt?: string;
    status: InvoiceStatus;
    downloadUrl: string;
}

export type InvoiceStatus =
    | 'DRAFT'
    | 'SENT'
    | 'PAID'
    | 'OVERDUE'
    | 'CANCELED';


// SUBSCRIPTION MANAGEMENT TYPES


export interface SubscriptionChangeRequest {
    newPlanType: SubscriptionPlan;
    changeType: SubscriptionChangeType;
    effectiveDate: string;
    prorationAmount?: number;
}

export type SubscriptionChangeType =
    | 'UPGRADE'
    | 'DOWNGRADE'
    | 'CANCEL'
    | 'REACTIVATE';

export interface CancelSubscriptionRequest {
    reason: CancelReason;
    feedback?: string;
    cancelImmediately?: boolean;
}

export type CancelReason =
    | 'TOO_EXPENSIVE'
    | 'NOT_USING_ENOUGH'
    | 'TECHNICAL_ISSUES'
    | 'FOUND_ALTERNATIVE'
    | 'TEMPORARY_BREAK'
    | 'OTHER';

export interface SubscriptionUsage {
    currentPeriodStart: string;
    currentPeriodEnd: string;
    booksRead: number;
    totalReadingTime: number;
    sessionsCount: number;
    averageSessionLength: number;
    usagePercentage: number;
}

// TRIAL AND PROMOTIONS TYPES


export interface TrialInfo {
    isTrialActive: boolean;
    trialStartDate?: string;
    trialEndDate?: string;
    daysRemaining?: number;
    trialExtensions?: TrialExtension[];
}

export interface TrialExtension {
    id: number;
    userId: number;
    reason: string;
    additionalDays: number;
    grantedAt: string;
    grantedBy: number;
}

export interface PromoCode {
    code: string;
    discountType: DiscountType;
    discountValue: number;
    validFrom: string;
    validUntil: string;
    usageLimit?: number;
    usedCount: number;
    applicablePlans: SubscriptionType[];
    active: boolean;
}

export type DiscountType =
    | 'PERCENTAGE'
    | 'FIXED_AMOUNT'
    | 'FREE_TRIAL_EXTENSION';