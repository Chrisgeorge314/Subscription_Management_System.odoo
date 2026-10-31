import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Brightloop database...');

  // Clean existing data
  await prisma.notification.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.invoiceLine.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.subscriptionHistory.deleteMany();
  await prisma.subscriptionLine.deleteMany();
  await prisma.subscription.deleteMany();
  await prisma.quotationLine.deleteMany();
  await prisma.quotation.deleteMany();
  await prisma.quotationTemplate.deleteMany();
  await prisma.subscriptionPlan.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.discountRule.deleteMany();
  await prisma.taxRule.deleteMany();
  await prisma.user.deleteMany();
  await prisma.customer.deleteMany();

  // 1. Create Tax Rules (GST rates)
  const gst18 = await prisma.taxRule.create({
    data: {
      name: 'GST 18% (Standard SaaS)',
      code: 'GST-18',
      rate: 18.0,
      type: 'PERCENTAGE',
      applicableProductTypes: 'ALL',
      isActive: true,
    },
  });

  const gst12 = await prisma.taxRule.create({
    data: {
      name: 'GST 12% (Telecom / Hardware Addon)',
      code: 'GST-12',
      rate: 12.0,
      type: 'PERCENTAGE',
      applicableProductTypes: 'PHYSICAL',
      isActive: true,
    },
  });

  const gst0 = await prisma.taxRule.create({
    data: {
      name: 'Zero Rated / SEZ Export',
      code: 'GST-0',
      rate: 0.0,
      type: 'PERCENTAGE',
      applicableProductTypes: 'ALL',
      isActive: true,
    },
  });

  // 2. Create Discount Rules
  await prisma.discountRule.createMany({
    data: [
      {
        name: 'Early Adopter 15%',
        code: 'EARLY15',
        type: 'PERCENTAGE',
        value: 15.0,
        scope: 'SUBSCRIPTION',
        minPurchaseAmount: 10000,
        maxUsageCount: 100,
        currentUsageCount: 18,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
      {
        name: 'Enterprise Festive Off ₹5,000',
        code: 'FESTIVE5K',
        type: 'FIXED',
        value: 5000.0,
        scope: 'SUBSCRIPTION',
        minPurchaseAmount: 50000,
        maxUsageCount: 50,
        currentUsageCount: 12,
        startDate: new Date('2026-08-01'),
        endDate: new Date('2026-11-30'),
        isActive: true,
      },
      {
        name: 'Annual Advance 20%',
        code: 'ANNUAL20',
        type: 'PERCENTAGE',
        value: 20.0,
        scope: 'SUBSCRIPTION',
        minPurchaseAmount: 25000,
        maxUsageCount: 200,
        currentUsageCount: 42,
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31'),
        isActive: true,
      },
    ],
  });

  // 3. Create Products & Variants
  // Product 1: Brightloop ERP Suite
  const pErp = await prisma.product.create({
    data: {
      name: 'Brightloop ERP Suite',
      code: 'PRD-ERP-01',
      type: 'SERVICE',
      salesPrice: 45000,
      costPrice: 15000,
      description: 'Comprehensive enterprise ERP with accounting, inventory, and subscription engine.',
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Standard Edition', sku: 'ERP-STD', additionalPrice: 0, isDefault: true },
          { name: 'ODOO Brand Integration Tier', sku: 'ERP-ODOO', additionalPrice: 560, isDefault: false },
          { name: 'Multi-Tenant Cloud Dedicated', sku: 'ERP-MULTI', additionalPrice: 12500, isDefault: false },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 2: CRM & Sales Automation
  const pCrm = await prisma.product.create({
    data: {
      name: 'Brightloop CRM & Sales Engine',
      code: 'PRD-CRM-02',
      type: 'SERVICE',
      salesPrice: 24000,
      costPrice: 8000,
      description: 'AI-assisted pipeline, omni-channel messaging, and quotation generator.',
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Team Pack (Up to 10 users)', sku: 'CRM-10', additionalPrice: 0, isDefault: true },
          { name: 'Scale Pack (Up to 50 users)', sku: 'CRM-50', additionalPrice: 15000, isDefault: false },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 3: Cloud POS & Retail Terminal
  const pPos = await prisma.product.create({
    data: {
      name: 'Retail Cloud POS & Barcode Sync',
      code: 'PRD-POS-03',
      type: 'SERVICE',
      salesPrice: 18000,
      costPrice: 6000,
      description: 'Modern offline-first web POS for supermarkets and retail chains.',
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Single Counter License', sku: 'POS-SGL', additionalPrice: 0, isDefault: true },
          { name: 'Multi-Store Multi-Register Sync', sku: 'POS-MLT', additionalPrice: 8500, isDefault: false },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 4: Dedicated API & Webhook Gateway
  const pApi = await prisma.product.create({
    data: {
      name: 'High-Throughput API Gateway',
      code: 'PRD-API-04',
      type: 'DIGITAL',
      salesPrice: 12000,
      costPrice: 3500,
      description: 'Enterprise API rate limit booster with 99.99% SLA and custom webhooks.',
      status: 'ACTIVE',
      variants: {
        create: [
          { name: '100k requests/mo', sku: 'API-100K', additionalPrice: 0, isDefault: true },
          { name: '1M requests/mo', sku: 'API-1M', additionalPrice: 18000, isDefault: false },
        ],
      },
    },
    include: { variants: true },
  });

  // Product 5: Priority Support & SLA
  const pSupport = await prisma.product.create({
    data: {
      name: '24/7 Dedicated Technical Support',
      code: 'PRD-SUP-05',
      type: 'SERVICE',
      salesPrice: 8000,
      costPrice: 4000,
      description: '15-minute response SLA, dedicated account manager, and phone hotline.',
      status: 'ACTIVE',
      variants: {
        create: [
          { name: 'Standard SLA (24h)', sku: 'SUP-STD', additionalPrice: 0, isDefault: true },
          { name: 'Gold SLA (1h with Dedicated TAM)', sku: 'SUP-GOLD', additionalPrice: 9500, isDefault: false },
        ],
      },
    },
    include: { variants: true },
  });

  // 4. Create Subscription Plans
  const planEnterpriseMonthly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Enterprise Monthly',
      code: 'PLAN-ENT-M',
      productId: pErp.id,
      billingFrequency: 'MONTHLY',
      price: 120000,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnEnd: false,
      status: 'ACTIVE',
    },
  });

  const planBusinessYearly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Business Yearly',
      code: 'PLAN-BIZ-Y',
      productId: pErp.id,
      billingFrequency: 'YEARLY',
      price: 58400,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: false,
      allowRenewal: true,
      autoCloseOnEnd: false,
      status: 'ACTIVE',
    },
  });

  const planStarterMonthly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Starter Monthly',
      code: 'PLAN-STR-M',
      productId: pCrm.id,
      billingFrequency: 'MONTHLY',
      price: 32000,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnEnd: true,
      status: 'ACTIVE',
    },
  });

  const planProMonthly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Pro Monthly',
      code: 'PLAN-PRO-M',
      productId: pCrm.id,
      billingFrequency: 'MONTHLY',
      price: 74800,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnEnd: false,
      status: 'ACTIVE',
    },
  });

  const planBusinessMonthly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Business Monthly',
      code: 'PLAN-BIZ-M',
      productId: pPos.id,
      billingFrequency: 'MONTHLY',
      price: 96000,
      minQuantity: 1,
      allowPause: true,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnEnd: false,
      status: 'ACTIVE',
    },
  });

  const planApiWeekly = await prisma.subscriptionPlan.create({
    data: {
      name: 'Developer Weekly Sandbox',
      code: 'PLAN-DEV-W',
      productId: pApi.id,
      billingFrequency: 'WEEKLY',
      price: 3500,
      minQuantity: 1,
      allowPause: false,
      allowEarlyClosure: true,
      allowRenewal: true,
      autoCloseOnEnd: true,
      status: 'ACTIVE',
    },
  });

  // 5. Create Quotation Templates
  const templateStandard = await prisma.quotationTemplate.create({
    data: {
      name: 'Standard SaaS Enterprise Onboarding',
      description: 'Default quotation template for new mid-to-large business clients with 30-day validity.',
      validityDays: 30,
      defaultTerms: 'Payment due within 15 days of invoice date. Subscription activates automatically upon payment verification.',
    },
  });

  // 6. Create Realistic Customers (16 customers across India)
  const customersData = [
    {
      name: 'Technova Pvt Ltd',
      email: 'customer@technova.com',
      phone: '+91 98470 12345',
      company: 'Technova Solutions India Pvt Ltd',
      billingAddress: 'Infopark Phase II, Kakkanad',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682042',
      taxNumber: '32AAACT1234F1Z8',
      status: 'ACTIVE',
    },
    {
      name: 'Kerala Traders',
      email: 'billing@keralatraders.in',
      phone: '+91 94471 23456',
      company: 'Kerala Spices & Commodities Ltd',
      billingAddress: 'Broadway, Marine Drive',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682031',
      taxNumber: '32AABCK5678G1Z2',
      status: 'ACTIVE',
    },
    {
      name: 'GreenLeaf Stores',
      email: 'accounts@greenleafstores.com',
      phone: '+91 98950 34567',
      company: 'GreenLeaf Retail Chains Pvt Ltd',
      billingAddress: 'MG Road, Panampilly Nagar',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682036',
      taxNumber: '32AAACG9012H1Z5',
      status: 'ACTIVE',
    },
    {
      name: 'Axis Solutions',
      email: 'operations@axissolutions.io',
      phone: '+91 80234 56789',
      company: 'Axis Cloud & Logistics Technologies',
      billingAddress: 'Indiranagar 100ft Road',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560038',
      taxNumber: '29AAACA4321J1Z1',
      status: 'ACTIVE',
    },
    {
      name: 'Bright Retail',
      email: 'purchase@brightretail.org',
      phone: '+91 44281 98765',
      company: 'Bright Retail Consumer Goods LLP',
      billingAddress: 'Anna Salai, T Nagar',
      city: 'Chennai',
      state: 'Tamil Nadu',
      postalCode: '600017',
      taxNumber: '33AAACB8765K1Z9',
      status: 'ACTIVE',
    },
    {
      name: 'Malabar Logistics',
      email: 'info@malabarlogistics.com',
      phone: '+91 49527 11223',
      company: 'Malabar Express Cargo & Warehousing',
      billingAddress: 'CH Flyover Road',
      city: 'Kozhikode',
      state: 'Kerala',
      postalCode: '673001',
      taxNumber: '32AAACM7654L1Z3',
      status: 'ACTIVE',
    },
    {
      name: 'Vertex Financials',
      email: 'compliance@vertexfin.in',
      phone: '+91 22409 88776',
      company: 'Vertex Capital Advisory Pvt Ltd',
      billingAddress: 'Bandra-Kurla Complex (BKC)',
      city: 'Mumbai',
      state: 'Maharashtra',
      postalCode: '400051',
      taxNumber: '27AAACV6543M1Z6',
      status: 'ACTIVE',
    },
    {
      name: 'Zenith Health Systems',
      email: 'admin@zenithhealth.com',
      phone: '+91 40667 99881',
      company: 'Zenith Diagnostics & Telehealth',
      billingAddress: 'HITEC City, Madhapur',
      city: 'Hyderabad',
      state: 'Telangana',
      postalCode: '500081',
      taxNumber: '36AAACZ5432N1Z4',
      status: 'ACTIVE',
    },
    {
      name: 'Pinnacle Agritech',
      email: 'support@pinnacleagri.com',
      phone: '+91 48723 44556',
      company: 'Pinnacle Hydroponics & Farmtech',
      billingAddress: 'Round North',
      city: 'Thrissur',
      state: 'Kerala',
      postalCode: '680001',
      taxNumber: '32AAACP4321P1Z7',
      status: 'ACTIVE',
    },
    {
      name: 'Orion Media Labs',
      email: 'billing@orionmedialabs.com',
      phone: '+91 12445 66778',
      company: 'Orion Digital Broadcasting Ltd',
      billingAddress: 'Cyber City, Phase 2',
      city: 'Gurugram',
      state: 'Haryana',
      postalCode: '122002',
      taxNumber: '06AAACO3210Q1Z0',
      status: 'ACTIVE',
    },
    {
      name: 'Cochin Ship Chandler',
      email: 'accounts@cochinship.com',
      phone: '+91 48426 67788',
      company: 'Cochin Maritime Supply Services',
      billingAddress: 'Willingdon Island',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682003',
      taxNumber: '32AAACC2109R1Z8',
      status: 'ACTIVE',
    },
    {
      name: 'Kalyan Digital Prints',
      email: 'contact@kalyandigital.in',
      phone: '+91 48724 11990',
      company: 'Kalyan Commercial Printing Hub',
      billingAddress: 'Swaraj Round South',
      city: 'Thrissur',
      state: 'Kerala',
      postalCode: '680001',
      taxNumber: '32AAACK1098S1Z1',
      status: 'ACTIVE',
    },
    {
      name: 'Apex Robotics India',
      email: 'finance@apexrobotics.co',
      phone: '+91 80491 22334',
      company: 'Apex Industrial Automation Pvt Ltd',
      billingAddress: 'Electronic City Phase 1',
      city: 'Bengaluru',
      state: 'Karnataka',
      postalCode: '560100',
      taxNumber: '29AAACA0987T1Z5',
      status: 'ACTIVE',
    },
    {
      name: 'Travancore Medicals',
      email: 'billing@travancoremed.com',
      phone: '+91 47124 55667',
      company: 'Travancore Pharma Distributorship',
      billingAddress: 'Statue Road',
      city: 'Thiruvananthapuram',
      state: 'Kerala',
      postalCode: '695001',
      taxNumber: '32AAACT9876U1Z9',
      status: 'ACTIVE',
    },
    {
      name: 'Deccan Analytics',
      email: 'ops@deccananalytics.com',
      phone: '+91 20256 77889',
      company: 'Deccan Data Science Consultancy',
      billingAddress: 'Koregaon Park',
      city: 'Pune',
      state: 'Maharashtra',
      postalCode: '411001',
      taxNumber: '27AAACD8765V1Z2',
      status: 'ACTIVE',
    },
    {
      name: 'Oceanic Exports',
      email: 'export@oceanicmarine.in',
      phone: '+91 48422 11335',
      company: 'Oceanic Seafood Processors Ltd',
      billingAddress: 'Thoppumpady Harbour Road',
      city: 'Kochi',
      state: 'Kerala',
      postalCode: '682005',
      taxNumber: '32AAACO7654W1Z4',
      status: 'ACTIVE',
    },
  ];

  const createdCustomers: Record<string, any> = {};

  for (const c of customersData) {
    const cust = await prisma.customer.create({ data: c });
    createdCustomers[c.name] = cust;
  }

  // 7. Create Users (Admin, Staff, Customer)
  const passwordSalt = await bcrypt.genSalt(10);
  const adminPasswordHash = await bcrypt.hash('Admin@1234', passwordSalt);
  const staffPasswordHash = await bcrypt.hash('Staff@1234', passwordSalt);
  const customerPasswordHash = await bcrypt.hash('Customer@1234', passwordSalt);

  await prisma.user.create({
    data: {
      name: 'Admin',
      email: 'admin@brightloop.io',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Sarah Joseph (Staff)',
      email: 'staff@brightloop.io',
      passwordHash: staffPasswordHash,
      role: 'STAFF',
      status: 'ACTIVE',
    },
  });

  await prisma.user.create({
    data: {
      name: 'Rahul Varma (Technova)',
      email: 'customer@technova.com',
      passwordHash: customerPasswordHash,
      role: 'CUSTOMER',
      customerId: createdCustomers['Technova Pvt Ltd'].id,
      status: 'ACTIVE',
    },
  });

  // 8. Create Exact Subscriptions & History Matching Screenshot
  // SUB-2026-1048: Technova Pvt Ltd, Enterprise Monthly, 28 Oct 2026, Active, ₹1,20,000
  const sub1048 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-1048',
      customerId: createdCustomers['Technova Pvt Ltd'].id,
      planId: planEnterpriseMonthly.id,
      status: 'ACTIVE',
      billingFrequency: 'MONTHLY',
      paymentTerms: 'Net 15',
      startDate: new Date('2026-10-28T09:00:00Z'),
      currentPeriodStart: new Date('2026-10-28T09:00:00Z'),
      currentPeriodEnd: new Date('2026-11-28T09:00:00Z'),
      nextBillingDate: new Date('2026-11-05T09:00:00Z'), // Upcoming renewal on Nov 05 matching screenshot
      subtotal: 101694.92,
      taxAmount: 18305.08,
      discountAmount: 0,
      totalAmount: 120000,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: pErp.id,
            variantId: pErp.variants[1]?.id, // ODOO Brand
            description: 'Enterprise ERP Suite - ODOO Brand Integration Tier',
            quantity: 1,
            unitPrice: 101694.92,
            taxRate: 18.0,
            taxAmount: 18305.08,
            totalAmount: 120000,
          },
        ],
      },
      history: {
        create: [
          {
            action: 'CREATED',
            newStatus: 'ACTIVE',
            performedBy: 'Admin',
            notes: 'Subscription activated via confirmed quotation',
          },
        ],
      },
    },
  });

  // SUB-2026-1047: Kerala Traders, Business Yearly, 27 Oct 2026, Active, ₹58,400
  const sub1047 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-1047',
      customerId: createdCustomers['Kerala Traders'].id,
      planId: planBusinessYearly.id,
      status: 'ACTIVE',
      billingFrequency: 'YEARLY',
      paymentTerms: 'Net 30',
      startDate: new Date('2026-10-27T10:00:00Z'),
      currentPeriodStart: new Date('2026-10-27T10:00:00Z'),
      currentPeriodEnd: new Date('2027-10-27T10:00:00Z'),
      nextBillingDate: new Date('2026-11-08T10:00:00Z'), // Renew date matching screenshot
      subtotal: 49491.53,
      taxAmount: 8908.47,
      discountAmount: 0,
      totalAmount: 58400,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: pErp.id,
            description: 'Business Yearly ERP Standard License',
            quantity: 1,
            unitPrice: 49491.53,
            taxRate: 18.0,
            taxAmount: 8908.47,
            totalAmount: 58400,
          },
        ],
      },
      history: {
        create: [
          {
            action: 'CREATED',
            newStatus: 'ACTIVE',
            performedBy: 'Sarah Joseph (Staff)',
            notes: 'Yearly contract initiated',
          },
        ],
      },
    },
  });

  // SUB-2026-1046: GreenLeaf Stores, Starter Monthly, 26 Oct 2026, Pending (DRAFT), ₹32,000
  const sub1046 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-1046',
      customerId: createdCustomers['GreenLeaf Stores'].id,
      planId: planStarterMonthly.id,
      status: 'DRAFT', // Shown as Pending in UI
      billingFrequency: 'MONTHLY',
      paymentTerms: 'Net 15',
      startDate: new Date('2026-10-26T11:00:00Z'),
      currentPeriodStart: new Date('2026-10-26T11:00:00Z'),
      currentPeriodEnd: new Date('2026-11-26T11:00:00Z'),
      nextBillingDate: new Date('2026-11-12T11:00:00Z'),
      subtotal: 27118.64,
      taxAmount: 4881.36,
      discountAmount: 0,
      totalAmount: 32000,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: pCrm.id,
            description: 'CRM Starter Monthly License',
            quantity: 1,
            unitPrice: 27118.64,
            taxRate: 18.0,
            taxAmount: 4881.36,
            totalAmount: 32000,
          },
        ],
      },
    },
  });

  // SUB-2026-1045: Axis Solutions, Pro Monthly, 24 Oct 2026, Active, ₹74,800
  const sub1045 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-1045',
      customerId: createdCustomers['Axis Solutions'].id,
      planId: planProMonthly.id,
      status: 'ACTIVE',
      billingFrequency: 'MONTHLY',
      paymentTerms: 'Net 15',
      startDate: new Date('2026-10-24T14:30:00Z'),
      currentPeriodStart: new Date('2026-10-24T14:30:00Z'),
      currentPeriodEnd: new Date('2026-11-24T14:30:00Z'),
      nextBillingDate: new Date('2026-11-15T14:30:00Z'),
      subtotal: 63389.83,
      taxAmount: 11410.17,
      discountAmount: 0,
      totalAmount: 74800,
      autoRenew: true,
      lines: {
        create: [
          {
            productId: pCrm.id,
            description: 'CRM Pro Monthly License with API access',
            quantity: 1,
            unitPrice: 63389.83,
            taxRate: 18.0,
            taxAmount: 11410.17,
            totalAmount: 74800,
          },
        ],
      },
    },
  });

  // SUB-2026-1044: Bright Retail, Business Monthly, 22 Oct 2026, Paused, ₹96,000
  const sub1044 = await prisma.subscription.create({
    data: {
      subscriptionNumber: 'SUB-2026-1044',
      customerId: createdCustomers['Bright Retail'].id,
      planId: planBusinessMonthly.id,
      status: 'PAUSED',
      billingFrequency: 'MONTHLY',
      paymentTerms: 'Net 15',
      startDate: new Date('2026-10-22T08:00:00Z'),
      pauseDate: new Date('2026-10-25T12:00:00Z'),
      currentPeriodStart: new Date('2026-10-22T08:00:00Z'),
      currentPeriodEnd: new Date('2026-11-22T08:00:00Z'),
      nextBillingDate: new Date('2026-11-22T08:00:00Z'),
      subtotal: 81355.93,
      taxAmount: 14644.07,
      discountAmount: 0,
      totalAmount: 96000,
      autoRenew: false,
      lines: {
        create: [
          {
            productId: pPos.id,
            description: 'Retail Cloud POS Multi-Register Sync',
            quantity: 1,
            unitPrice: 81355.93,
            taxRate: 18.0,
            taxAmount: 14644.07,
            totalAmount: 96000,
          },
        ],
      },
      history: {
        create: [
          {
            action: 'PAUSED',
            previousStatus: 'ACTIVE',
            newStatus: 'PAUSED',
            performedBy: 'Admin',
            notes: 'Paused on customer request during warehouse remodel',
          },
        ],
      },
    },
  });

  // Additional subscriptions across other customers to build realistic distribution
  const extraSubs = [
    { num: 'SUB-2026-1043', cust: 'Technova Pvt Ltd', plan: planEnterpriseMonthly, status: 'ACTIVE', amount: 120000, date: '2026-09-15' },
    { num: 'SUB-2026-1042', cust: 'Kerala Traders', plan: planBusinessYearly, status: 'ACTIVE', amount: 58400, date: '2026-09-10' },
    { num: 'SUB-2026-1041', cust: 'Malabar Logistics', plan: planBusinessMonthly, status: 'ACTIVE', amount: 96000, date: '2026-08-12' },
    { num: 'SUB-2026-1040', cust: 'Vertex Financials', plan: planEnterpriseMonthly, status: 'ACTIVE', amount: 120000, date: '2026-08-01' },
    { num: 'SUB-2026-1039', cust: 'Zenith Health Systems', plan: planProMonthly, status: 'ACTIVE', amount: 74800, date: '2026-07-20' },
    { num: 'SUB-2026-1038', cust: 'Pinnacle Agritech', plan: planStarterMonthly, status: 'CLOSED', amount: 32000, date: '2026-05-10' },
    { num: 'SUB-2026-1037', cust: 'Orion Media Labs', plan: planApiWeekly, status: 'ACTIVE', amount: 3500, date: '2026-10-01' },
    { num: 'SUB-2026-1036', cust: 'Cochin Ship Chandler', plan: planBusinessMonthly, status: 'ACTIVE', amount: 96000, date: '2026-06-18' },
    { num: 'SUB-2026-1035', cust: 'Kalyan Digital Prints', plan: planStarterMonthly, status: 'EXPIRED', amount: 32000, date: '2026-04-11' },
    { num: 'SUB-2026-1034', cust: 'Apex Robotics India', plan: planEnterpriseMonthly, status: 'ACTIVE', amount: 120000, date: '2026-09-02' },
    { num: 'SUB-2026-1033', cust: 'Travancore Medicals', plan: planProMonthly, status: 'ACTIVE', amount: 74800, date: '2026-08-19' },
    { num: 'SUB-2026-1032', cust: 'Deccan Analytics', plan: planBusinessYearly, status: 'ACTIVE', amount: 58400, date: '2026-07-05' },
    { num: 'SUB-2026-1031', cust: 'Oceanic Exports', plan: planBusinessMonthly, status: 'ACTIVE', amount: 96000, date: '2026-06-25' },
  ];

  for (const s of extraSubs) {
    const cust = createdCustomers[s.cust];
    if (cust) {
      await prisma.subscription.create({
        data: {
          subscriptionNumber: s.num,
          customerId: cust.id,
          planId: s.plan.id,
          status: s.status,
          billingFrequency: s.plan.billingFrequency,
          startDate: new Date(`${s.date}T00:00:00Z`),
          currentPeriodStart: new Date(`${s.date}T00:00:00Z`),
          currentPeriodEnd: new Date('2026-11-30T00:00:00Z'),
          nextBillingDate: new Date('2026-11-20T00:00:00Z'),
          totalAmount: s.amount,
          subtotal: Math.round(s.amount / 1.18),
          taxAmount: Math.round(s.amount - s.amount / 1.18),
          lines: {
            create: [
              {
                productId: s.plan.productId,
                description: `${s.plan.name} License`,
                quantity: 1,
                unitPrice: Math.round(s.amount / 1.18),
                taxRate: 18,
                taxAmount: Math.round(s.amount - s.amount / 1.18),
                totalAmount: s.amount,
              },
            ],
          },
        },
      });
    }
  }

  // 9. Create Invoices matching screenshot
  // INV-2026-1187: Invoice, Kerala Traders, ₹58,400, 27 Oct 2026, Sent / Confirmed
  const inv1187 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1187',
      customerId: createdCustomers['Kerala Traders'].id,
      subscriptionId: sub1047.id,
      issueDate: new Date('2026-10-27T10:00:00Z'),
      dueDate: new Date('2026-11-11T10:00:00Z'),
      status: 'SENT',
      subtotal: 49491.53,
      taxAmount: 8908.47,
      totalAmount: 58400,
      paidAmount: 0,
      outstandingAmount: 58400,
      paymentTerms: 'Net 15',
      lines: {
        create: [
          {
            description: 'Business Yearly ERP Standard License (Period Oct 2026 - Oct 2027)',
            quantity: 1,
            unitPrice: 49491.53,
            taxRate: 18.0,
            taxAmount: 8908.47,
            totalAmount: 58400,
          },
        ],
      },
    },
  });

  // INV-2026-1186: Invoice, Axis Solutions, ₹74,800, 25 Oct 2026, Overdue
  const inv1186 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1186',
      customerId: createdCustomers['Axis Solutions'].id,
      subscriptionId: sub1045.id,
      issueDate: new Date('2026-10-10T14:30:00Z'),
      dueDate: new Date('2026-10-25T14:30:00Z'), // Passed due date -> OVERDUE
      status: 'OVERDUE',
      subtotal: 63389.83,
      taxAmount: 11410.17,
      totalAmount: 74800,
      paidAmount: 0,
      outstandingAmount: 74800,
      paymentTerms: 'Net 15',
      lines: {
        create: [
          {
            description: 'CRM Pro Monthly License with API access (Period Oct - Nov 2026)',
            quantity: 1,
            unitPrice: 63389.83,
            taxRate: 18.0,
            taxAmount: 11410.17,
            totalAmount: 74800,
          },
        ],
      },
    },
  });

  // Invoice for Technova (Paid)
  const inv1185 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1185',
      customerId: createdCustomers['Technova Pvt Ltd'].id,
      subscriptionId: sub1048.id,
      issueDate: new Date('2026-10-28T09:00:00Z'),
      dueDate: new Date('2026-11-12T09:00:00Z'),
      status: 'PAID',
      subtotal: 101694.92,
      taxAmount: 18305.08,
      totalAmount: 120000,
      paidAmount: 120000,
      outstandingAmount: 0,
      lines: {
        create: [
          {
            description: 'Enterprise ERP Suite - ODOO Brand Integration Tier',
            quantity: 1,
            unitPrice: 101694.92,
            taxRate: 18,
            taxAmount: 18305.08,
            totalAmount: 120000,
          },
        ],
      },
    },
  });

  // Invoice for GreenLeaf Stores (Paid)
  const inv1184 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1184',
      customerId: createdCustomers['GreenLeaf Stores'].id,
      issueDate: new Date('2026-10-26T11:00:00Z'),
      dueDate: new Date('2026-11-10T11:00:00Z'),
      status: 'PAID',
      subtotal: 27118.64,
      taxAmount: 4881.36,
      totalAmount: 32000,
      paidAmount: 32000,
      outstandingAmount: 0,
      lines: {
        create: [
          {
            description: 'CRM Starter Monthly License',
            quantity: 1,
            unitPrice: 27118.64,
            taxRate: 18,
            taxAmount: 4881.36,
            totalAmount: 32000,
          },
        ],
      },
    },
  });

  // Invoice for Bright Retail (Paid)
  const inv1183 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1183',
      customerId: createdCustomers['Bright Retail'].id,
      issueDate: new Date('2026-10-22T08:00:00Z'),
      dueDate: new Date('2026-11-06T08:00:00Z'),
      status: 'PAID',
      subtotal: 81355.93,
      taxAmount: 14644.07,
      totalAmount: 96000,
      paidAmount: 96000,
      outstandingAmount: 0,
      lines: {
        create: [
          {
            description: 'Retail Cloud POS Multi-Register Sync',
            quantity: 1,
            unitPrice: 81355.93,
            taxRate: 18,
            taxAmount: 14644.07,
            totalAmount: 96000,
          },
        ],
      },
    },
  });

  // Extra invoices to simulate overdue & outstanding balances matching ~₹3,18,400 outstanding
  const inv1182 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1182',
      customerId: createdCustomers['Malabar Logistics'].id,
      issueDate: new Date('2026-09-20T00:00:00Z'),
      dueDate: new Date('2026-10-05T00:00:00Z'),
      status: 'OVERDUE',
      subtotal: 81355.93,
      taxAmount: 14644.07,
      totalAmount: 96000,
      paidAmount: 0,
      outstandingAmount: 96000,
      lines: {
        create: [
          {
            description: 'Business Monthly POS License Renewal',
            quantity: 1,
            unitPrice: 81355.93,
            taxRate: 18,
            taxAmount: 14644.07,
            totalAmount: 96000,
          },
        ],
      },
    },
  });

  const inv1181 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1181',
      customerId: createdCustomers['Zenith Health Systems'].id,
      issueDate: new Date('2026-10-01T00:00:00Z'),
      dueDate: new Date('2026-10-16T00:00:00Z'),
      status: 'OVERDUE',
      subtotal: 63389.83,
      taxAmount: 11410.17,
      totalAmount: 74800,
      paidAmount: 0,
      outstandingAmount: 74800,
      lines: {
        create: [
          {
            description: 'Pro Monthly CRM License',
            quantity: 1,
            unitPrice: 63389.83,
            taxRate: 18,
            taxAmount: 11410.17,
            totalAmount: 74800,
          },
        ],
      },
    },
  });

  const inv1180 = await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-1180',
      customerId: createdCustomers['Pinnacle Agritech'].id,
      issueDate: new Date('2026-10-05T00:00:00Z'),
      dueDate: new Date('2026-10-20T00:00:00Z'),
      status: 'PARTIALLY_PAID',
      subtotal: 27118.64,
      taxAmount: 4881.36,
      totalAmount: 32000,
      paidAmount: 17600,
      outstandingAmount: 14400,
      lines: {
        create: [
          {
            description: 'Starter Monthly License',
            quantity: 1,
            unitPrice: 27118.64,
            taxRate: 18,
            taxAmount: 4881.36,
            totalAmount: 32000,
          },
        ],
      },
    },
  });

  // 10. Create Payments matching screenshot
  // PAY-2026-3021, Payment, Technova Pvt Ltd, ₹1,20,000, 28 Oct 2026, Completed
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-3021',
      customerId: createdCustomers['Technova Pvt Ltd'].id,
      invoiceId: inv1185.id,
      amount: 120000,
      paymentMethod: 'BANK_TRANSFER',
      paymentDate: new Date('2026-10-28T11:15:00Z'),
      transactionRef: 'NEFT-HDFC-99882211',
      status: 'COMPLETED',
      notes: 'Full payment received via NEFT',
      recordedBy: 'Admin',
    },
  });

  // PAY-2026-3020, Payment, GreenLeaf Stores, ₹32,000, 26 Oct 2026, Completed
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-3020',
      customerId: createdCustomers['GreenLeaf Stores'].id,
      invoiceId: inv1184.id,
      amount: 32000,
      paymentMethod: 'UPI',
      paymentDate: new Date('2026-10-26T16:45:00Z'),
      transactionRef: 'UPI-SBIN-88776655',
      status: 'COMPLETED',
      notes: 'Instant settlement via PhonePe QR',
      recordedBy: 'Sarah Joseph (Staff)',
    },
  });

  // PAY-2026-3019, Payment, Bright Retail, ₹96,000, 24 Oct 2026, Completed
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-3019',
      customerId: createdCustomers['Bright Retail'].id,
      invoiceId: inv1183.id,
      amount: 96000,
      paymentMethod: 'CARD',
      paymentDate: new Date('2026-10-24T18:20:00Z'),
      transactionRef: 'CC-VISA-4028-AUTH77',
      status: 'COMPLETED',
      notes: 'Corporate Visa Card Online Gateway',
      recordedBy: 'Admin',
    },
  });

  // Partial payment for Pinnacle
  await prisma.payment.create({
    data: {
      paymentNumber: 'PAY-2026-3018',
      customerId: createdCustomers['Pinnacle Agritech'].id,
      invoiceId: inv1180.id,
      amount: 17600,
      paymentMethod: 'UPI',
      paymentDate: new Date('2026-10-18T10:00:00Z'),
      transactionRef: 'UPI-AXIS-33221144',
      status: 'COMPLETED',
      notes: 'Partial advance payment',
      recordedBy: 'Sarah Joseph (Staff)',
    },
  });

  // Additional historical payments to aggregate ₹24.8L Total Revenue
  const historicalPayments = [
    { cust: 'Technova Pvt Ltd', amount: 720000, method: 'BANK_TRANSFER', date: '2026-08-15' },
    { cust: 'Kerala Traders', amount: 469600, method: 'BANK_TRANSFER', date: '2026-07-20' },
    { cust: 'Axis Solutions', amount: 397200, method: 'CARD', date: '2026-08-25' },
    { cust: 'GreenLeaf Stores', amount: 352000, method: 'UPI', date: '2026-09-01' },
    { cust: 'Vertex Financials', amount: 240000, method: 'BANK_TRANSFER', date: '2026-09-10' },
  ];

  for (let i = 0; i < historicalPayments.length; i++) {
    const hp = historicalPayments[i];
    const c = createdCustomers[hp.cust];
    // create historical invoice
    const inv = await prisma.invoice.create({
      data: {
        invoiceNumber: `INV-2026-${1000 + i}`,
        customerId: c.id,
        issueDate: new Date(`${hp.date}T09:00:00Z`),
        dueDate: new Date(`${hp.date}T18:00:00Z`),
        status: 'PAID',
        subtotal: Math.round(hp.amount / 1.18),
        taxAmount: Math.round(hp.amount - hp.amount / 1.18),
        totalAmount: hp.amount,
        paidAmount: hp.amount,
        outstandingAmount: 0,
        lines: {
          create: [
            {
              description: 'Consolidated Software Licensing & SLA',
              quantity: 1,
              unitPrice: Math.round(hp.amount / 1.18),
              taxRate: 18,
              taxAmount: Math.round(hp.amount - hp.amount / 1.18),
              totalAmount: hp.amount,
            },
          ],
        },
      },
    });

    await prisma.payment.create({
      data: {
        paymentNumber: `PAY-2026-${2900 + i}`,
        customerId: c.id,
        invoiceId: inv.id,
        amount: hp.amount,
        paymentMethod: hp.method,
        paymentDate: new Date(`${hp.date}T14:00:00Z`),
        transactionRef: `REF-HIST-${i + 1}`,
        status: 'COMPLETED',
        notes: 'Settled on schedule',
        recordedBy: 'Admin',
      },
    });
  }

  // 11. Create Quotations
  const qt1 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-0042',
      customerId: createdCustomers['Cochin Ship Chandler'].id,
      templateId: templateStandard.id,
      status: 'SENT',
      issueDate: new Date('2026-10-25T10:00:00Z'),
      validUntil: new Date('2026-11-24T10:00:00Z'),
      subtotal: 96000,
      taxAmount: 17280,
      discountAmount: 4800,
      totalAmount: 108480,
      terms: templateStandard.defaultTerms,
      notes: 'Special hackathon pricing with 5% volume incentive applied.',
      lines: {
        create: [
          {
            productId: pPos.id,
            description: 'Cloud POS Multi-Store Register Terminal',
            quantity: 1,
            unitPrice: 96000,
            discountAmount: 4800,
            taxRate: 18,
            taxAmount: 16416,
            totalAmount: 107616,
          },
        ],
      },
    },
  });

  const qt2 = await prisma.quotation.create({
    data: {
      quotationNumber: 'QT-2026-0043',
      customerId: createdCustomers['Apex Robotics India'].id,
      templateId: templateStandard.id,
      status: 'DRAFT',
      issueDate: new Date('2026-10-29T15:00:00Z'),
      validUntil: new Date('2026-11-28T15:00:00Z'),
      subtotal: 120000,
      taxAmount: 21600,
      discountAmount: 0,
      totalAmount: 141600,
      terms: templateStandard.defaultTerms,
      notes: 'Proposed ERP implementation for industrial robotics team.',
      lines: {
        create: [
          {
            productId: pErp.id,
            description: 'Brightloop ERP Suite - Enterprise Edition',
            quantity: 1,
            unitPrice: 120000,
            discountAmount: 0,
            taxRate: 18,
            taxAmount: 21600,
            totalAmount: 141600,
          },
        ],
      },
    },
  });

  // 12. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        type: 'ALERT',
        title: 'Invoice Overdue Alert',
        message: 'Invoice INV-2026-1186 for Axis Solutions (₹74,800) is past its due date.',
        link: '/invoices',
        isRead: false,
      },
      {
        type: 'SUCCESS',
        title: 'Payment Received',
        message: 'Technova Pvt Ltd has paid ₹1,20,000 for invoice INV-2026-1185.',
        link: '/payments',
        isRead: false,
      },
      {
        type: 'INFO',
        title: 'Renewal Approaching',
        message: 'Subscription SUB-2026-1048 is scheduled for renewal on 05 Nov 2026.',
        link: '/subscriptions',
        isRead: false,
      },
    ],
  });

  console.log('Database seeded successfully with realistic data!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
