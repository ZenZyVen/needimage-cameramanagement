const bcrypt = require('bcryptjs');

// Pre-seeded realistic cinema data for offline/demo fallback
const passwordHash = bcrypt.hashSync('password123', 10);

const users = [
  {
    id: 'user-admin-1',
    name: 'Sarah Connor',
    email: 'admin@cameragear.com',
    password: passwordHash,
    role: 'ADMIN',
    department: 'Production Operations',
    phone: '+1 555-019-2831',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'user-stock-1',
    name: 'Marcus Vance',
    email: 'stock@cameragear.com',
    password: passwordHash,
    role: 'STOCK_CONTROLLER',
    department: 'Gear Vault & Logistics',
    phone: '+1 555-019-4822',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date('2026-01-02')
  },
  {
    id: 'user-normal-1',
    name: 'David Kim',
    email: 'user@cameragear.com',
    password: passwordHash,
    role: 'USER',
    department: 'Cinematography Unit',
    phone: '+1 555-019-7711',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date('2026-01-03')
  },
  {
    id: 'user-normal-2',
    name: 'Elena Rostova',
    email: 'elena@cameragear.com',
    password: passwordHash,
    role: 'USER',
    department: 'Documentary Division',
    phone: '+1 555-019-9944',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
    isActive: true,
    createdAt: new Date('2026-01-04')
  }
];

const categories = [
  { id: 'cat-1', name: 'Cinema Cameras', description: 'Full-frame and Super35 digital cinema camera bodies', icon: 'bi-camera-reels' },
  { id: 'cat-2', name: 'Mirrorless Cameras', description: 'Compact hybrid 4K/8K mirrorless cameras', icon: 'bi-camera' },
  { id: 'cat-3', name: 'Cinema Lenses', description: 'Cine prime sets, anamorphic lenses, and professional cine zooms', icon: 'bi-disc' },
  { id: 'cat-4', name: 'Studio & Field Lighting', description: 'High-output LED monolights, tube lights, and softboxes', icon: 'bi-lightbulb' },
  { id: 'cat-5', name: 'Audio & Microphones', description: 'Shotgun mics, wireless lavalier systems, and field recorders', icon: 'bi-mic' },
  { id: 'cat-6', name: 'Gimbals & Stabilizers', description: '3-axis motorized gimbals and 4-axis integrated stabilization systems', icon: 'bi-joystick' },
  { id: 'cat-7', name: 'Tripods & Grip', description: 'Carbon fiber fluid head tripods, C-stands, and rigging accessories', icon: 'bi-wrench-adjustable' },
  { id: 'cat-8', name: 'Monitors & Wireless Video', description: 'High-brightness field monitors and zero-latency wireless video transmitters', icon: 'bi-display' },
  { id: 'cat-9', name: 'Batteries & Power', description: 'V-Mount/Gold-Mount battery bricks, chargers, and AC power distribution', icon: 'bi-battery-charging' },
  { id: 'cat-10', name: 'Media & Storage', description: 'CFexpress Type A/B, SDXC V90, and rugged on-set SSDs', icon: 'bi-device-ssd' }
];

const equipment = [
  {
    id: 'eq-1',
    assetTag: 'CAM-001',
    name: 'Sony FX3 Full-Frame Cinema Camera',
    brand: 'Sony',
    model: 'ILME-FX3',
    serialNumber: 'SN-FX3-882194',
    categoryId: 'cat-1',
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-03-15'),
    purchasePrice: 3899.00,
    dailyRate: 150.00,
    location: 'Vault Locker A-01',
    imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&auto=format&fit=crop&q=80',
    accessories: ['Top XLR Audio Handle Unit', '2x Sony NP-FZ100 Batteries', 'Dual Bay Battery Charger', 'HDMI Cable Clamp', 'Body Cap', 'Pelican 1510 Storm Case'],
    specifications: { sensor: '12.1MP Full-Frame Exmor R CMOS', mount: 'Sony E-Mount' },
    notes: 'Firmware v5.00 updated. Sensor cleaned Oct 2026.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-001</text></svg>'
  },
  {
    id: 'eq-2',
    assetTag: 'CAM-002',
    name: 'Sony FX6 Full-Frame Cinema Camera',
    brand: 'Sony',
    model: 'ILME-FX6V',
    serialNumber: 'SN-FX6-551029',
    categoryId: 'cat-1',
    status: 'BORROWED',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-11-20'),
    purchasePrice: 5999.00,
    dailyRate: 250.00,
    location: 'Vault Locker A-02',
    imageUrl: 'https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=600&auto=format&fit=crop&q=80',
    accessories: ['Top Handle with Audio Controls', '3.5" LCD Monitor & Hood', 'Grip Remote Controller', '2x BP-U60 Batteries', 'Heavy-Duty Rolling Hard Case'],
    specifications: { sensor: '4K Full-Frame 10.2MP CMOS', ndFilter: 'Electronic Variable ND' },
    notes: 'Assigned to commercial production.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-002</text></svg>'
  },
  {
    id: 'eq-3',
    assetTag: 'CAM-003',
    name: 'Canon EOS C70 4K Cinema Camera',
    brand: 'Canon',
    model: 'EOS C70',
    serialNumber: 'SN-C70-901844',
    categoryId: 'cat-1',
    status: 'AVAILABLE',
    condition: 'GOOD',
    purchaseDate: new Date('2023-08-10'),
    purchasePrice: 5499.00,
    dailyRate: 220.00,
    location: 'Vault Locker A-03',
    imageUrl: 'https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=600&auto=format&fit=crop&q=80',
    accessories: ['Handle Unit with Mic Holder', '2x BP-A60 Batteries', 'Single Battery Charger', 'Compact Hard Case'],
    notes: 'EF-EOS R 0.71x Speedbooster available.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-003</text></svg>'
  },
  {
    id: 'eq-4',
    assetTag: 'CAM-004',
    name: 'RED Komodo 6K Cinema Camera',
    brand: 'RED Digital Cinema',
    model: 'Komodo 6K',
    serialNumber: 'SN-KOM-109283',
    categoryId: 'cat-1',
    status: 'UNDER_MAINTENANCE',
    condition: 'FAIR',
    purchaseDate: new Date('2023-05-18'),
    purchasePrice: 6200.00,
    dailyRate: 280.00,
    location: 'Repair Bench Shelf 2',
    imageUrl: 'https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?w=600&auto=format&fit=crop&q=80',
    accessories: ['Wing Grip', 'Outrigger Handle', 'Canon RF to EF Adapter with VND', '2x RED CFast 512GB Cards'],
    notes: 'SDI output loose pin reported. Scheduled for inspection.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">CAM-004</text></svg>'
  },
  {
    id: 'eq-5',
    assetTag: 'LNS-001',
    name: 'Sony FE 24-70mm f/2.8 GM II Lens',
    brand: 'Sony',
    model: 'SEL2470GM2',
    serialNumber: 'SN-LNS-772910',
    categoryId: 'cat-3',
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2024-01-20'),
    purchasePrice: 2298.00,
    dailyRate: 65.00,
    location: 'Lens Cabinet B-01',
    imageUrl: 'https://images.unsplash.com/photo-1617005082133-548c4dd27f35?w=600&auto=format&fit=crop&q=80',
    accessories: ['Front Lens Cap 82mm', 'Rear E-Mount Cap', 'Lens Hood ALC-SH168', 'Padded Lens Pouch'],
    notes: 'Pristine condition. Nano AR Coating II.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">LNS-001</text></svg>'
  },
  {
    id: 'eq-6',
    assetTag: 'LGT-001',
    name: 'Aputure LS 600d Pro Daylight LED Monolight',
    brand: 'Aputure',
    model: 'LS 600d Pro',
    serialNumber: 'SN-LGT-339102',
    categoryId: 'cat-4',
    status: 'BORROWED',
    condition: 'GOOD',
    purchaseDate: new Date('2023-09-05'),
    purchasePrice: 1890.00,
    dailyRate: 110.00,
    location: 'Lighting Bay C-01',
    imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=600&auto=format&fit=crop&q=80',
    accessories: ['Control Box with V-Mount Plates', 'Hyper Reflector', 'Weatherproof Head Cable', 'Heavy-Duty Rolling Case'],
    notes: 'Weather resistant IP54 rated.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">LGT-001</text></svg>'
  },
  {
    id: 'eq-7',
    assetTag: 'AUD-001',
    name: 'Sennheiser MKH 416 Shotgun Microphone',
    brand: 'Sennheiser',
    model: 'MKH 416-P48U3',
    serialNumber: 'SN-AUD-119280',
    categoryId: 'cat-5',
    status: 'AVAILABLE',
    condition: 'EXCELLENT',
    purchaseDate: new Date('2023-04-10'),
    purchasePrice: 999.00,
    dailyRate: 45.00,
    location: 'Audio Locker D-01',
    imageUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600&auto=format&fit=crop&q=80',
    accessories: ['MZW 415 Windscreen', 'MZQ 100 Mic Clamp', 'Rycote Softie Windshield', 'XLR Cable 25ft', 'Travel Tube'],
    notes: 'Standard film dialogue shotgun mic.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">AUD-001</text></svg>'
  },
  {
    id: 'eq-8',
    assetTag: 'GMB-001',
    name: 'DJI RS 3 Pro Gimbal Stabilizer Combo',
    brand: 'DJI',
    model: 'RS 3 Pro Combo',
    serialNumber: 'SN-GMB-993812',
    categoryId: 'cat-6',
    status: 'AVAILABLE',
    condition: 'GOOD',
    purchaseDate: new Date('2023-07-22'),
    purchasePrice: 1099.00,
    dailyRate: 70.00,
    location: 'Grip Bay E-01',
    imageUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?w=600&auto=format&fit=crop&q=80',
    accessories: ['BG30 Battery Grip', 'Briefcase Handle', 'Focus Motor (2022)', 'Ronin RavenEye', 'Carrying Case'],
    notes: 'Calibrated for FX3.',
    qrCode: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200"><rect width="200" height="200" fill="%23fff"/><text x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="monospace" font-size="14" fill="%230f172a">GMB-001</text></svg>'
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
    actualReturnDate: new Date('2026-10-22T16:00:00Z'),
    purpose: 'Vogue Fashion Week Runway Multi-Cam Coverage',
    status: 'RETURNED',
    approvedById: 'user-admin-1',
    approvedAt: new Date('2026-10-14T09:00:00Z'),
    notes: 'Returned in full and inspected by Marcus Vance.'
  }
];

const borrowRequestItems = [
  { id: 'item-1', requestId: 'req-1', equipmentId: 'eq-2', status: 'CHECKED_OUT' },
  { id: 'item-2', requestId: 'req-1', equipmentId: 'eq-6', status: 'CHECKED_OUT' },
  { id: 'item-3', requestId: 'req-2', equipmentId: 'eq-1', status: 'REQUESTED' },
  { id: 'item-4', requestId: 'req-2', equipmentId: 'eq-5', status: 'REQUESTED' },
  { id: 'item-5', requestId: 'req-2', equipmentId: 'eq-7', status: 'REQUESTED' },
  { id: 'item-6', requestId: 'req-3', equipmentId: 'eq-8', status: 'RETURNED', returnedCondition: 'GOOD', notes: 'Returned cleaned' }
];

const checkInOuts = [
  {
    id: 'chk-1',
    requestId: 'req-1',
    equipmentId: 'eq-2',
    type: 'CHECK_OUT',
    handledById: 'user-stock-1',
    borrowerName: 'David Kim',
    conditionAtAction: 'EXCELLENT',
    accessoriesChecked: ['Top Handle', 'LCD Monitor', 'Grip Remote', '2x Batteries', 'Hard Case'],
    damageReported: false,
    actionDate: new Date('2026-11-08T09:00:00Z'),
    notes: 'All 5 accessories verified.'
  },
  {
    id: 'chk-2',
    requestId: 'req-1',
    equipmentId: 'eq-6',
    type: 'CHECK_OUT',
    handledById: 'user-stock-1',
    borrowerName: 'David Kim',
    conditionAtAction: 'GOOD',
    accessoriesChecked: ['Control Box', 'Hyper Reflector', 'Head Cable', 'Rolling Case'],
    damageReported: false,
    actionDate: new Date('2026-11-08T09:05:00Z'),
    notes: 'Reflector verified in rolling case.'
  },
  {
    id: 'chk-3',
    requestId: 'req-3',
    equipmentId: 'eq-8',
    type: 'CHECK_IN',
    handledById: 'user-stock-1',
    borrowerName: 'David Kim',
    conditionAtAction: 'GOOD',
    damageReported: false,
    actionDate: new Date('2026-10-22T16:00:00Z'),
    notes: 'Full kit returned with briefcase handle.'
  }
];

const maintenances = [
  {
    id: 'mnt-1',
    ticketNumber: 'MNT-2026-001',
    equipmentId: 'eq-4',
    reportedById: 'user-stock-1',
    issueTitle: 'Loose 12G-SDI Output BNC Port',
    description: 'Camera video output intermittently flickers when BNC cable is moved. Requires BNC connector re-soldering or board replacement.',
    severity: 'HIGH',
    status: 'SENT_TO_VENDOR',
    vendor: 'RED Authorized Service Center - Burbank',
    cost: 450.00,
    scheduledDate: new Date('2026-11-12'),
    notes: 'Sent via insured courier tracking #RED9920184.',
    createdAt: new Date('2026-11-06')
  }
];

const notifications = [
  {
    id: 'notif-1',
    userId: 'user-admin-1',
    title: 'New Borrow Request Submitted',
    message: 'Elena Rostova submitted Request #REQ-2026-002 for project "Echoes of the High Arctic".',
    type: 'INFO',
    isRead: false,
    link: '/requests',
    createdAt: new Date('2026-11-09T10:00:00Z')
  },
  {
    id: 'notif-2',
    userId: 'user-stock-1',
    title: 'Scheduled Return Alert',
    message: 'Request #REQ-2026-001 (Sony FX6, Aputure 600d) is scheduled for return on Nov 15.',
    type: 'WARNING',
    isRead: false,
    link: '/checkin-out',
    createdAt: new Date('2026-11-09T08:00:00Z')
  },
  {
    id: 'notif-3',
    userId: 'user-normal-1',
    title: 'Request Approved & Checked Out',
    message: 'Your Request #REQ-2026-001 has been checked out by Marcus Vance.',
    type: 'SUCCESS',
    isRead: true,
    link: '/requests',
    createdAt: new Date('2026-11-08T09:10:00Z')
  }
];

const auditLogs = [
  {
    id: 'audit-1',
    userId: 'user-admin-1',
    action: 'EQUIPMENT_REGISTER',
    entity: 'Equipment',
    entityId: 'eq-1',
    details: { assetTag: 'CAM-001', name: 'Sony FX3 Full-Frame Cinema Camera' },
    ipAddress: '192.168.1.100',
    createdAt: new Date('2026-11-01')
  }
];

// Helper to filter items by criteria
function filterCollection(collection, where = {}) {
  return collection.filter(item => {
    for (const [key, val] of Object.entries(where)) {
      if (val === undefined) continue;
      if (key === 'OR' && Array.isArray(val)) {
        const orMatch = val.some(condition => {
          return Object.entries(condition).every(([k, v]) => {
            if (v && v.contains) {
              const fieldVal = String(item[k] || '').toLowerCase();
              return fieldVal.includes(String(v.contains).toLowerCase());
            }
            if (v && v.equals) {
              return String(item[k] || '').toLowerCase() === String(v.equals).toLowerCase();
            }
            return item[k] === v;
          });
        });
        if (!orMatch) return false;
      } else if (val && typeof val === 'object' && val.in) {
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
    findUnique: async ({ where } = {}) => users.find(u => (where.id && u.id === where.id) || (where.email && u.email.toLowerCase() === where.email.toLowerCase())),
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
          _count: { equipment: equipment.filter(e => e.categoryId === c.id).length }
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
    }
  },

  equipment: {
    findMany: async ({ where, take = 100, skip = 0, include } = {}) => {
      let list = filterCollection(equipment, where);
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
    findFirst: async ({ where }) => {
      const matches = filterCollection(equipment, where);
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
    count: async ({ where } = {}) => filterCollection(equipment, where).length,
    create: async ({ data }) => {
      const newEq = { id: `eq-${Date.now()}`, createdAt: new Date(), ...data };
      equipment.push(newEq);
      return { ...newEq, category: categories.find(c => c.id === newEq.categoryId) };
    },
    update: async ({ where, data }) => {
      const idx = equipment.findIndex(e => e.id === where.id);
      if (idx !== -1) {
        equipment[idx] = { ...equipment[idx], ...data, updatedAt: new Date() };
        return { ...equipment[idx], category: categories.find(c => c.id === equipment[idx].categoryId) };
      }
      return null;
    },
    delete: async ({ where }) => {
      const idx = equipment.findIndex(e => e.id === where.id);
      if (idx !== -1) equipment.splice(idx, 1);
      return { success: true };
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
    delete: async ({ where }) => {
      const idx = projects.findIndex(p => p.id === where.id);
      if (idx !== -1) projects.splice(idx, 1);
      return { success: true };
    }
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
          handledBy: users.find(u => u.id === c.handledById)
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
    }
  },

  borrowRequestItem: {
    findMany: async ({ where } = {}) => filterCollection(borrowRequestItems, where),
    updateMany: async ({ where, data }) => {
      let count = 0;
      borrowRequestItems.forEach((i, idx) => {
        if ((!where.requestId || i.requestId === where.requestId) && (!where.equipmentId || i.equipmentId === where.equipmentId)) {
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
    count: async ({ where } = {}) => filterCollection(checkInOuts, where).length,
    create: async ({ data }) => {
      const newRec = { id: `chk-${Date.now()}`, actionDate: new Date(), ...data };
      checkInOuts.unshift(newRec);
      return newRec;
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
    findMany: async ({ where } = {}) => filterCollection(auditLogs, where),
    create: async ({ data }) => {
      const log = { id: `audit-${Date.now()}`, createdAt: new Date(), ...data };
      auditLogs.unshift(log);
      return log;
    }
  },

  $transaction: async (fn) => {
    return fn(mockStore);
  },

  $queryRaw: async () => [{ 1: 1 }]
};

module.exports = { mockStore };
