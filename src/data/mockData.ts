import { CivicComplaint, CivicAlert, EmergencyHotline, FAQItem } from '../types';

export const INITIAL_COMPLAINTS: CivicComplaint[] = [
  {
    id: '#ICMRS-2026-001245',
    title: 'Sub-Surface Asphalt Pothole on CP Outer Circle & Barakhamba Rd',
    description: 'Severe asphalt crater forming near Metro Gate 3 & Barakhamba Road junction. Heavy traffic swerving into opposing lanes during evening peak rush, posing hazard to two-wheelers.',
    category: 'Roads & Bridges',
    location: 'Outer Circle, Connaught Place, Block C (New Delhi 110001)',
    coordinates: { lat: 28.6315, lng: 77.2167 },
    status: 'In Progress',
    pipelineStep: 3,
    pipelineStepName: 'Step 3 of 5: Asphalt Crew Deployed',
    pipelinePercent: 60,
    assignedCrew: 'NDMC Rapid Road Patch Unit (Central Zone)',
    timeLogged: 'Logged 4 hrs ago',
    slaRemaining: '18h 42m SLA remaining',
    totalSlaHours: 24,
    slaStatus: 'urgent',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKUAmlJjfN4RPAZeqjdSap1DcOB1SYBxe9IkhPw69OcoRfzN6QW9RK5jlq0V3osMWttxlXtj53GJfTbQbMI2vEXOSab5pM0XkL7HHqx-jkf0jcmFZmz1f5yERzYI6vkssUgfhDTo1-7KYKHVDNp4gR9lv-EHqArNSk7ZuN_YooteMhIj4twCqPXhqRGdkoNpbuQfy7hBtDugONdYHXl9vkcEryHWAtX6PzW_paboSR2AIZcrcsGVrk7A',
    imageAlt: 'Close-up documentary civic photo of a hazardous deep asphalt pothole on an urban road lane with orange hazard spray paint markers in clear morning daylight.',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-1',
        author: 'Elena Vance',
        role: 'Chief Field Auditor (Central Delhi)',
        time: '3 hours ago',
        text: 'Initial inspection confirmed severe asphalt shear near Barakhamba crossing. Depth approx 12 cm. Asphalt mixer dispatched from Mandi House depot.'
      },
      {
        id: 'n-2',
        author: 'Crew Lead Verma',
        role: 'NDMC Patch Crew 09',
        time: '45 mins ago',
        text: 'Safety cones placed on northbound lane. Hot mix delivery en route (ETA 15 mins).'
      }
    ],
    priority: 'Critical',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-001198',
    title: 'Heritage Streetlight Luminaire Damage & Exposed Wiring',
    description: 'Decorative heritage lamppost fixture dangling in high winds near Town Hall walkway. Exposed electrical wiring near dense pedestrian bazaar and primary school walkway.',
    category: 'Electrical & Lighting',
    location: 'Chandni Chowk Main Marg, near Town Hall (Old Delhi 110006)',
    nodeCode: 'Node #NDMC-CC-402',
    coordinates: { lat: 28.6562, lng: 77.2410 },
    status: 'Assigned & Scheduled',
    pipelineStep: 2,
    pipelineStepName: 'Step 2 of 5: Work Order Issued',
    pipelinePercent: 40,
    assignedCrew: 'BSES Yamuna / North MCD Grid Team',
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
        role: 'Chief Field Auditor (Central Delhi)',
        time: '18 hours ago',
        text: 'Electrical isolation command sent to substation node #CC-12. Circuit de-energized to safeguard pedestrians.'
      }
    ],
    priority: 'High',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-000984',
    title: 'Monsoon Stormwater Underpass Drain Clearing',
    description: 'Severe silt and monsoon stormwater backflow cleared on Ring Road underpass near AIIMS & Hauz Khas. Flow velocity restored to 100% with suction pump units.',
    category: 'Water & Sanitation',
    location: 'Ring Road Underpass, near AIIMS & Hauz Khas (New Delhi 110016)',
    coordinates: { lat: 28.5672, lng: 77.2100 },
    status: 'Resolved',
    pipelineStep: 5,
    pipelineStepName: 'Step 5 of 5: Certified Sign-off',
    pipelinePercent: 100,
    assignedCrew: 'Delhi Jal Board Hydro-Jet Suction Unit 08',
    timeLogged: '3 days ago',
    slaRemaining: 'Certified Closed',
    totalSlaHours: 48,
    slaStatus: 'resolved',
    beforeImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdyTxPLgjVOtrbvSgH-z1pFks8qeq7JWBmOm1yswZgi-nVbeYZkrJdJwEM8EFq9T6ABjmQiA4bhxgm_Vh72Pt-xWE1MVc3XRQaMtbJd0WA2_HjsRQXTtR0Qm_KJe9zLFoWPYUTJIyDHM2EMbIwr3sNMM8DcVy-uX34mcdvYmKr7hwQM91TxEKPSrewhvQJ3ET8_PpaqEpNaI3_ZClUETKa-qQHRsxclVF4IePs71nMEbspIawGzL6vpA',
    beforeImageAlt: 'Before photograph showing severe storm drain clogged with fallen debris, wet silt and street trash causing gutter flooding.',
    afterImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2l8HaUVF9slNV9YxOmbqq1WjycFPXVErGy_cOc0QCGQTRJQsKGTtoIjrQ3EbbZ_293VRfFB0jDzrilVBQFy2m8gLtbeuD-imZ-bfwsLmZjdMPV6jb41KKUghwKP2j1Qow8xFhNXJ5JWJnw4pbdWF2Xn9JX4080XkmGAxy7u85Xf-udf8rFj2tvGwU7OqPN7YyM0Y6R9YYhnXFmrqsXdeSBkS-wrpMWM-PUyU8gSxE5zs9b5LofG3rIw',
    afterImageAlt: 'After photograph showing clean, clear steel street drain grate with spotless asphalt and free-flowing water outlet.',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-4',
        author: 'Insp. Sunita Rao',
        role: 'Chief Field Auditor (South Delhi)',
        time: '3 hours ago',
        text: 'Visual forensic audit passed. Gutter flow rate 100%. Site perimeter sanitised and clear of waterlogging.'
      }
    ],
    inspector: {
      name: 'Insp. Sunita Rao',
      title: 'Chief Field Auditor (South Delhi)',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAo1spD6uHFwwgatDTJluJOHotpybzw1nBkawW4CpVC6tlgHanXHxZvE0b9hld20gHblmdWB1BKG26TxYFl08U0B-ZXXEI1jdhNWju4uXF9hCFgd5N9KkNaLrVmbsK6jSUlD-791HHLMzt7oy1RI-Z_Jg1iOQ8Hblq4NHF2N2s9dbKjfkqQu2gyn0Km1a1bvL1fpxUYzB9D3cLbyVdzxcmXvTJctldXOlrLGGDuADl4FDBluoZE6eIUaQ'
    },
    resolvedTime: 'Resolved 3h ago',
    rating: 5,
    priority: 'High',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-000871',
    title: 'Pedestrian Zebra Crossing Sensor Recalibration',
    description: 'Smart pedestrian pushbutton and audible walk countdown signal at Janakpuri District Centre crossing repaired for commuter crosswalk safety near Metro interchange.',
    category: 'Public Safety & Transit',
    location: 'Najafgarh Road Crossing, Janakpuri District Centre (West Delhi 110058)',
    coordinates: { lat: 28.6219, lng: 77.0878 },
    status: 'Resolved',
    pipelineStep: 5,
    pipelineStepName: 'Step 5 of 5: Certified Sign-off',
    pipelinePercent: 100,
    assignedCrew: 'Delhi Traffic Police Telemetry Div & PWD Unit',
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
        author: 'Eng. T. Kapoor',
        role: 'Delhi Traffic Telemetry Wing',
        time: '2 days ago',
        text: 'Piezo touch switch replaced. 20-second pedestrian walk signal synchronized with Najafgarh Road traffic signal controllers.'
      }
    ],
    inspector: {
      name: 'Eng. T. Kapoor',
      title: 'Delhi Traffic Telemetry Wing',
      initials: 'TK'
    },
    resolvedTime: 'Resolved 2d ago',
    rating: 4.5,
    priority: 'Medium',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-001302',
    title: 'Downed Gulmohar Tree Limb Blocking Dedicated Cycle Track',
    description: 'Heavy Gulmohar branch fallen across two-way cycle lane and left-turn road near Dwarka Sector 10 Metro Station following nocturnal squall winds.',
    category: 'Parks & Forestry',
    location: 'Sector 10 Central Avenue, Dwarka (South West Delhi 110075)',
    coordinates: { lat: 28.5823, lng: 77.0500 },
    status: 'Dispatched',
    pipelineStep: 3,
    pipelineStepName: 'Step 3 of 5: Chipper Crew on Site',
    pipelinePercent: 60,
    assignedCrew: 'DDA & MCD Horticulture Rapid Team',
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
        role: 'Chief Field Auditor (Central Delhi)',
        time: '1 hour ago',
        text: 'Priority raised to Level-2 due to heavy cycle transit and proximity to Metro station gate.'
      }
    ],
    priority: 'High',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-001410',
    title: 'Open Manhole Chamber Hazard on Market Service Road',
    description: 'Heavy cast-iron sewer chamber cover dislodged on busy commercial market service lane. High risk for school vans and pedestrians.',
    category: 'Water & Sanitation',
    location: 'Ring Road Service Lane, Rohini Sector 9 (North West Delhi 110085)',
    coordinates: { lat: 28.7140, lng: 77.1230 },
    status: 'In Progress',
    pipelineStep: 3,
    pipelineStepName: 'Step 3 of 5: Chamber Barricading & Cover Fitting',
    pipelinePercent: 60,
    assignedCrew: 'MCD Rohini Zone Maintenance Wing',
    timeLogged: 'Logged 3 hrs ago',
    slaRemaining: '12h 15m SLA remaining',
    totalSlaHours: 24,
    slaStatus: 'urgent',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCKUAmlJjfN4RPAZeqjdSap1DcOB1SYBxe9IkhPw69OcoRfzN6QW9RK5jlq0V3osMWttxlXtj53GJfTbQbMI2vEXOSab5pM0XkL7HHqx-jkf0jcmFZmz1f5yERzYI6vkssUgfhDTo1-7KYKHVDNp4gR9lv-EHqArNSk7ZuN_YooteMhIj4twCqPXhqRGdkoNpbuQfy7hBtDugONdYHXl9vkcEryHWAtX6PzW_paboSR2AIZcrcsGVrk7A',
    imageAlt: 'Open manhole hazard on urban street',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-7',
        author: 'Insp. R. K. Meena',
        role: 'Rohini Zone Field Officer',
        time: '2 hours ago',
        text: 'Heavy-duty steel replacement cover transported from Rohini Central Depot. Hazard cones secured.'
      }
    ],
    priority: 'Critical',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-001455',
    title: 'High-Mast LED Streetlight Outage at Bus Interchange',
    description: 'LED cluster on 20-meter high mast extinguished at Mayur Vihar Pocket 1 bus stop and e-rickshaw stand, creating low visibility area after sunset.',
    category: 'Electrical & Lighting',
    location: 'Pocket 1 Bus Interchange, Mayur Vihar Phase 1 (East Delhi 110091)',
    coordinates: { lat: 28.6080, lng: 77.2980 },
    status: 'Assigned & Scheduled',
    pipelineStep: 2,
    pipelineStepName: 'Step 2 of 5: Work Order Issued',
    pipelinePercent: 40,
    assignedCrew: 'East Delhi MCD & BSES Streetlight Wing',
    timeLogged: 'Logged 6 hrs ago',
    slaRemaining: '28h 30m SLA nominal',
    totalSlaHours: 48,
    slaStatus: 'nominal',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGor6GIQRztnq1Fn78tsRToKFXcyUfB2pCehvBgbC2kfy02JB_bh2NghGkyRghoQj5IEktqAY81JDt6YBAmwkTlubTXGizz8H6Vi8rON_8DP5hd8B9P9ujYDsLNW5b_4wB6tmI6waZ5YIOkK1cmaNEjE4688acIWA1vStVXJ4OqshCrvbLsM3xRfbzUpsGGnJe94b7W2Xif13ILNOi08le2cwUqTgoVhbTj4M37AvPjCd6eyynr66LLg',
    imageAlt: 'Streetlight pole out of service',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-8',
        author: 'Er. S. Gupta',
        role: 'East Delhi Electrical Section',
        time: '4 hours ago',
        text: 'Hydraulic cherry picker ladder vehicle scheduled for 18:00 repair run before darkness.'
      }
    ],
    priority: 'High',
    citizenToken: 'Verified Resident'
  },
  {
    id: '#ICMRS-2026-000780',
    title: 'Secondary Waste Dhalao Spill & Sanitation Cleansing',
    description: 'Solid waste overflow outside secondary collection point cleared with compactor truck. Full chemical lime disinfection and deodorizing wash executed.',
    category: 'Waste Management',
    location: 'Feroze Gandhi Marg, Lajpat Nagar III (South East Delhi 110024)',
    coordinates: { lat: 28.5700, lng: 77.2400 },
    status: 'Resolved',
    pipelineStep: 5,
    pipelineStepName: 'Step 5 of 5: Certified Sign-off',
    pipelinePercent: 100,
    assignedCrew: 'MCD Solid Waste Green Cleansing Fleet',
    timeLogged: 'Resolved yesterday',
    slaRemaining: 'Certified Closed',
    totalSlaHours: 24,
    slaStatus: 'resolved',
    beforeImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDdyTxPLgjVOtrbvSgH-z1pFks8qeq7JWBmOm1yswZgi-nVbeYZkrJdJwEM8EFq9T6ABjmQiA4bhxgm_Vh72Pt-xWE1MVc3XRQaMtbJd0WA2_HjsRQXTtR0Qm_KJe9zLFoWPYUTJIyDHM2EMbIwr3sNMM8DcVy-uX34mcdvYmKr7hwQM91TxEKPSrewhvQJ3ET8_PpaqEpNaI3_ZClUETKa-qQHRsxclVF4IePs71nMEbspIawGzL6vpA',
    beforeImageAlt: 'Before photograph showing waste clutter',
    afterImageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2l8HaUVF9slNV9YxOmbqq1WjycFPXVErGy_cOc0QCGQTRJQsKGTtoIjrQ3EbbZ_293VRfFB0jDzrilVBQFy2m8gLtbeuD-imZ-bfwsLmZjdMPV6jb41KKUghwKP2j1Qow8xFhNXJ5JWJnw4pbdWF2Xn9JX4080XkmGAxy7u85Xf-udf8rFj2tvGwU7OqPN7YyM0Y6R9YYhnXFmrqsXdeSBkS-wrpMWM-PUyU8gSxE5zs9b5LofG3rIw',
    afterImageAlt: 'After photograph showing sanitized clean road pavement',
    gpsTagged: true,
    officerNotes: [
      {
        id: 'n-9',
        author: 'Insp. Sunita Rao',
        role: 'Chief Field Auditor (South Delhi)',
        time: 'Yesterday',
        text: 'Compactor clearance certified. Anti-microbial lime applied across pavement.'
      }
    ],
    inspector: {
      name: 'Insp. Sunita Rao',
      title: 'Chief Field Auditor (South Delhi)',
      initials: 'SR'
    },
    resolvedTime: 'Resolved yesterday',
    rating: 5,
    priority: 'Medium',
    citizenToken: 'Verified Resident'
  }
];

export const CIVIC_ALERTS: CivicAlert[] = [
  {
    id: 'alt-1',
    title: 'South Delhi Water Supply Maintenance',
    time: 'Tomorrow 08:00',
    description: 'Delhi Jal Board scheduled valve upgrade on Sonia Vihar line. Possible low water pressure in Hauz Khas, Saket and Lajpat Nagar between 8:00 AM - 1:00 PM.',
    icon: 'water_damage',
    badgeStyle: 'water'
  },
  {
    id: 'alt-2',
    title: 'Anti-Smog Electric Sweeper Fleet Deployed',
    time: '20 min ago',
    description: 'MCD mechanical mist sweeper active along Ring Road & ITO corridor. Traffic flow smooth and particulate dust suppression active.',
    icon: 'cleaning_services',
    badgeStyle: 'cleaning'
  },
  {
    id: 'alt-3',
    title: 'Ridge Forest Canopy Pruning Initiative',
    time: 'Yesterday',
    description: 'MCD & Forest department trimmed 38 storm-vulnerable branches across Northern Ridge and Vandemataram Marg.',
    icon: 'nature_people',
    badgeStyle: 'forestry'
  }
];

export const EMERGENCY_HOTLINES: EmergencyHotline[] = [
  {
    id: 'hot-1',
    title: 'Delhi Jal Board (DJB Emergency)',
    subtitle: 'Water Leak & Sewer Overflow 24/7',
    number: '1916',
    icon: 'emergency',
    isUrgent: true
  },
  {
    id: 'hot-2',
    title: 'Delhi Power (BSES / Tata Power)',
    subtitle: 'Wire Snaps & Power Outage Helpline',
    number: '19124',
    icon: 'electric_bolt',
    isUrgent: false
  },
  {
    id: 'hot-3',
    title: 'Delhi MCD Civic Helpline (311)',
    subtitle: 'Potholes, Sanitation & Encroachments',
    number: '155305',
    icon: 'traffic',
    isUrgent: false
  }
];

export const FAQS: FAQItem[] = [
  {
    id: 'faq-1',
    question: 'How are SLAs calculated across Delhi wards?',
    answer: 'SLAs are dynamically weighted based on hazard risk: critical live electrical wires or deep arterial road potholes receive a 4-24 hour target, while neighborhood signage or sidewalk touchups follow 48-72 hour timelines.'
  },
  {
    id: 'faq-2',
    question: 'Can I appeal or dispute a closed resolution?',
    answer: 'Yes. Within 72 hours of an officer closing a ticket, citizens can click "Contest Resolution" and submit new photo evidence for a supervisor audit by the Zonal Chief Engineer.'
  },
  {
    id: 'faq-3',
    question: 'Is my citizen phone or identity kept confidential?',
    answer: 'Yes. Your reports are linked securely to your account while personal details remain private. Municipal dispatch crews only receive incident geolocation coordinates and defect photos necessary to complete field repairs.'
  }
];

export const INITIAL_ALERTS = CIVIC_ALERTS;
export const FAQ_ITEMS = FAQS;
