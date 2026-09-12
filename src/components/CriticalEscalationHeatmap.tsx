/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Ensure L is available on window for leaflet.heat
if (typeof window !== 'undefined') {
  (window as any).L = L;
}
import 'leaflet.heat';

import { CivicComplaint } from '../types';
import { 
  Flame, 
  Clock, 
  AlertTriangle, 
  ShieldAlert, 
  Layers, 
  TrendingUp, 
  MapPin, 
  Filter, 
  Info, 
  Activity, 
  ChevronRight, 
  CheckCircle2, 
  Timer, 
  Compass, 
  Maximize2,
  RefreshCw,
  Eye,
  EyeOff,
  Sliders,
  Sparkles,
  Zap,
  BarChart2
} from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

export interface CriticalEscalationPoint {
  id: string;
  title: string;
  category: string;
  location: string;
  sector: string;
  wardCode: string;
  coordinates: { lat: number; lng: number };
  responseTimeMinutes: number; // Actual emergency arrival/response time in minutes
  targetResponseMinutes: number; // SLA benchmark (e.g., 25 or 30 mins)
  slaStatus: 'on_target' | 'moderate_lag' | 'severe_bottleneck';
  escalationTrigger: string;
  timeOfDay: 'Morning (06:00-12:00)' | 'Midday (12:00-17:00)' | 'Evening Rush (17:00-22:00)' | 'Night (22:00-06:00)';
  timeLogged: string;
  assignedCrew: string;
  status: 'In Progress' | 'Dispatched' | 'Remediated' | 'Resolved';
  bottleneckCause?: string;
  incidentDate: string;
}

interface CriticalEscalationHeatmapProps {
  complaints?: CivicComplaint[];
  onSelectComplaint?: (complaint: CivicComplaint) => void;
}

// Baseline historical critical escalation dataset across municipal NCT sectors
const BASELINE_CRITICAL_ESCALATIONS: CriticalEscalationPoint[] = [
  {
    id: '#ICMRS-2026-001042',
    title: 'Severe Arterial Road Cavity & Under-Bridge Subsidence',
    category: 'Road Hazards & Pavements',
    location: 'Connaught Place Radial Road 3, Inner Circle',
    sector: 'Central Delhi',
    wardCode: 'Ward 04',
    coordinates: { lat: 28.6315, lng: 77.2167 },
    responseTimeMinutes: 18,
    targetResponseMinutes: 25,
    slaStatus: 'on_target',
    escalationTrigger: 'Structural Collapse Risk near metro concourse',
    timeOfDay: 'Evening Rush (17:00-22:00)',
    timeLogged: 'Today, 18:14',
    assignedCrew: 'NDMC Quick Response Asphalt Unit #04',
    status: 'In Progress',
    bottleneckCause: 'None - Fast corridor access via radial ring',
    incidentDate: '2026-09-12'
  },
  {
    id: '#ICMRS-2026-001198',
    title: 'Heritage Streetlight Luminaire Damage & High-Voltage Sparking',
    category: 'Electrical & Lighting',
    location: 'Chandni Chowk Main Marg, near Town Hall',
    sector: 'North MCD',
    wardCode: 'Ward 08',
    coordinates: { lat: 28.6562, lng: 77.2410 },
    responseTimeMinutes: 46,
    targetResponseMinutes: 25,
    slaStatus: 'severe_bottleneck',
    escalationTrigger: 'Exposed high-voltage wire hanging near primary school',
    timeOfDay: 'Midday (12:00-17:00)',
    timeLogged: 'Yesterday, 14:20',
    assignedCrew: 'North Delhi Power Rapid Isolation Unit',
    status: 'Remediated',
    bottleneckCause: 'Pedestrian market congestion & non-motorized vehicle gridlock',
    incidentDate: '2026-09-11'
  },
  {
    id: '#ICMRS-2026-000984',
    title: 'High-Pressure 300mm Water Main Burst & Basement Inundation',
    category: 'Water & Sewage Infrastructure',
    location: 'South Extension Part II, Block C Main Gate',
    sector: 'South Delhi',
    wardCode: 'Ward 02',
    coordinates: { lat: 28.5685, lng: 77.2215 },
    responseTimeMinutes: 22,
    targetResponseMinutes: 30,
    slaStatus: 'on_target',
    escalationTrigger: 'Substation ground floor flooding hazard',
    timeOfDay: 'Morning (06:00-12:00)',
    timeLogged: 'Sep 10, 08:35',
    assignedCrew: 'DJB South Hydraulic Emergency Response',
    status: 'Resolved',
    bottleneckCause: 'None - Ring road detour executed cleanly',
    incidentDate: '2026-09-10'
  },
  {
    id: '#ICMRS-2026-000871',
    title: 'Commercial Kitchen Waste Overflow & Toxic Fume Buildup',
    category: 'Sanitation & Solid Waste',
    location: 'Karol Bagh Market Square, Ajmal Khan Road',
    sector: 'Central Delhi',
    wardCode: 'Ward 05',
    coordinates: { lat: 28.6515, lng: 77.1906 },
    responseTimeMinutes: 38,
    targetResponseMinutes: 30,
    slaStatus: 'moderate_lag',
    escalationTrigger: 'Methane sensor threshold warning in storm sewer',
    timeOfDay: 'Evening Rush (17:00-22:00)',
    timeLogged: 'Sep 09, 19:10',
    assignedCrew: 'MCD Heavy De-silting Rapid Triage Unit',
    status: 'Resolved',
    bottleneckCause: 'Evening bazaar shopper influx and double parking',
    incidentDate: '2026-09-09'
  },
  {
    id: '#ICMRS-2026-000762',
    title: 'Flyover Structural Joint Displacement & Concrete Spalling',
    category: 'Road Hazards & Pavements',
    location: 'Lajpat Nagar Flyover Ring Road South Bound',
    sector: 'South Delhi',
    wardCode: 'Ward 03',
    coordinates: { lat: 28.5701, lng: 77.2435 },
    responseTimeMinutes: 16,
    targetResponseMinutes: 20,
    slaStatus: 'on_target',
    escalationTrigger: 'Expansion joint plate lifting during peak traffic',
    timeOfDay: 'Midday (12:00-17:00)',
    timeLogged: 'Sep 08, 13:45',
    assignedCrew: 'PWD Flyover Structural Emergency Gang #12',
    status: 'Resolved',
    bottleneckCause: 'Clear highway right-of-way',
    incidentDate: '2026-09-08'
  },
  {
    id: '#ICMRS-2026-000654',
    title: 'Underground Gas Feeder Odorant Spike & Roadway Settlement',
    category: 'Civic Infrastructure',
    location: 'Rohini Sector 9 Outer Ring Connector',
    sector: 'North-West Delhi',
    wardCode: 'Ward 07',
    coordinates: { lat: 28.7125, lng: 77.1180 },
    responseTimeMinutes: 24,
    targetResponseMinutes: 25,
    slaStatus: 'on_target',
    escalationTrigger: 'Gas line proximity to high-capacity storm drain',
    timeOfDay: 'Morning (06:00-12:00)',
    timeLogged: 'Sep 07, 10:15',
    assignedCrew: 'IGL Hazardous Gas Containment Squad',
    status: 'Resolved',
    bottleneckCause: 'Traffic light sequencing synchronization delay',
    incidentDate: '2026-09-07'
  },
  {
    id: '#ICMRS-2026-000543',
    title: 'Storm Sewer Siphon Backflow & Submerged Electrical Box',
    category: 'Water & Sewage Infrastructure',
    location: 'Anand Vihar ISBT Approach, Vikas Marg Extension',
    sector: 'Trans-Yamuna East',
    wardCode: 'Ward 11',
    coordinates: { lat: 28.6475, lng: 77.3150 },
    responseTimeMinutes: 44,
    targetResponseMinutes: 25,
    slaStatus: 'severe_bottleneck',
    escalationTrigger: 'Inter-state bus terminal approach submerged with live wires',
    timeOfDay: 'Evening Rush (17:00-22:00)',
    timeLogged: 'Sep 06, 18:40',
    assignedCrew: 'East Delhi Flood Response & Drain Gang #02',
    status: 'Resolved',
    bottleneckCause: 'Monsoon evening bus bottleneck & rail overbridge bottle-neck',
    incidentDate: '2026-09-06'
  },
  {
    id: '#ICMRS-2026-000431',
    title: 'Centenary Banyan Tree Overhang Fracture onto Overhead Cables',
    category: 'Urban Forestry & Greenery',
    location: 'Civil Lines Rajpur Road near Metro Station Gate 2',
    sector: 'North MCD',
    wardCode: 'Ward 01',
    coordinates: { lat: 28.6810, lng: 77.2255 },
    responseTimeMinutes: 19,
    targetResponseMinutes: 30,
    slaStatus: 'on_target',
    escalationTrigger: 'Massive trunk split leaning over 11kV distribution grid',
    timeOfDay: 'Night (22:00-06:00)',
    timeLogged: 'Sep 05, 23:15',
    assignedCrew: 'Horticulture Rapid Hydraulic Crane Crew',
    status: 'Resolved',
    bottleneckCause: 'None - Wide residential boulevard with zero nighttime traffic',
    incidentDate: '2026-09-05'
  },
  {
    id: '#ICMRS-2026-000320',
    title: 'Industrial Chemical Effluent Leakage into Public Stormwater Drain',
    category: 'Sanitation & Solid Waste',
    location: 'Okhla Industrial Area Phase III, Road 14',
    sector: 'South Delhi',
    wardCode: 'Ward 14',
    coordinates: { lat: 28.5355, lng: 77.2720 },
    responseTimeMinutes: 29,
    targetResponseMinutes: 25,
    slaStatus: 'moderate_lag',
    escalationTrigger: 'Corrosive vapor detection near passenger transit stop',
    timeOfDay: 'Midday (12:00-17:00)',
    timeLogged: 'Sep 04, 15:30',
    assignedCrew: 'Delhi Fire Service Hazmat Quick Response Unit',
    status: 'Resolved',
    bottleneckCause: 'Heavy cargo container trucks maneuvering in narrow lanes',
    incidentDate: '2026-09-04'
  },
  {
    id: '#ICMRS-2026-000219',
    title: 'Heritage Masonry Wall Collapse onto Active Traffic Lane',
    category: 'Road Hazards & Pavements',
    location: 'Daryaganj Netaji Subhash Marg near Golcha',
    sector: 'Central Delhi',
    wardCode: 'Ward 06',
    coordinates: { lat: 28.6435, lng: 77.2420 },
    responseTimeMinutes: 41,
    targetResponseMinutes: 25,
    slaStatus: 'severe_bottleneck',
    escalationTrigger: 'Rubble blocking both south-bound ambulance corridor lanes',
    timeOfDay: 'Evening Rush (17:00-22:00)',
    timeLogged: 'Sep 03, 17:50',
    assignedCrew: 'NDMC Disaster Relief Excavator Gang #05',
    status: 'Resolved',
    bottleneckCause: 'Peak evening traffic choke point near Delhi Gate',
    incidentDate: '2026-09-03'
  },
  {
    id: '#ICMRS-2026-000108',
    title: 'Sinkhole Opening on Primary Arterial Bus Corridor',
    category: 'Road Hazards & Pavements',
    location: 'Dwarka Sector 10 Metro Pillar 142 Crossing',
    sector: 'West Delhi',
    wardCode: 'Ward 19',
    coordinates: { lat: 28.5815, lng: 77.0585 },
    responseTimeMinutes: 15,
    targetResponseMinutes: 25,
    slaStatus: 'on_target',
    escalationTrigger: '3-meter deep cave-in underneath active bus lane',
    timeOfDay: 'Morning (06:00-12:00)',
    timeLogged: 'Sep 02, 07:40',
    assignedCrew: 'DDA / PWD Rapid Shoring & Barricade Squad',
    status: 'Resolved',
    bottleneckCause: 'None - Broad 60m sector arterial road',
    incidentDate: '2026-09-02'
  }
];

// Generate custom SVG emergency pin with response time badge
function createCriticalMarkerIcon(point: CriticalEscalationPoint, isSelected: boolean) {
  const isBottleneck = point.responseTimeMinutes > 35;
  const isModerate = point.responseTimeMinutes > 25 && point.responseTimeMinutes <= 35;
  
  const badgeColor = isBottleneck ? '#e11d48' : isModerate ? '#d97706' : '#059669';
  const badgeBg = isBottleneck ? '#ffe4e6' : isModerate ? '#fef3c7' : '#d1fae5';
  const glow = isSelected ? '0 0 0 4px rgba(225, 29, 72, 0.4)' : '0 4px 12px rgba(0,0,0,0.18)';
  const transform = isSelected ? 'scale(1.15)' : 'scale(1.0)';

  return L.divIcon({
    className: 'critical-escalation-marker',
    html: `
      <div style="position:relative; display:flex; flex-direction:column; align-items:center; cursor:pointer; transform:${transform}; transition:transform 0.2s ease;">
        <!-- Pulsing beacon for active critical incident -->
        ${point.status !== 'Resolved' ? `
          <span style="position:absolute; top:-2px; width:42px; height:42px; border-radius:50%; background-color:#e11d48; opacity:0.35; animation:ping 1.6s cubic-bezier(0,0,0.2,1) infinite;"></span>
        ` : ''}

        <!-- Primary Emergency Badge -->
        <div style="
          position:relative;
          background:${badgeColor};
          color:#ffffff;
          border-radius:12px;
          padding:3px 7px;
          font-family:ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
          font-weight:900;
          font-size:11px;
          display:flex;
          align-items:center;
          gap:4px;
          border:2px solid #ffffff;
          box-shadow:${glow};
          white-space:nowrap;
        ">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
          </svg>
          <span>${point.responseTimeMinutes}m</span>
        </div>

        <!-- Pointer Arrow -->
        <div style="
          width:0; 
          height:0; 
          border-left:5px solid transparent;
          border-right:5px solid transparent;
          border-top:6px solid ${badgeColor};
          margin-top:-1px;
        "></div>
      </div>
    `,
    iconSize: [44, 40],
    iconAnchor: [22, 38],
    popupAnchor: [0, -38],
  });
}

export const CriticalEscalationHeatmap: React.FC<CriticalEscalationHeatmapProps> = ({
  complaints = [],
  onSelectComplaint
}) => {
  // Active view: Interactive Map Heatmap vs Time-of-Day Pattern Grid vs Bottleneck Diagnostics
  const [activeTab, setActiveTab] = useState<'map' | 'patternMatrix' | 'diagnostics'>('map');

  // Heat map overlay visualization controls
  const [heatOverlayVisible, setHeatOverlayVisible] = useState<boolean>(true);
  const [markersVisible, setMarkersVisible] = useState<boolean>(true);
  const [metricMode, setMetricMode] = useState<'responseTime' | 'frequency' | 'slaRisk'>('responseTime');
  const [heatRadius, setHeatRadius] = useState<number>(36);
  const [heatBlur, setHeatBlur] = useState<number>(24);
  const [heatOpacity, setHeatOpacity] = useState<number>(0.45);
  const [showControls, setShowControls] = useState<boolean>(false);

  // Filters
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedTimeShift, setSelectedTimeShift] = useState<string>('all');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('all');

  // Selected incident for detail telemetry inspection
  const [selectedIncident, setSelectedIncident] = useState<CriticalEscalationPoint | null>(
    BASELINE_CRITICAL_ESCALATIONS[0]
  );

  // Combine live critical complaints with historical baseline
  const allCriticalEscalations: CriticalEscalationPoint[] = useMemo(() => {
    // Extract critical incidents from live props if any
    const livePoints: CriticalEscalationPoint[] = (complaints || [])
      .filter(c => c.priority === 'Critical' || c.slaStatus === 'urgent')
      .map(c => {
        const lat = c.latitude ?? c.coordinates?.lat ?? 28.6139;
        const lng = c.longitude ?? c.coordinates?.lng ?? 77.2090;
        
        // Derive realistic response time from location or existing notes
        let responseMins = 20;
        if (c.location.toLowerCase().includes('chandni') || c.location.toLowerCase().includes('old delhi')) {
          responseMins = 44;
        } else if (c.location.toLowerCase().includes('connaught') || c.location.toLowerCase().includes('central')) {
          responseMins = 18;
        } else if (c.location.toLowerCase().includes('south')) {
          responseMins = 22;
        } else if (c.slaStatus === 'urgent') {
          responseMins = 40;
        }

        const targetMins = 25;
        const slaStatus: 'on_target' | 'moderate_lag' | 'severe_bottleneck' = 
          responseMins <= targetMins ? 'on_target' :
          responseMins <= 35 ? 'moderate_lag' : 'severe_bottleneck';

        return {
          id: c.id,
          title: c.title,
          category: c.category,
          location: c.location,
          sector: c.location.includes('Central') ? 'Central Delhi' :
                  c.location.includes('North') ? 'North MCD' :
                  c.location.includes('South') ? 'South Delhi' : 'Central Delhi',
          wardCode: c.nodeCode ? `Ward ${c.nodeCode.slice(-2)}` : 'Ward 04',
          coordinates: { lat, lng },
          responseTimeMinutes: responseMins,
          targetResponseMinutes: targetMins,
          slaStatus,
          escalationTrigger: 'Priority Escalation: Hazardous Infrastructure Condition',
          timeOfDay: 'Evening Rush (17:00-22:00)',
          timeLogged: c.timeLogged || 'Recently',
          assignedCrew: c.assignedCrew || 'Municipal Emergency Response Group',
          status: c.status === 'Resolved' ? 'Resolved' : 'In Progress',
          bottleneckCause: responseMins > 30 ? 'High density traffic & arterial choke points' : 'Rapid transit corridor',
          incidentDate: '2026-09-12'
        };
      });

    // Merge without duplicates by ID
    const liveIds = new Set(livePoints.map(p => p.id));
    const dedupedHistorical = BASELINE_CRITICAL_ESCALATIONS.filter(b => !liveIds.has(b.id));

    return [...livePoints, ...dedupedHistorical];
  }, [complaints]);

  // Filtered critical incidents based on UI controls
  const filteredPoints = useMemo(() => {
    return allCriticalEscalations.filter(pt => {
      if (selectedSector !== 'all' && pt.sector !== selectedSector) return false;
      if (selectedTimeShift !== 'all' && !pt.timeOfDay.includes(selectedTimeShift)) return false;
      if (selectedStatusFilter === 'active' && pt.status === 'Resolved') return false;
      if (selectedStatusFilter === 'resolved' && pt.status !== 'Resolved') return false;
      return true;
    });
  }, [allCriticalEscalations, selectedSector, selectedTimeShift, selectedStatusFilter]);

  // Aggregate metrics across critical escalations
  const metrics = useMemo(() => {
    if (allCriticalEscalations.length === 0) {
      return {
        totalCritical: 0,
        avgResponseMinutes: 0,
        withinTargetPct: 0,
        slowestSector: 'N/A',
        slowestSectorTime: 0,
        fastestSector: 'N/A',
        fastestSectorTime: 0,
        peakShift: 'Evening Rush',
        bottleneckCount: 0
      };
    }

    const total = allCriticalEscalations.length;
    const sumResponse = allCriticalEscalations.reduce((acc, p) => acc + p.responseTimeMinutes, 0);
    const avgResponse = Math.round((sumResponse / total) * 10) / 10;
    const withinTarget = allCriticalEscalations.filter(p => p.responseTimeMinutes <= p.targetResponseMinutes).length;
    const withinTargetPct = Math.round((withinTarget / total) * 100);
    const bottlenecks = allCriticalEscalations.filter(p => p.responseTimeMinutes > 35).length;

    // Sector averages
    const sectorTotals: Record<string, { sum: number; count: number }> = {};
    allCriticalEscalations.forEach(p => {
      if (!sectorTotals[p.sector]) sectorTotals[p.sector] = { sum: 0, count: 0 };
      sectorTotals[p.sector].sum += p.responseTimeMinutes;
      sectorTotals[p.sector].count += 1;
    });

    let slowestSector = '';
    let slowestTime = 0;
    let fastestSector = '';
    let fastestTime = 999;

    Object.entries(sectorTotals).forEach(([sector, data]) => {
      const avg = data.sum / data.count;
      if (avg > slowestTime) {
        slowestTime = Math.round(avg * 10) / 10;
        slowestSector = sector;
      }
      if (avg < fastestTime) {
        fastestTime = Math.round(avg * 10) / 10;
        fastestSector = sector;
      }
    });

    return {
      totalCritical: total,
      avgResponseMinutes: avgResponse,
      withinTargetPct,
      slowestSector,
      slowestSectorTime: slowestTime,
      fastestSector,
      fastestSectorTime: fastestTime,
      peakShift: 'Evening Rush (17:00-22:00)',
      bottleneckCount: bottlenecks
    };
  }, [allCriticalEscalations]);

  // Time-of-day x Sector Heat Matrix data
  const matrixSectors = ['Central Delhi', 'North MCD', 'South Delhi', 'Trans-Yamuna East', 'West Delhi'];
  const matrixTimeBlocks = [
    { key: 'Morning', label: 'Morning (06:00-12:00)', shortLabel: '06h–12h' },
    { key: 'Midday', label: 'Midday (12:00-17:00)', shortLabel: '12h–17h' },
    { key: 'Evening Rush', label: 'Evening Rush (17:00-22:00)', shortLabel: '17h–22h (Peak)' },
    { key: 'Night', label: 'Night (22:00-06:00)', shortLabel: '22h–06h' },
  ];

  // Calculate cell stats for matrix: returns { avgMins, count, isBottleneck }
  const getMatrixCellData = (sector: string, shiftKey: string) => {
    const matches = allCriticalEscalations.filter(
      p => p.sector === sector && p.timeOfDay.includes(shiftKey)
    );
    if (matches.length === 0) {
      // Representative baseline model for realistic complete heatmap inspection
      const defaultAverages: Record<string, Record<string, number>> = {
        'Central Delhi': { 'Morning': 17, 'Midday': 24, 'Evening Rush': 36, 'Night': 14 },
        'North MCD': { 'Morning': 28, 'Midday': 34, 'Evening Rush': 48, 'Night': 21 },
        'South Delhi': { 'Morning': 19, 'Midday': 21, 'Evening Rush': 29, 'Night': 16 },
        'Trans-Yamuna East': { 'Morning': 31, 'Midday': 33, 'Evening Rush': 45, 'Night': 24 },
        'West Delhi': { 'Morning': 16, 'Midday': 22, 'Evening Rush': 32, 'Night': 15 },
      };
      const def = defaultAverages[sector]?.[shiftKey] || 25;
      return { avgMins: def, count: 1, isSynthesized: true };
    }
    const sum = matches.reduce((acc, m) => acc + m.responseTimeMinutes, 0);
    return {
      avgMins: Math.round(sum / matches.length),
      count: matches.length,
      isSynthesized: false
    };
  };

  // Helper for matrix cell background color scale
  const getCellColorClass = (mins: number) => {
    if (mins <= 20) return 'bg-emerald-50 text-emerald-800 border-emerald-200/80 hover:bg-emerald-100';
    if (mins <= 30) return 'bg-amber-50 text-amber-800 border-amber-200/80 hover:bg-amber-100';
    if (mins <= 40) return 'bg-orange-50 text-orange-800 border-orange-200/80 hover:bg-orange-100';
    return 'bg-rose-100 text-rose-900 border-rose-300 hover:bg-rose-200 font-extrabold';
  };

  // Direct Leaflet Map instance management (avoids react-leaflet context & React 19 hook dispatcher issues)
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<any>(null);
  const markersGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize map when activeTab === 'map'
  useEffect(() => {
    if (activeTab !== 'map') return;

    // Small timeout to allow DOM container to attach
    const timer = setTimeout(() => {
      if (!mapContainerRef.current) return;

      if (!mapInstanceRef.current) {
        const map = L.map(mapContainerRef.current, {
          center: [28.6250, 77.2150],
          zoom: 11.5,
          scrollWheelZoom: false,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
          maxZoom: 19
        }).addTo(map);

        const markersGroup = L.layerGroup().addTo(map);
        markersGroupRef.current = markersGroup;
        mapInstanceRef.current = map;
      }

      mapInstanceRef.current.invalidateSize();
    }, 120);

    return () => clearTimeout(timer);
  }, [activeTab]);

  // Clean up Leaflet map instance on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch {
          // ignore
        }
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Synchronize heat layer & emergency markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || activeTab !== 'map') return;

    // 1. Synchronize Heat Overlay
    if (heatLayerRef.current) {
      try {
        map.removeLayer(heatLayerRef.current);
      } catch {
        // ignore
      }
      heatLayerRef.current = null;
    }

    if (heatOverlayVisible && filteredPoints.length > 0 && typeof (L as any).heatLayer === 'function') {
      const heatData: [number, number, number][] = filteredPoints.map(pt => {
        let intensity = 0.5;
        if (metricMode === 'responseTime') {
          intensity = Math.min(Math.max((pt.responseTimeMinutes - 10) / 40, 0.2), 1.0);
        } else if (metricMode === 'slaRisk') {
          intensity = Math.min(Math.max(pt.responseTimeMinutes / pt.targetResponseMinutes, 0.25), 1.0);
        } else {
          intensity = 0.85;
        }
        return [pt.coordinates.lat, pt.coordinates.lng, intensity];
      });

      const gradient = metricMode === 'responseTime' ? {
        0.2: '#06b6d4',
        0.4: '#10b981',
        0.6: '#f59e0b',
        0.8: '#f97316',
        1.0: '#e11d48'
      } : {
        0.2: '#3b82f6',
        0.4: '#10b981',
        0.6: '#eab308',
        0.8: '#f97316',
        1.0: '#dc2626'
      };

      try {
        const heatLayer = (L as any).heatLayer(heatData, {
          radius: heatRadius,
          blur: heatBlur,
          maxZoom: 16,
          minOpacity: heatOpacity,
          gradient
        });
        heatLayer.addTo(map);
        heatLayerRef.current = heatLayer;
      } catch (err) {
        console.warn('[CriticalEscalationHeatmap] heatLayer error:', err);
      }
    }

    // 2. Synchronize Markers
    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();

      if (markersVisible) {
        filteredPoints.forEach(point => {
          const isSelected = selectedIncident?.id === point.id;
          const icon = createCriticalMarkerIcon(point, isSelected);
          const marker = L.marker([point.coordinates.lat, point.coordinates.lng], { icon });

          const popupContent = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; min-width: 250px; color: #111827;">
              <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
                <span style="font-family: monospace; font-size: 11px; font-weight: 900; color: #be123c; background: #fff1f2; border: 1px solid #fecdd3; padding: 2px 6px; border-radius: 6px;">
                  ${point.id}
                </span>
                <span style="font-size: 10px; padding: 2px 8px; border-radius: 9999px; font-weight: 700; text-transform: uppercase; ${
                  point.status === 'Resolved' ? 'background: #d1fae5; color: #065f46;' : 'background: #ffe4e6; color: #9f1239;'
                }">
                  ${point.status}
                </span>
              </div>
              <h4 style="font-size: 13px; font-weight: 800; margin: 0 0 4px 0; color: #111827; line-height: 1.3;">
                ${point.title}
              </h4>
              <p style="font-size: 11px; color: #64748b; margin: 0 0 8px 0;">
                📍 ${point.location}
              </p>
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 8px; font-size: 11px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748b; font-weight: 600;">Response Time:</span>
                  <span style="font-family: monospace; font-weight: 900; color: ${point.responseTimeMinutes <= 25 ? '#047857' : '#be123c'};">
                    ${point.responseTimeMinutes} mins (Target: ${point.targetResponseMinutes}m)
                  </span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="color: #64748b; font-weight: 600;">Shift:</span>
                  <span style="font-weight: 600; color: #1e293b;">${point.timeOfDay}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="color: #64748b; font-weight: 600;">Assigned Crew:</span>
                  <span style="font-weight: 700; color: #4338ca;">${point.assignedCrew}</span>
                </div>
                ${point.bottleneckCause ? `
                  <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e2e8f0; font-size: 10px; color: #92400e;">
                    <strong>Bottleneck Factor:</strong> ${point.bottleneckCause}
                  </div>
                ` : ''}
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          marker.on('click', () => {
            setSelectedIncident(point);
            if (onSelectComplaint && complaints) {
              const matched = complaints.find(c => c.id === point.id);
              if (matched) onSelectComplaint(matched);
            }
          });

          marker.addTo(markersGroupRef.current!);
        });
      }
    }
  }, [filteredPoints, heatOverlayVisible, markersVisible, metricMode, heatRadius, heatBlur, heatOpacity, selectedIncident, activeTab, complaints, onSelectComplaint]);

  // Smooth camera centering when selected incident changes
  useEffect(() => {
    if (selectedIncident && mapInstanceRef.current && activeTab === 'map') {
      mapInstanceRef.current.flyTo(
        [selectedIncident.coordinates.lat, selectedIncident.coordinates.lng],
        14.5,
        { duration: 0.9 }
      );
    }
  }, [selectedIncident, activeTab]);

  return (
    <div 
      id="critical-escalations-heatmap-container"
      className="bg-white rounded-[32px] border border-gray-200 shadow-sm p-6 sm:p-8 space-y-6 transition-all"
    >
      {/* Top Header: Title, Subtitle, and View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
              <Flame className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              Critical Escalations Radar
            </span>
            <span className="text-[11px] font-mono text-gray-500 font-semibold">
              Emergency Response Telemetry & Spatial Heat Map Overlay
            </span>
          </div>

          <h2 className="font-['Plus_Jakarta_Sans'] text-[22px] sm:text-[24px] font-black text-[#111827] tracking-tight">
            Emergency Response Times & Critical Escalation Patterns
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 max-w-3xl">
            Heat map overlay and triage telemetry identifying response latency choke points, peak escalation windows, and spatial clusters across municipal NCT sectors.
          </p>
        </div>

        {/* View Switcher: Map vs Matrix vs Diagnostics */}
        <div className="flex items-center gap-1.5 bg-gray-100/90 p-1.5 rounded-2xl self-start lg:self-center shrink-0 border border-gray-200/70">
          <button
            type="button"
            onClick={() => setActiveTab('map')}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'map'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80 font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Compass className="w-3.5 h-3.5 text-indigo-600" />
            <span>GIS Heatmap</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('patternMatrix')}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'patternMatrix'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80 font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>Shift Heat Matrix</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('diagnostics')}
            className={`px-3.5 py-2 rounded-xl text-[12px] font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'diagnostics'
                ? 'bg-white text-indigo-700 shadow-xs border border-gray-200/80 font-extrabold'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-indigo-600" />
            <span>Bottlenecks & SLA</span>
          </button>
        </div>
      </div>

      {/* 4 High-Impact Emergency Telemetry Metric KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* KPI 1: Average Emergency Response Time */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200/90 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Avg Emergency Response
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-['Plus_Jakarta_Sans'] text-[24px] sm:text-[28px] font-black text-[#111827]">
              {metrics.avgResponseMinutes}m
            </span>
            <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/80">
              Target: ≤ 25m
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            {metrics.withinTargetPct}% of critical incidents responded within SLA target
          </p>
        </div>

        {/* KPI 2: Primary Bottleneck Zone */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-rose-50/40 to-white border border-rose-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800">
              Slowest Sector Lag
            </span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Plus_Jakarta_Sans'] text-[22px] sm:text-[24px] font-black text-rose-700 truncate">
              {metrics.slowestSector}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1 font-semibold text-rose-800">
            <span>Avg {metrics.slowestSectorTime} mins</span>
            <span className="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-mono">
              Choke Point
            </span>
          </div>
        </div>

        {/* KPI 3: Optimal Triage Zone */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-emerald-50/40 to-white border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-800">
              Fastest Sector Triage
            </span>
            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-['Plus_Jakarta_Sans'] text-[22px] sm:text-[24px] font-black text-emerald-700 truncate">
              {metrics.fastestSector}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] mt-1 font-semibold text-emerald-800">
            <span>Avg {metrics.fastestSectorTime} mins</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono">
              Rapid Flow
            </span>
          </div>
        </div>

        {/* KPI 4: Peak Escalation Window */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-50/30 to-white border border-indigo-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-900">
              Peak Escalation Shift
            </span>
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="flex items-baseline gap-1">
            <span className="font-['Plus_Jakarta_Sans'] text-[20px] sm:text-[22px] font-black text-indigo-700">
              17:00 – 22:00
            </span>
          </div>
          <p className="text-[11px] text-gray-500 mt-1 font-medium">
            Evening commute & storm season surges account for 58% of alerts
          </p>
        </div>
      </div>

      {/* TAB 1: GIS HEATMAP VIEW WITH OVERLAY CONTROLS */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          {/* Controls Bar: Metric Selector, Sector Filter, Shift Filter, Layer Toggles */}
          <div className="bg-gray-50/90 rounded-2xl p-3.5 sm:p-4 border border-gray-200 flex flex-wrap items-center justify-between gap-3 text-[12px]">
            {/* Left: Metric Mode Selector & Heat Overlay Toggle */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-gray-700 flex items-center gap-1.5 mr-1">
                <Flame className="w-3.5 h-3.5 text-rose-600" />
                Heat Mode:
              </span>

              <button
                type="button"
                onClick={() => setMetricMode('responseTime')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  metricMode === 'responseTime'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Weights heatmap by emergency response time in minutes — highlighting emergency bottlenecks in red"
              >
                <Clock className="w-3 h-3" />
                <span>Response Time Latency</span>
              </button>

              <button
                type="button"
                onClick={() => setMetricMode('frequency')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  metricMode === 'frequency'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Weights heatmap by density and volume of critical escalations"
              >
                <Layers className="w-3 h-3" />
                <span>Incident Density</span>
              </button>

              <button
                type="button"
                onClick={() => setMetricMode('slaRisk')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  metricMode === 'slaRisk'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Weights heatmap by SLA breach margin risk"
              >
                <Timer className="w-3 h-3" />
                <span>SLA Risk Margin</span>
              </button>
            </div>

            {/* Right: Quick Toggles and Sliders Drawer Toggle */}
            <div className="flex flex-wrap items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={() => setHeatOverlayVisible(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  heatOverlayVisible
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                {heatOverlayVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                <span>Heat Gradient Overlay</span>
              </button>

              <button
                type="button"
                onClick={() => setMarkersVisible(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  markersVisible
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-gray-500 border-gray-200'
                }`}
              >
                <MapPin className="w-3 h-3" />
                <span>Incident Pins ({filteredPoints.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setShowControls(prev => !prev)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border flex items-center gap-1.5 cursor-pointer ${
                  showControls
                    ? 'bg-gray-800 text-white border-gray-800 shadow-2xs'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                }`}
                title="Adjust Heatmap Radius, Blur, and Opacity"
              >
                <Sliders className="w-3 h-3" />
                <span>Fine-Tune Layer</span>
              </button>
            </div>
          </div>

          {/* Collapsible Layer Fine-Tuning Drawer */}
          {showControls && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/90 grid grid-cols-1 sm:grid-cols-3 gap-4 text-[12px]">
              <div>
                <div className="flex items-center justify-between font-bold text-gray-700 mb-1.5">
                  <span>Heat Radius</span>
                  <span className="font-mono text-indigo-600">{heatRadius}px</span>
                </div>
                <input
                  type="range"
                  min="15"
                  max="60"
                  value={heatRadius}
                  onChange={(e) => setHeatRadius(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold text-gray-700 mb-1.5">
                  <span>Gradient Blur</span>
                  <span className="font-mono text-indigo-600">{heatBlur}px</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="45"
                  value={heatBlur}
                  onChange={(e) => setHeatBlur(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div>
                <div className="flex items-center justify-between font-bold text-gray-700 mb-1.5">
                  <span>Min Opacity</span>
                  <span className="font-mono text-indigo-600">{Math.round(heatOpacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="85"
                  value={Math.round(heatOpacity * 100)}
                  onChange={(e) => setHeatOpacity(Number(e.target.value) / 100)}
                  className="w-full accent-indigo-600"
                />
              </div>
            </div>
          )}

          {/* Sub-filters: Sector & Time-of-Day Shift */}
          <div className="flex flex-wrap items-center gap-3 text-[12px]">
            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-bold">Sector:</span>
              <select
                value={selectedSector}
                onChange={(e) => setSelectedSector(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[#111827] font-semibold text-[12px] focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Sectors ({allCriticalEscalations.length})</option>
                <option value="Central Delhi">Central Delhi</option>
                <option value="North MCD">North MCD</option>
                <option value="South Delhi">South Delhi</option>
                <option value="Trans-Yamuna East">Trans-Yamuna East</option>
                <option value="West Delhi">West Delhi</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-bold">Shift:</span>
              <select
                value={selectedTimeShift}
                onChange={(e) => setSelectedTimeShift(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[#111827] font-semibold text-[12px] focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Shifts (24 Hours)</option>
                <option value="Morning">Morning (06:00-12:00)</option>
                <option value="Midday">Midday (12:00-17:00)</option>
                <option value="Evening Rush">Evening Rush (17:00-22:00)</option>
                <option value="Night">Night (22:00-06:00)</option>
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-gray-500 font-bold">Status:</span>
              <select
                value={selectedStatusFilter}
                onChange={(e) => setSelectedStatusFilter(e.target.value)}
                className="bg-white border border-gray-200 rounded-xl px-2.5 py-1 text-[#111827] font-semibold text-[12px] focus:outline-none focus:border-indigo-600"
              >
                <option value="all">All Statuses</option>
                <option value="active">Active Response Only</option>
                <option value="resolved">Resolved / Remediated</option>
              </select>
            </div>

            {/* Dynamic Heat Gradient Legend */}
            <div className="ml-auto flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-xl border border-gray-200/70">
              <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                {metricMode === 'responseTime' ? 'Response Latency:' : 'Density Intensity:'}
              </span>
              <div className="flex items-center gap-1 text-[11px] font-mono font-bold">
                <span className="text-emerald-700">≤ 18m</span>
                <span className="w-16 h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600"></span>
                <span className="text-rose-700">&gt; 45m (Bottleneck)</span>
              </div>
            </div>
          </div>

          {/* Interactive GIS Leaflet Container with Heat Overlay */}
          <div className="relative w-full h-[460px] sm:h-[500px] rounded-2xl overflow-hidden border border-gray-200 shadow-inner">
            <div
              ref={mapContainerRef}
              id="critical-heatmap-leaflet-stage"
              className="w-full h-full z-0"
            />

            {/* Quick Map Floating Telemetry HUD */}
            <div className="absolute top-3 left-3 z-[1000] bg-white/95 backdrop-blur-md rounded-2xl p-3 border border-gray-200/90 shadow-sm max-w-[280px] hidden sm:block">
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping"></span>
                <span className="text-[11px] font-black text-rose-800 uppercase tracking-wide">
                  Emergency Heat Layer
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium leading-snug">
                Displaying <strong>{filteredPoints.length}</strong> critical incident dispatches. Red heat crowns indicate triage arrival latencies &gt; 35m.
              </p>
            </div>
          </div>

          {/* Selected Incident Telemetry Inspector Card */}
          {selectedIncident && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gray-50/80 border border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-[12px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {selectedIncident.id}
                  </span>
                  <PriorityBadge priority="Critical" size="xs" />
                  <span className="text-[11px] font-bold text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded-full">
                    {selectedIncident.sector} • {selectedIncident.wardCode}
                  </span>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {selectedIncident.timeLogged}
                  </span>
                </div>

                <h4 className="font-['Plus_Jakarta_Sans'] text-[15px] font-black text-[#111827]">
                  {selectedIncident.title}
                </h4>

                <p className="text-[12px] text-gray-600 flex items-center gap-1.5 font-medium">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span>{selectedIncident.location}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-indigo-700">{selectedIncident.assignedCrew}</span>
                </p>
              </div>

              {/* Response Time Breakdown Metrics */}
              <div className="flex items-center gap-4 shrink-0 bg-white p-3 rounded-xl border border-gray-200/90">
                <div className="text-center pr-3 border-r border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Response</span>
                  <span className={`text-[18px] font-black font-mono ${
                    selectedIncident.responseTimeMinutes <= 25 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {selectedIncident.responseTimeMinutes}m
                  </span>
                </div>

                <div className="text-center pr-3 border-r border-gray-100">
                  <span className="block text-[10px] uppercase font-bold text-gray-400">SLA Target</span>
                  <span className="text-[18px] font-black font-mono text-gray-700">
                    {selectedIncident.targetResponseMinutes}m
                  </span>
                </div>

                <div className="text-left">
                  <span className="block text-[10px] uppercase font-bold text-gray-400">Triage Classification</span>
                  <span className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                    selectedIncident.slaStatus === 'on_target' 
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    {selectedIncident.slaStatus === 'on_target' ? 'Within Target' : 'Bottleneck Delay'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: TIME-OF-DAY VS SECTOR RESPONSE TIME HEAT MATRIX */}
      {activeTab === 'patternMatrix' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/80 text-[12px] text-gray-700 flex items-start gap-3">
            <Info className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-900 font-bold">How to read this Emergency Response Heat Matrix:</strong>
              <p className="mt-0.5 text-gray-600">
                Each cell reflects average dispatch and arrival response times in minutes across municipal sectors and operational shifts. 
                <span className="text-emerald-700 font-bold"> Green (≤ 20m)</span> indicates rapid unimpeded triage; 
                <span className="text-rose-800 font-extrabold"> Deep Red (&gt; 40m)</span> marks severe transit bottlenecks requiring satellite depots or specialized route pre-clearance.
              </p>
            </div>
          </div>

          {/* 2D Heat Grid Table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4">Municipal Sector / Ward</th>
                  {matrixTimeBlocks.map(block => (
                    <th key={block.key} className="py-3.5 px-4 text-center">
                      <span>{block.label}</span>
                    </th>
                  ))}
                  <th className="py-3.5 px-4 text-center">Sector Benchmark</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 text-[12px]">
                {matrixSectors.map(sector => {
                  // Calculate row benchmark
                  const rowCells = matrixTimeBlocks.map(tb => getMatrixCellData(sector, tb.key).avgMins);
                  const rowAvg = Math.round(rowCells.reduce((a, b) => a + b, 0) / rowCells.length);

                  return (
                    <tr key={sector} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-[#111827] flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        <span>{sector}</span>
                      </td>

                      {matrixTimeBlocks.map(block => {
                        const cell = getMatrixCellData(sector, block.key);
                        const colorClass = getCellColorClass(cell.avgMins);

                        return (
                          <td key={block.key} className="py-2.5 px-3 text-center">
                            <div 
                              className={`py-2 px-2.5 rounded-xl border transition-all cursor-pointer ${colorClass}`}
                              title={`${sector} during ${block.label}: Avg ${cell.avgMins} mins response`}
                              onClick={() => {
                                setSelectedSector(sector);
                                setSelectedTimeShift(block.key);
                                setActiveTab('map');
                              }}
                            >
                              <span className="font-mono text-[13px] font-extrabold">{cell.avgMins}m</span>
                              <span className="block text-[10px] opacity-75">
                                {cell.avgMins <= 25 ? 'On Target' : cell.avgMins <= 35 ? 'Moderate' : 'Bottleneck'}
                              </span>
                            </div>
                          </td>
                        );
                      })}

                      {/* Row Average */}
                      <td className="py-3 px-4 text-center font-mono font-black text-[#111827]">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] ${
                          rowAvg <= 25 ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                        }`}>
                          {rowAvg}m avg
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
            <span>Clicking any cell automatically filters the GIS Heatmap to inspect matching incidents.</span>
            <span className="font-mono text-gray-400">Target Standard: National Urban Municipal SLA ≤ 25 mins</span>
          </div>
        </div>
      )}

      {/* TAB 3: BOTTLENECKS & SLA AUDIT RECOMMENDATIONS */}
      {activeTab === 'diagnostics' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-[12px]">
          {/* Bottleneck Factors Box */}
          <div className="p-5 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold text-[14px]">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>Identified Emergency Dispatch Bottlenecks</span>
            </div>

            <div className="space-y-2.5 text-gray-600">
              <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  1
                </div>
                <div>
                  <strong className="text-[#111827] block font-bold">North MCD Heritage Corridors (Ward 08)</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Chandni Chowk and Old Delhi commercial lanes average 46m response due to narrow alleys and uncoordinated deliveries during market hours.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-gray-100 flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 font-bold text-[11px]">
                  2
                </div>
                <div>
                  <strong className="text-[#111827] block font-bold">Trans-Yamuna Rail Overbridge Choke Points</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Anand Vihar and Vikas Marg connectors experience 44m response times during monsoon evenings (17h-21h) due to stormwater siphon backflow.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actionable Engineering Recommendations */}
          <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
            <div className="flex items-center gap-2 text-indigo-900 font-extrabold text-[14px]">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Rapid Response Strategic Interventions</span>
            </div>

            <div className="space-y-2.5 text-gray-600">
              <div className="p-3 bg-white rounded-xl border border-indigo-50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Station Two Electric Satellite Buggies in Old Delhi</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Deploy compact two-person hydraulic buggies stationed at Town Hall depot to circumvent non-motorized vehicle congestion.
                  </p>
                </div>
              </div>

              <div className="p-3 bg-white rounded-xl border border-indigo-50 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-[#111827] block font-bold">Dynamic Traffic Pre-emption for Emergency Units</strong>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Connect Delhi Traffic Police GPS feeds with ICMRS rapid response vehicles for automatic green light clearance along radial arterials.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CriticalEscalationHeatmap;
