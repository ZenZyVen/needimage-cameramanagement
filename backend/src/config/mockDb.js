const bcrypt = require('bcryptjs');

// Pre-seeded realistic cinema data for offline/demo fallback
const passwordHash = bcrypt.hashSync('password123', 10);

const users = [
  {
    id: 'user-admin-1',
    name: 'Sarah Connor',
    username: 'admin',
    email: 'admin@cameragear.com',
    password: passwordHash,
    role: 'ADMIN',
    department: 'Production Operations',
    phone: '+1 555-019-2831',
    avatar: 'Studio Administrator & Vault Authority',
    profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M15,45 Q40,10 70,35 T130,30 Q160,50 195,20" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="140" y="60" font-family="cursive" font-size="14" fill="%2364748b">S. Connor</text></svg>',
    isActive: true,
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'user-stock-1',
    name: 'Marcus Vance',
    username: 'stock',
    email: 'stock@cameragear.com',
    password: passwordHash,
    role: 'STOCK_CONTROLLER',
    department: 'Gear Vault & Logistics',
    phone: '+1 555-019-4822',
    avatar: 'Lead Equipment Custodian - Quality Assurance',
    profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M20,50 Q45,15 80,40 T140,25 Q170,45 200,30" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="135" y="60" font-family="cursive" font-size="14" fill="%2364748b">M. Vance</text></svg>',
    isActive: true,
    createdAt: new Date('2026-01-02')
  },
  {
    id: 'user-normal-1',
    name: 'David Kim',
    username: 'user',
    email: 'user@cameragear.com',
    password: passwordHash,
    role: 'USER',
    department: 'Cinematography Unit',
    phone: '+1 555-019-7711',
    avatar: 'Director of Photography - Tier 1 Camera Packages',
    profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M25,48 Q60,18 90,42 T155,28 Q180,50 205,25" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="145" y="60" font-family="cursive" font-size="14" fill="%2364748b">D. Kim</text></svg>',
    isActive: true,
    createdAt: new Date('2026-01-03')
  },
  {
    id: 'user-normal-2',
    name: 'Elena Rostova',
    username: 'elena',
    email: 'elena@cameragear.com',
    password: passwordHash,
    role: 'USER',
    department: 'Documentary Division',
    phone: '+1 555-019-9944',
    avatar: 'Documentary Camera Operator - Field Approved',
    profilePhoto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M20,40 Q50,15 95,45 T150,22 Q175,40 200,20" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="135" y="60" font-family="cursive" font-size="14" fill="%2364748b">E. Rostova</text></svg>',
    isActive: true,
    createdAt: new Date('2026-01-04')
  }
];

// 18 Complete Media Production Categories
const categories = [
  { id: 'cat-cameras', name: 'Cameras', description: 'Cinema cameras, mirrorless bodies, and medium format systems', icon: 'bi-camera-reels' },
  { id: 'cat-lenses', name: 'Lenses', description: 'Cinema prime lenses, anamorphic optics, and cine zooms', icon: 'bi-disc' },
  { id: 'cat-lighting', name: 'Lighting', description: 'High-output LED monolights, tube lights, and softbox kits', icon: 'bi-lightbulb' },
  { id: 'cat-audio', name: 'Audio', description: 'Multi-track field recorders, mixers, and audio accessories', icon: 'bi-soundwave' },
  { id: 'cat-microphones', name: 'Microphones', description: 'Shotgun microphones, wireless lavalier kits, and boundary mics', icon: 'bi-mic' },
  { id: 'cat-tripods', name: 'Tripods', description: 'Carbon fiber fluid head tripods, heavy-duty pedestals, and hi-hats', icon: 'bi-triangle' },
  { id: 'cat-stand', name: 'Stand', description: 'Light stands, C-stands, boom arms, and studio support stands', icon: 'bi-arrows-move' },
  { id: 'cat-gimbals', name: 'Gimbals', description: '3-axis motorized gimbals, steadicams, and vehicle rig mounts', icon: 'bi-joystick' },
  { id: 'cat-drones', name: 'Drones', description: 'Aerial cinematography drones, FPV rigs, and flight controllers', icon: 'bi-send' },
  { id: 'cat-monitors', name: 'Monitors', description: 'High-brightness field monitors and wireless director stations', icon: 'bi-display' },
  { id: 'cat-broadcasting', name: 'Broadcasting', description: 'Broadcast video switchers, SDI converters, and tally systems', icon: 'bi-broadcast' },
  { id: 'cat-streaming', name: 'Streaming', description: 'Live video encoders, capture cards, and stream controllers', icon: 'bi-camera-video' },
  { id: 'cat-cables', name: 'Cables', description: '12G-SDI cables, HDMI 2.1, XLR audio cables, and D-Tap power cords', icon: 'bi-diagram-2' },
  { id: 'cat-batteries', name: 'Batteries', description: 'V-Mount / Gold-Mount battery bricks, chargers, and power banks', icon: 'bi-battery-charging' },
  { id: 'cat-memory-cards', name: 'Memory Cards', description: 'CFexpress Type A/B, SDXC V90 cards, and high-speed readers', icon: 'bi-sd-card' },
  { id: 'cat-computers', name: 'Computers', description: 'DIT workstations, on-set editing laptops, and color grading monitors', icon: 'bi-laptop' },
  { id: 'cat-storage-devices', name: 'Storage Devices', description: 'Rugged NVMe field SSDs, RAID arrays, and archive storage', icon: 'bi-device-ssd' },
  { id: 'cat-accessories', name: 'Accessories', description: 'Matte boxes, follow focus rigs, camera cages, clamps, and arms', icon: 'bi-gear-wide-connected' }
];

const equipment = [
  {
    id: 'eq-1',
    assetTag: 'CAM-001',
    name: 'Sony FX3 Full-Frame Cinema Camera',
    brand: 'Sony',
    model: 'ILME-FX3',
    serialNumber: 'SN-FX3-882194',
    categoryId: 'cat-cameras',
    quantity: 4,
    availableQuantity: 3,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-03-15'),
    purchasePrice: 3899.00,
    dailyRate: 150.00,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    notes: 'Firmware v5.00 updated. Full-frame 4K/120p sensor.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-2',
    assetTag: 'CAM-002',
    name: 'Sony FX6 Full-Frame Cinema Camera',
    brand: 'Sony',
    model: 'ILME-FX6V',
    serialNumber: 'SN-FX6-551029',
    categoryId: 'cat-cameras',
    quantity: 2,
    availableQuantity: 0,
    status: 'BORROWED',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-11-20'),
    purchasePrice: 5999.00,
    dailyRate: 250.00,
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
    notes: 'Electronic variable ND. Assigned to commercial production.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-002</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-3',
    assetTag: 'CAM-003',
    name: 'Canon EOS C70 4K Cinema Camera',
    brand: 'Canon',
    model: 'EOS C70',
    serialNumber: 'SN-C70-901844',
    categoryId: 'cat-cameras',
    quantity: 3,
    availableQuantity: 2,
    status: 'AVAILABLE',
    condition: 'GOOD',
    purchaseDate: new Date('2023-08-10'),
    purchasePrice: 5499.00,
    dailyRate: 220.00,
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&auto=format&fit=crop&q=80',
    notes: 'Super 35 DGO sensor. EF-EOS R 0.71x adapter available.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-003</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-4',
    assetTag: 'CAM-004',
    name: 'RED Komodo 6K Cinema Camera',
    brand: 'RED Digital Cinema',
    model: 'Komodo 6K',
    serialNumber: 'SN-KOM-109283',
    categoryId: 'cat-cameras',
    quantity: 2,
    availableQuantity: 1,
    status: 'UNDER_MAINTENANCE',
    condition: 'FAIR',
    purchaseDate: new Date('2023-05-18'),
    purchasePrice: 6200.00,
    dailyRate: 280.00,
    imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&auto=format&fit=crop&q=80',
    notes: 'Global shutter 6K sensor. 1 unit in inspection for SDI port tightening.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-004</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-5',
    assetTag: 'LNS-001',
    name: 'Sony FE 24-70mm f/2.8 GM II Lens',
    brand: 'Sony',
    model: 'SEL2470GM2',
    serialNumber: 'SN-LNS-772910',
    categoryId: 'cat-lenses',
    quantity: 5,
    availableQuantity: 4,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-01-20'),
    purchasePrice: 2298.00,
    dailyRate: 65.00,
    imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&auto=format&fit=crop&q=80',
    notes: 'Pristine condition. Front 82mm thread, Nano AR Coating II.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">LNS-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-6',
    assetTag: 'LGT-001',
    name: 'Aputure LS 600d Pro Daylight LED Monolight',
    brand: 'Aputure',
    model: 'LS 600d Pro',
    serialNumber: 'SN-LGT-339102',
    categoryId: 'cat-lighting',
    quantity: 4,
    availableQuantity: 2,
    status: 'BORROWED',
    condition: 'GOOD',
    purchaseDate: new Date('2023-09-05'),
    purchasePrice: 1890.00,
    dailyRate: 110.00,
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    notes: 'Weather-resistant IP54 rating. Hyper reflector and control box.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">LGT-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-7',
    assetTag: 'AUD-001',
    name: 'Sound Devices MixPre-6 II 32-Bit Float Field Recorder',
    brand: 'Sound Devices',
    model: 'MixPre-6 II',
    serialNumber: 'SN-AUD-883192',
    categoryId: 'cat-audio',
    quantity: 3,
    availableQuantity: 3,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-02-12'),
    purchasePrice: 1150.00,
    dailyRate: 60.00,
    imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=600&auto=format&fit=crop&q=80',
    notes: '32-bit float recording with ultra-low noise Kashmir preamps.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">AUD-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-8',
    assetTag: 'MIC-001',
    name: 'Sennheiser MKH 416 Shotgun Microphone',
    brand: 'Sennheiser',
    model: 'MKH 416-P48U3',
    serialNumber: 'SN-MIC-119280',
    categoryId: 'cat-microphones',
    quantity: 4,
    availableQuantity: 3,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-04-10'),
    purchasePrice: 999.00,
    dailyRate: 45.00,
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
    notes: 'Standard film dialogue interference tube shotgun mic with phantom power.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">MIC-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-9',
    assetTag: 'TRP-001',
    name: 'Sachtler Flowtech 75 MS Carbon Fiber Tripod',
    brand: 'Sachtler',
    model: 'Flowtech 75 w/ FSB 6',
    serialNumber: 'SN-TRP-440219',
    categoryId: 'cat-tripods',
    quantity: 4,
    availableQuantity: 3,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-06-14'),
    purchasePrice: 2450.00,
    dailyRate: 75.00,
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    notes: 'Quick-release brakes with carbon fiber legs and fluid drag head.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">TRP-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-10',
    assetTag: 'GMB-001',
    name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
    brand: 'DJI',
    model: 'RS 3 Pro Combo',
    serialNumber: 'SN-GMB-993812',
    categoryId: 'cat-gimbals',
    quantity: 3,
    availableQuantity: 2,
    status: 'AVAILABLE',
    condition: 'GOOD',
    purchaseDate: new Date('2023-07-22'),
    purchasePrice: 1099.00,
    dailyRate: 70.00,
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    notes: 'Extended carbon fiber axis arms. Payload up to 4.5kg.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">GMB-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-11',
    assetTag: 'DRN-001',
    name: 'DJI Inspire 3 Full-Frame 8K Cinema Drone',
    brand: 'DJI',
    model: 'Inspire 3',
    serialNumber: 'SN-DRN-773109',
    categoryId: 'cat-drones',
    quantity: 1,
    availableQuantity: 1,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-04-10'),
    purchasePrice: 16499.00,
    dailyRate: 850.00,
    imageUrl: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600&auto=format&fit=crop&q=80',
    notes: '8K/75fps Apple ProRes RAW aerial package with dual remote controllers.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">DRN-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-12',
    assetTag: 'MON-001',
    name: 'SmallHD Cine 7 Touchscreen Field Monitor',
    brand: 'SmallHD',
    model: 'Cine 7 Daylight',
    serialNumber: 'SN-MON-552091',
    categoryId: 'cat-monitors',
    quantity: 4,
    availableQuantity: 3,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-10-05'),
    purchasePrice: 1799.00,
    dailyRate: 90.00,
    imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    notes: '1800 nits daylight-viewable 7-inch display with 3D LUT support and camera control.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">MON-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-13',
    assetTag: 'BRD-001',
    name: 'Blackmagic ATEM Television Studio HD8',
    brand: 'Blackmagic Design',
    model: 'ATEM TV Studio HD8',
    serialNumber: 'SN-BRD-330198',
    categoryId: 'cat-broadcasting',
    quantity: 2,
    availableQuantity: 2,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-12-01'),
    purchasePrice: 2995.00,
    dailyRate: 140.00,
    imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=600&auto=format&fit=crop&q=80',
    notes: '8-input 3G-SDI live production switcher with built-in hardware control surface.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">BRD-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-14',
    assetTag: 'STR-001',
    name: 'Blackmagic Web Presenter 4K Streaming Engine',
    brand: 'Blackmagic Design',
    model: 'Web Presenter 4K',
    serialNumber: 'SN-STR-129038',
    categoryId: 'cat-streaming',
    quantity: 3,
    availableQuantity: 3,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-01-10'),
    purchasePrice: 695.00,
    dailyRate: 40.00,
    imageUrl: 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=600&auto=format&fit=crop&q=80',
    notes: 'Ultra HD hardware streaming engine for YouTube, Facebook Live, and Twitter.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">STR-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-15',
    assetTag: 'CBL-001',
    name: 'Canare 12G-SDI BNC Cable Master Kit (50ft)',
    brand: 'Canare',
    model: '12G-BNC-50',
    serialNumber: 'SN-CBL-660192',
    categoryId: 'cat-cables',
    quantity: 20,
    availableQuantity: 18,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-05-10'),
    purchasePrice: 95.00,
    dailyRate: 10.00,
    imageUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    notes: '4K/8K 12G high-frequency SDI coaxial cable with gold-plated connectors.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CBL-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-16',
    assetTag: 'BAT-001',
    name: 'Anton Bauer Titon 150 V-Mount Battery Pack',
    brand: 'Anton Bauer',
    model: 'Titon 150 V-Mount',
    serialNumber: 'SN-BAT-901842',
    categoryId: 'cat-batteries',
    quantity: 12,
    availableQuantity: 10,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-08-15'),
    purchasePrice: 425.00,
    dailyRate: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1619725002198-6a689b72f41d?w=600&auto=format&fit=crop&q=80',
    notes: '144Wh lithium-ion flight-safe battery with LCD fuel gauge and D-Tap output.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">BAT-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-17',
    assetTag: 'MEM-001',
    name: 'Sony TOUGH 160GB CFexpress Type A Memory Card',
    brand: 'Sony',
    model: 'CEA-G160T',
    serialNumber: 'SN-MEM-449102',
    categoryId: 'cat-memory-cards',
    quantity: 10,
    availableQuantity: 8,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-01-15'),
    purchasePrice: 398.00,
    dailyRate: 25.00,
    imageUrl: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=600&auto=format&fit=crop&q=80',
    notes: 'Up to 800MB/s read, 700MB/s write. Rugged resin-molded TOUGH build.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">MEM-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-18',
    assetTag: 'CMP-001',
    name: 'Apple MacBook Pro 16" M3 Max On-Set DIT Station',
    brand: 'Apple',
    model: 'MBP 16 M3 Max',
    serialNumber: 'SN-CMP-881902',
    categoryId: 'cat-computers',
    quantity: 2,
    availableQuantity: 2,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-02-01'),
    purchasePrice: 3999.00,
    dailyRate: 180.00,
    imageUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600&auto=format&fit=crop&q=80',
    notes: '64GB RAM, 2TB SSD, DaVinci Resolve Studio & Silverstack Lab installed.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CMP-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-19',
    assetTag: 'STR-002',
    name: 'SanDisk Professional 4TB PRO-BLADE Transport NVMe SSD',
    brand: 'SanDisk Professional',
    model: 'PRO-BLADE 4TB',
    serialNumber: 'SN-STR-991023',
    categoryId: 'cat-storage-devices',
    quantity: 8,
    availableQuantity: 7,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-11-10'),
    purchasePrice: 549.00,
    dailyRate: 35.00,
    imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
    notes: 'Ultra-fast 2000MB/s USB-C Gen 2x2 modular SSD mag for high-res dailies offload.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">STR-002</text></svg>',
    isDeleted: false,
    deletedAt: null
  },
  {
    id: 'eq-20',
    assetTag: 'ACC-001',
    name: 'Tilta Mirage Carbon Fiber Matte Box System',
    brand: 'Tilta',
    model: 'Mirage Matte Box MB-T16',
    serialNumber: 'SN-ACC-771920',
    categoryId: 'cat-accessories',
    quantity: 5,
    availableQuantity: 4,
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-07-15'),
    purchasePrice: 369.00,
    dailyRate: 20.00,
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
    notes: 'Ultra-lightweight 95mm clamp-on matte box with 4x5.65 filter tray and top flag.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">ACC-001</text></svg>',
    isDeleted: false,
    deletedAt: null
  }
];

const projects = [
  {
    id: 'prj-1',
    projectCode: 'PRJ-2026-001',
    title: 'Horizon 2026 Electric Vehicle Commercial',
    client: 'Apex Automotive Group',
    director: 'Alex Rivera',
    location: 'Pacific Rim Highway Stage 3',
    startDate: new Date('2026-11-05'),
    endDate: new Date('2026-11-20'),
    status: 'IN_PRODUCTION',
    createdById: 'user-admin-1',
    notes: 'High-speed tracking shots, day/night lighting setups required.'
  },
  {
    id: 'prj-2',
    projectCode: 'PRJ-2026-002',
    title: 'Echoes of the High Arctic (Docuseries)',
    client: 'Earth Horizon Media',
    director: 'Elena Rostova',
    location: 'Northern Svalbard Archipelago',
    startDate: new Date('2026-11-25'),
    endDate: new Date('2026-12-10'),
    status: 'PLANNING',
    createdById: 'user-normal-2',
    notes: 'Cold weather resilience gear, weather-sealed prime lenses required.'
  },
  {
    id: 'prj-3',
    projectCode: 'PRJ-2026-003',
    title: 'Metropolitan Fashion Week 2026',
    client: 'Vogue Global Media',
    director: 'David Kim',
    location: 'Grand Palais Exhibition Center',
    startDate: new Date('2026-10-15'),
    endDate: new Date('2026-10-22'),
    status: 'COMPLETED',
    createdById: 'user-normal-1',
    notes: 'Handheld gimbal tracking and wireless video to client lounge.'
  }
];

const borrowRequests = [
  {
    id: 'req-1',
    requestNumber: 'REQ-2026-001',
    userId: 'user-normal-1',
    projectId: 'prj-1',
    startDate: new Date('2026-11-08'),
    endDate: new Date('2026-11-15'),
    purpose: 'Commercial vehicle shoot - exterior tracking and night lighting',
    destination: 'Pacific Rim Highway Stage 3',
    status: 'CHECKED_OUT',
    approvedById: 'user-admin-1',
    approvedAt: new Date('2026-11-07T14:30:00Z'),
    notes: 'Handled by Marcus Vance at Vault Locker.'
  },
  {
    id: 'req-2',
    requestNumber: 'REQ-2026-002',
    userId: 'user-normal-2',
    projectId: 'prj-2',
    startDate: new Date('2026-11-25'),
    endDate: new Date('2026-12-05'),
    purpose: 'Arctic wildlife documentary reconnaissance shoot',
    destination: 'Svalbard Field Station',
    status: 'PENDING',
    notes: 'Requesting weather-resistant cases and spare battery quad kit.'
  },
  {
    id: 'req-3',
    requestNumber: 'REQ-2026-003',
    userId: 'user-normal-1',
    projectId: 'prj-3',
    startDate: new Date('2026-10-15'),
    endDate: new Date('2026-10-22'),
    purpose: 'Runway multi-camera broadcast capture',
    destination: 'Grand Palais Hall B',
    status: 'RETURNED',
    approvedById: 'user-admin-1',
    approvedAt: new Date('2026-10-14T09:00:00Z'),
    actualReturnDate: new Date('2026-10-22T17:00:00Z'),
    notes: 'Returned in pristine condition.'
  }
];

const borrowRequestItems = [
  { id: 'item-1', requestId: 'req-1', equipmentId: 'eq-2', status: 'CHECKED_OUT' },
  { id: 'item-2', requestId: 'req-1', equipmentId: 'eq-6', status: 'CHECKED_OUT' },
  { id: 'item-3', requestId: 'req-2', equipmentId: 'eq-1', status: 'REQUESTED' },
  { id: 'item-4', requestId: 'req-3', equipmentId: 'eq-1', status: 'RETURNED' },
  { id: 'item-5', requestId: 'req-3', equipmentId: 'eq-5', status: 'RETURNED' }
];

const checkInOuts = [
  {
    id: 'chk-1',
    requestId: 'req-1',
    equipmentId: 'eq-2',
    type: 'CHECK_OUT',
    handledById: 'user-stock-1',
    borrowerName: 'David Kim',
    borrowerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">D. Kim</text></svg>',
    staffSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">M. Vance</text></svg>',
    conditionAtAction: 'EXCELLENT',
    actionDate: new Date('2026-11-08T09:15:00Z'),
    notes: 'Inspected sensor and verified battery capacity at 100%.'
  },
  {
    id: 'chk-2',
    requestId: 'req-1',
    equipmentId: 'eq-6',
    type: 'CHECK_OUT',
    handledById: 'user-stock-1',
    borrowerName: 'David Kim',
    borrowerSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">D. Kim</text></svg>',
    staffSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">M. Vance</text></svg>',
    conditionAtAction: 'GOOD',
    actionDate: new Date('2026-11-08T09:20:00Z'),
    notes: 'Tested ballast and Bowens mount locking latch.'
  },
  {
    id: 'chk-3',
    requestId: 'req-3',
    equipmentId: 'eq-1',
    type: 'CHECK_IN',
    handledById: 'user-admin-1',
    borrowerName: 'David Kim',
    staffSignature: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="40"><text y="25" font-family="cursive">S. Connor</text></svg>',
    conditionAtAction: 'EXCELLENT',
    actionDate: new Date('2026-10-22T17:00:00Z'),
    notes: 'Check-in completed. Sensor clean, firmware intact.'
  }
];

const maintenances = [
  {
    id: 'mnt-1',
    ticketNumber: 'MNT-2026-001',
    equipmentId: 'eq-4',
    reportedById: 'user-stock-1',
    issueTitle: 'SDI Port 1 Loose Connection Inspection',
    description: 'During checkout QC, 12G-SDI video feed experienced intermittent drop when cable was flexed. Port BNC barrel needs retention ring tightening.',
    severity: 'MEDIUM',
    status: 'IN_REPAIR',
    damageCategory: 'Cable / Port / SDI',
    damageImageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=600&auto=format&fit=crop&q=80',
    technician: 'Marcus Vance (Vault Internal Tech)',
    vendor: 'RED Digital Cinema Certified Service',
    cost: 175.00,
    scheduledDate: new Date('2026-11-12'),
    createdAt: new Date('2026-11-06T10:00:00Z')
  }
];

const notifications = [
  {
    id: 'notif-1',
    userId: 'user-admin-1',
    title: 'New Equipment Requisition',
    message: 'David Kim submitted requisition REQ-2026-001 for Horizon Commercial.',
    type: 'INFO',
    isRead: false,
    link: '/requests',
    createdAt: new Date('2026-11-07T12:00:00Z')
  },
  {
    id: 'notif-2',
    userId: 'user-stock-1',
    title: 'Scheduled Maintenance Due',
    message: 'RED Komodo 6K (CAM-004) scheduled for bench diagnostic.',
    type: 'WARNING',
    isRead: false,
    link: '/maintenance',
    createdAt: new Date('2026-11-08T08:00:00Z')
  }
];

const auditLogs = [
  {
    id: 'audit-1',
    userId: 'user-admin-1',
    action: 'INITIALIZE_SYSTEM',
    entity: 'System',
    entityId: 'vault-01',
    details: { message: 'CineVault Studio Equipment System initialized.' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-11-01T08:00:00Z')
  },
  {
    id: 'audit-2',
    userId: 'user-admin-1',
    action: 'CREATE_PROJECT',
    entity: 'Project',
    entityId: 'prj-1',
    details: { projectCode: 'PRJ-2026-001', title: 'Horizon 2026 Electric Vehicle Commercial', director: 'Alex Rivera' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-11-02T09:30:00Z')
  },
  {
    id: 'audit-3',
    userId: 'user-admin-1',
    action: 'RESTOCK_EQUIPMENT',
    entity: 'Equipment',
    entityId: 'eq-1',
    details: { assetTag: 'CAM-001', name: 'Sony FX3 Full-Frame Cinema Camera', delta: 4, reason: 'PO-2026-01 Intake' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-11-03T11:00:00Z')
  },
  {
    id: 'audit-4',
    userId: 'user-normal-1',
    action: 'SUBMIT_REQUEST',
    entity: 'BorrowRequest',
    entityId: 'req-1',
    details: { requestNumber: 'REQ-2026-001', purpose: 'Commercial vehicle shoot - exterior tracking' },
    ipAddress: '192.168.1.45',
    createdAt: new Date('2026-11-07T10:15:00Z')
  },
  {
    id: 'audit-5',
    userId: 'user-admin-1',
    action: 'APPROVE_REQUEST',
    entity: 'BorrowRequest',
    entityId: 'req-1',
    details: { requestNumber: 'REQ-2026-001', approvedFor: 'David Kim' },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-11-07T14:30:00Z')
  },
  {
    id: 'audit-6',
    userId: 'user-stock-1',
    action: 'CHECK_OUT',
    entity: 'Equipment',
    entityId: 'eq-2',
    details: { assetTag: 'CAM-002', borrower: 'David Kim', requestNumber: 'REQ-2026-001' },
    ipAddress: '192.168.1.12',
    createdAt: new Date('2026-11-08T09:15:00Z')
  },
  {
    id: 'audit-7',
    userId: 'user-stock-1',
    action: 'REPORT_MAINTENANCE',
    entity: 'Maintenance',
    entityId: 'mnt-1',
    details: { ticketNumber: 'MNT-2026-001', assetTag: 'CAM-004', severity: 'MEDIUM', issue: 'SDI port loose' },
    ipAddress: '192.168.1.12',
    createdAt: new Date('2026-11-09T14:00:00Z')
  },
  {
    id: 'audit-8',
    userId: 'user-admin-1',
    action: 'UPDATE_SETTINGS',
    entity: 'SystemSettings',
    entityId: 'global',
    details: { updatedKeys: ['invoiceHeader', 'loanTerms', 'maxLoanDurationDays'] },
    ipAddress: '127.0.0.1',
    createdAt: new Date('2026-11-10T16:20:00Z')
  }
];

// Track all stock movements (In, Out, Damage, Adjustment, Restore)
const stockMovements = [
  {
    id: 'mov-1',
    equipmentId: 'eq-1',
    assetTag: 'CAM-001',
    equipmentName: 'Sony FX3 Full-Frame Cinema Camera',
    type: 'INITIAL_STOCK',
    quantityChanged: 4,
    previousAvailable: 0,
    newAvailable: 4,
    previousTotal: 0,
    newTotal: 4,
    reference: 'PO-2026-01',
    notes: 'Initial vault catalog inventory intake.',
    performedBy: 'Sarah Connor',
    createdAt: new Date('2026-10-01T08:00:00Z')
  },
  {
    id: 'mov-2',
    equipmentId: 'eq-2',
    assetTag: 'CAM-002',
    equipmentName: 'Sony FX6 Full-Frame Cinema Camera',
    type: 'CHECK_OUT',
    quantityChanged: -2,
    previousAvailable: 2,
    newAvailable: 0,
    previousTotal: 2,
    newTotal: 2,
    reference: 'REQ-2026-001',
    notes: 'Checked out to David Kim for Horizon Commercial shoot.',
    performedBy: 'Marcus Vance',
    createdAt: new Date('2026-11-08T09:15:00Z')
  },
  {
    id: 'mov-3',
    equipmentId: 'eq-4',
    assetTag: 'CAM-004',
    equipmentName: 'RED Komodo 6K Cinema Camera',
    type: 'MAINTENANCE',
    quantityChanged: -1,
    previousAvailable: 2,
    newAvailable: 1,
    previousTotal: 2,
    newTotal: 2,
    reference: 'MNT-2026-001',
    notes: 'Unit quarantined for SDI port tightening.',
    performedBy: 'Marcus Vance',
    createdAt: new Date('2026-11-06T10:00:00Z')
  },
  {
    id: 'mov-4',
    equipmentId: 'eq-16',
    assetTag: 'BAT-001',
    equipmentName: 'Anton Bauer Titon 150 V-Mount Battery Pack',
    type: 'RESTOCK',
    quantityChanged: 4,
    previousAvailable: 6,
    newAvailable: 10,
    previousTotal: 8,
    newTotal: 12,
    reference: 'RESTOCK-PO-991',
    notes: 'Routine seasonal restock of high-capacity flight-safe batteries.',
    performedBy: 'Sarah Connor',
    createdAt: new Date('2026-11-09T11:30:00Z')
  },
  {
    id: 'mov-5',
    equipmentId: 'eq-17',
    assetTag: 'MEM-001',
    equipmentName: 'Sony TOUGH 160GB CFexpress Type A Memory Card',
    type: 'CHECK_OUT',
    quantityChanged: -2,
    previousAvailable: 10,
    newAvailable: 8,
    previousTotal: 10,
    newTotal: 10,
    reference: 'REQ-2026-001',
    notes: 'Issued to D. Kim alongside FX6 kit.',
    performedBy: 'Marcus Vance',
    createdAt: new Date('2026-11-08T09:18:00Z')
  }
];

// Centralized System Settings (Company Branding, Rules, Colors)
let systemSettings = {
  companyName: 'CineVault Media Production Studios',
  companyTagline: 'Professional Camera Equipment & Stock Vault',
  logoUrl: '/logo.svg',
  address: 'Studio Lot 4B, 742 Sunset Boulevard, Media Arts District, CA 90028',
  phone: '+1 (555) 019-2831',
  email: 'operations@cinevault-studios.com',
  website: 'www.cinevault-studios.com',
  brandColor: '#0f172a',
  accentColor: '#2563eb',
  currency: 'USD',
  maxLoanDurationDays: 14,
  requireApproval: true,
  autoOverdueCheck: true,
  allowMultipleItemsPerRequest: true,
  lowStockThreshold: 2,
  autoOutOfStockStatus: true,
  enableStockMovementLogging: true,
  defaultInspectorTitle: 'Lead Vault Inspector',
  requireInspectionSignature: true,
  autoCreateTicketOnDamagedCheckin: true,
  notifyOnBorrowRequest: true,
  notifyOnOverdue: true,
  notifyOnLowStock: true
};

// Filtering helper
function filterCollection(collection, where = {}) {
  if (!where || Object.keys(where).length === 0) return [...collection];

  return collection.filter(item => {
    for (const [key, val] of Object.entries(where)) {
      if (val === undefined) continue;

      if (key === 'OR' && Array.isArray(val)) {
        const orMatches = val.some(subCondition => {
          return Object.entries(subCondition).every(([k, v]) => {
            if (v && v.contains) {
              const strVal = String(item[k] || '').toLowerCase();
              return strVal.includes(String(v.contains).toLowerCase());
            }
            if (v && v.equals) {
              return String(item[k] || '').toLowerCase() === String(v.equals).toLowerCase();
            }
            return item[k] === v;
          });
        });
        if (!orMatches) return false;
      } else if (key === 'isDeleted') {
        // Explicit soft-delete filter
        if (Boolean(item.isDeleted) !== Boolean(val)) return false;
      } else if (val && typeof val === 'object' && val.in && Array.isArray(val.in)) {
        if (!val.in.includes(item[key])) return false;
      } else if (val && typeof val === 'object' && val.lt) {
        if (new Date(item[key]) >= new Date(val.lt)) return false;
      } else if (val && typeof val === 'object' && val.gte) {
        if (new Date(item[key]) < new Date(val.gte)) return false;
      } else if (item[key] !== val) {
        return false;
      }
    }
    return true;
  });
}

// In-Memory Mock Store Provider for seamless Zero-Setup execution
const mockStore = {
  user: {
    findMany: async ({ where } = {}) => filterCollection(users, where),
    findUnique: async ({ where } = {}) => users.find(u =>
      (where.id && u.id === where.id) ||
      (where.username && u.username && u.username.toLowerCase() === where.username.toLowerCase()) ||
      (where.email && u.email && u.email.toLowerCase() === where.email.toLowerCase())
    ),
    findFirst: async ({ where } = {}) => filterCollection(users, where)[0] || null,
    count: async ({ where } = {}) => filterCollection(users, where).length,
    create: async ({ data }) => {
      const newUser = { id: `user-${Date.now()}`, createdAt: new Date(), ...data };
      users.push(newUser);
      return newUser;
    },
    update: async ({ where, data }) => {
      const idx = users.findIndex(u => u.id === where.id);
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data, updatedAt: new Date() };
        return users[idx];
      }
      return null;
    },
    delete: async ({ where }) => {
      const idx = users.findIndex(u => u.id === where.id);
      if (idx !== -1) users.splice(idx, 1);
      return { success: true };
    }
  },

  category: {
    findMany: async ({ where, include } = {}) => {
      let list = filterCollection(categories, where);
      if (include?._count) {
        list = list.map(c => ({
          ...c,
          _count: { equipment: equipment.filter(e => e.categoryId === c.id && !e.isDeleted).length }
        }));
      }
      return list;
    },
    findUnique: async ({ where }) => categories.find(c => c.id === where.id || c.name === where.name),
    count: async () => categories.length,
    create: async ({ data }) => {
      const newCat = { id: `cat-${Date.now()}`, ...data };
      categories.push(newCat);
      return newCat;
    },
    update: async ({ where, data }) => {
      const idx = categories.findIndex(c => c.id === where.id);
      if (idx !== -1) {
        categories[idx] = { ...categories[idx], ...data, updatedAt: new Date() };
        return categories[idx];
      }
      return null;
    },
    delete: async ({ where }) => {
      const idx = categories.findIndex(c => c.id === where.id);
      if (idx !== -1) {
        return categories.splice(idx, 1)[0];
      }
      return null;
    }
  },

  equipment: {
    findMany: async ({ where = {}, take = 100, skip = 0, include } = {}) => {
      // Default: exclude soft-deleted unless where.isDeleted explicitly requested
      const effectiveWhere = { ...where };
      if (effectiveWhere.isDeleted === undefined) {
        effectiveWhere.isDeleted = false;
      }
      let list = filterCollection(equipment, effectiveWhere);
      list = list.slice(skip, skip + take);
      return list.map(eq => ({
        ...eq,
        category: categories.find(c => c.id === eq.categoryId) || null,
        borrowItems: borrowRequestItems
          .filter(i => i.equipmentId === eq.id && i.status === 'CHECKED_OUT')
          .map(i => ({
            ...i,
            request: borrowRequests.find(r => r.id === i.requestId)
          }))
      }));
    },
    findUnique: async ({ where }) => {
      const eq = equipment.find(e => e.id === where.id || e.assetTag === where.assetTag || e.serialNumber === where.serialNumber);
      if (!eq) return null;
      return {
        ...eq,
        category: categories.find(c => c.id === eq.categoryId) || null,
        borrowItems: borrowRequestItems.filter(i => i.equipmentId === eq.id).map(i => ({
          ...i,
          request: borrowRequests.find(r => r.id === i.requestId)
        })),
        checkInsOuts: checkInOuts.filter(c => c.equipmentId === eq.id).map(c => ({
          ...c,
          handledBy: users.find(u => u.id === c.handledById)
        })),
        maintenances: maintenances.filter(m => m.equipmentId === eq.id).map(m => ({
          ...m,
          reportedBy: users.find(u => u.id === m.reportedById)
        }))
      };
    },
    findFirst: async ({ where = {} }) => {
      const effectiveWhere = { ...where };
      if (effectiveWhere.isDeleted === undefined) {
        effectiveWhere.isDeleted = false;
      }
      const matches = filterCollection(equipment, effectiveWhere);
      if (!matches[0]) return null;
      const eq = matches[0];
      return {
        ...eq,
        category: categories.find(c => c.id === eq.categoryId) || null,
        borrowItems: borrowRequestItems.filter(i => i.equipmentId === eq.id && i.status === 'CHECKED_OUT').map(i => ({
          ...i,
          request: borrowRequests.find(r => r.id === i.requestId)
        }))
      };
    },
    count: async ({ where = {} } = {}) => {
      const effectiveWhere = { ...where };
      if (effectiveWhere.isDeleted === undefined) {
        effectiveWhere.isDeleted = false;
      }
      return filterCollection(equipment, effectiveWhere).length;
    },
    create: async ({ data }) => {
      const qty = parseInt(data.quantity || 1, 10);
      const avail = data.availableQuantity !== undefined ? parseInt(data.availableQuantity, 10) : qty;
      const newEq = {
        id: `eq-${Date.now()}`,
        quantity: qty,
        availableQuantity: avail,
        isDeleted: false,
        deletedAt: null,
        createdAt: new Date(),
        ...data
      };
      equipment.push(newEq);

      return { ...newEq, category: categories.find(c => c.id === newEq.categoryId) };
    },
    update: async ({ where, data }) => {
      const idx = equipment.findIndex(e => e.id === where.id);
      if (idx !== -1) {
        const prev = equipment[idx];
        const updated = { ...prev, ...data, updatedAt: new Date() };

        // Auto-status adjustment based on stock
        if (updated.availableQuantity <= 0 && updated.status === 'AVAILABLE') {
          updated.status = updated.quantity > 0 ? 'BORROWED' : 'OUT_OF_STOCK';
        } else if (updated.availableQuantity > 0 && (updated.status === 'BORROWED' || updated.status === 'OUT_OF_STOCK')) {
          updated.status = 'AVAILABLE';
        }

        equipment[idx] = updated;
        return { ...updated, category: categories.find(c => c.id === updated.categoryId) };
      }
      return null;
    },
    delete: async ({ where }) => {
      const idx = equipment.findIndex(e => e.id === where.id);
      if (idx !== -1) {
        return equipment.splice(idx, 1)[0];
      }
      return { success: true };
    },
    deleteMany: async ({ where } = {}) => {
      const toRemove = new Set(filterCollection(equipment, where).map(e => e.id));
      for (let i = equipment.length - 1; i >= 0; i--) {
        if (toRemove.has(equipment[i].id)) equipment.splice(i, 1);
      }
      return { count: toRemove.size };
    }
  },

  project: {
    findMany: async ({ where, include } = {}) => {
      let list = filterCollection(projects, where);
      return list.map(p => ({
        ...p,
        createdBy: users.find(u => u.id === p.createdById),
        _count: { borrowRequests: borrowRequests.filter(r => r.projectId === p.id).length }
      }));
    },
    findUnique: async ({ where }) => {
      const p = projects.find(proj => proj.id === where.id || proj.projectCode === where.projectCode);
      if (!p) return null;
      return {
        ...p,
        createdBy: users.find(u => u.id === p.createdById),
        borrowRequests: borrowRequests.filter(r => r.projectId === p.id).map(r => ({
          ...r,
          user: users.find(u => u.id === r.userId),
          items: borrowRequestItems.filter(i => i.requestId === r.id).map(i => ({
            ...i,
            equipment: equipment.find(e => e.id === i.equipmentId)
          }))
        }))
      };
    },
    count: async ({ where } = {}) => filterCollection(projects, where).length,
    create: async ({ data }) => {
      const newProj = { id: `prj-${Date.now()}`, createdAt: new Date(), ...data };
      projects.push(newProj);
      return { ...newProj, createdBy: users.find(u => u.id === newProj.createdById) };
    },
    update: async ({ where, data }) => {
      const idx = projects.findIndex(p => p.id === where.id);
      if (idx !== -1) {
        projects[idx] = { ...projects[idx], ...data, updatedAt: new Date() };
        return projects[idx];
      }
      return null;
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      projects.forEach((p, idx) => {
        if (!where?.createdById || p.createdById === where.createdById) {
          projects[idx] = { ...p, ...data, updatedAt: new Date() };
          count++;
        }
      });
      return { count };
    },
    delete: async ({ where }) => {
      const idx = projects.findIndex(p => p.id === where.id);
      if (idx !== -1) projects.splice(idx, 1);
      return { success: true };
    }
  },

  projectCrew: {
    deleteMany: async () => ({ count: 0 })
  },

  borrowRequest: {
    findMany: async ({ where, take = 50 } = {}) => {
      let list = filterCollection(borrowRequests, where).slice(0, take);
      return list.map(r => ({
        ...r,
        user: users.find(u => u.id === r.userId),
        project: projects.find(p => p.id === r.projectId),
        approvedBy: users.find(u => u.id === r.approvedById),
        items: borrowRequestItems.filter(i => i.requestId === r.id).map(i => ({
          ...i,
          equipment: equipment.find(e => e.id === i.equipmentId)
        })),
        checkInsOuts: checkInOuts.filter(c => c.requestId === r.id).map(c => ({
          ...c,
          handledBy: users.find(u => u.id === c.handledById),
          equipment: equipment.find(e => e.id === c.equipmentId)
        }))
      }));
    },
    findUnique: async ({ where }) => {
      const r = borrowRequests.find(req => req.id === where.id);
      if (!r) return null;
      return {
        ...r,
        user: users.find(u => u.id === r.userId),
        project: projects.find(p => p.id === r.projectId),
        approvedBy: users.find(u => u.id === r.approvedById),
        items: borrowRequestItems.filter(i => i.requestId === r.id).map(i => ({
          ...i,
          equipment: equipment.find(e => e.id === i.equipmentId)
        })),
        checkInsOuts: checkInOuts.filter(c => c.requestId === r.id).map(c => ({
          ...c,
          handledBy: users.find(u => u.id === c.handledById),
          equipment: equipment.find(e => e.id === c.equipmentId)
        }))
      };
    },
    count: async ({ where } = {}) => filterCollection(borrowRequests, where).length,
    create: async ({ data }) => {
      const { items, ...rest } = data;
      const newReq = { id: `req-${Date.now()}`, createdAt: new Date(), ...rest };
      borrowRequests.unshift(newReq);
      if (items?.create) {
        items.create.forEach(i => {
          borrowRequestItems.push({
            id: `item-${Date.now()}-${Math.random()}`,
            requestId: newReq.id,
            equipmentId: i.equipmentId,
            status: i.status || 'REQUESTED'
          });
        });
      }
      return {
        ...newReq,
        items: borrowRequestItems.filter(i => i.requestId === newReq.id).map(i => ({
          ...i,
          equipment: equipment.find(e => e.id === i.equipmentId)
        }))
      };
    },
    update: async ({ where, data }) => {
      const idx = borrowRequests.findIndex(r => r.id === where.id);
      if (idx !== -1) {
        borrowRequests[idx] = { ...borrowRequests[idx], ...data, updatedAt: new Date() };
        return {
          ...borrowRequests[idx],
          items: borrowRequestItems.filter(i => i.requestId === where.id).map(i => ({
            ...i,
            equipment: equipment.find(e => e.id === i.equipmentId)
          })),
          user: users.find(u => u.id === borrowRequests[idx].userId)
        };
      }
      return null;
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      borrowRequests.forEach((r, idx) => {
        const matchProject = !where?.projectId || r.projectId === where.projectId;
        const matchUser = !where?.userId || r.userId === where.userId;
        const matchApproved = !where?.approvedById || r.approvedById === where.approvedById;
        if (matchProject && matchUser && matchApproved) {
          borrowRequests[idx] = { ...r, ...data, updatedAt: new Date() };
          count++;
        }
      });
      return { count };
    },
    delete: async ({ where }) => {
      const idx = borrowRequests.findIndex(r => r.id === where.id);
      if (idx !== -1) borrowRequests.splice(idx, 1);
      return { success: true };
    }
  },

  borrowRequestItem: {
    findMany: async ({ where } = {}) => filterCollection(borrowRequestItems, where),
    updateMany: async ({ where, data }) => {
      let count = 0;
      borrowRequestItems.forEach((i, idx) => {
        if ((!where.requestId || i.requestId === where.requestId) && (!where.equipmentId || i.equipmentId === where.equipmentId) && (!where.status || i.status === where.status)) {
          borrowRequestItems[idx] = { ...i, ...data };
          count++;
        }
      });
      return { count };
    },
    create: async ({ data }) => {
      const item = { id: `item-${Date.now()}`, ...data };
      borrowRequestItems.push(item);
      return item;
    },
    deleteMany: async ({ where } = {}) => {
      let count = 0;
      for (let i = borrowRequestItems.length - 1; i >= 0; i--) {
        const item = borrowRequestItems[i];
        const matchReq = !where?.requestId || item.requestId === where.requestId;
        const matchEq = !where?.equipmentId || item.equipmentId === where.equipmentId;
        if (matchReq && matchEq) {
          borrowRequestItems.splice(i, 1);
          count++;
        }
      }
      return { count };
    }
  },

  checkInOut: {
    findMany: async ({ where, take = 50, skip = 0 } = {}) => {
      let list = filterCollection(checkInOuts, where).slice(skip, skip + take);
      return list.map(c => ({
        ...c,
        handledBy: users.find(u => u.id === c.handledById),
        equipment: equipment.find(e => e.id === c.equipmentId),
        request: borrowRequests.find(r => r.id === c.requestId)
      }));
    },
    findUnique: async ({ where }) => checkInOuts.find(c => c.id === where.id) || null,
    count: async ({ where } = {}) => filterCollection(checkInOuts, where).length,
    create: async ({ data }) => {
      const newRec = { id: `chk-${Date.now()}`, actionDate: new Date(), ...data };
      checkInOuts.unshift(newRec);
      return newRec;
    },
    updateMany: async ({ where, data }) => {
      let count = 0;
      checkInOuts.forEach((c, idx) => {
        if ((!where?.requestId || c.requestId === where.requestId) && (!where?.handledById || c.handledById === where.handledById)) {
          checkInOuts[idx] = { ...c, ...data };
          count++;
        }
      });
      return { count };
    },
    delete: async ({ where }) => {
      const idx = checkInOuts.findIndex(c => c.id === where.id);
      if (idx !== -1) checkInOuts.splice(idx, 1);
      return { success: true };
    },
    deleteMany: async ({ where } = {}) => {
      let count = 0;
      for (let i = checkInOuts.length - 1; i >= 0; i--) {
        if (!where?.equipmentId || checkInOuts[i].equipmentId === where.equipmentId) {
          checkInOuts.splice(i, 1);
          count++;
        }
      }
      return { count };
    }
  },

  maintenance: {
    findMany: async ({ where, take = 50 } = {}) => {
      let list = filterCollection(maintenances, where).slice(0, take);
      return list.map(m => ({
        ...m,
        equipment: equipment.find(e => e.id === m.equipmentId),
        reportedBy: users.find(u => u.id === m.reportedById)
      }));
    },
    findUnique: async ({ where }) => {
      const m = maintenances.find(ticket => ticket.id === where.id);
      if (!m) return null;
      return {
        ...m,
        equipment: equipment.find(e => e.id === m.equipmentId),
        reportedBy: users.find(u => u.id === m.reportedById)
      };
    },
    count: async ({ where } = {}) => filterCollection(maintenances, where).length,
    create: async ({ data }) => {
      const newMnt = { id: `mnt-${Date.now()}`, createdAt: new Date(), ...data };
      maintenances.unshift(newMnt);
      return {
        ...newMnt,
        equipment: equipment.find(e => e.id === newMnt.equipmentId),
        reportedBy: users.find(u => u.id === newMnt.reportedById)
      };
    },
    update: async ({ where, data }) => {
      const idx = maintenances.findIndex(m => m.id === where.id);
      if (idx !== -1) {
        maintenances[idx] = { ...maintenances[idx], ...data, updatedAt: new Date() };
        return {
          ...maintenances[idx],
          equipment: equipment.find(e => e.id === maintenances[idx].equipmentId)
        };
      }
      return null;
    },
    delete: async ({ where }) => {
      const idx = maintenances.findIndex(m => m.id === where.id);
      if (idx !== -1) maintenances.splice(idx, 1);
      return { success: true };
    },
    deleteMany: async ({ where } = {}) => {
      let count = 0;
      for (let i = maintenances.length - 1; i >= 0; i--) {
        if (!where?.equipmentId || maintenances[i].equipmentId === where.equipmentId) {
          maintenances.splice(i, 1);
          count++;
        }
      }
      return { count };
    }
  },

  notification: {
    findMany: async ({ where, take = 30 } = {}) => filterCollection(notifications, where).slice(0, take),
    count: async ({ where } = {}) => filterCollection(notifications, where).length,
    create: async ({ data }) => {
      const n = { id: `notif-${Date.now()}`, createdAt: new Date(), isRead: false, ...data };
      notifications.unshift(n);
      return n;
    },
    update: async ({ where, data }) => {
      const idx = notifications.findIndex(n => n.id === where.id);
      if (idx !== -1) {
        notifications[idx] = { ...notifications[idx], ...data };
        return notifications[idx];
      }
      return null;
    },
    updateMany: async ({ where, data }) => {
      notifications.forEach((n, idx) => {
        if (!where.userId || n.userId === where.userId) {
          notifications[idx] = { ...n, ...data };
        }
      });
      return { count: notifications.length };
    }
  },

  auditLog: {
    findMany: async ({ where, take = 100, skip = 0, orderBy } = {}) => {
      let list = filterCollection(auditLogs, where);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      list = list.slice(skip, skip + take);
      return list.map(l => ({
        ...l,
        user: l.userId ? users.find(u => u.id === l.userId) : null
      }));
    },
    findUnique: async ({ where }) => auditLogs.find(l => l.id === where.id) || null,
    count: async ({ where } = {}) => filterCollection(auditLogs, where).length,
    create: async ({ data }) => {
      const log = { id: `audit-${Date.now()}-${Math.floor(Math.random() * 1000)}`, createdAt: new Date(), ...data };
      auditLogs.unshift(log);
      return log;
    },
    delete: async ({ where }) => {
      const idx = auditLogs.findIndex(l => l.id === where.id);
      if (idx !== -1) auditLogs.splice(idx, 1);
      return { success: true };
    },
    deleteMany: async ({ where } = {}) => {
      const matches = new Set(filterCollection(auditLogs, where).map(l => l.id));
      for (let i = auditLogs.length - 1; i >= 0; i--) {
        if (matches.has(auditLogs[i].id)) auditLogs.splice(i, 1);
      }
      return { count: matches.size };
    }
  },

  stockMovement: {
    findMany: async ({ where, take = 50, skip = 0, orderBy } = {}) => {
      let list = filterCollection(stockMovements, where);
      list.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      return list.slice(skip, skip + take);
    },
    findUnique: async ({ where }) => stockMovements.find(m => m.id === where.id) || null,
    count: async ({ where } = {}) => filterCollection(stockMovements, where).length,
    create: async ({ data }) => {
      const mov = { id: `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`, createdAt: new Date(), ...data };
      stockMovements.unshift(mov);
      return mov;
    },
    delete: async ({ where }) => {
      const idx = stockMovements.findIndex(m => m.id === where.id);
      if (idx !== -1) stockMovements.splice(idx, 1);
      return { success: true };
    },
    deleteMany: async ({ where } = {}) => {
      const matches = new Set(filterCollection(stockMovements, where).map(m => m.id));
      for (let i = stockMovements.length - 1; i >= 0; i--) {
        if (matches.has(stockMovements[i].id)) stockMovements.splice(i, 1);
      }
      return { count: matches.size };
    }
  },

  systemSetting: {
    findUnique: async () => ({ id: 'default', key: 'global', value: systemSettings }),
    findFirst: async () => ({ id: 'default', key: 'global', value: systemSettings }),
    upsert: async ({ create, update }) => {
      systemSettings = { ...systemSettings, ...(update?.value || create?.value || {}) };
      return { id: 'default', key: 'global', value: systemSettings };
    },
    update: async ({ data }) => {
      systemSettings = { ...systemSettings, ...(data?.value || {}) };
      return { id: 'default', key: 'global', value: systemSettings };
    }
  },

  getSystemSettings: () => ({ ...systemSettings }),
  updateSystemSettings: (newSettings) => {
    systemSettings = { ...systemSettings, ...newSettings };
    return { ...systemSettings };
  },

  getBackup: () => ({
    timestamp: new Date().toISOString(),
    systemSettings,
    users: users.map(u => ({ ...u, password: '[REDACTED]' })),
    categories,
    equipment,
    projects,
    borrowRequests,
    borrowRequestItems,
    checkInOuts,
    maintenances,
    stockMovements,
    auditLogs
  }),

  $transaction: async (fn) => {
    return fn(mockStore);
  },

  $queryRaw: async () => [{ 1: 1 }]
};

module.exports = { mockStore };
