export const DEPARTMENT_GROUPS = [
  {
    label: 'Camera & Cinematography',
    options: [
      'Cinematography',
      'Camera Department (A-Cam / B-Cam)',
      'Camera Assistant (1st AC / 2nd AC)',
      'Steadicam & Gimbal Operation',
      'Aerial & Drone Unit',
      'Photography & Stills Unit'
    ]
  },
  {
    label: 'Lighting, Grip & Sound',
    options: [
      'Lighting & Gaffer',
      'Grip & Rigging',
      'Lighting & Grip',
      'Sound & Audio'
    ]
  },
  {
    label: 'Production & Direction',
    options: [
      'Directing',
      'Production Management',
      'Production Unit',
      'Commercial & Advertising',
      'Documentary',
      'Music Video & Creative',
      'Live Broadcast & Streaming',
      'Art & Set Design',
      'Location & Transport Logistics'
    ]
  },
  {
    label: 'DIT, Post-Production & Media',
    options: [
      'DIT & Media',
      'Video Editing & Post-Production',
      'Color Grading & VFX'
    ]
  },
  {
    label: 'Vault, Rental & Technical Operations',
    options: [
      'Gear Vault & Stock Control',
      'Equipment Rental & Booking Desk',
      'Technical Maintenance & Repair',
      'Production Operations',
      'Client Services & Administration'
    ]
  }
];

export const ALL_DEPARTMENTS = DEPARTMENT_GROUPS.flatMap((group) => group.options);
