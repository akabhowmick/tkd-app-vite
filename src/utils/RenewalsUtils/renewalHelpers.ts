import { Renewal } from "../../types/student_renewal";

/**
 * Calculates the new expiration date for a renewal based on the current renewal's expiration
 * @param currentRenewal - The current renewal that is being renewed
 * @param durationMonths - Duration in months for the new renewal
 * @returns ISO date string for the new expiration date
 */
export function calculateNewExpirationDate(
  currentRenewal: Renewal,
  durationMonths: number
): string {
  const currentExpiration = new Date(currentRenewal.expiration_date);

  // Start the new renewal from the day after the current expiration
  const newStartDate = new Date(currentExpiration);
  newStartDate.setDate(newStartDate.getDate() + 1);

  // Calculate the new expiration date by adding the duration in months
  const newExpirationDate = new Date(newStartDate);
  newExpirationDate.setMonth(newExpirationDate.getMonth() + durationMonths);

  // Return as ISO string (YYYY-MM-DD format)
  return newExpirationDate.toISOString().split("T")[0];
}

/**
 * Calculates expiration date from a given start date
 * @param startDate - The start date (payment date)
 * @param durationMonths - Duration in months
 * @returns ISO date string for expiration
 */
export function calculateExpirationFromStart(startDate: string, durationMonths: number): string {
  const start = new Date(startDate);
  const expiration = new Date(start);
  expiration.setMonth(expiration.getMonth() + durationMonths);

  return expiration.toISOString().split("T")[0];
}

/**
 * Calculates the number of days until expiration (negative if expired)
 * @param expirationDate - The expiration date to check
 * @returns Number of days (negative means already expired)
 */
export function calculateDaysUntilExpiration(expirationDate: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const expiration = new Date(expirationDate);
  expiration.setHours(0, 0, 0, 0);

  const diffTime = expiration.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Checks if a renewal is within the grace period
 * @param expirationDate - The expiration date
 * @param gracePeriodDays - Number of days for grace period (default: 7)
 * @returns True if within grace period
 */
export function isInGracePeriod(expirationDate: string, gracePeriodDays: number = 7): boolean {
  const daysOverdue = -calculateDaysUntilExpiration(expirationDate);
  return daysOverdue > 0 && daysOverdue <= gracePeriodDays;
}

/**
 * Checks if a renewal is expiring soon
 * @param expirationDate - The expiration date
 * @param warningDays - Number of days before expiration to warn (default: 15)
 * @returns True if expiring within warning period
 */
export function isExpiringSoon(expirationDate: string, warningDays: number = 15): boolean {
  const daysUntil = calculateDaysUntilExpiration(expirationDate);
  return daysUntil >= 0 && daysUntil <= warningDays;
}

/**
 * Validates if a renewal's dates are logical
 * @param paymentDate - Payment date
 * @param expirationDate - Expiration date
 * @returns Error message if invalid, null if valid
 */
export function validateRenewalDates(paymentDate: string, expirationDate: string): string | null {
  const payment = new Date(paymentDate);
  const expiration = new Date(expirationDate);

  if (isNaN(payment.getTime())) {
    return "Invalid payment date";
  }

  if (isNaN(expiration.getTime())) {
    return "Invalid expiration date";
  }

  if (expiration <= payment) {
    return "Expiration date must be after payment date";
  }

  return null;
}

/**
 * Formats a date for display
 * @param dateString - ISO date string
 * @param locale - Locale for formatting (default: 'en-US')
 * @returns Formatted date string
 */
export function formatRenewalDate(dateString: string, locale: string = "en-US"): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Calculates the payment amount per class
 * @param totalAmount - Total amount due
 * @param numberOfClasses - Number of classes included
 * @returns Amount per class
 */
export function calculateAmountPerClass(totalAmount: number, numberOfClasses: number): number {
  if (numberOfClasses <= 0) return 0;
  return totalAmount / numberOfClasses;
}

/**
 * Calculates remaining balance
 * @param amountDue - Total amount due
 * @param amountPaid - Amount already paid
 * @returns Remaining balance
 */
export function calculateRemainingBalance(amountDue: number, amountPaid: number): number {
  return Math.max(0, amountDue - amountPaid);
}

/**
 * Calculates payment percentage completed
 * @param amountDue - Total amount due
 * @param amountPaid - Amount already paid
 * @returns Percentage (0-100)
 */
export function calculatePaymentPercentage(amountDue: number, amountPaid: number): number {
  if (amountDue <= 0) return 0;
  return Math.min(100, Math.round((amountPaid / amountDue) * 100));
}

/**
 * Determines renewal status based on dates and payment
 * @param renewal - The renewal object
 * @returns Status string
 */
export function determineRenewalStatus(
  renewal: Renewal
): "active" | "expiring_soon" | "grace_period" | "expired" | "paid" {
  const isPaid = renewal.amount_paid >= renewal.amount_due;
  const daysUntilExpiration = calculateDaysUntilExpiration(renewal.expiration_date);

  if (isPaid) return "paid";
  if (daysUntilExpiration < -7) return "expired";
  if (daysUntilExpiration < 0) return "grace_period";
  if (daysUntilExpiration <= 15) return "expiring_soon";
  return "active";
}
