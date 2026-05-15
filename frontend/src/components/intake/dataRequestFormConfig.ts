/** Options mirrored from Typeform ONTHimJl (Data Request Form). */

export const BUSINESS_SECTORS = [
  'Saas (Software as a Service)',
  'High-Ticket Service (Consulting, Coaching, Engineering/Dev Shop, Marketing Agency, Or Similar)',
  'Financial Services',
  'Real Estate',
  'Information Product (Fitness, Trading, Marketing, Sales, Investing, etc)',
  'Ecommerce Store',
] as const

export const SALES_REP_COUNTS = [
  'Just Me',
  '1-5',
  '5-10',
  '10-50',
  '50-100',
  '100-200',
  '200+',
] as const

export const LEAD_SOURCING_OPTIONS = [
  'Data Providers & Sales Intelligence Platforms',
  'Referrals',
  'Outbound Cold Email',
  'Cold LinkedIn Messaging',
  'Facebook Ads, YouTube Ads, Instagram Ads, or other social platform ads',
  'Organic Content (Posting on socials)',
  'Channel Partners/Affiliates',
  'In-Person Events',
  'Webinars',
  "I don't do anything currently and I'm looking for direction",
] as const

export const COMPANY_SIZE_OPTIONS = [
  'Small (1-50 employees)',
  'Medium (51-200 employees',
  'Large (201-1,000+ employees)',
] as const

export const LEAD_INFO_OPTIONS = [
  'Full Name',
  'Current Company',
  'Job Title',
  'Email',
  'Telephone',
  'Mobile',
  'Location',
  'Linkedin URL',
  'Sector',
  'Unique Lead ID',
  'Years spent working at a specific location or company.',
  'Psychometrics',
] as const

export const TERMS_URL = 'https://www.the-leadlab.com/legal?policy=terms'

export const DATA_REQUEST_STEPS = [
  { id: 'welcome', label: 'Welcome' },
  { id: 'business', label: 'Your business' },
  { id: 'audience', label: 'Target audience' },
  { id: 'prospect', label: 'Ideal prospect' },
  { id: 'contact', label: 'Contact' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'review', label: 'Review' },
] as const

export type DataRequestStepId = (typeof DATA_REQUEST_STEPS)[number]['id']
