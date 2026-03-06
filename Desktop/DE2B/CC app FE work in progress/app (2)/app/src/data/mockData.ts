/**
 * Mock datasets used to develop and test UI flows without live backend data.
 */
// Mock data for CampusCart

export interface Product {
  id: string;
  title: string;
  price: number;
  originalPrice?: number;
  condition: 'New' | 'Like New' | 'Good' | 'Fair' | 'Used';
  category: string;
  subcategory?: string;
  location: string;
  image: string;
  images?: string[];
  seller: User;
  description: string;
  specifications?: Record<string, string>;
  postedDate: string;
  views: number;
  favorites: number;
  isNegotiable: boolean;
  status: 'active' | 'sold' | 'pending';
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  university: string;
  major?: string;
  year?: string;
  isVerified: boolean;
  joinedDate: string;
  rating: number;
  reviewCount: number;
  bio?: string;
  phone?: string;
}

export interface Order {
  id: string;
  product: Product;
  buyer: User;
  seller: User;
  agreedPrice: number;
  originalPrice: number;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  meetupLocation: string;
  meetupTime?: string;
  orderDate: string;
  deliveryMethod: 'campus_meetup' | 'pickup';
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  productId?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  proposedPrice?: number;
}

export interface Conversation {
  id: string;
  participant: User;
  lastMessage: Message;
  unreadCount: number;
  product?: Product;
}

export interface Notification {
  id: string;
  type: 'message' | 'order' | 'bid' | 'listing' | 'system';
  title: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
}

// Current user (logged in)
export const currentUser: User = {
  id: 'u1',
  name: 'Rahul Sharma',
  email: 'rahul.s@campus.edu',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul',
  university: 'Indian Institute of Technology, Delhi',
  major: 'Computer Science',
  year: '3rd Year',
  isVerified: true,
  joinedDate: '2023-08-15',
  rating: 4.8,
  reviewCount: 24,
  bio: 'CS student passionate about tech and sustainability. Always looking to buy/sell course materials.',
  phone: '+91 98765 43210'
};

// Other users
export const users: User[] = [
  {
    id: 'u2',
    name: 'Jessica Roberts',
    email: 'jessica.r@iitb.ac.in',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jessica',
    university: 'IIT Bombay',
    major: 'Electrical Engineering',
    year: '4th Year',
    isVerified: true,
    joinedDate: '2022-06-10',
    rating: 4.9,
    reviewCount: 56
  },
  {
    id: 'u3',
    name: 'Sarah Miller',
    email: 'sarah.m@mit.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah',
    university: 'MIT',
    major: 'Biology',
    year: '2nd Year',
    isVerified: true,
    joinedDate: '2023-09-01',
    rating: 4.7,
    reviewCount: 18
  },
  {
    id: 'u4',
    name: 'Alex Chen',
    email: 'alex.c@stanford.edu',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex',
    university: 'Stanford University',
    major: 'Mechanical Engineering',
    year: '3rd Year',
    isVerified: true,
    joinedDate: '2023-01-20',
    rating: 4.6,
    reviewCount: 32
  },
  {
    id: 'u5',
    name: 'Priya Verma',
    email: 'priya.v@iitd.ac.in',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
    university: 'IIT Delhi',
    major: 'Biotechnology',
    year: '2nd Year',
    isVerified: true,
    joinedDate: '2023-07-15',
    rating: 4.9,
    reviewCount: 15
  },
  {
    id: 'u6',
    name: 'Aman Gupta',
    email: 'aman.g@iitb.ac.in',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aman',
    university: 'IIT Bombay',
    major: 'Mechanical Engineering',
    year: '4th Year',
    isVerified: true,
    joinedDate: '2022-08-01',
    rating: 4.5,
    reviewCount: 42
  }
];

// Products
export const products: Product[] = [
  {
    id: 'p1',
    title: 'Calculus: Early Transcendentals (9th Edition) - James Stewart',
    price: 1499,
    originalPrice: 4500,
    condition: 'Like New',
    category: 'Textbooks',
    subcategory: 'Mathematics',
    location: 'HSR Layout, BLR',
    image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1589829085413-56de8ae18c73?w=400&h=300&fit=crop'
    ],
    seller: users[1],
    description: 'Excellent condition textbook, used for only one semester. No highlighting or notes inside. Perfect for Calculus I, II, and III courses.',
    specifications: {
      'Author': 'James Stewart',
      'Edition': '9th Edition',
      'ISBN': '978-1337613927',
      'Publisher': 'Cengage Learning'
    },
    postedDate: '2024-01-15',
    views: 234,
    favorites: 18,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p2',
    title: 'Logitech G Pro Mechanical Keyboard - Blue Switches',
    price: 3200,
    originalPrice: 8999,
    condition: 'Good',
    category: 'Electronics',
    subcategory: 'Peripherals',
    location: 'Koramangala, BLR',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=300&fit=crop',
    seller: users[2],
    description: 'Professional gaming keyboard with tactile blue switches. RGB lighting works perfectly. Minor wear on keycaps but fully functional.',
    specifications: {
      'Brand': 'Logitech',
      'Model': 'G Pro',
      'Switch Type': 'Blue (Tactile)',
      'Connection': 'USB-C'
    },
    postedDate: '2024-01-14',
    views: 189,
    favorites: 12,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p3',
    title: 'Premium Chemistry Lab Kit - Includes Pipettes, Beakers & More',
    price: 850,
    originalPrice: 2500,
    condition: 'Like New',
    category: 'Lab Kits',
    location: 'Powai, MUM',
    image: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?w=400&h=300&fit=crop',
    seller: users[3],
    description: 'Complete chemistry lab kit with all essential equipment. Perfect for first-year chemistry courses. Everything is clean and sanitized.',
    specifications: {
      'Includes': 'Beakers, Pipettes, Test Tubes, Flask',
      'Condition': 'Sterilized and cleaned'
    },
    postedDate: '2024-01-13',
    views: 156,
    favorites: 8,
    isNegotiable: false,
    status: 'active'
  },
  {
    id: 'p4',
    title: 'Ergonomic Mesh Swivel Chair - Perfect for Dorm Study',
    price: 2400,
    originalPrice: 6500,
    condition: 'Good',
    category: 'Dorm Furniture',
    location: 'Guindy, CHN',
    image: 'https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?w=400&h=300&fit=crop',
    seller: users[4],
    description: 'Comfortable ergonomic chair with breathable mesh back. Adjustable height and lumbar support. Great for long study sessions.',
    specifications: {
      'Type': 'Office/Study Chair',
      'Material': 'Mesh + Fabric',
      'Features': 'Adjustable height, Swivel base'
    },
    postedDate: '2024-01-12',
    views: 312,
    favorites: 24,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p5',
    title: 'Casio fx-991EX Scientific Calculator',
    price: 1599,
    originalPrice: 2400,
    condition: 'New',
    category: 'Electronics',
    subcategory: 'Calculators',
    location: 'Andheri, Mumbai',
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQZ8zX5oxWbvw_7-3wtfYqDCHYX-anSK8FloA&s?w=400&h=300&fit=crop',
    seller: users[0],
    description: 'Brand new scientific calculator, never used. Perfect for engineering and science students. 552 functions, high-resolution LCD display.',
    specifications: {
      'Brand': 'Casio',
      'Model': 'fx-991EX Classwiz',
      'Functions': '552',
      'Display': 'High-Resolution LCD'
    },
    postedDate: '2024-01-16',
    views: 89,
    favorites: 5,
    isNegotiable: false,
    status: 'active'
  },
  {
    id: 'p6',
    title: 'Bluetooth Headphones - Noise Cancelling',
    price: 2499,
    originalPrice: 5999,
    condition: 'New',
    category: 'Electronics',
    subcategory: 'Audio',
    location: 'Andheri City, Mumbai',
    image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
    seller: users[2],
    description: 'Premium wireless headphones with active noise cancellation. 30-hour battery life. Comes with carrying case and all accessories.',
    specifications: {
      'Type': 'Over-ear Wireless',
      'Features': 'ANC, 30hr Battery',
      'Connection': 'Bluetooth 5.0'
    },
    postedDate: '2024-01-11',
    views: 267,
    favorites: 31,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p7',
    title: 'Organic Chemistry: Structure & Function',
    price: 650,
    originalPrice: 3200,
    condition: 'Good',
    category: 'Textbooks',
    subcategory: 'Chemistry',
    location: 'Library Block, Mumbai',
    image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400&h=300&fit=crop',
    seller: users[4],
    description: 'Comprehensive organic chemistry textbook. Some highlighting in important sections but overall good condition.',
    specifications: {
      'Subject': 'Organic Chemistry',
      'Level': 'Undergraduate'
    },
    postedDate: '2024-01-10',
    views: 145,
    favorites: 9,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p8',
    title: 'Premium Lab Coat - White',
    price: 1200,
    originalPrice: 2000,
    condition: 'New',
    category: 'Lab Kits',
    location: 'Science Dept, Mumbai',
    image: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&h=300&fit=crop',
    seller: users[1],
    description: 'High-quality lab coat, never worn. Size M. Perfect for chemistry and biology lab sessions.',
    specifications: {
      'Size': 'Medium',
      'Material': 'Cotton Blend',
      'Color': 'White'
    },
    postedDate: '2024-01-09',
    views: 78,
    favorites: 4,
    isNegotiable: false,
    status: 'active'
  },
  {
    id: 'p9',
    title: 'Ergonomic Study Table - Foldable',
    price: 3999,
    originalPrice: 7500,
    condition: 'Like New',
    category: 'Dorm Furniture',
    location: 'North Dorms, Mumbai',
    image: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400&h=300&fit=crop',
    seller: users[3],
    description: 'Spacious study table with built-in storage. Foldable design for easy moving. Perfect for dorm rooms.',
    specifications: {
      'Dimensions': '120cm x 60cm',
      'Material': 'Engineered Wood',
      'Features': 'Foldable, Storage drawer'
    },
    postedDate: '2024-01-08',
    views: 198,
    favorites: 15,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p10',
    title: 'Scientific Calculator - TI-84 Plus CE',
    price: 1450,
    originalPrice: 4500,
    condition: 'Like New',
    category: 'Electronics',
    subcategory: 'Calculators',
    location: 'Science Block, Mumbai',
    image: 'https://images.unsplash.com/photo-1587145820266-a5951eebb5e9?w=400&h=300&fit=crop',
    seller: users[0],
    description: 'Graphing calculator in excellent condition. Color display, rechargeable battery. Perfect for advanced math courses.',
    specifications: {
      'Brand': 'Texas Instruments',
      'Model': 'TI-84 Plus CE',
      'Display': 'Color LCD'
    },
    postedDate: '2024-01-07',
    views: 234,
    favorites: 22,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p11',
    title: 'iPad Air (4th Gen) - Space Grey',
    price: 29000,
    originalPrice: 54000,
    condition: 'Like New',
    category: 'Electronics',
    subcategory: 'Tablets',
    location: 'Campus Center, Delhi',
    image: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&h=300&fit=crop',
    seller: users[3],
    description: '64GB WiFi model. Used for one semester for note-taking. Screen protector installed since day one. Includes original box.',
    specifications: {
      'Model': 'iPad Air 4th Gen',
      'Storage': '64GB',
      'Color': 'Space Grey',
      'Connectivity': 'WiFi'
    },
    postedDate: '2024-01-06',
    views: 456,
    favorites: 45,
    isNegotiable: true,
    status: 'active'
  },
  {
    id: 'p12',
    title: 'Keychron K2 V2 Mechanical Keyboard',
    price: 5200,
    originalPrice: 8500,
    condition: 'Used',
    category: 'Electronics',
    subcategory: 'Peripherals',
    location: 'Powai, Mumbai',
    image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=400&h=300&fit=crop',
    seller: users[4],
    description: 'Wireless mechanical keyboard with Gateron Brown switches. RGB backlight, Bluetooth connectivity. Great for coding.',
    specifications: {
      'Brand': 'Keychron',
      'Model': 'K2 V2',
      'Switches': 'Gateron Brown',
      'Connection': 'Bluetooth/USB'
    },
    postedDate: '2024-01-05',
    views: 178,
    favorites: 14,
    isNegotiable: true,
    status: 'active'
  }
];

// Categories
export const categories = [
  { id: 'c1', name: 'Textbooks', icon: 'BookOpen', count: 12450, listings: '12k+' },
  { id: 'c2', name: 'Electronics', icon: 'Monitor', count: 3450, listings: '3.4k+' },
  { id: 'c3', name: 'Dorm Furniture', icon: 'BedDouble', count: 2180, listings: '2.1k+' },
  { id: 'c4', name: 'Lab Kits', icon: 'FlaskConical', count: 890, listings: '890+' },
  { id: 'c5', name: 'Stationery', icon: 'PenTool', count: 5670, listings: '5.6k+' },
  { id: 'c6', name: 'Study Notes', icon: 'FileText', count: 4320, listings: '4.3k+' }
];

// Universities
export const universities = [
  'Indian Institute of Technology, Delhi',
  'IIT Bombay',
  'IIT Madras',
  'IIT Kharagpur',
  'IIT Kanpur',
  'IIT Roorkee',
  'Delhi University',
  'Mumbai University',
  'Anna University',
  'Jadavpur University',
  'BITS Pilani',
  'NIT Trichy',
  'MIT (Manipal)',
  'VIT Vellore',
  'SRM University'
];

// Conversations/Messages
export const conversations: Conversation[] = [
  {
    id: 'conv1',
    participant: users[2],
    lastMessage: {
      id: 'm1',
      senderId: users[2].id,
      receiverId: currentUser.id,
      productId: 'p6',
      content: 'That price sounds fair to me!',
      timestamp: '2024-01-16T14:30:00Z',
      isRead: false,
      proposedPrice: 3000
    },
    unreadCount: 2,
    product: products[5]
  },
  {
    id: 'conv2',
    participant: users[3],
    lastMessage: {
      id: 'm2',
      senderId: users[3].id,
      receiverId: currentUser.id,
      content: 'Is it still available for pickup?',
      timestamp: '2024-01-16T13:15:00Z',
      isRead: true
    },
    unreadCount: 0
  },
  {
    id: 'conv3',
    participant: users[4],
    lastMessage: {
      id: 'm3',
      senderId: users[4].id,
      receiverId: currentUser.id,
      content: 'I can meet you at the Student Union.',
      timestamp: '2024-01-16T11:00:00Z',
      isRead: true
    },
    unreadCount: 0
  },
  {
    id: 'conv4',
    participant: users[1],
    lastMessage: {
      id: 'm4',
      senderId: currentUser.id,
      receiverId: users[1].id,
      content: 'Perfect, thanks again!',
      timestamp: '2024-01-15T16:45:00Z',
      isRead: true
    },
    unreadCount: 0
  }
];

// Orders
export const orders: Order[] = [
  {
    id: 'ord1',
    product: products[9],
    buyer: currentUser,
    seller: users[0],
    agreedPrice: 100,
    originalPrice: 1450,
    status: 'pending',
    meetupLocation: 'Main Library, Level 2 Study Area',
    orderDate: '2024-01-16',
    deliveryMethod: 'campus_meetup'
  },
  {
    id: 'ord2',
    product: products[6],
    buyer: currentUser,
    seller: users[4],
    agreedPrice: 65,
    originalPrice: 650,
    status: 'confirmed',
    meetupLocation: 'Student Union Cafe, Ground Floor',
    orderDate: '2024-01-14',
    deliveryMethod: 'campus_meetup'
  },
  {
    id: 'ord3',
    product: {
      ...products[0],
      title: 'Set of 5 Premium Dotted Notebooks',
      price: 25,
      image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=300&fit=crop',
      condition: 'Fair',
      category: 'Stationery'
    },
    buyer: currentUser,
    seller: users[5],
    agreedPrice: 25,
    originalPrice: 580,
    status: 'completed',
    meetupLocation: 'Engineering Block A Fountain',
    orderDate: '2024-01-10',
    deliveryMethod: 'campus_meetup'
  }
];

// Notifications
export const notifications: Notification[] = [
  {
    id: 'n1',
    type: 'message',
    title: 'New message from Sarah Miller',
    content: 'That price sounds fair to me!',
    timestamp: '2024-01-16T14:30:00Z',
    isRead: false,
    link: '/messages/conv1'
  },
  {
    id: 'n2',
    type: 'bid',
    title: 'New offer on your listing',
    content: 'Someone offered ₹2,800 for your Bluetooth Headphones',
    timestamp: '2024-01-16T12:00:00Z',
    isRead: false,
    link: '/listings'
  },
  {
    id: 'n3',
    type: 'order',
    title: 'Order confirmed',
    content: 'Your order for TI-84 Plus CE has been confirmed',
    timestamp: '2024-01-15T10:30:00Z',
    isRead: true,
    link: '/orders'
  },
  {
    id: 'n4',
    type: 'listing',
    title: 'Item sold!',
    content: 'Your Dotted Notebooks have been sold',
    timestamp: '2024-01-14T16:00:00Z',
    isRead: true,
    link: '/listings'
  },
  {
    id: 'n5',
    type: 'system',
    title: 'Welcome to CampusCart!',
    content: 'Complete your profile to start buying and selling',
    timestamp: '2024-01-10T09:00:00Z',
    isRead: true,
    link: '/profile'
  }
];

// User's listings
export const myListings: Product[] = [
  products[4], products[9]
];

// Wishlist
export const wishlist: Product[] = [
  products[0], products[2], products[5]
];

// Cart items
export const cartItems = [
  { product: products[6], quantity: 1 },
  { product: products[7], quantity: 1 },
  { product: {
    ...products[0],
    title: 'Grid Ruled Notebook',
    price: 580,
    image: 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=400&h=300&fit=crop',
    condition: 'New',
    category: 'Stationery'
  }, quantity: 1 }
];

