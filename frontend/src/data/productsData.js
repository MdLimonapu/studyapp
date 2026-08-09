// Default Amazon Associate Tag (Your actual Amazon Tracking Tag)
export const AMAZON_ASSOCIATE_TAG = 'limison-21';

export const buildAmazonUrl = (asin, tag = AMAZON_ASSOCIATE_TAG, domain = 'de') => {
  return `https://www.amazon.${domain}/dp/${asin}?tag=${tag}`;
};

export const PRODUCT_CATEGORIES = [
  { id: 'all', name: 'All', icon: '🛍️' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'dorm', name: 'Household & Dorm', icon: '🏠' },
  { id: 'travel', name: 'Travel', icon: '✈️' },
  { id: 'supplies', name: 'Study', icon: '📚' },
  { id: 'adapters', name: 'Power', icon: '⚡' }
];

// DESIGN RULE: All product images MUST be isolated front-facing product cutouts on a clean white background. No lifestyle/ambient backgrounds.
export const PRODUCTS_DATA = [
  {
    id: 'siemens-iq300-washer',
    name: 'Siemens iQ300 WM14N225 Frontlader Waschmaschine (8 kg, 1400 U/Min)',
    category: 'dorm',
    asin: 'B0CH31SQH8',
    domain: 'de',
    customUrl: 'https://www.amazon.de/dp/B0CH31SQH8?tag=limison-21&linkCode=ll2&linkId=f76e721ec804841647a55bd66d53f4f2',
    image: '/products/siemens-washer.jpg',
    rating: 4.6,
    reviewsCount: 3850,
    price: '€414.90',
    badge: 'DE Student Essential',
    shortDesc: 'Siemens iQ300 front-load washing machine with iQdrive motor, speedPack L and smartFinish. Energy Efficiency Class A.',
    highlights: [
      '8 kg capacity & 1400 RPM spin speed',
      'speedPack L for accelerated wash cycles',
      'iQdrive motor - quiet & long-lasting',
      'Energy Efficiency Class A'
    ],
    targetCountries: ['Germany', 'Global']
  },
  {
    id: 'bosch-serie4-washer',
    name: 'Bosch Serie 4 WAN282K4 Waschmaschine (8 kg, 1400 U/Min)',
    category: 'dorm',
    asin: 'B0G65FW24B',
    domain: 'de',
    customUrl: 'https://www.amazon.de/dp/B0G65FW24B?th=1&tag=limison-21&linkCode=ll2&linkId=0e2928837942fcd169c86b5b8f680e8d',
    image: '/products/bosch-washer.jpg',
    rating: 4.7,
    reviewsCount: 1250,
    price: '€429.00',
    badge: 'DE Best Seller',
    shortDesc: 'Bosch Serie 4 front-load washing machine with Iron Assist steam program, SpeedPerfect (65% faster wash) and ActiveWater Plus.',
    highlights: [
      '8 kg capacity & 1400 RPM spin speed',
      'Iron Assist steam program reduces wrinkles',
      'SpeedPerfect washes up to 65% faster',
      'EcoSilence Drive motor & Energy Class A'
    ],
    targetCountries: ['Germany', 'Global']
  },
  {
    id: 'macbook-air-m2',
    name: 'Apple MacBook Air M2 Chip – 13.6" Laptop',
    category: 'tech',
    asin: 'B0B3C5A11S',
    domain: 'com',
    image: '/products/macbook-air.jpg',
    rating: 4.8,
    reviewsCount: 14200,
    price: '$999.00',
    badge: 'Best Seller',
    shortDesc: '18-hour battery, fanless design, Liquid Retina Display. The gold standard for university coursework.',
    highlights: [
      '13.6-inch Liquid Retina Display',
      '8GB Unified Memory, 256GB SSD Storage',
      'Silent fanless design with 18-hr battery life',
      'Backlit Magic Keyboard & Touch ID'
    ],
    targetCountries: ['USA', 'Germany', 'UK', 'Canada', 'Australia'],
  },
  {
    id: 'epicka-universal-adapter',
    name: 'EPICKA Universal Travel Adapter – 150+ Countries',
    category: 'adapters',
    asin: 'B078S3M2NX',
    domain: 'com',
    image: '/products/epicka-adapter.jpg',
    rating: 4.7,
    reviewsCount: 22800,
    price: '$22.99',
    badge: 'Must Have',
    shortDesc: 'All-in-one adapter with 4 USB-A + 1 USB-C port. Works in EU, UK, US and AU.',
    highlights: [
      'Works in 150+ countries worldwide',
      'Supports 4 USB + 1 Type-C + 1 AC Socket simultaneously',
      'Built-in 8A fuse protection',
      'Compact & lightweight for carry-on bags'
    ],
    targetCountries: ['Global', 'Germany', 'UK', 'USA', 'Canada'],
  },
  {
    id: 'samsonite-omni-hardside',
    name: 'Samsonite Omni 2 Hardside Spinner Luggage',
    category: 'travel',
    asin: 'B08BX8TDB3',
    domain: 'com',
    image: '/products/samsonite-luggage.jpg',
    rating: 4.6,
    reviewsCount: 18900,
    price: '$149.99',
    badge: 'Popular',
    shortDesc: 'Scratch-resistant polycarbonate with 360° spinner wheels. Built for international flights.',
    highlights: [
      'Micro-diamond polycarbonate texture',
      'Side-mounted TSA locks for security',
      'Expandable design for extra packing space',
      '10-year Samsonite limited warranty'
    ],
    targetCountries: ['USA', 'Germany', 'UK', 'Canada'],
  },
  {
    id: 'sony-wh1000xm4',
    name: 'Sony WH-1000XM4 Noise Canceling Headphones',
    category: 'tech',
    asin: 'B08F25MLF9',
    domain: 'com',
    image: '/products/sony-headphones.jpg',
    rating: 4.7,
    reviewsCount: 56100,
    price: '$348.00',
    badge: 'Editor Pick',
    shortDesc: 'Industry-leading noise cancellation. 30-hour battery. Perfect for libraries and flights.',
    highlights: [
      'Dual Noise Sensor technology',
      'Up to 30-hour battery life with quick charging',
      'Speak-to-chat technology automatically reduces volume',
      'Superior mic quality for online lectures & Zoom calls'
    ],
    targetCountries: ['Global'],
  },
  {
    id: 'anker-power-bank-737',
    name: 'Anker 737 PowerCore 24K 140W Power Bank',
    category: 'adapters',
    asin: 'B09VPHVT2Z',
    domain: 'com',
    image: '/products/anker-powerbank.jpg',
    rating: 4.6,
    reviewsCount: 8400,
    price: '$109.99',
    badge: 'High Power',
    shortDesc: '140W bi-directional charging. Charges a MacBook Air and phone simultaneously.',
    highlights: [
      '24,000mAh capacity for multi-day battery life',
      'Smart Digital Display showing output/input power',
      'Charges laptops, tablets, and phones simultaneously',
      'Airline flight safe compliance'
    ],
    targetCountries: ['Global'],
  },
  {
    id: 'kindle-paperwhite-16gb',
    name: 'Kindle Paperwhite 16GB – 6.8" E-Reader',
    category: 'supplies',
    asin: 'B09TMN58Y2',
    domain: 'com',
    image: '/products/kindle-paperwhite.jpg',
    rating: 4.7,
    reviewsCount: 31200,
    price: '$149.99',
    badge: 'Top Rated',
    shortDesc: 'Glare-free 300 ppi display. Reads like paper. 10-week battery. Waterproof.',
    highlights: [
      '6.8" screen with warm light feature',
      'Up to 10 weeks of battery life',
      'IPX8 waterproof design',
      'Instant dictionary & PDF highlight tools'
    ],
    targetCountries: ['Global'],
  },
  {
    id: 'matein-travel-laptop-backpack',
    name: 'Matein Travel Backpack with USB Charging Port',
    category: 'travel',
    asin: 'B06XZTZ7GB',
    domain: 'com',
    image: '/products/matein-backpack.jpg',
    rating: 4.7,
    reviewsCount: 89000,
    price: '$29.96',
    badge: '#1 Seller',
    shortDesc: 'Water-resistant backpack with anti-theft pocket and USB pass-through. Fits 15.6" laptop.',
    highlights: [
      'Fits up to 15.6 inch laptop',
      'Built-in USB charging port',
      'Anti-theft back pocket for passport and wallet',
      'Luggage strap attaches firmly to suitcase handle'
    ],
    targetCountries: ['Global'],
  },
  {
    id: 'utopia-bedding-sheet-set',
    name: 'Utopia Bedding Twin XL Sheet Set – Dorm Size',
    category: 'dorm',
    asin: 'B00N17M9M8',
    domain: 'com',
    image: '/products/utopia-bedding.jpg',
    rating: 4.5,
    reviewsCount: 124000,
    price: '$16.99',
    badge: 'Value Pick',
    shortDesc: 'Soft microfiber bed sheets for university dorm mattresses. Machine washable.',
    highlights: [
      'Fits standard Twin XL university dorm mattresses',
      'Fade-resistant and shrink-resistant material',
      'Easy care: machine wash cold',
      'Breathable and comfortable microfiber'
    ],
    targetCountries: ['USA', 'Canada', 'UK'],
  }
];
