const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateQRCode } = require('../src/utils/qrGenerator');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed into Neon PostgreSQL...');

  // 0. Clean existing data in reverse dependency order
  console.log('Clearing existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.checkInOut.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.borrowRequestItem.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.projectCrew.deleteMany();
  await prisma.project.deleteMany();
  await prisma.stockMovement.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.category.deleteMany();
  await prisma.systemSetting.deleteMany();
  await prisma.user.deleteMany();

  console.log('Database cleared.');

  // 1. Create Users with Exact Roles
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      username: 'admin',
      email: 'admin@cameragear.com',
      password: passwordHash,
      role: 'ADMIN',
      roleNote: 'Executive Producer & Master Vault Administrator',
      department: 'Production Operations',
      phone: '+1 555-019-2831',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      profilePhoto: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M15,45 Q40,10 70,35 T130,30 Q160,50 195,20" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="140" y="60" font-family="cursive" font-size="14" fill="%2364748b">S. Connor</text></svg>',
      isActive: true
    }
  });

  const stockController = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      username: 'stock',
      email: 'stock@cameragear.com',
      password: passwordHash,
      role: 'STOCK_MANAGEMENT',
      roleNote: 'Lead Gear Custodian & Stock Logistics Authority',
      department: 'Gear Vault & Logistics',
      phone: '+1 555-019-4822',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      profilePhoto: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M20,50 Q45,15 80,40 T140,25 Q170,45 200,30" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="135" y="60" font-family="cursive" font-size="14" fill="%2364748b">M. Vance</text></svg>',
      isActive: true
    }
  });

  const userDavid = await prisma.user.create({
    data: {
      name: 'David Kim',
      username: 'user',
      email: 'user@cameragear.com',
      password: passwordHash,
      role: 'USER',
      roleNote: 'Director of Photography - Tier 1 Camera Packages',
      department: 'Cinematography Unit',
      phone: '+1 555-019-7711',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      profilePhoto: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M25,48 Q60,18 90,42 T155,28 Q180,50 205,25" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="145" y="60" font-family="cursive" font-size="14" fill="%2364748b">D. Kim</text></svg>',
      isActive: true
    }
  });

  const userElena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      username: 'elena',
      email: 'elena@cameragear.com',
      password: passwordHash,
      role: 'USER',
      roleNote: 'Documentary Camera Operator - Field Approved',
      department: 'Documentary Division',
      phone: '+1 555-019-9944',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      profilePhoto: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      signatureUrl: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="220" height="70" viewBox="0 0 220 70"><path d="M20,40 Q50,15 95,45 T150,22 Q175,40 200,20" fill="none" stroke="%230f172a" stroke-width="2.5" stroke-linecap="round"/><text x="135" y="60" font-family="cursive" font-size="14" fill="%2364748b">E. Rostova</text></svg>',
      isActive: true
    }
  });

  console.log('✅ Created 4 users (Admin, Stock Management, 2 Normal Users).');

  // 2. Create 17 Production Categories
  const categoriesData = [
    { name: 'Cameras', description: 'Cinema cameras, mirrorless bodies, and medium format systems', icon: 'bi-camera-reels' },
    { name: 'Lenses', description: 'Cinema prime lenses, anamorphic optics, and cine zooms', icon: 'bi-disc' },
    { name: 'Lighting', description: 'High-output LED monolights, tube lights, and softbox kits', icon: 'bi-lightbulb' },
    { name: 'Audio', description: 'Multi-track field recorders, mixers, and audio accessories', icon: 'bi-soundwave' },
    { name: 'Microphones', description: 'Shotgun microphones, wireless lavalier kits, and boundary mics', icon: 'bi-mic' },
    { name: 'Tripods', description: 'Carbon fiber fluid head tripods, heavy-duty pedestals, and hi-hats', icon: 'bi-triangle' },
    { name: 'Gimbals', description: '3-axis motorized gimbals, steadicams, and vehicle rig mounts', icon: 'bi-joystick' },
    { name: 'Drones', description: 'Aerial cinematography drones, FPV rigs, and flight controllers', icon: 'bi-send' },
    { name: 'Monitors', description: 'High-brightness field monitors and wireless director stations', icon: 'bi-display' },
    { name: 'Broadcasting', description: 'Broadcast video switchers, SDI converters, and tally systems', icon: 'bi-broadcast' },
    { name: 'Streaming', description: 'Live video encoders, capture cards, and stream controllers', icon: 'bi-camera-video' },
    { name: 'Cables', description: '12G-SDI cables, HDMI 2.1, XLR audio cables, and D-Tap power cords', icon: 'bi-diagram-2' },
    { name: 'Batteries', description: 'V-Mount / Gold-Mount battery bricks, chargers, and power banks', icon: 'bi-battery-charging' },
    { name: 'Memory Cards', description: 'CFexpress Type A/B, SDXC V90 cards, and high-speed readers', icon: 'bi-sd-card' },
    { name: 'Computers', description: 'DIT workstations, on-set editing laptops, and color grading monitors', icon: 'bi-laptop' },
    { name: 'Storage Devices', description: 'Rugged NVMe field SSDs, RAID arrays, and archive storage', icon: 'bi-device-ssd' },
    { name: 'Accessories', description: 'Matte boxes, follow focus rigs, camera cages, clamps, and arms', icon: 'bi-gear-wide-connected' }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.name] = created;
  }
  console.log(`✅ Created ${Object.keys(categories).length} categories.`);

  // 3. Create Equipment Items
  const rawEquipment = [
    {
      assetTag: 'CAM-001',
      name: 'Sony FX3 Full-Frame Cinema Camera',
      brand: 'Sony',
      model: 'ILME-FX3',
      serialNumber: 'SN-FX3-882194',
      categoryName: 'Cameras',
      quantity: 4,
      availableQuantity: 3,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-03-15'),
      purchasePrice: 3899.00,
      dailyRate: 150.00,
      location: 'Vault Locker A-01',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      accessories: ['Top XLR Audio Handle Unit', '2x Sony NP-FZ100 Batteries', 'Dual Bay Charger', 'Pelican 1510 Storm Case'],
      specifications: { sensor: '12.1MP Full-Frame Exmor R CMOS', mount: 'Sony E-Mount', isoRange: '80 - 409,600', recording: '4K UHD up to 120p' },
      notes: 'Firmware v5.00 updated. Sensor cleaned Oct 2026.'
    },
    {
      assetTag: 'CAM-002',
      name: 'Sony FX6 Full-Frame Cinema Camera',
      brand: 'Sony',
      model: 'ILME-FX6V',
      serialNumber: 'SN-FX6-551029',
      categoryName: 'Cameras',
      quantity: 2,
      availableQuantity: 1,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2023-11-20'),
      purchasePrice: 5999.00,
      dailyRate: 250.00,
      location: 'Vault Locker A-02',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
      accessories: ['Top Handle with Audio Controls', '3.5" LCD Monitor', 'Grip Remote', '2x BP-U60 Batteries', 'Heavy-Duty Rolling Case'],
      specifications: { sensor: '4K Full-Frame 10.2MP CMOS', ndFilter: 'Electronic Variable ND 1/4 to 1/128', mount: 'Sony E-Mount' },
      notes: 'One unit out on active commercial shoot REQ-2026-001.'
    },
    {
      assetTag: 'CAM-003',
      name: 'Canon EOS C70 4K Cinema Camera',
      brand: 'Canon',
      model: 'EOS C70',
      serialNumber: 'SN-C70-901844',
      categoryName: 'Cameras',
      quantity: 3,
      availableQuantity: 3,
      status: 'AVAILABLE',
      condition: 'GOOD',
      purchaseDate: new Date('2023-08-10'),
      purchasePrice: 5499.00,
      dailyRate: 220.00,
      location: 'Vault Locker A-03',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&auto=format&fit=crop&q=80',
      accessories: ['Handle Unit with Mic Holder', '2x BP-A60 Batteries', 'Single Charger', 'Shoulder Strap'],
      specifications: { sensor: 'Super 35 DGO Sensor', mount: 'Canon RF Mount', dynamicRange: '16+ stops' },
      notes: 'EF-EOS R 0.71x Speedbooster available separately.'
    },
    {
      assetTag: 'CAM-004',
      name: 'RED Komodo 6K Cinema Camera',
      brand: 'RED Digital Cinema',
      model: 'Komodo 6K',
      serialNumber: 'SN-KOM-109283',
      categoryName: 'Cameras',
      quantity: 1,
      availableQuantity: 0,
      status: 'UNDER_MAINTENANCE',
      condition: 'POOR',
      purchaseDate: new Date('2022-09-05'),
      purchasePrice: 5995.00,
      dailyRate: 275.00,
      location: 'Service Bench B-01',
      imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&auto=format&fit=crop&q=80',
      accessories: ['Canon RF to EF Adapter with Drop-in VND', 'Top Handle', 'Outrigger Handle', 'Wing Grip'],
      specifications: { sensor: '19.9MP Super 35 Global Shutter CMOS', resolution: '6144 x 3240 at 40 fps', dynamicRange: '16+ stops' },
      notes: 'SDI port loose. Ticket #MNT-2026-001 opened.'
    },
    {
      assetTag: 'CAM-005',
      name: 'Blackmagic Pocket Cinema Camera 6K Pro',
      brand: 'Blackmagic Design',
      model: 'BMPCC 6K Pro',
      serialNumber: 'SN-BM-771920',
      categoryName: 'Cameras',
      quantity: 5,
      availableQuantity: 5,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-01-12'),
      purchasePrice: 2535.00,
      dailyRate: 95.00,
      location: 'Vault Locker A-04',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      accessories: ['Tilta Full Camera Cage', '2x NP-F570 Batteries', 'AC Power Supply', 'Sunhood'],
      specifications: { sensor: 'Super 35 6144 x 3456 HDR Sensor', ndFilter: 'Built-In 2, 4, and 6-stop ND filters', mount: 'Canon EF Mount' },
      notes: 'Equipped with Blackmagic OS 8.1.'
    },
    {
      assetTag: 'LNS-001',
      name: 'Sony FE 24-70mm f/2.8 GM II Lens',
      brand: 'Sony',
      model: 'SEL2470GM2',
      serialNumber: 'SN-LNS-449102',
      categoryName: 'Lenses',
      quantity: 4,
      availableQuantity: 4,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-02-18'),
      purchasePrice: 2298.00,
      dailyRate: 65.00,
      location: 'Lens Cabinet L-01',
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&auto=format&fit=crop&q=80',
      accessories: ['Front & Rear Caps', 'ALC-SH168 Lens Hood', 'Padded Lens Pouch', '82mm B+W UV Filter'],
      specifications: { focalLength: '24-70mm', maxAperture: 'f/2.8', mount: 'Sony E', filterThread: '82mm' },
      notes: 'Clean glass, zero optical blemishes.'
    },
    {
      assetTag: 'LNS-002',
      name: 'Sony FE 70-200mm f/2.8 GM OSS II Lens',
      brand: 'Sony',
      model: 'SEL70200GM2',
      serialNumber: 'SN-LNS-883910',
      categoryName: 'Lenses',
      quantity: 3,
      availableQuantity: 3,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-04-10'),
      purchasePrice: 2798.00,
      dailyRate: 85.00,
      location: 'Lens Cabinet L-02',
      imageUrl: 'https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=600&auto=format&fit=crop&q=80',
      accessories: ['Tripod Collar Foot', 'Lens Hood', 'Front/Rear Caps', 'Hard Zipper Case'],
      specifications: { focalLength: '70-200mm', maxAperture: 'f/2.8', opticalStabilization: 'Optical SteadyShot' },
      notes: 'Super lightweight telephoto zoom.'
    },
    {
      assetTag: 'LGT-001',
      name: 'Aputure LS 600d Pro Daylight LED Monolight',
      brand: 'Aputure',
      model: 'LS 600d Pro',
      serialNumber: 'SN-AP-600D-019',
      categoryName: 'Lighting',
      quantity: 2,
      availableQuantity: 1,
      status: 'AVAILABLE',
      condition: 'GOOD',
      purchaseDate: new Date('2023-09-14'),
      purchasePrice: 1890.00,
      dailyRate: 110.00,
      location: 'Grip Bay G-01',
      imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&auto=format&fit=crop&q=80',
      accessories: ['Control Box with Dual V-Mount Plates', 'Hyper Reflector', 'Weatherproof Head Cable (6m)', 'Neutrik AC Power Cable', 'Rolling Hard Case'],
      specifications: { powerOutput: '600W COB LED', colorTemp: '5600K Daylight', criTlci: '96+ / 96+', weatherproofing: 'IP54 Weather-resistant' },
      notes: 'One unit out with FX6 on Project PRJ-01.'
    },
    {
      assetTag: 'LGT-002',
      name: 'Nanlite PavoTube II 30X 4ft RGBWW Tube Light (4-Light Kit)',
      brand: 'Nanlite',
      model: 'PavoTube II 30X 4-Kit',
      serialNumber: 'SN-NL-30X-4K',
      categoryName: 'Lighting',
      quantity: 2,
      availableQuantity: 2,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-05-20'),
      purchasePrice: 2199.00,
      dailyRate: 90.00,
      location: 'Grip Bay G-03',
      imageUrl: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?w=600&auto=format&fit=crop&q=80',
      accessories: ['4x Tube Lights', '4x Power Adapters', '4x Eyebolts', '8x Tube Transparent Mounting Clips', 'Master Padded Rolling Case'],
      specifications: { length: '4 Feet (120 cm)', colorRange: '2700K - 12000K + Full RGB', battery: 'Internal rechargeable Li-ion' },
      notes: 'Equipped with DMX and Wireless Bluetooth App control.'
    },
    {
      assetTag: 'AUD-001',
      name: 'Sennheiser MKH 416 Shotgun Microphone Kit',
      brand: 'Sennheiser',
      model: 'MKH 416-P48U3',
      serialNumber: 'SN-SEN-416-192',
      categoryName: 'Microphones',
      quantity: 3,
      availableQuantity: 3,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2023-05-11'),
      purchasePrice: 999.00,
      dailyRate: 40.00,
      location: 'Audio Drawer M-01',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      accessories: ['Rycote Super-Shield Blimp Kit', 'Furry Windjammer', 'Pistol Grip Handle', '10m Neutrik XLR Cable'],
      specifications: { acousticPrinciple: 'Interference Tube', polarPattern: 'Supercardioid/Lobar', frequencyResponse: '40 to 20,000 Hz' },
      notes: 'Industry-standard broadcast shotgun mic.'
    },
    {
      assetTag: 'AUD-002',
      name: 'DJI Mic 2 Wireless Lavalier Microphone Kit (2 TX + 1 RX)',
      brand: 'DJI',
      model: 'DJI Mic 2 Kit',
      serialNumber: 'SN-DJI-MIC2-88',
      categoryName: 'Microphones',
      quantity: 6,
      availableQuantity: 6,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-03-01'),
      purchasePrice: 349.00,
      dailyRate: 35.00,
      location: 'Audio Drawer M-02',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      accessories: ['Charging Case', '2x Clip-on Transmitters', 'Camera Receiver', '2x Furry Windscreens', 'Lightning and USB-C Adapters'],
      specifications: { range: '250m Transmission Range', recording: '32-bit Float Internal Recording', batteryLife: '18 Hours with Case' },
      notes: '32-bit float internal backup recording prevents any clipping.'
    },
    {
      assetTag: 'GMB-001',
      name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
      brand: 'DJI',
      model: 'RS 3 Pro Combo',
      serialNumber: 'SN-RS3P-99214',
      categoryName: 'Gimbals',
      quantity: 3,
      availableQuantity: 3,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2023-12-04'),
      purchasePrice: 1099.00,
      dailyRate: 60.00,
      location: 'Vault Locker G-02',
      imageUrl: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
      accessories: ['Ronin RavenEye Image Transmitter', 'Focus Motor (2022)', 'Briefcase Handle', 'Lower Quick-Release Plate', 'Carrying Case'],
      specifications: { payloadCapacity: '4.5 kg (10 lbs)', materials: 'Extended Carbon Fiber Axis Arms', locks: 'Automated 2nd Gen Axis Locks' },
      notes: 'Automated axis locks calibrated.'
    },
    {
      assetTag: 'TRP-001',
      name: 'Sachtler Aktiv8 Flowtech75 Tripod System',
      brand: 'Sachtler',
      model: 'Aktiv8 Flowtech75',
      serialNumber: 'SN-SAC-75-381',
      categoryName: 'Tripods',
      quantity: 4,
      availableQuantity: 4,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-01-20'),
      purchasePrice: 3450.00,
      dailyRate: 75.00,
      location: 'Grip Bay G-04',
      imageUrl: 'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600&auto=format&fit=crop&q=80',
      accessories: ['Aktiv8 Fluid Head with Sideload Mechanism', 'Flowtech75 Carbon Fiber Legs', 'Mid-level Spreader', 'Padded Carry Case'],
      specifications: { bowlDiameter: '75mm with SpeedLevel Technology', payloadRange: '0 - 12 kg (0 - 26.5 lbs)', counterbalanceSteps: '15 + 0' },
      notes: 'Fluid drag and SpeedLevel mechanism fully inspected.'
    },
    {
      assetTag: 'MON-001',
      name: 'SmallHD Cine 7 Touchscreen On-Camera Monitor',
      brand: 'SmallHD',
      model: 'Cine 7 Smart Monitor',
      serialNumber: 'SN-SHD-C7-882',
      categoryName: 'Monitors',
      quantity: 3,
      availableQuantity: 3,
      status: 'AVAILABLE',
      condition: 'GOOD',
      purchaseDate: new Date('2023-07-19'),
      purchasePrice: 1799.00,
      dailyRate: 70.00,
      location: 'Vault Locker M-03',
      imageUrl: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=600&auto=format&fit=crop&q=80',
      accessories: ['Sony L-Series Battery Bracket', 'D-Tap to 2-Pin LEMO Power Cable', 'Sunhood', 'Articulating Arm Mount', 'Pelican 1200 Case'],
      specifications: { displaySize: '7.0-inch IPS LCD', brightness: '1800 nits Daylight Viewable', resolution: '1920 x 1200 Full HD' },
      notes: 'PageOS 5 installed with camera control licenses.'
    },
    {
      assetTag: 'BAT-001',
      name: 'Anton Bauer Titon Micro 150 V-Mount Battery (Pair + Dual Charger)',
      brand: 'Anton Bauer',
      model: 'Titon Micro 150 Dual Kit',
      serialNumber: 'SN-AB-TM150-K2',
      categoryName: 'Batteries',
      quantity: 8,
      availableQuantity: 8,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-06-15'),
      purchasePrice: 1250.00,
      dailyRate: 45.00,
      location: 'Battery Charging Station B-01',
      imageUrl: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80',
      accessories: ['2x 147Wh Titon Micro V-Mount Bricks', 'VM2 Dual Simultaneous Fast Charger', 'AC Cord'],
      specifications: { capacity: '147Wh (14.4V, 10.2Ah)', outputs: 'P-Tap / D-Tap and High-Speed USB Output', maxDraw: '10A continuous' },
      notes: 'Battery health diagnostic 98% capacity.'
    },
    {
      assetTag: 'MEM-001',
      name: 'Sony CEA-G160T 160GB CFexpress Type A Card (Pack of 2)',
      brand: 'Sony',
      model: 'CEA-G160T 2-Pack',
      serialNumber: 'SN-CFX-160-2P',
      categoryName: 'Memory Cards',
      quantity: 10,
      availableQuantity: 10,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-05-10'),
      purchasePrice: 796.00,
      dailyRate: 30.00,
      location: 'Media Vault Safe S-01',
      imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80',
      accessories: ['2x 160GB CFexpress Type A Cards', 'Rugged Protective Jewel Cases', 'MRW-G2 Card Reader with USB-C Cables'],
      specifications: { readSpeed: 'Up to 800 MB/s', writeSpeed: 'Up to 700 MB/s', vpg: 'VPG-400 Certified' },
      notes: 'Low-level formatted, ready for deployment.'
    }
  ];

  const createdEquipment = [];
  for (const eq of rawEquipment) {
    const cat = categories[eq.categoryName];
    if (!cat) continue;

    const qrPayload = {
      assetTag: eq.assetTag,
      name: eq.name,
      serial: eq.serialNumber,
      brand: eq.brand,
      model: eq.model
    };
    const qrCode = await generateQRCode(qrPayload);

    const created = await prisma.equipment.create({
      data: {
        assetTag: eq.assetTag,
        name: eq.name,
        brand: eq.brand,
        model: eq.model,
        serialNumber: eq.serialNumber,
        categoryId: cat.id,
        quantity: eq.quantity,
        availableQuantity: eq.availableQuantity,
        status: eq.status,
        condition: eq.condition,
        purchaseDate: eq.purchaseDate,
        purchasePrice: eq.purchasePrice,
        dailyRate: eq.dailyRate,
        location: eq.location,
        imageUrl: eq.imageUrl,
        accessories: eq.accessories,
        specifications: eq.specifications,
        notes: eq.notes,
        qrCode
      }
    });
    createdEquipment.push(created);
  }
  console.log(`✅ Created ${createdEquipment.length} equipment items with QR codes & pricing.`);

  // 4. Create Production Projects (Strictly created by Admin, Sequential Numbers starting from 01)
  const project1 = await prisma.project.create({
    data: {
      projectNumber: '01',
      projectCode: 'PRJ-01',
      title: 'Horizon 2026 Electric Vehicle Commercial',
      client: 'Apex Automotive Group',
      director: 'Alex Rivera',
      location: 'Pacific Rim Highway & Studio Stage 3',
      startDate: new Date('2026-11-05'),
      endDate: new Date('2026-11-20'),
      status: 'IN_PRODUCTION',
      createdById: admin.id,
      notes: 'High-speed tracking shots, day/night lighting setups required.'
    }
  });

  const project2 = await prisma.project.create({
    data: {
      projectNumber: '02',
      projectCode: 'PRJ-02',
      title: 'Echoes of the High Arctic (Docuseries)',
      client: 'Earth Horizon Media',
      director: 'Elena Rostova',
      location: 'Northern Svalbard Archipelago',
      startDate: new Date('2026-11-25'),
      endDate: new Date('2026-12-10'),
      status: 'PLANNING',
      createdById: admin.id,
      notes: 'Cold weather resilience gear, weather-sealed prime lenses required.'
    }
  });

  const project3 = await prisma.project.create({
    data: {
      projectNumber: '03',
      projectCode: 'PRJ-03',
      title: 'Metropolitan Fashion Week 2026',
      client: 'Vogue Global Media',
      director: 'David Kim',
      location: 'Grand Palais Exhibition Center',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-22'),
      status: 'COMPLETED',
      createdById: admin.id,
      notes: 'Handheld gimbal tracking and wireless video to client lounge.'
    }
  });

  console.log('✅ Created 3 Admin-created production projects (PRJ-01, PRJ-02, PRJ-03).');

  // 5. Create Project Crew Members
  const crewMembers = [
    { projectId: project1.id, name: 'David Kim', role: 'Director of Photography', phone: '+1 555-019-7711', callTime: '06:00 AM', status: 'CONFIRMED' },
    { projectId: project1.id, name: 'Marcus Vance', role: '1st AC / Focus Puller', phone: '+1 555-019-4822', callTime: '06:00 AM', status: 'CONFIRMED' },
    { projectId: project1.id, name: 'Sarah Connor', role: 'Executive Producer', phone: '+1 555-019-2831', callTime: '07:30 AM', status: 'CONFIRMED' },
    { projectId: project2.id, name: 'Elena Rostova', role: 'Lead Director / Shooter', phone: '+1 555-019-9944', callTime: '08:00 AM', status: 'CONFIRMED' },
    { projectId: project2.id, name: 'Anya Lindqvist', role: 'Field Sound Recordist', phone: '+1 555-019-3321', callTime: '08:00 AM', status: 'CONFIRMED' },
    { projectId: project3.id, name: 'David Kim', role: 'Steadicam Operator', phone: '+1 555-019-7711', callTime: '09:00 AM', status: 'COMPLETED' }
  ];

  for (const c of crewMembers) {
    await prisma.projectCrew.create({ data: c });
  }
  console.log(`✅ Created ${crewMembers.length} project crew members.`);

  // 6. Create Borrow Requests with Multiple Items
  const fx6 = createdEquipment.find(e => e.assetTag === 'CAM-002');
  const ap600 = createdEquipment.find(e => e.assetTag === 'LGT-001');
  const fx3 = createdEquipment.find(e => e.assetTag === 'CAM-001');
  const lens2470 = createdEquipment.find(e => e.assetTag === 'LNS-001');
  const mkh416 = createdEquipment.find(e => e.assetTag === 'AUD-001');
  const rs3 = createdEquipment.find(e => e.assetTag === 'GMB-001');

  // Request 1: Active CHECKED_OUT
  const reqCheckedOut = await prisma.borrowRequest.create({
    data: {
      requestNumber: 'REQ-2026-001',
      userId: userDavid.id,
      projectId: project1.id,
      startDate: new Date('2026-11-08'),
      endDate: new Date('2026-11-15'),
      purpose: 'Commercial vehicle shoot - exterior tracking and night lighting',
      destination: 'Pacific Rim Highway Stage 3',
      status: 'CHECKED_OUT',
      approvedById: admin.id,
      approvedAt: new Date('2026-11-07T14:30:00Z'),
      notes: 'Handled by Marcus Vance at Vault Locker.'
    }
  });

  await prisma.borrowRequestItem.create({
    data: { requestId: reqCheckedOut.id, equipmentId: fx6.id, quantity: 1, status: 'CHECKED_OUT' }
  });
  await prisma.borrowRequestItem.create({
    data: { requestId: reqCheckedOut.id, equipmentId: ap600.id, quantity: 1, status: 'CHECKED_OUT' }
  });

  // CheckInOut records for Handover
  await prisma.checkInOut.create({
    data: {
      requestId: reqCheckedOut.id,
      equipmentId: fx6.id,
      type: 'CHECK_OUT',
      handledById: stockController.id,
      borrowerName: userDavid.name,
      borrowerSignature: userDavid.signatureUrl,
      conditionAtAction: 'EXCELLENT',
      accessoriesChecked: fx6.accessories,
      damageReported: false,
      notes: 'All accessories present and verified. Clean optics.'
    }
  });

  await prisma.checkInOut.create({
    data: {
      requestId: reqCheckedOut.id,
      equipmentId: ap600.id,
      type: 'CHECK_OUT',
      handledById: stockController.id,
      borrowerName: userDavid.name,
      borrowerSignature: userDavid.signatureUrl,
      conditionAtAction: 'GOOD',
      accessoriesChecked: ap600.accessories,
      damageReported: false,
      notes: 'Reflector and barn doors verified in rolling case.'
    }
  });

  // Request 2: PENDING review
  const reqPending = await prisma.borrowRequest.create({
    data: {
      requestNumber: 'REQ-2026-002',
      userId: userElena.id,
      projectId: project2.id,
      startDate: new Date('2026-11-25'),
      endDate: new Date('2026-12-05'),
      purpose: 'Arctic wildlife documentary reconnaissance shoot',
      destination: 'Svalbard Field Station',
      status: 'PENDING',
      notes: 'Requesting weather-resistant cases and spare battery quad kit.'
    }
  });

  await prisma.borrowRequestItem.create({
    data: { requestId: reqPending.id, equipmentId: fx3.id, quantity: 1, status: 'REQUESTED' }
  });
  await prisma.borrowRequestItem.create({
    data: { requestId: reqPending.id, equipmentId: lens2470.id, quantity: 1, status: 'REQUESTED' }
  });
  await prisma.borrowRequestItem.create({
    data: { requestId: reqPending.id, equipmentId: mkh416.id, quantity: 1, status: 'REQUESTED' }
  });

  // Request 3: Past completed & RETURNED
  const reqReturned = await prisma.borrowRequest.create({
    data: {
      requestNumber: 'REQ-2026-003',
      userId: userDavid.id,
      projectId: project3.id,
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-22'),
      actualReturnDate: new Date('2026-10-22T16:00:00Z'),
      purpose: 'Vogue Fashion Week Runway Multi-Cam Coverage',
      destination: 'Grand Palais Exhibition Center',
      status: 'RETURNED',
      approvedById: admin.id,
      approvedAt: new Date('2026-10-14T09:00:00Z'),
      notes: 'Returned in full and inspected by Marcus Vance.'
    }
  });

  await prisma.borrowRequestItem.create({
    data: { requestId: reqReturned.id, equipmentId: rs3.id, quantity: 1, status: 'RETURNED', returnedCondition: 'GOOD', notes: 'Cleaned and charged' }
  });

  await prisma.checkInOut.create({
    data: {
      requestId: reqReturned.id,
      equipmentId: rs3.id,
      type: 'CHECK_IN',
      handledById: stockController.id,
      borrowerName: userDavid.name,
      staffSignature: stockController.signatureUrl,
      conditionAtAction: 'GOOD',
      accessoriesChecked: rs3.accessories,
      damageReported: false,
      notes: 'Full kit returned with briefcase handle. Quality inspection passed.'
    }
  });

  console.log('✅ Created 3 borrow requests with multiple items and check-in/out records.');

  // 7. Create Maintenance Record
  const komodo = createdEquipment.find(e => e.assetTag === 'CAM-004');
  await prisma.maintenance.create({
    data: {
      ticketNumber: 'MNT-2026-001',
      equipmentId: komodo.id,
      reportedById: stockController.id,
      issueTitle: 'SDI Port Intermittent Video Signal Drop',
      description: '12G-SDI Output BNC connector exhibits signal dropout when cable is tensioned.',
      severity: 'HIGH',
      status: 'SENT_TO_VENDOR',
      vendor: 'RED Authorized Service Center - Burbank',
      cost: 450.00,
      scheduledDate: new Date('2026-11-12'),
      notes: 'Sent via insured courier tracking #RED9920184.'
    }
  });
  console.log('✅ Created maintenance record.');

  // 8. Create Invoices
  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-001',
      requestId: reqCheckedOut.id,
      userId: userDavid.id,
      projectId: project1.id,
      issuedById: admin.id,
      borrowerName: userDavid.name,
      borrowerDepartment: userDavid.department,
      borrowerPhone: userDavid.phone,
      borrowerEmail: userDavid.email,
      projectName: project1.title,
      projectCode: project1.projectCode,
      projectLocation: project1.location,
      borrowingDate: reqCheckedOut.startDate,
      expectedReturnDate: reqCheckedOut.endDate,
      totalAmount: 2520.00, // 7 days * ($250 + $110)
      taxRate: 0.08,
      taxAmount: 201.60,
      grandTotal: 2721.60,
      status: 'ISSUED',
      terms: 'The borrower acknowledges full custody and legal responsibility for all camera equipment listed herein. All items must be returned clean in original flight cases.',
      declaration: 'I confirm receipt and satisfactory inspection of the listed items.',
      authorizedSigner: 'Sarah Connor, Vault Operations Director',
      items: [
        { assetTag: 'CAM-002', name: 'Sony FX6 Full-Frame Cinema Camera', dailyRate: 250, days: 7, total: 1750 },
        { assetTag: 'LGT-001', name: 'Aputure LS 600d Pro Daylight LED', dailyRate: 110, days: 7, total: 770 }
      ],
      notes: 'Commercial production assignment loan.'
    }
  });

  await prisma.invoice.create({
    data: {
      invoiceNumber: 'INV-2026-002',
      requestId: reqReturned.id,
      userId: userDavid.id,
      projectId: project3.id,
      issuedById: admin.id,
      borrowerName: userDavid.name,
      borrowerDepartment: userDavid.department,
      borrowerPhone: userDavid.phone,
      borrowerEmail: userDavid.email,
      projectName: project3.title,
      projectCode: project3.projectCode,
      projectLocation: project3.location,
      borrowingDate: reqReturned.startDate,
      expectedReturnDate: reqReturned.endDate,
      actualReturnDate: reqReturned.actualReturnDate,
      totalAmount: 420.00, // 7 days * $60
      taxRate: 0.08,
      taxAmount: 33.60,
      grandTotal: 453.60,
      status: 'PAID',
      terms: 'Standard custody terms and conditions.',
      declaration: 'Equipment returned in verified condition.',
      authorizedSigner: 'Sarah Connor, Vault Operations Director',
      items: [
        { assetTag: 'GMB-001', name: 'DJI RS 3 Pro Gimbal Stabilizer', dailyRate: 60, days: 7, total: 420 }
      ],
      notes: 'Completed past loan invoice.'
    }
  });
  console.log('✅ Created 2 official custody invoices.');

  // 9. Create Stock Movements History
  await prisma.stockMovement.createMany({
    data: [
      {
        equipmentId: fx6.id,
        assetTag: fx6.assetTag,
        equipmentName: fx6.name,
        type: 'INITIAL_STOCK',
        quantityChanged: 2,
        previousAvailable: 0,
        newAvailable: 2,
        previousTotal: 0,
        newTotal: 2,
        reference: 'VAULT_INTAKE_2026',
        performedBy: 'Sarah Connor',
        notes: 'Initial studio catalog registration.'
      },
      {
        equipmentId: fx6.id,
        assetTag: fx6.assetTag,
        equipmentName: fx6.name,
        type: 'CHECK_OUT',
        quantityChanged: -1,
        previousAvailable: 2,
        newAvailable: 1,
        previousTotal: 2,
        newTotal: 2,
        reference: 'REQ-2026-001',
        performedBy: 'Marcus Vance',
        notes: 'Checked out to David Kim for commercial shoot.'
      },
      {
        equipmentId: ap600.id,
        assetTag: ap600.assetTag,
        equipmentName: ap600.name,
        type: 'CHECK_OUT',
        quantityChanged: -1,
        previousAvailable: 2,
        newAvailable: 1,
        previousTotal: 2,
        newTotal: 2,
        reference: 'REQ-2026-001',
        performedBy: 'Marcus Vance',
        notes: 'Checked out to David Kim.'
      },
      {
        equipmentId: rs3.id,
        assetTag: rs3.assetTag,
        equipmentName: rs3.name,
        type: 'RESTOCK',
        quantityChanged: 1,
        previousAvailable: 2,
        newAvailable: 3,
        previousTotal: 2,
        newTotal: 3,
        reference: 'PURCHASE_ORDER_892',
        performedBy: 'Marcus Vance',
        notes: 'Additional gimbal combo unit received from B&H Photo.'
      }
    ]
  });
  console.log('✅ Created stock movements log.');

  // 10. Create System Settings
  await prisma.systemSetting.create({
    data: {
      id: 'default',
      key: 'global',
      value: {
        companyName: 'CineVault Studio Hub',
        tagline: 'Professional Camera Equipment Management',
        contactEmail: 'vault@cameragear.com',
        contactPhone: '+1 555-019-0000',
        currency: 'USD',
        currencySymbol: '$',
        defaultTaxRate: 8,
        maxLoanDurationDays: 14,
        lowStockThreshold: 2,
        invoiceHeader: 'EQUIPMENT LOAN & CUSTODY INVOICE',
        invoiceTaxId: 'EIN-84-9182903',
        invoiceTerms: 'The borrower acknowledges full custody and legal responsibility for all equipment listed herein. All items must be returned in their original flight cases with verified components. Any damaged optical sensors, missing cables, or body damage will be billed according to standard studio repair rates.',
        invoiceDeclaration: 'I confirm receipt and satisfactory visual inspection of the listed items and agree to return them on or before the due date.',
        invoiceAuthorizedSigner: 'Vault Operations Director'
      }
    }
  });
  console.log('✅ Created global system settings.');

  // 11. Create Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: admin.id,
        title: 'New Borrow Request Submitted',
        message: 'Elena Rostova submitted Request #REQ-2026-002 for project "Echoes of the High Arctic".',
        type: 'INFO',
        isRead: false,
        link: '/requests'
      },
      {
        userId: stockController.id,
        title: 'Scheduled Return Alert',
        message: 'Request #REQ-2026-001 (Sony FX6, Aputure 600d) is scheduled for return on Nov 15.',
        type: 'WARNING',
        isRead: false,
        link: '/checkin-out'
      },
      {
        userId: userDavid.id,
        title: 'Request Approved & Checked Out',
        message: 'Your Request #REQ-2026-001 has been checked out by Marcus Vance.',
        type: 'SUCCESS',
        isRead: true,
        link: '/requests'
      },
      {
        userId: userElena.id,
        title: 'Request Received',
        message: 'Your Request #REQ-2026-002 is currently pending review by Admin.',
        type: 'INFO',
        isRead: false,
        link: '/requests'
      }
    ]
  });
  console.log('✅ Created role notifications.');

  // 12. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'EQUIPMENT_REGISTER',
        entity: 'Equipment',
        entityId: fx3.id,
        details: { assetTag: 'CAM-001', name: fx3.name, quantity: 4 },
        ipAddress: '192.168.1.100'
      },
      {
        userId: admin.id,
        action: 'CREATE_PROJECT',
        entity: 'Project',
        entityId: project1.id,
        details: { projectCode: 'PRJ-01', title: project1.title },
        ipAddress: '192.168.1.100'
      },
      {
        userId: admin.id,
        action: 'APPROVE_REQUEST',
        entity: 'BorrowRequest',
        entityId: reqCheckedOut.id,
        details: { requestNumber: 'REQ-2026-001', borrower: userDavid.name },
        ipAddress: '192.168.1.100'
      },
      {
        userId: stockController.id,
        action: 'CHECK_OUT',
        entity: 'CheckInOut',
        entityId: fx6.id,
        details: { equipment: fx6.name, borrower: userDavid.name },
        ipAddress: '192.168.1.105'
      },
      {
        userId: stockController.id,
        action: 'RESTOCK_EQUIPMENT',
        entity: 'Equipment',
        entityId: rs3.id,
        details: { assetTag: rs3.assetTag, delta: 1, newAvailable: 3 },
        ipAddress: '192.168.1.105'
      }
    ]
  });
  console.log('✅ Created audit logs.');

  console.log('\n🎉 Seed complete! Neon PostgreSQL database is 100% operational with production data.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
