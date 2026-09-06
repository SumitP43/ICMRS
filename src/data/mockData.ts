import { CivicComplaint, CivicAlert, EmergencyHotline, FAQItem } from '../types';

export const INITIAL_COMPLAINTS: CivicComplaint[] = [
  {
    id: '#ICMRS-2026-001245',
    title: 'Deep Sub-Surface Pothole on Oak Ave & 14th St.',
    description: 'Severe crater forming near storm water drainage curb. Vehicles swerving into opposing oncoming lanes during evening transit rush.',
    category: 'Roads & Bridges',
    location: 'Oak Ave Crossway 4402',
    coordinates: { lat: 47.6097, lng: -122.3331 },
    status: 'In Progress',
    pipelineStep: 3,
    pipelineStepName: 'Step 3 of 5: Asphalt Crew Deployed',
    pipelinePercent: 60,
    assignedCrew: 'Crew 09 (Rapid Patch Unit)',
    timeLogged: 'Logged 5 hrs ago',
    slaRemaining: '18h 42m SLA remaining',
    totalSlaHours: 24,
    slaStatus: 'urgent',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKUAmlJjfN4RPAZeqjdSap1DcOB1SYBxe9IkhPw69OcoRfzN6QW9RK5jlq0V3osMWttxlXtj53GJfTbQbMI2vEXOSab5pM0XkL7HHqx-jkf0jcmFZmz1f5yERzYI6vkssUgfhDTo1-7KYKHVDNp4gR9lv-EHqArNSk7ZuN_YooteMhIj4twCqPXhqRGdkoNpbuQfy7hBtDugONdYHXl9vkcEryHWAtX6PzW_paboSR2AIZcrcsGVrk7A',
    imageAlt: 'Close-up documentary civic photo of a hazardous deep asphalt pothole on a suburban asphalt lane with orange hazard spray paint markers in clear morning daylight.',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-1',
        author: 'Elena Vance',
        role: 'Ward Officer 04',
        time: '3 hours ago',
        text: 'Initial inspection confirmed severe asphalt shear. Depth is approx 11 cm. Asphalt mixer unit dispatched from Depot Central.'
      },
      {
        id: 'n-2',
        author: 'Crew Lead Miller',
        role: 'Crew 09',
        time: '45 mins ago',
        text: 'Safety cones placed on northbound shoulder. Hot mix delivery en route (ETA 15 mins).'
      }
    ],
    priority: 'Critical',
    citizenToken: 'CT-88942-X'
  },
  {
    id: '#ICMRS-2026-001198',
    title: 'Broken Luminaire Fixture with Exposed Wiring',
    description: 'Damaged light head swaying in winds following heavy storm. High pedestrian walkway hazard near Elementary School crosswalk.',
    category: 'Electrical & Lighting',
    location: 'Corner Elmwood & Maple Dr.',
    nodeCode: 'Node #SL-402',
    coordinates: { lat: 47.6152, lng: -122.3214 },
    status: 'Assigned & Scheduled',
    pipelineStep: 2,
    pipelineStepName: 'Step 2 of 5: Work Order Issued',
    pipelinePercent: 40,
    assignedCrew: 'Tech Team Grid Beta',
    timeLogged: 'Logged Yesterday',
    slaRemaining: '34h 10m SLA nominal',
    totalSlaHours: 48,
    slaStatus: 'nominal',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGor6GIQRztnq1Fn78tsRToKFXcyUfB2pCehvBgbC2kfy02JB_bh2NghGkyRghoQj5IEktqAY81JDt6YBAmwkTlubTXGizz8H6Vi8rON_8DP5hd8B9P9ujYDsLNW5b_4wB6tmI6waZ5YIOkK1cmaNEjE4688acIWA1vStVXJ4OqshCrvbLsM3xRfbzUpsGGnJe94b7W2Xif13ILNOi08le2cwUqTgoVhbTj4M37AvPjCd6eyynr66LLg',
    imageAlt: 'Urban public street view of an overhead municipal LED streetlight fixture hanging loose from pole wiring during overcast conditions.',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-3',
        author: 'Elena Vance',
        role: 'Ward Officer 04',
        time: '18 hours ago',
        text: 'Electrical isolation command sent to substation node #SL-402. Circuit de-energized to safeguard pedestrians.'
      }
    ],
    priority: 'High',
    citizenToken: 'CT-88942-X'
  },
  {
    id: '#ICMRS-2026-000984',
    title: 'Overflowing Storm Drain Clearing',
    description: 'Debris accumulation cleared on Highland Blvd during flood-watch window. Flow velocity restored to 100%.',
    category: 'Water & Sanitation',
    location: 'Highland Blvd & 22nd Way',
    coordinates: { lat: 47.6205, lng: -122.3493 },
    status: 'Resolved',
    pipelineStep: 5,
    pipelineStepName: 'Step 5 of 5: Certified Sign-off',
    pipelinePercent: 100,
    assignedCrew: 'Hydro-Jet Vacuum Unit 04',
    timeLogged: '3 days ago',
    slaRemaining: 'Certified Closed',
    totalSlaHours: 48,
    slaStatus: 'resolved',
    beforeImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdyTxPLgjVOtrbvSgH-z1pFks8qeq7JWBmOm1yswZgi-nVbeYZkrJdJwEM8EFq9T6ABjmQiA4bhxgm_Vh72Pt-xWE1MVc3XRQaMtbJd0WA2_HjsRQXTtR0Qm_KJe9zLFoWPYUTJIyDHM2EMbIwr3sNMM8DcVy-uX34mcdvYmKr7hwQM91TxEKPSrewhvQJ3ET8_PpaqEpNaI3_ZClUETKa-qQHRsxclVF4IePs71nMEbspIawGzL6vpA',
    beforeImageAlt: 'Before photograph showing severe storm drain clogged with fallen leaves, wet branches and street trash causing gutter flooding.',
    afterImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2l8HaUVF9slNV9YxOmbqq1WjycFPXVErGy_cOc0QCGQTRJQsKGTtoIjrQ3EbbZ_293VRfFB0jDzrilVBQFy2m8gLtbeuD-imZ-bfwsLmZjdMPV6jb41KKUghwKP2j1Qow8xFhNXJ5JWJnw4pbdWF2Xn9JX4080XkmGAxy7u85Xf-udf8rFj2tvGwU7OqPN7YyM0Y6R9YYhnXFmrqsXdeSBkS-wrpMWM-PUyU8gSxE5zs9b5LofG3rIw',
    afterImageAlt: 'After photograph showing clean, clear steel street drain grate with spotless asphalt and free-flowing water outlet.',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-4',
        author: 'Insp. E. Vance',
        role: 'Chief Field Auditor',
        time: '3 hours ago',
        text: 'Visual forensic audit passed. Gutter flow rate 100%. Site perimeter sanitised.'
      }
    ],
    inspector: {
      name: 'Insp. E. Vance',
      title: 'Chief Field Auditor',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
    },
    resolvedTime: 'Resolved 3h ago',
    rating: 5,
    priority: 'High',
    citizenToken: 'CT-88942-X'
  },
  {
    id: '#ICMRS-2026-000871',
    title: 'Pedestrian Signal Button Sensor Fix',
    description: 'Stuck capacitive call button on 4th & Lexington pedestrian crossing repaired and recalibrated for crosswalk safety.',
    category: 'Public Safety & Transit',
    location: '4th & Lexington Ave',
    coordinates: { lat: 47.6062, lng: -122.3321 },
    status: 'Resolved',
    pipelineStep: 5,
    pipelineStepName: 'Step 5 of 5: Certified Sign-off',
    pipelinePercent: 100,
    assignedCrew: 'Traffic Signal Calibration Team 2',
    timeLogged: '4 days ago',
    slaRemaining: 'Certified Closed',
    totalSlaHours: 72,
    slaStatus: 'resolved',
    beforeImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDT2La5a4Q94QSB22nK-OlVmZbB19gMUB1PaQIHGfJtYm4yIAO7y4S3Ys7kUf5Axl5fpActrCkVu5dOLiuOty2ATzHloFJbnuoGxVQ8lejBeqW21A-TpdiYvyUxIWreYYOcylrGwBOQ9msJDui1pIR2yJ1-OeH-OxVYBQHAxa65oYF9627KKIg2goup0_UlRiFouEKCO3J485BhTia4Z_hHE25vrH_aVav6qYyTaeJtMClGDz7gr8dclQ',
    beforeImageAlt: 'Before photograph showing cracked yellow crosswalk push button housing with vandalism and broken cover.',
    afterImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC_G5IcEAQcE5RjYxuLjUj27lbO_CDXWic6zAVb-7J8DC8wOpfvx9c76Kpw34OS0oflW2uVyuDsevnjvpO8AMSJ8SfY160HmvZBdg4B8oeuvs5uPKoP4g8wOi8_GOJqnXJ4Pj1Lx9wC_MspCBHbftbUpULM5BOPHtjYFOokp9DNoXjVTE3fCD1SwGq0gxIvWmeqS0AdqG_jlHt40PsNqIadkHQatlQPubE2gjdnb7LHAmYkg2DQ8meghQ',
    afterImageAlt: 'After photograph showing brand new stainless steel crosswalk push button installed on clean black steel traffic pole with lighted sensor ring.',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-5',
        author: 'Eng. T. Chen',
        role: 'Traffic Telemetry Div',
        time: '2 days ago',
        text: 'Solid state piezo button installed. Auditory beep signal synchronized to 18 second walk countdown.'
      }
    ],
    inspector: {
      name: 'Eng. T. Chen',
      title: 'Traffic Telemetry Div',
      initials: 'TC'
    },
    resolvedTime: 'Resolved 2d ago',
    rating: 4.5,
    priority: 'Medium',
    citizenToken: 'CT-88942-X'
  },
  {
    id: '#ICMRS-2026-001302',
    title: 'Downed Tree Limb Blocking Bicycle Corridor',
    description: 'Heavy pine bough fallen across two-way cycle lane following nocturnal gale force gusts. Forced detours into traffic.',
    category: 'Parks & Forestry',
    location: 'Pine St & 8th Ave',
    coordinates: { lat: 47.6134, lng: -122.3340 },
    status: 'Dispatched',
    pipelineStep: 3,
    pipelineStepName: 'Step 3 of 5: Chipper Crew on Site',
    pipelinePercent: 60,
    assignedCrew: 'Urban Forestry Rapid Team',
    timeLogged: 'Logged 2 hrs ago',
    slaRemaining: '6h 15m SLA remaining',
    totalSlaHours: 8,
    slaStatus: 'urgent',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKUAmlJjfN4RPAZeqjdSap1DcOB1SYBxe9IkhPw69OcoRfzN6QW9RK5jlq0V3osMWttxlXtj53GJfTbQbMI2vEXOSab5pM0XkL7HHqx-jkf0jcmFZmz1f5yERzYI6vkssUgfhDTo1-7KYKHVDNp4gR9lv-EHqArNSk7ZuN_YooteMhIj4twCqPXhqRGdkoNpbuQfy7hBtDugONdYHXl9vkcEryHWAtX6PzW_paboSR2AIZcrcsGVrk7A',
    imageAlt: 'Branch blocking road lane',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-6',
        author: 'Elena Vance',
        role: 'Ward Officer 04',
        time: '1 hour ago',
        text: 'Priority raised to Level-2 due to high commuter bike density.'
      }
    ],
    priority: 'High',
    citizenToken: 'CT-91204-K'
  }
];

export const CIVIC_ALERTS: CivicAlert[] = [
  {
    id: 'alt-1',
    title: 'Ward 4 Water Maintenance',
    time: 'Tomorrow 08:00',
    description: 'Scheduled valve upgrade on 9th Ave line. Possible low water pressure between 8:00 AM - 12:00 PM.',
    icon: 'water_damage',
    badgeStyle: 'water'
  },
  {
    id: 'alt-2',
    title: 'Street Sweeper Dispatched',
    time: '15 min ago',
    description: 'Autonomous cleaner deployed in North Sector residential zone. No parking restrictions needed.',
    icon: 'cleaning_services',
    badgeStyle: 'cleaning'
  },
  {
    id: 'alt-3',
    title: 'Canopy Pruning Initiative',
    time: 'Yesterday',
    description: 'Urban Forestry unit trimmed 42 storm-damaged branches across Maple Avenue corridor.',
    icon: 'nature_people',
    badgeStyle: 'forestry'
  }
];

export const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    id: 'hot-1',
    title: 'Gas / Water Main Break',
    subtitle: '24/7 Rapid Containment',
    number: '311-990',
    icon: 'emergency',
    isUrgent: true
  },
  {
    id: 'hot-2',
    title: 'Downed Power Wire',
    subtitle: 'Municipal Grid Dispatch',
    number: '311-881',
    icon: 'electric_bolt',
    isUrgent: false
  },
  {
    id: 'hot-3',
    title: 'Signal Malfunction',
    subtitle: 'Metro Transit Control',
    number: '311-404',
    icon: 'traffic',
    isUrgent: false
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How are SLAs calculated?',
    answer: 'SLAs are dynamically weighted based on risk severity (e.g. hazardous electrical lines get a 4-hour target, while sidewalk repairs have a 48-hour window).'
  },
  {
    id: 'faq-2',
    question: 'Can I appeal a resolved status?',
    answer: 'Yes. Within 72 hours of an officer closing a ticket, you can click "Contest Resolution" and submit new photo evidence for a supervisor audit.'
  },
  {
    id: 'faq-3',
    question: 'Is my voter / citizen data private?',
    answer: 'Reports are cryptographically pseudonymized with your citizen token. Only assigned officers see location coordinates relevant to the incident.'
  }
];

export const INITIAL_ALERTS = CIVIC_ALERTS;
export const FAQ_ITEMS = FAQS;
