/**
 * CURATED BENEFIT DATASET — BenefitBridge
 *
 * All entries are real, existing Indian government schemes.
 * Sources verified against official portals as of August 2025.
 * No eligibility rules, amounts, deadlines, or descriptions are invented.
 *
 * Data Sources:
 *   - myscheme.gov.in  (Government of India unified scheme portal)
 *   - scholarships.gov.in (National Scholarship Portal)
 *   - nha.gov.in (National Health Authority)
 *   - pmkisan.gov.in
 *   - mahadbt.maharashtra.gov.in
 *   - nsfdc.nic.in
 *   - labour.gov.in / esic.gov.in
 *
 * IMPORTANT: Do NOT invent scheme details. Additions must cite a real source URL.
 */

import type { Benefit } from '../types/benefit';

export const CURATED_BENEFITS: Benefit[] = [
  // ──────────────────────────────────────────────────────────────────────────
  // FINANCIAL ASSISTANCE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'pm-kisan-samman-nidhi',
    title: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
    issuer: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Financial Assistance',
    description:
      'Direct income support of ₹6,000 per year to small and marginal farmer families, paid in three equal installments of ₹2,000 every four months directly to their bank accounts via DBT.',
    eligibilityCriteria: {
      employmentStatuses: ['Farmer'],
    },
    deadline: 'Ongoing',
    benefitAmount: '₹6,000 per year (₹2,000 per installment, 3 installments)',
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook Front Page', 'Land Record (7/12 Extract or equivalent)'],
    isRenewable: false, provenance: {
      sourceName: 'pmkisan.gov.in',
      sourceUrl: 'https://pmkisan.gov.in/',
      applicationUrl: 'https://pmkisan.gov.in/RegistrationForm.aspx',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'pm-awas-yojana-gramin',
    title: 'Pradhan Mantri Awas Yojana – Gramin (PMAY-G)',
    issuer: 'Ministry of Rural Development, Government of India',
    category: 'Housing',
    description:
      'Financial assistance for construction of pucca houses for rural households who are houseless or living in kutcha/dilapidated houses. Assistance of ₹1.20 lakh in plain areas and ₹1.30 lakh in hilly/NE states.',
    eligibilityCriteria: {
      maxAnnualIncome: 250000,
      employmentStatuses: ['Unemployed', 'Farmer', 'Self-Employed'],
    },
    deadline: 'Ongoing',
    benefitAmount: '₹1.20 lakh (plain areas) / ₹1.30 lakh (hilly/NE states)',
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook Front Page', 'Income Certificate', 'Domicile Certificate'],
    isRenewable: false, provenance: {
      sourceName: 'pmayg.nic.in',
      sourceUrl: 'https://pmayg.nic.in/',
      applicationUrl: 'https://rhreporting.nic.in/netiay/newreport/publicGrievances.aspx',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'pm-svanidhi',
    title: 'PM SVANidhi (PM Street Vendor\'s AtmaNirbhar Nidhi)',
    issuer: 'Ministry of Housing and Urban Affairs, Government of India',
    category: 'Financial Assistance',
    description:
      'Provides affordable working capital loans to street vendors displaced due to COVID-19. Initial loan of ₹10,000 with escalating credit limit up to ₹50,000 on timely repayment.',
    eligibilityCriteria: {
      employmentStatuses: ['Self-Employed'],
    },
    deadline: 'Ongoing',
    benefitAmount: 'Working capital loan: ₹10,000 → ₹20,000 → ₹50,000',
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook Front Page', 'PM Svanidhi Certificate of Vending'],
    isRenewable: false, provenance: {
      sourceName: 'pmsvanidhi.mohua.gov.in',
      sourceUrl: 'https://pmsvanidhi.mohua.gov.in/',
      applicationUrl: 'https://pmsvanidhi.mohua.gov.in/apply',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // EDUCATION
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'nsp-post-matric-minority',
    title: 'Post-Matric Scholarship for Minorities (NSP)',
    issuer: 'Ministry of Minority Affairs, Government of India',
    category: 'Education',
    description:
      'Scholarships for students from minority communities (Muslim, Christian, Sikh, Buddhist, Jain, Parsi) who are studying in Class 11 or above. Covers maintenance allowance and course fees.',
    eligibilityCriteria: {
      maxAnnualIncome: 200000,
      educationLevels: ['12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
    },
    deadline: 'Ongoing (Annual — typically October–November)',
    benefitAmount: 'Maintenance allowance (₹380–₹1,200/month) + course fee reimbursement',
    requiredDocuments: [
      'Aadhaar Card',
      'Income Certificate',
      'Class 10 Marksheet / Passing Certificate',
      'Bank Passbook Front Page',
      'Domicile Certificate',
    ],
    isRenewable: false, provenance: {
      sourceName: 'scholarships.gov.in',
      sourceUrl: 'https://scholarships.gov.in/public/schemeX/central/MOMASCH.htm',
      applicationUrl: 'https://scholarships.gov.in/',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'nsp-post-matric-sc',
    title: 'Post-Matric Scholarship for SC Students (NSP)',
    issuer: 'Ministry of Social Justice and Empowerment, Government of India',
    category: 'Education',
    description:
      'Financial assistance to SC students for pursuing post-matric or post-secondary education. Covers course fees and maintenance allowance for students studying in recognised government and private institutions.',
    eligibilityCriteria: {
      maxAnnualIncome: 250000,
      educationLevels: ['12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
      casteCriteria: ['SC'],
    },
    deadline: 'Ongoing (Annual)',
    benefitAmount: 'Full course fee reimbursement + maintenance allowance (₹380–₹1,200/month)',
    requiredDocuments: [
      'Aadhaar Card',
      'Caste Certificate (SC/ST)',
      'Income Certificate',
      'Class 10 Marksheet / Passing Certificate',
      'Bank Passbook Front Page',
    ],
    isRenewable: false, provenance: {
      sourceName: 'scholarships.gov.in',
      sourceUrl: 'https://scholarships.gov.in/public/schemeX/central/MSJESCH.htm',
      applicationUrl: 'https://scholarships.gov.in/',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'mahadbt-post-matric',
    title: 'MahaDBT Post Matric Scholarship (Maharashtra)',
    issuer: 'Government of Maharashtra – Social Justice Department',
    category: 'Education',
    description:
      'Financial assistance for students from SC, ST, VJ-NT, OBC, SBC, EBC, and EWS categories who are Maharashtra domicile and pursuing post-matric education in recognised institutions.',
    eligibilityCriteria: {
      states: ['MH'],
      maxAnnualIncome: 800000,
      educationLevels: ['12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
    },
    deadline: 'Ongoing (Annual)',
    benefitAmount: 'Tuition fee reimbursement + maintenance allowance (varies by category and course)',
    requiredDocuments: [
      'Aadhaar Card',
      'Domicile Certificate',
      'Income Certificate',
      'Caste Certificate (SC/ST)',
      'Class 10 Marksheet / Passing Certificate',
      'Bank Passbook Front Page',
    ],
    isRenewable: false, provenance: {
      sourceName: 'mahadbt.maharashtra.gov.in',
      sourceUrl: 'https://mahadbt.maharashtra.gov.in/',
      applicationUrl: 'https://mahadbt.maharashtra.gov.in/',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
  },
  {
    id: 'pm-yasasvi-scholarship',
    title: 'PM YASASVI Scholarship Scheme 2026',
    issuer: 'Ministry of Social Justice and Empowerment, Government of India',
    category: 'Education',
    description:
      'Active scholarship for students belonging to OBC, EBC and DNT categories studying in Class 9 and Class 11 in identified Top Schools. Provides up to ₹1,25,000 per annum.',
    eligibilityCriteria: {
      maxAnnualIncome: 250000,
      educationLevels: ['9th', '11th', '12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
      employmentStatuses: ['Student'],
      casteCriteria: ['OBC', 'EBC', 'DNT'],
    },
    deadline: '2026-10-15',
    benefitAmount: '₹75,000 to ₹1,25,000 per annum',
    requiredDocuments: [
      'Aadhaar Card',
      'Income Certificate',
      'Caste Certificate (OBC/EBC/DNT)',
      'Previous Year Marksheet',
      'Bank Passbook Front Page',
    ],
    isRenewable: true,
    provenance: {
      sourceName: 'yet.nta.ac.in',
      sourceUrl: 'https://yet.nta.ac.in/',
      applicationUrl: 'https://yet.nta.ac.in/',
      lastVerified: '2026-09-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'national-means-cum-merit-scholarship',
    title: 'National Means cum Merit Scholarship (NMMS) 2026-27',
    issuer: 'Department of School Education & Literacy',
    category: 'Education',
    description:
      'Active scholarship to award meritorious students of economically weaker sections to arrest their drop out at class VIII and encourage them to continue study at secondary stage.',
    eligibilityCriteria: {
      maxAnnualIncome: 350000,
      educationLevels: ['9th', '10th', '11th', '12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
      employmentStatuses: ['Student'],
    },
    deadline: '2026-11-30',
    benefitAmount: '₹12,000 per annum (₹1,000 per month)',
    requiredDocuments: [
      'Aadhaar Card',
      'Income Certificate',
      'Class 7/8 Marksheet',
      'Bank Passbook Front Page',
      'Domicile Certificate'
    ],
    isRenewable: true,
    provenance: {
      sourceName: 'scholarships.gov.in',
      sourceUrl: 'https://scholarships.gov.in/public/schemeX/central/DOSEL.htm',
      applicationUrl: 'https://scholarships.gov.in/',
      lastVerified: '2026-09-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'pm-yasasvi-scholarship',
    title: 'PM YASASVI Scholarship Scheme 2026',
    issuer: 'Ministry of Social Justice and Empowerment, Government of India',
    category: 'Education',
    description:
      'Active scholarship for students belonging to OBC, EBC and DNT categories studying in Class 9 and Class 11 in identified Top Schools. Provides up to ₹1,25,000 per annum.',
    eligibilityCriteria: {
      maxAnnualIncome: 250000,
      educationLevels: ['9th', '11th', '12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
      employmentStatuses: ['Student'],
      casteCriteria: ['OBC', 'EBC', 'DNT'],
    },
    deadline: '2026-10-15',
    benefitAmount: '₹75,000 to ₹1,25,000 per annum',
    requiredDocuments: [
      'Aadhaar Card',
      'Income Certificate',
      'Caste Certificate (OBC/EBC/DNT)',
      'Previous Year Marksheet',
      'Bank Passbook Front Page',
    ],
    isRenewable: true,
    provenance: {
      sourceName: 'yet.nta.ac.in',
      sourceUrl: 'https://yet.nta.ac.in/',
      applicationUrl: 'https://yet.nta.ac.in/',
      lastVerified: '2026-09-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'national-means-cum-merit-scholarship',
    title: 'National Means cum Merit Scholarship (NMMS) 2026-27',
    issuer: 'Department of School Education & Literacy',
    category: 'Education',
    description:
      'Active scholarship to award meritorious students of economically weaker sections to arrest their drop out at class VIII and encourage them to continue study at secondary stage.',
    eligibilityCriteria: {
      maxAnnualIncome: 350000,
      educationLevels: ['9th', '10th', '11th', '12th', 'Undergraduate', 'Graduate', 'Postgraduate'],
      employmentStatuses: ['Student'],
    },
    deadline: '2026-11-30',
    benefitAmount: '₹12,000 per annum (₹1,000 per month)',
    requiredDocuments: [
      'Aadhaar Card',
      'Income Certificate',
      'Class 7/8 Marksheet',
      'Bank Passbook Front Page',
      'Domicile Certificate'
    ],
    isRenewable: true,
    provenance: {
      sourceName: 'scholarships.gov.in',
      sourceUrl: 'https://scholarships.gov.in/public/schemeX/central/DOSEL.htm',
      applicationUrl: 'https://scholarships.gov.in/',
      lastVerified: '2026-09-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'nsfdc-educational-loan',
    title: 'Educational Loan Scheme for SC Students (NSFDC)',
    issuer: 'National Scheduled Castes Finance and Development Corporation (NSFDC)',
    category: 'Education',
    description:
      'Concessional educational loans up to ₹20 lakh at subsidised interest rates for SC students pursuing professional/technical courses in India or abroad, through State Channelising Agencies.',
    eligibilityCriteria: {
      maxAnnualIncome: 300000,
      casteCriteria: ['SC'],
      educationLevels: ['Undergraduate', 'Postgraduate'],
    },
    deadline: 'Ongoing',
    benefitAmount: 'Loan up to ₹20 lakh at 4% p.a. (women: 3.5% p.a.)',
    requiredDocuments: [
      'Aadhaar Card',
      'Caste Certificate (SC/ST)',
      'Income Certificate',
      'Graduation Degree Certificate',
      'Bank Passbook Front Page',
    ],
    isRenewable: false, provenance: {
      sourceName: 'nsfdc.nic.in',
      sourceUrl: 'http://www.nsfdc.nic.in/en/educational-loan-scheme',
      applicationUrl: 'http://www.nsfdc.nic.in/en/state-channelising-agencies',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // HEALTHCARE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'ayushman-bharat-pmjay',
    title: 'Ayushman Bharat PM-JAY',
    issuer: 'National Health Authority, Government of India',
    category: 'Healthcare',
    description:
      'Health cover of ₹5 lakh per family per year for secondary and tertiary care hospitalisation for economically vulnerable families. Covers pre- and post-hospitalisation expenses.',
    eligibilityCriteria: {
      maxAnnualIncome: 500000,
    },
    deadline: 'Ongoing',
    benefitAmount: '₹5 lakh per family per year (hospitalisation cover)',
    requiredDocuments: ['Aadhaar Card', 'Ration Card', 'Income Certificate'],
    isRenewable: false, provenance: {
      sourceName: 'nha.gov.in',
      sourceUrl: 'https://nha.gov.in/PM-JAY',
      applicationUrl: 'https://bis.pmjay.gov.in/BIS/selfprintCard',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'esic-medical-benefit',
    title: 'ESIC Medical Benefit for Insured Workers',
    issuer: 'Employees\' State Insurance Corporation (ESIC), Ministry of Labour',
    category: 'Healthcare',
    description:
      'Full medical care for Employees\' State Insurance (ESI) insured workers and their families. Covers outpatient, inpatient, specialist, and super-specialist treatment at ESI hospitals and empanelled facilities.',
    eligibilityCriteria: {
      maxAnnualIncome: 800000,
      employmentStatuses: ['Employed'],
    },
    deadline: 'Ongoing',
    benefitAmount: 'Full medical care (no fixed cap) for self and family',
    requiredDocuments: ['ESIC Card', 'Aadhaar Card'],
    isRenewable: false, provenance: {
      sourceName: 'esic.gov.in',
      sourceUrl: 'https://www.esic.gov.in/medical-benefit',
      applicationUrl: 'https://www.esic.gov.in/foru-employers',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // SOCIAL WELFARE / EMPLOYMENT
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'mgnregs',
    title: 'MGNREGS (Mahatma Gandhi National Rural Employment Guarantee Scheme)',
    issuer: 'Ministry of Rural Development, Government of India',
    category: 'Employment',
    description:
      'Guarantees 100 days of wage employment per year to rural households whose adult members volunteer to do unskilled manual work. Wage is ₹267 (Karnataka) to ₹374 (Haryana) per day, varying by state.',
    eligibilityCriteria: {
      employmentStatuses: ['Unemployed', 'Farmer'],
    },
    deadline: 'Ongoing',
    benefitAmount: '100 days of employment per year (₹267–₹374/day, state-specific)',
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook Front Page', 'MGNREGA Job Card'],
    isRenewable: false, provenance: {
      sourceName: 'nrega.nic.in',
      sourceUrl: 'https://nrega.nic.in/',
      applicationUrl: 'https://nrega.nic.in/MGNREGA_new/Nrega_home.aspx',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'e-shram-portal',
    title: 'e-Shram Portal Registration (Unorganised Workers)',
    issuer: 'Ministry of Labour & Employment, Government of India',
    category: 'Social Welfare',
    description:
      'Free registration for unorganised sector workers providing a Universal Account Number (UAN) card. Registered workers are covered with ₹2 lakh accidental insurance under PMSBY. Also enables better benefit delivery.',
    eligibilityCriteria: {
      maxAnnualIncome: 500000,
      employmentStatuses: ['Self-Employed', 'Unemployed', 'Farmer'],
    },
    deadline: 'Ongoing',
    benefitAmount: '₹2 lakh accidental insurance (via PMSBY) + UAN card for future schemes',
    requiredDocuments: ['Aadhaar Card', 'Bank Passbook Front Page'],
    isRenewable: false, provenance: {
      sourceName: 'eshram.gov.in',
      sourceUrl: 'https://eshram.gov.in/',
      applicationUrl: 'https://register.eshram.gov.in/',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'pm-mudra-yojana-shishu',
    title: 'PM Mudra Yojana – Shishu (Loan up to ₹50,000)',
    issuer: 'Ministry of Finance / Micro Units Development & Refinance Agency',
    category: 'Financial Assistance',
    description:
      'Collateral-free loans up to ₹50,000 for micro/small businesses under the Shishu category. Loans are provided through commercial banks, MFIs, NBFCs, and cooperative banks.',
    eligibilityCriteria: {
      employmentStatuses: ['Self-Employed'],
    },
    deadline: 'Ongoing',
    benefitAmount: 'Collateral-free loan up to ₹50,000',
    requiredDocuments: ['Aadhaar Card', 'PAN Card', 'Bank Passbook Front Page', 'Udyam Registration Certificate (MSME)'],
    isRenewable: false, provenance: {
      sourceName: 'mudra.org.in',
      sourceUrl: 'https://www.mudra.org.in/',
      applicationUrl: 'https://www.jansamarth.in/home',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'udyam-registration',
    title: 'Udyam Registration (MSME) — Benefits & Subsidies Access',
    issuer: 'Ministry of Micro, Small and Medium Enterprises, Government of India',
    category: 'Financial Assistance',
    description:
      'Free online registration for MSMEs that unlocks priority sector lending, collateral-free loans under CGTSME, 1% interest concession, ISO certification reimbursement, and government tender preferences.',
    eligibilityCriteria: {
      employmentStatuses: ['Self-Employed'],
    },
    deadline: 'Ongoing',
    benefitAmount: 'Priority lending + subsidies (varies by scheme accessed post-registration)',
    requiredDocuments: ['Aadhaar Card', 'PAN Card'],
    isRenewable: false, provenance: {
      sourceName: 'udyamregistration.gov.in',
      sourceUrl: 'https://udyamregistration.gov.in/',
      applicationUrl: 'https://udyamregistration.gov.in/',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },

  // ──────────────────────────────────────────────────────────────────────────
  // AGRICULTURE
  // ──────────────────────────────────────────────────────────────────────────
  {
    id: 'pm-fasal-bima-yojana',
    title: 'PM Fasal Bima Yojana (PMFBY) — Crop Insurance',
    issuer: 'Ministry of Agriculture & Farmers Welfare, Government of India',
    category: 'Agriculture',
    description:
      'Provides financial support to farmers suffering crop loss/damage due to unforeseen events like natural calamities, pests, and diseases. Premium rates are capped at 2% for Kharif, 1.5% for Rabi, and 5% for commercial crops.',
    eligibilityCriteria: {
      employmentStatuses: ['Farmer'],
    },
    deadline: 'Ongoing (Season-specific: Kharif July/Aug, Rabi Dec/Jan)',
    benefitAmount: 'Full sum insured for crop loss; premium capped at 1.5%–5%',
    requiredDocuments: ['Aadhaar Card', 'Land Record (7/12 Extract or equivalent)', 'Bank Passbook Front Page', 'Kisan Credit Card (KCC)'],
    isRenewable: false, provenance: {
      sourceName: 'pmfby.gov.in',
      sourceUrl: 'https://pmfby.gov.in/',
      applicationUrl: 'https://pmfby.gov.in/farmerRegistrationForm',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
  {
    id: 'kisan-credit-card',
    title: 'Kisan Credit Card (KCC) Scheme',
    issuer: 'NABARD / Commercial Banks / RRBs / Cooperative Banks',
    category: 'Agriculture',
    description:
      'Credit card providing farmers with adequate and timely credit for their agricultural operations, maintenance of farm assets and consumption requirements. Short-term credit at 7% p.a. (4% with interest subvention).',
    eligibilityCriteria: {
      employmentStatuses: ['Farmer'],
    },
    deadline: 'Ongoing',
    benefitAmount: 'Credit limit based on land holding and crops; rate at 4–7% p.a.',
    requiredDocuments: ['Aadhaar Card', 'Land Record (7/12 Extract or equivalent)', 'Passport Size Photograph'],
    isRenewable: false, provenance: {
      sourceName: 'nabard.org',
      sourceUrl: 'https://www.nabard.org/auth/writereaddata/tender/1307180417KCC.pdf',
      applicationUrl: 'https://www.jansamarth.in/home',
      lastVerified: '2025-08-01',
      dataType: 'Official Government Portal',
    },
  },
];

