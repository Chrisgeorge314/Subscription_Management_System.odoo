import prisma from '../db.js';

export class BillingService {
  /**
   * Helper to add interval to a date based on billing frequency
   */
  static calculateNextPeriod(startDate: Date, frequency: string): { periodEnd: Date; nextBilling: Date } {
    const end = new Date(startDate);
    const next = new Date(startDate);

    switch (frequency) {
      case 'DAILY':
        end.setDate(end.getDate() + 1);
        next.setDate(next.getDate() + 1);
        break;
      case 'WEEKLY':
        end.setDate(end.getDate() + 7);
        next.setDate(next.getDate() + 7);
        break;
      case 'YEARLY':
        end.setFullYear(end.getFullYear() + 1);
        next.setFullYear(next.getFullYear() + 1);
        break;
      case 'MONTHLY':
      default:
        end.setMonth(end.getMonth() + 1);
        next.setMonth(next.getMonth() + 1);
        break;
    }

    return { periodEnd: end, nextBilling: next };
  }

  /**
   * Run recurring billing cycle.
   * Idempotent: Skips if an invoice already exists for the subscription and period.
   */
  static async runRecurringBilling(): Promise<{ generated: number; skipped: number; autoClosed: number }> {
    const now = new Date();
    let generated = 0;
    let skipped = 0;
    let autoClosed = 0;

    // 1. Process active subscriptions due for billing
    const dueSubscriptions = await prisma.subscription.findMany({
      where: {
        status: 'ACTIVE',
        nextBillingDate: { lte: now },
      },
      include: {
        customer: true,
        plan: true,
        lines: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    for (const sub of dueSubscriptions) {
      // Check if subscription has expired and should auto-close
      if (sub.expiryDate && new Date(sub.expiryDate) <= now) {
        if (sub.plan.autoCloseOnEnd) {
          await prisma.subscription.update({
            where: { id: sub.id },
            data: {
              status: 'CLOSED',
              closedDate: now,
            },
          });
          await prisma.subscriptionHistory.create({
            data: {
              subscriptionId: sub.id,
              action: 'CLOSED',
              previousStatus: 'ACTIVE',
              newStatus: 'CLOSED',
              notes: 'Subscription reached expiry date and auto-closed according to plan rules.',
              performedBy: 'System Automation',
            },
          });
          autoClosed++;
          continue;
        }
      }

      // Idempotency check: see if invoice already exists for this exact period start
      const existingInvoice = await prisma.invoice.findFirst({
        where: {
          subscriptionId: sub.id,
          billingPeriodStart: sub.currentPeriodStart,
          billingPeriodEnd: sub.currentPeriodEnd,
        },
      });

      if (existingInvoice) {
        skipped++;
        // Advance billing date if already processed
        const { periodEnd, nextBilling } = this.calculateNextPeriod(sub.currentPeriodEnd, sub.billingFrequency);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: sub.currentPeriodEnd,
            currentPeriodEnd: periodEnd,
            nextBillingDate: nextBilling,
          },
        });
        continue;
      }

      // Check applicable discounts
      let discountAmount = sub.discountAmount || 0;
      const activeDiscount = await prisma.discountRule.findFirst({
        where: {
          isActive: true,
          scope: 'SUBSCRIPTION',
          minPurchaseAmount: { lte: sub.subtotal },
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
      });

      if (activeDiscount) {
        if (!activeDiscount.maxUsageCount || activeDiscount.currentUsageCount < activeDiscount.maxUsageCount) {
          if (activeDiscount.type === 'PERCENTAGE') {
            discountAmount = (sub.subtotal * activeDiscount.value) / 100;
          } else {
            discountAmount = activeDiscount.value;
          }
          await prisma.discountRule.update({
            where: { id: activeDiscount.id },
            data: { currentUsageCount: { increment: 1 } },
          });
        }
      }

      const taxableAmount = Math.max(0, sub.subtotal - discountAmount);
      const taxRate = 18.0; // Standard GST
      const taxAmount = (taxableAmount * taxRate) / 100;
      const totalAmount = Math.round((taxableAmount + taxAmount) * 100) / 100;

      // Generate invoice number
      const count = await prisma.invoice.count();
      const invoiceNumber = `INV-${now.getFullYear()}-${(count + 1001).toString()}`;

      const dueDate = new Date(now);
      dueDate.setDate(dueDate.getDate() + 15); // Net 15

      // Create recurring invoice in transaction
      await prisma.$transaction(async (tx) => {
        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber,
            customerId: sub.customerId,
            subscriptionId: sub.id,
            billingPeriodStart: sub.currentPeriodStart,
            billingPeriodEnd: sub.currentPeriodEnd,
            issueDate: now,
            dueDate,
            status: 'SENT',
            subtotal: sub.subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            paidAmount: 0,
            outstandingAmount: totalAmount,
            paymentTerms: sub.paymentTerms,
            lines: {
              create: sub.lines.map((l) => ({
                productId: l.productId,
                variantId: l.variantId,
                description: `${l.description} (Billing Period: ${sub.currentPeriodStart.toISOString().split('T')[0]} to ${sub.currentPeriodEnd.toISOString().split('T')[0]})`,
                quantity: l.quantity,
                unitPrice: l.unitPrice,
                taxRate: l.taxRate,
                taxAmount: (l.unitPrice * l.quantity * l.taxRate) / 100,
                totalAmount: l.totalAmount,
              })),
            },
          },
        });

        // Advance subscription period
        const { periodEnd, nextBilling } = this.calculateNextPeriod(sub.currentPeriodEnd, sub.billingFrequency);
        await tx.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: sub.currentPeriodEnd,
            currentPeriodEnd: periodEnd,
            nextBillingDate: nextBilling,
          },
        });

        // Audit log
        await tx.subscriptionHistory.create({
          data: {
            subscriptionId: sub.id,
            action: 'INVOICE_GENERATED',
            newStatus: 'ACTIVE',
            notes: `Recurring invoice ${invoiceNumber} automatically generated for ₹${totalAmount.toLocaleString('en-IN')}`,
            performedBy: 'Billing Automation Engine',
          },
        });

        // Notification
        await tx.notification.create({
          data: {
            type: 'INFO',
            title: 'New Recurring Invoice Generated',
            message: `Invoice ${invoiceNumber} created for ${sub.customer.name} (₹${totalAmount.toLocaleString('en-IN')})`,
            link: '/invoices',
          },
        });
      });

      generated++;
    }

    // 2. Mark overdue invoices
    await prisma.invoice.updateMany({
      where: {
        status: { in: ['SENT', 'CONFIRMED', 'PARTIALLY_PAID'] },
        dueDate: { lt: now },
        outstandingAmount: { gt: 0 },
      },
      data: {
        status: 'OVERDUE',
      },
    });

    return { generated, skipped, autoClosed };
  }
}
