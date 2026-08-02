// Default Amazon Associate Tag (Your actual Amazon Tracking Tag)
export const AMAZON_ASSOCIATE_TAG = 'limison-21';

export const buildAmazonUrl = (asin, tag = AMAZON_ASSOCIATE_TAG, domain = 'com') => {
  return `https://www.amazon.${domain}/dp/${asin}?tag=${tag}`;
};

export const PRODUCT_CATEGORIES = [
  { id: 'all', name: 'All Essentials', icon: '🎒' },
  { id: 'tech', name: 'Laptops & Tech', icon: '💻' },
  { id: 'travel', name: 'Luggage & Travel', icon: '🧳' },
  { id: 'dorm', name: 'Dorm & Living', icon: '🛏️' },
  { id: 'supplies', name: 'Study & Office', icon: '📝' },
  { id: 'adapters', name: 'Adapters & Power', icon: '🔌' }
];

export const PRODUCTS_DATA = [
  {
    id: 'macbook-air-m2',
    name: 'Apple 2022 MacBook Air Laptop with M2 Chip',
    category: 'tech',
    asin: 'B0B3C5A11S',
    image: 'https://m.media-amazon.com/images/I/71TPda7cwUL._AC_SL1500_.jpg',
    fallbackImage: '💻',
    rating: 4.8,
    reviewsCount: 14200,
    price: '$999.00',
    badge: 'Top Pick for Students',
    shortDesc: 'Ultra-lightweight, 18-hour battery life, fast M2 chip—the gold standard laptop for university coursework and study abroad.',
    highlights: [
      '13.6-inch Liquid Retina Display',
      '8GB Unified Memory, 256GB SSD Storage',
      'Silent fanless design with 18-hr battery life',
      'Backlit Magic Keyboard & Touch ID'
    ],
    targetCountries: ['USA', 'Germany', 'UK', 'Canada', 'Australia'],
    amazonUrl: 'https://www.amazon.com/dp/B0B3C5A11S?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'epicka-universal-adapter',
    name: 'EPICKA Universal All-in-One Travel Power Adapter',
    category: 'adapters',
    asin: 'B078S36M7Y',
    image: 'https://m.media-amazon.com/images/I/61gR7l+f4pL._AC_SL1500_.jpg',
    fallbackImage: '🔌',
    rating: 4.7,
    reviewsCount: 22800,
    price: '$22.99',
    badge: 'Must-Have Travel Gear',
    shortDesc: 'Covers over 150+ countries (EU, UK, US, AU). Includes 4 USB-A ports and 1 USB Type-C fast charging port.',
    highlights: [
      'Works in 150+ countries worldwide',
      'Supports 4 USB + 1 Type-C + 1 AC Socket simultaneously',
      'Built-in 8A fuse protection',
      'Compact & lightweight for carry-on bags'
    ],
    targetCountries: ['Global', 'Germany', 'UK', 'USA', 'Canada'],
    amazonUrl: 'https://www.amazon.com/dp/B078S36M7Y?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'samsonite-omni-hardside',
    name: 'Samsonite Omni 2 Hardside Expandable Luggage Set',
    category: 'travel',
    asin: 'B08F9S8F82',
    image: 'https://m.media-amazon.com/images/I/81fH+1T92UL._AC_SL1500_.jpg',
    fallbackImage: '🧳',
    rating: 4.6,
    reviewsCount: 18900,
    price: '$149.99',
    badge: 'Best International Luggage',
    shortDesc: 'Scratch-resistant polycarbonate construction with 360-degree spinner wheels to withstand long international flights.',
    highlights: [
      'Micro-diamond polycarbonate texture',
      'Side-mounted TSA locks for security',
      'Expandable design for extra packing space',
      '10-year Samsonite limited warranty'
    ],
    targetCountries: ['USA', 'Germany', 'UK', 'Canada'],
    amazonUrl: 'https://www.amazon.com/dp/B08F9S8F82?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'sony-wh1000xm4',
    name: 'Sony WH-1000XM4 Wireless Noise Canceling Headphones',
    category: 'tech',
    asin: 'B086MHBS93',
    image: 'https://m.media-amazon.com/images/I/71o8Q5XJS5L._AC_SL1500_.jpg',
    fallbackImage: '🎧',
    rating: 4.7,
    reviewsCount: 56100,
    price: '$348.00',
    badge: 'Best for Library & Flight',
    shortDesc: 'Industry-leading noise cancellation to focus in noisy university libraries, dorms, and during flights.',
    highlights: [
      'Dual Noise Sensor technology',
      'Up to 30-hour battery life with quick charging',
      'Speak-to-chat technology automatically reduces volume',
      'Superior mic quality for online lectures & Zoom calls'
    ],
    targetCountries: ['Global'],
    amazonUrl: 'https://www.amazon.com/dp/B086MHBS93?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'anker-power-bank-737',
    name: 'Anker 737 Power Bank (PowerCore 24K 140W)',
    category: 'adapters',
    asin: 'B09VPHVT2Z',
    image: 'https://m.media-amazon.com/images/I/61NbfmX-UUL._AC_SL1500_.jpg',
    fallbackImage: '🔋',
    rating: 4.6,
    reviewsCount: 8400,
    price: '$109.99',
    badge: 'High Power Output',
    shortDesc: 'Ultra-fast 140W bi-directional charging capable of charging a MacBook Air and phone at the same time.',
    highlights: [
      '24,000mAh capacity for multi-day battery life',
      'Smart Digital Display showing output/input power',
      'Charges laptops, tablets, and phones simultaneously',
      'Airline flight safe compliance'
    ],
    targetCountries: ['Global'],
    amazonUrl: 'https://www.amazon.com/dp/B09VPHVT2Z?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'kindle-paperwhite-16gb',
    name: 'Amazon Kindle Paperwhite (16 GB) – 6.8" Display',
    category: 'supplies',
    asin: 'B09TMN58Y2',
    image: 'https://m.media-amazon.com/images/I/61bK6PMOC3L._AC_SL1500_.jpg',
    fallbackImage: '📚',
    rating: 4.7,
    reviewsCount: 31200,
    price: '$149.99',
    badge: 'Textbook & Reading Companion',
    shortDesc: 'Glare-free 300 ppi display reads like real paper, even in direct sunlight. Store thousands of academic PDFs and e-books.',
    highlights: [
      '6.8" screen with warm light feature',
      'Up to 10 weeks of battery life',
      'IPX8 waterproof design',
      'Instant dictionary & PDF highlight tools'
    ],
    targetCountries: ['Global'],
    amazonUrl: 'https://www.amazon.com/dp/B09TMN58Y2?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'matein-travel-laptop-backpack',
    name: 'Matein Travel Laptop Backpack with USB Charging Port',
    category: 'travel',
    asin: 'B06XZTZ7GB',
    image: 'https://m.media-amazon.com/images/I/8106aLqRVAL._AC_SL1500_.jpg',
    fallbackImage: '🎒',
    rating: 4.7,
    reviewsCount: 89000,
    price: '$29.96',
    badge: '#1 Best Seller',
    shortDesc: 'Durable water-resistant backpack with anti-theft back pocket and built-in USB charger pass-through for campus life.',
    highlights: [
      'Fits up to 15.6 inch laptop',
      'Built-in USB charging port',
      'Anti-theft back pocket for passport and wallet',
      'Luggage strap attaches firmly to suitcase handle'
    ],
    targetCountries: ['Global'],
    amazonUrl: 'https://www.amazon.com/dp/B06XZTZ7GB?tag=' + AMAZON_ASSOCIATE_TAG
  },
  {
    id: 'utopia-bedding-sheet-set',
    name: 'Utopia Bedding Twin XL Sheet Set (Dorm Size)',
    category: 'dorm',
    asin: 'B00N17M9M8',
    image: 'https://m.media-amazon.com/images/I/61f2xN6k9DL._AC_SL1500_.jpg',
    fallbackImage: '🛏️',
    rating: 4.5,
    reviewsCount: 124000,
    price: '$16.99',
    badge: 'Dorm Room Essential',
    shortDesc: 'Standard Twin XL soft brushed microfiber bed sheets required for most international university dorm beds.',
    highlights: [
      'Fits standard Twin XL university dorm mattresses',
      'Fade-resistant and shrink-resistant material',
      'Easy care: machine wash cold',
      'Breathable and comfortable microfiber'
    ],
    targetCountries: ['USA', 'Canada', 'UK'],
    amazonUrl: 'https://www.amazon.com/dp/B00N17M9M8?tag=' + AMAZON_ASSOCIATE_TAG
  }
];
