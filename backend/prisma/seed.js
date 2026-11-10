const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { generateQRCode } = require('../src/utils/qrGenerator');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clear existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.checkInOut.deleteMany();
  await prisma.maintenance.deleteMany();
  await prisma.borrowRequestItem.deleteMany();
  await prisma.borrowRequest.deleteMany();
  await prisma.project.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cleared existing records.');

  // 1. Create Users
  const passwordHash = await bcrypt.hash('password123', 10);

  const admin = await prisma.user.create({
    data: {
      name: 'Sarah Connor',
      email: 'admin@cameragear.com',
      password: passwordHash,
      role: 'ADMIN',
      department: 'Production Operations',
      phone: '+1 555-019-2831',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
      isActive: true
    }
  });

  const stockController = await prisma.user.create({
    data: {
      name: 'Marcus Vance',
      email: 'stock@cameragear.com',
      password: passwordHash,
      role: 'STOCK_CONTROLLER',
      department: 'Gear Vault & Logistics',
      phone: '+1 555-019-4822',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      isActive: true
    }
  });

  const userDavid = await prisma.user.create({
    data: {
      name: 'David Kim',
      email: 'user@cameragear.com',
      password: passwordHash,
      role: 'USER',
      department: 'Cinematography Unit',
      phone: '+1 555-019-7711',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isActive: true
    }
  });

  const userElena = await prisma.user.create({
    data: {
      name: 'Elena Rostova',
      email: 'elena@cameragear.com',
      password: passwordHash,
      role: 'USER',
      department: 'Documentary Division',
      phone: '+1 555-019-9944',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      isActive: true
    }
  });

  console.log('✅ Created 4 users (Admin, Stock Controller, 2 Normal Users).');

  // 2. Create Categories
  const categoriesData = [
    { name: 'Cinema Cameras', description: 'Full-frame and Super35 digital cinema camera bodies', icon: 'bi-camera-reels' },
    { name: 'Mirrorless Cameras', description: 'Compact hybrid 4K/8K mirrorless cameras', icon: 'bi-camera' },
    { name: 'Cinema Lenses', description: 'Cine prime sets, anamorphic lenses, and professional cine zooms', icon: 'bi-disc' },
    { name: 'Studio & Field Lighting', description: 'High-output LED monolights, tube lights, and softboxes', icon: 'bi-lightbulb' },
    { name: 'Audio & Microphones', description: 'Shotgun mics, wireless lavalier systems, and field recorders', icon: 'bi-mic' },
    { name: 'Gimbals & Stabilizers', description: '3-axis motorized gimbals and 4-axis integrated stabilization systems', icon: 'bi-joystick' },
    { name: 'Tripods & Grip', description: 'Carbon fiber fluid head tripods, C-stands, and rigging accessories', icon: 'bi-wrench-adjustable' },
    { name: 'Monitors & Wireless Video', description: 'High-brightness field monitors and zero-latency wireless video transmitters', icon: 'bi-display' },
    { name: 'Batteries & Power', description: 'V-Mount/Gold-Mount battery bricks, chargers, and AC power distribution', icon: 'bi-battery-charging' },
    { name: 'Media & Storage', description: 'CFexpress Type A/B, SDXC V90, and rugged on-set SSDs', icon: 'bi-device-ssd' }
  ];

  const categories = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.name] = created;
  }
  console.log(`✅ Created ${Object.keys(categories).length} categories.`);

  // 3. Create Equipment Items
  const equipmentData = [
    {
      assetTag: 'CAM-001',
      name: 'Sony FX3 Full-Frame Cinema Camera',
      brand: 'Sony',
      model: 'ILME-FX3',
      serialNumber: 'SN-FX3-882194',
      categoryId: categories['Cinema Cameras'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-03-15'),
      purchasePrice: 3899.00,
      dailyRate: 150.00,
      location: 'Vault Locker A-01',
      imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Top XLR Audio Handle Unit',
        '2x Sony NP-FZ100 Batteries',
        'Dual Bay Battery Charger',
        'HDMI Cable Clamp',
        'Body Cap',
        'Pelican 1510 Storm Case'
      ],
      specifications: {
        sensor: '12.1MP Full-Frame Exmor R CMOS',
        mount: 'Sony E-Mount',
        isoRange: '80 - 409,600 (Dual Base ISO 800/12800)',
        recording: '4K UHD up to 120p 10-bit 4:2:2 All-Intra',
        cooling: 'Internal active cooling fan for unlimited record time'
      },
      notes: 'Firmware v5.00 updated. Sensor cleaned Oct 2026.'
    },
    {
      assetTag: 'CAM-002',
      name: 'Sony FX6 Full-Frame Cinema Camera',
      brand: 'Sony',
      model: 'ILME-FX6V',
      serialNumber: 'SN-FX6-551029',
      categoryId: categories['Cinema Cameras'].id,
      status: 'BORROWED',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2023-11-20'),
      purchasePrice: 5999.00,
      dailyRate: 250.00,
      location: 'Vault Locker A-02',
      imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Top Handle with Audio Controls',
        '3.5" LCD Monitor & Hood',
        'Grip Remote Controller',
        '2x BP-U60 Batteries',
        'AC Adapter / Charger',
        'Heavy-Duty Rolling Hard Case'
      ],
      specifications: {
        sensor: '4K Full-Frame 10.2MP CMOS',
        ndFilter: 'Electronic Variable ND 1/4 to 1/128',
        mount: 'Sony E-Mount',
        recording: 'DCI 4K up to 120p, 16-bit RAW output via SDI'
      },
      notes: 'Assigned to commercial production.'
    },
    {
      assetTag: 'CAM-003',
      name: 'Canon EOS C70 4K Cinema Camera',
      brand: 'Canon',
      model: 'EOS C70',
      serialNumber: 'SN-C70-901844',
      categoryId: categories['Cinema Cameras'].id,
      status: 'AVAILABLE',
      condition: 'GOOD',
      purchaseDate: new Date('2023-08-10'),
      purchasePrice: 5499.00,
      dailyRate: 220.00,
      location: 'Vault Locker A-03',
      imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Handle Unit with Mic Holder',
        '2x BP-A60 Batteries',
        'Single Battery Charger',
        'Shoulder Strap',
        'Compact Hard Case'
      ],
      specifications: {
        sensor: 'Super 35 DGO Sensor',
        mount: 'Canon RF Mount',
        dynamicRange: '16+ stops of DGO dynamic range',
        audio: '2x Mini XLR inputs'
      },
      notes: 'EF-EOS R 0.71x Speedbooster available separately.'
    },
    {
      assetTag: 'CAM-004',
      name: 'RED Komodo 6K Cinema Camera',
      brand: 'RED Digital Cinema',
      model: 'Komodo 6K',
      serialNumber: 'SN-KOM-109283',
      categoryId: categories['Cinema Cameras'].id,
      status: 'UNDER_MAINTENANCE',
      condition: 'FAIR',
      purchaseDate: new Date('2023-05-18'),
      purchasePrice: 6200.00,
      dailyRate: 280.00,
      location: 'Repair Bench Shelf 2',
      imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Wing Grip',
        'Outrigger Handle',
        'Canon RF to EF Adapter with Drop-in VND',
        '2x RED CFast 512GB Cards',
        'AC Power Adapter'
      ],
      specifications: {
        sensor: '19.9MP Super 35 Global Shutter CMOS',
        resolution: '6K 17:9 (6144 x 3240) at 40fps',
        mount: 'Canon RF Mount'
      },
      notes: 'SDI port loose pin reported. Scheduled for inspection.'
    },
    {
      assetTag: 'LNS-001',
      name: 'Sony FE 24-70mm f/2.8 GM II Lens',
      brand: 'Sony',
      model: 'SEL2470GM2',
      serialNumber: 'SN-LNS-772910',
      categoryId: categories['Cinema Lenses'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-01-20'),
      purchasePrice: 2298.00,
      dailyRate: 65.00,
      location: 'Lens Cabinet B-01',
      imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Front Lens Cap 82mm',
        'Rear E-Mount Cap',
        'Petal Lens Hood ALC-SH168',
        'Padded Lens Pouch',
        'B+W 82mm Clear Nano Filter'
      ],
      specifications: {
        aperture: 'f/2.8 to f/22',
        elements: '20 Elements in 15 Groups',
        focus: '4x XD Linear Motors',
        filterSize: '82mm'
      },
      notes: 'Pristine condition. Filter always attached.'
    },
    {
      assetTag: 'LNS-002',
      name: 'Sony FE 70-200mm f/2.8 GM OSS II Lens',
      brand: 'Sony',
      model: 'SEL70200GM2',
      serialNumber: 'SN-LNS-883921',
      categoryId: categories['Cinema Lenses'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-02-10'),
      purchasePrice: 2798.00,
      dailyRate: 75.00,
      location: 'Lens Cabinet B-02',
      imageUrl: 'https://images.unsplash.com/photo-1542385151-efd9000785a0?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Front Cap 77mm',
        'Rear Cap',
        'Lens Hood with Filter Window',
        'Removable Tripod Collar Foot',
        'Protective Carrying Case'
      ],
      specifications: {
        aperture: 'f/2.8 to f/22',
        stabilization: 'Optical SteadyShot with 3 Modes',
        filterSize: '77mm'
      },
      notes: 'Includes Arca-Swiss compatible foot.'
    },
    {
      assetTag: 'LGT-001',
      name: 'Aputure LS 600d Pro Daylight LED Monolight',
      brand: 'Aputure',
      model: 'LS 600d Pro',
      serialNumber: 'SN-LGT-339102',
      categoryId: categories['Studio & Field Lighting'].id,
      status: 'BORROWED',
      condition: 'GOOD',
      purchaseDate: new Date('2023-09-05'),
      purchasePrice: 1890.00,
      dailyRate: 110.00,
      location: 'Lighting Bay C-01',
      imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Control Box with V-Mount Plates',
        'Hyper Reflector',
        'Weatherproof Neutrik Head Cable 3m',
        'AC Power Cable 6m',
        'Lightning Clamp',
        'Heavy-Duty Rolling Case'
      ],
      specifications: {
        output: '8,500+ lux at 3m with Hyper Reflector',
        cct: '5600K Daylight',
        criTlci: '96+ CRI, 96+ TLCI',
        mount: 'Standard Bowens Mount'
      },
      notes: 'Weather resistant IP54 rated.'
    },
    {
      assetTag: 'LGT-002',
      name: 'Nanlite Forza 500B II Bi-Color LED',
      brand: 'Nanlite',
      model: 'Forza 500B II',
      serialNumber: 'SN-LGT-448201',
      categoryId: categories['Studio & Field Lighting'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-04-12'),
      purchasePrice: 1499.00,
      dailyRate: 90.00,
      location: 'Lighting Bay C-02',
      imageUrl: 'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Reflector 55°',
        'Control Unit with Dual V-Mount',
        'Quick Release Clamp',
        'Padded Carrying Bag'
      ],
      specifications: {
        cct: '2700K - 6500K Bi-color',
        cri: '96, TLCI 97',
        effects: '12 Built-in practical lighting effects'
      },
      notes: 'Ultra quiet fan mode.'
    },
    {
      assetTag: 'AUD-001',
      name: 'Sennheiser MKH 416 Shotgun Microphone',
      brand: 'Sennheiser',
      model: 'MKH 416-P48U3',
      serialNumber: 'SN-AUD-119280',
      categoryId: categories['Audio & Microphones'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2023-04-10'),
      purchasePrice: 999.00,
      dailyRate: 45.00,
      location: 'Audio Locker D-01',
      imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'MZW 415 Foam Windscreen',
        'MZQ 100 Mic Clamp',
        'Rycote Softie Furry Windshield',
        'XLR Cable 25ft Mogami Gold',
        'Hard Plastic Travel Tube'
      ],
      specifications: {
        transducer: 'RF condenser microphone',
        polarPattern: 'Supercardioid / Lobar',
        frequencyResponse: '40 to 20,000 Hz',
        phantomPower: '48V ± 12V Phantom'
      },
      notes: 'Industry standard film dialogue microphone.'
    },
    {
      assetTag: 'AUD-002',
      name: 'Rode Wireless PRO Dual Wireless System',
      brand: 'Rode Microphones',
      model: 'Wireless PRO',
      serialNumber: 'SN-AUD-220194',
      categoryId: categories['Audio & Microphones'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-05-01'),
      purchasePrice: 399.00,
      dailyRate: 35.00,
      location: 'Audio Locker D-02',
      imageUrl: 'https://images.unsplash.com/photo-1583795128727-6ec3642408f8?w=600&auto=format&fit=crop&q=80',
      accessories: [
        '2x Transmitters (TX)',
        '1x Dual Receiver (RX)',
        'Smart Charging Case',
        '2x Lavalier II Microphones with Clips',
        '3x Furry Windshields',
        'MagClip GO Magnets',
        'SC2 3.5mm TRS Cable',
        'USB-C to Lightning Cable'
      ],
      specifications: {
        recording: '32-bit Float on-board backup recording',
        range: 'Up to 260m line-of-sight',
        timecode: 'Internal timecode generator'
      },
      notes: 'All lavaliers and magnets accounted for.'
    },
    {
      assetTag: 'GMB-001',
      name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
      brand: 'DJI',
      model: 'RS 3 Pro Combo',
      serialNumber: 'SN-GMB-993812',
      categoryId: categories['Gimbals & Stabilizers'].id,
      status: 'AVAILABLE',
      condition: 'GOOD',
      purchaseDate: new Date('2023-07-22'),
      purchasePrice: 1099.00,
      dailyRate: 70.00,
      location: 'Grip Bay E-01',
      imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'BG30 Battery Grip',
        'Quick-Release Plate (Arca / Manfrotto)',
        'Extended Grip/Tripod',
        'Briefcase Handle',
        'Focus Motor (2022) with Gear Strip',
        'Ronin Image Transmitter (RavenEye)',
        'Carrying Case'
      ],
      specifications: {
        payload: '4.5 kg (10 lbs) tested payload',
        arms: 'Extended carbon fiber axis arms',
        locks: 'Automated 2nd-gen axis locks'
      },
      notes: 'Calibrated for Sony FX3 + 24-70 GM.'
    },
    {
      assetTag: 'TRP-001',
      name: 'Sachtler Flowtech 75 Tripod with FSB 8 Head',
      brand: 'Sachtler',
      model: 'System FSB 8 FT 75',
      serialNumber: 'SN-TRP-449102',
      categoryId: categories['Tripods & Grip'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2023-03-12'),
      purchasePrice: 2850.00,
      dailyRate: 80.00,
      location: 'Grip Bay E-03',
      imageUrl: 'https://images.unsplash.com/photo-1588636142475-a62d56692870?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'FSB 8 Fluid Head with Sideload Plate',
        'Flowtech 75 Carbon Fiber 2-Stage Legs',
        'Flowtech Rubber Feet Set',
        'Mid-Level Spreader Flowtech75',
        'Padded Sachtler Tripod Bag'
      ],
      specifications: {
        payload: '1 to 10 kg (2.2 to 22 lbs)',
        counterbalance: '10-step counterbalance',
        drag: '5 grades of horizontal & vertical drag',
        heightRange: '41 to 169 cm'
      },
      notes: 'Quick-release brakes fully tested.'
    },
    {
      assetTag: 'MON-001',
      name: 'SmallHD Cine 7 Touchscreen Field Monitor',
      brand: 'SmallHD',
      model: 'Cine 7 SDI/HDMI',
      serialNumber: 'SN-MON-660193',
      categoryId: categories['Monitors & Wireless Video'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-01-15'),
      purchasePrice: 1799.00,
      dailyRate: 75.00,
      location: 'Monitor Bay F-01',
      imageUrl: 'https://images.unsplash.com/photo-1546776310-eef45dd6d63c?w=600&auto=format&fit=crop&q=80',
      accessories: [
        'Dual Sony L-Series Battery Bracket',
        'Sunhood Cine 7',
        'Screen Protector (Installed)',
        'Articulating Magic Arm 1/4"-20',
        '12" BNC SDI Cable',
        'Pelican Custom Hard Case'
      ],
      specifications: {
        display: '7-inch IPS LCD 1920x1200',
        brightness: '1800 nits daylight-viewable',
        colorGamut: '100% DCI-P3 coverage',
        os: 'PageOS 5 with EL Zone, Waveform, 3D LUTs'
      },
      notes: 'Sony camera control license installed.'
    },
    {
      assetTag: 'PWR-001',
      name: 'Anton Bauer Titon Micro 90 V-Mount Battery 4-Kit',
      brand: 'Anton Bauer',
      model: 'Titon Micro 90 Quad',
      serialNumber: 'SN-PWR-771029',
      categoryId: categories['Batteries & Power'].id,
      status: 'AVAILABLE',
      condition: 'EXCELLENT',
      purchaseDate: new Date('2024-02-18'),
      purchasePrice: 1350.00,
      dailyRate: 60.00,
      location: 'Power Station G-01',
      imageUrl: 'https://images.unsplash.com/photo-1609592424364-f655ffec0fa9?w=600&auto=format&fit=crop&q=80',
      accessories: [
        '4x Anton Bauer Titon Micro 90Wh V-Mount Batteries',
        'VM4 4-Position Simultaneous Fast Charger',
        'US AC Power Cable',
        'Protective Travel Case'
      ],
      specifications: {
        capacity: '94Wh, 14.4V, 6.6Ah',
        maxDraw: '10A continuous',
        ports: 'P-Tap / D-Tap and 5V USB output ports',
        display: 'On-battery LCD runtime display'
      },
      notes: 'Full battery health cycle > 98%.'
    }
  ];

  const createdEquipment = [];
  for (const eq of equipmentData) {
    const qrPayload = {
      assetTag: eq.assetTag,
      name: eq.name,
      serial: eq.serialNumber,
      brand: eq.brand,
      model: eq.model,
      category: eq.categoryId
    };
    const qrCode = await generateQRCode(qrPayload);

    const item = await prisma.equipment.create({
      data: {
        ...eq,
        qrCode
      }
    });
    createdEquipment.push(item);
  }
  console.log(`✅ Created ${createdEquipment.length} equipment items with QR codes.`);

  // 4. Create Projects
  const project1 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-2026-001',
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
      projectCode: 'PRJ-2026-002',
      title: 'Echoes of the High Arctic (Docuseries)',
      client: 'Earth Horizon Media',
      director: 'Elena Rostova',
      location: 'Northern Svalbard Archipelago',
      startDate: new Date('2026-11-25'),
      endDate: new Date('2026-12-10'),
      status: 'PLANNING',
      createdById: userElena.id,
      notes: 'Cold weather resilience gear, weather-sealed prime lenses required.'
    }
  });

  const project3 = await prisma.project.create({
    data: {
      projectCode: 'PRJ-2026-003',
      title: 'Metropolitan Fashion Week 2026',
      client: 'Vogue Global Media',
      director: 'David Kim',
      location: 'Grand Palais Exhibition Center',
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-22'),
      status: 'COMPLETED',
      createdById: userDavid.id,
      notes: 'Handheld gimbal tracking and wireless video to client lounge.'
    }
  });

  console.log('✅ Created 3 production projects.');

  // 5. Create Borrow Requests
  // Request 1: Currently CHECKED OUT (Sony FX6 + Aputure 600d)
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

  // Items for Request 1
  const fx6 = createdEquipment.find(e => e.assetTag === 'CAM-002');
  const ap600 = createdEquipment.find(e => e.assetTag === 'LGT-001');

  await prisma.borrowRequestItem.create({
    data: {
      requestId: reqCheckedOut.id,
      equipmentId: fx6.id,
      status: 'CHECKED_OUT'
    }
  });

  await prisma.borrowRequestItem.create({
    data: {
      requestId: reqCheckedOut.id,
      equipmentId: ap600.id,
      status: 'CHECKED_OUT'
    }
  });

  // Record CheckOut Action
  await prisma.checkInOut.create({
    data: {
      requestId: reqCheckedOut.id,
      equipmentId: fx6.id,
      type: 'CHECK_OUT',
      handledById: stockController.id,
      borrowerName: userDavid.name,
      conditionAtAction: 'EXCELLENT',
      accessoriesChecked: fx6.accessories,
      damageReported: false,
      notes: 'All 6 accessories present and verified. Clean optics.'
    }
  });

  await prisma.checkInOut.create({
    data: {
      requestId: reqCheckedOut.id,
      equipmentId: ap600.id,
      type: 'CHECK_OUT',
      handledById: stockController.id,
      borrowerName: userDavid.name,
      conditionAtAction: 'GOOD',
      accessoriesChecked: ap600.accessories,
      damageReported: false,
      notes: 'Reflector and barn doors verified in rolling case.'
    }
  });

  // Request 2: PENDING review (Elena requesting FX3, 24-70mm lens, and Audio mic)
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

  const fx3 = createdEquipment.find(e => e.assetTag === 'CAM-001');
  const lens2470 = createdEquipment.find(e => e.assetTag === 'LNS-001');
  const mkh416 = createdEquipment.find(e => e.assetTag === 'AUD-001');

  await prisma.borrowRequestItem.create({
    data: {
      requestId: reqPending.id,
      equipmentId: fx3.id,
      status: 'REQUESTED'
    }
  });

  await prisma.borrowRequestItem.create({
    data: {
      requestId: reqPending.id,
      equipmentId: lens2470.id,
      status: 'REQUESTED'
    }
  });

  await prisma.borrowRequestItem.create({
    data: {
      requestId: reqPending.id,
      equipmentId: mkh416.id,
      status: 'REQUESTED'
    }
  });

  // Request 3: RETURNED (Completed past request)
  const reqReturned = await prisma.borrowRequest.create({
    data: {
      requestNumber: 'REQ-2026-003',
      userId: userDavid.id,
      projectId: project3.id,
      startDate: new Date('2026-10-15'),
      endDate: new Date('2026-10-22'),
      actualReturnDate: new Date('2026-10-22T16:00:00Z'),
      purpose: 'Vogue Fashion Week Runway Multi-Cam Coverage',
      status: 'RETURNED',
      approvedById: admin.id,
      approvedAt: new Date('2026-10-14T09:00:00Z'),
      notes: 'Returned in full and inspected by Marcus Vance.'
    }
  });

  const rs3 = createdEquipment.find(e => e.assetTag === 'GMB-001');
  await prisma.borrowRequestItem.create({
    data: {
      requestId: reqReturned.id,
      equipmentId: rs3.id,
      status: 'RETURNED',
      returnedCondition: 'GOOD',
      notes: 'Returned cleaned and charged'
    }
  });

  await prisma.checkInOut.create({
    data: {
      requestId: reqReturned.id,
      equipmentId: rs3.id,
      type: 'CHECK_IN',
      handledById: stockController.id,
      borrowerName: userDavid.name,
      conditionAtAction: 'GOOD',
      accessoriesChecked: rs3.accessories,
      damageReported: false,
      notes: 'Full kit returned with briefcase handle.'
    }
  });

  console.log('✅ Created 3 borrow requests with items and check-in/out records.');

  // 6. Create Maintenance Ticket
  const komodo = createdEquipment.find(e => e.assetTag === 'CAM-004');
  await prisma.maintenance.create({
    data: {
      ticketNumber: 'MNT-2026-001',
      equipmentId: komodo.id,
      reportedById: stockController.id,
      issueTitle: 'Loose 12G-SDI Output BNC Port',
      description: 'Camera video output intermittently flickers when BNC cable is moved. Requires BNC connector re-soldering or board replacement.',
      severity: 'HIGH',
      status: 'SENT_TO_VENDOR',
      vendor: 'RED Authorized Service Center - Burbank',
      cost: 450.00,
      scheduledDate: new Date('2026-11-12'),
      notes: 'Sent via insured courier tracking #RED9920184.'
    }
  });

  console.log('✅ Created maintenance record.');

  // 7. Create Notifications
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
      }
    ]
  });

  // 8. Create Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        userId: admin.id,
        action: 'EQUIPMENT_REGISTER',
        entity: 'Equipment',
        entityId: fx3.id,
        details: { assetTag: 'CAM-001', name: fx3.name },
        ipAddress: '192.168.1.100'
      },
      {
        userId: admin.id,
        action: 'APPROVE_REQUEST',
        entity: 'BorrowRequest',
        entityId: reqCheckedOut.id,
        details: { requestNumber: 'REQ-2026-001', user: userDavid.name },
        ipAddress: '192.168.1.100'
      },
      {
        userId: stockController.id,
        action: 'CHECK_OUT',
        entity: 'CheckInOut',
        entityId: fx6.id,
        details: { equipment: fx6.name, borrower: userDavid.name },
        ipAddress: '192.168.1.105'
      }
    ]
  });

  console.log('✅ Seed complete! System is fully primed with realistic production data.');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
