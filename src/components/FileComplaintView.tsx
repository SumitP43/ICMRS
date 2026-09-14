import React, { useState, useEffect } from 'react';
import { CivicComplaint } from '../types';
import { 
  AlertTriangle, 
  Camera, 
  MapPin, 
  Send, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  ArrowRight,
  Upload,
  Info,
  AlertCircle,
  ArrowDownCircle
} from 'lucide-react';
import { CivicLocationPicker } from './CivicLocationPicker';
import { useAuth } from '../context/AuthContext';

interface FileComplaintViewProps {
  onSubmitComplaint: (complaint: CivicComplaint) => void;
  onNavigateToTrack: (complaint: CivicComplaint) => void;
}

export const FileComplaintView: React.FC<FileComplaintViewProps> = ({
  onSubmitComplaint,
  onNavigateToTrack
}) => {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState('Roads & Bridges');
  const [citizenName, setCitizenName] = useState(currentUser?.name || 'Marcus Vance');
  const [citizenEmail, setCitizenEmail] = useState(currentUser?.email || 'citizen@icmrs.gov');
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number }>({ lat: 28.6315, lng: 77.2167 });
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');
  const [isLocating, setIsLocating] = useState(false);
  const [liveGpsLocked, setLiveGpsLocked] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [locError, setLocError] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser?.name && !citizenName) setCitizenName(currentUser.name);
    if (currentUser?.email && citizenEmail === 'citizen@icmrs.gov') setCitizenEmail(currentUser.email);
  }, [currentUser]);

  const handleCaptureLiveLocation = () => {
    if (!('geolocation' in navigator)) {
      setLocError('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    setLocError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const acc = pos.coords.accuracy || 15;
        setCoordinates({ lat, lng });
        setGpsAccuracy(acc);
        setLiveGpsLocked(true);
        setIsLocating(false);

        // Reverse geocode with OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.display_name) {
              const shortAddress = [
                data.address?.house_number,
                data.address?.road,
                data.address?.suburb || data.address?.neighbourhood,
                data.address?.city || data.address?.town
              ].filter(Boolean).join(', ');
              setLocation(shortAddress || data.display_name.split(',').slice(0, 3).join(', '));
              return;
            }
          }
        } catch (err) {
          console.warn('Reverse geocode note:', err);
        }

        setLocation(`Live GPS Pin (${lat.toFixed(5)}, ${lng.toFixed(5)})`);
      },
      (err) => {
        setIsLocating(false);
        console.warn('GPS location error:', err);
        setLocError('Could not acquire GPS fix. Set to Delhi Central default.');
        setCoordinates({ lat: 28.6315, lng: 77.2167 });
        setLocation('Outer Circle, Connaught Place (New Delhi 110001)');
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };
  const [photoUrl, setPhotoUrl] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCKUAmlJjfN4RPAZeqjdSap1DcOB1SYBxe9IkhPw69OcoRfzN6QW9RK5jlq0V3osMWttxlXtj53GJfTbQbMI2vEXOSab5pM0XkL7HHqx-jkf0jcmFZmz1f5yERzYI6vkssUgfhDTo1-7KYKHVDNp4gR9lv-EHqArNSk7ZuN_YooteMhIj4twCqPXhqRGdkoNpbuQfy7hBtDugONdYHXl9vkcEryHWAtX6PzW_paboSR2AIZcrcsGVrk7A'
  );
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiAnalysisResult, setAiAnalysisResult] = useState<{
    severityScore: number;
    recommendedPriority: 'Critical' | 'High' | 'Medium' | 'Low';
    crewType: string;
    hazardDetails: string;
  } | null>(null);

  const [submittedTicket, setSubmittedTicket] = useState<CivicComplaint | null>(null);

  const categories = [
    { name: 'Roads & Bridges', icon: 'traffic', count: '14 Active in Delhi' },
    { name: 'Electrical & Lighting', icon: 'electric_bolt', count: '8 Active in Delhi' },
    { name: 'Water & Sanitation', icon: 'water_damage', count: '5 Active in Delhi' },
    { name: 'Public Safety & Transit', icon: 'fmd_bad', count: '3 Active in Delhi' },
    { name: 'Parks & Forestry', icon: 'park', count: '7 Active in Delhi' },
    { name: 'Waste Management', icon: 'recycling', count: '4 Active in Delhi' },
  ];

  const handleSimulateAiAnalysis = () => {
    setAiAnalyzing(true);
    setTimeout(() => {
      setAiAnalyzing(false);
      setAiAnalysisResult({
        severityScore: 8.6,
        recommendedPriority: 'High',
        crewType: 'Crew 09 (Rapid Patch Unit)',
        hazardDetails: 'Geometric edge displacement detected. High risk to low-profile vehicles and night cycling.'
      });
      setPriority('High');
    }, 900);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const newId = `#ICMRS-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    const departmentMap: Record<string, string> = {
      'Roads & Bridges': 'NDMC Roads & Infrastructure Directorate',
      'Electrical & Lighting': 'BSES Power & Municipal Lighting Wing',
      'Water & Sanitation': 'Delhi Jal Board Hydrology Unit',
      'Public Safety & Transit': 'Delhi Traffic Police & PWD Telemetry',
      'Parks & Forestry': 'Municipal Parks & Forestry Directorate',
      'Waste Management': 'Clean Delhi Solid Waste Response'
    };

    const assignedDepartment = departmentMap[category] || 'District 04 Municipal Response Bureau';
    const finalCitizenName = citizenName.trim() || currentUser?.name || 'Marcus Vance';
    const finalCitizenEmail = citizenEmail.trim() || currentUser?.email || 'citizen@icmrs.gov';

    const newTicket: CivicComplaint = {
      id: newId,
      complaintNumber: newId,
      title: title.trim() || `${category} Hazard at ${location.trim() || 'Delhi NCT'}`,
      description: description.trim() || 'Citizen reported public infrastructure issue requiring municipal inspection.',
      category: category,
      location: location.trim() || 'Connaught Place, New Delhi',
      coordinates: coordinates,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
      status: 'In Progress',
      priority: priority,
      citizenName: finalCitizenName,
      citizenEmail: finalCitizenEmail,
      department: assignedDepartment,
      assignedOfficer: 'Elena Vance',
      assignedCrew: aiAnalysisResult?.crewType || 'Delhi Municipal Rapid Unit',
      resolutionDetails: '',
      dateTime: now,
      createdAt: now,
      updatedAt: now,
      pipelineStep: 1,
      pipelineStepName: 'Step 1 of 5: Telemetry Received & Dispatched',
      pipelinePercent: 20,
      timeLogged: 'Just now',
      slaRemaining: priority === 'Critical' ? '4h 00m SLA remaining' : '24h 00m SLA remaining',
      totalSlaHours: priority === 'Critical' ? 4 : 24,
      slaStatus: priority === 'Critical' ? 'urgent' : 'nominal',
      imageUrl: photoUrl,
      imageAlt: `Documentary civic photo of ${category} hazard at ${location || 'Delhi NCT'}`,
      attachments: photoUrl ? [
        {
          id: `att-${Date.now()}`,
          name: 'Scene Photographic Evidence',
          url: photoUrl,
          type: 'image/jpeg',
          uploadedAt: now
        }
      ] : [],
      statusHistory: [
        {
          status: 'In Progress',
          timestamp: now,
          updatedBy: finalCitizenName,
          role: 'citizen',
          notes: `Complaint permanently registered in database and dispatched to ${assignedDepartment}`
        }
      ],
      gpsTagged: true,
      citizenToken: currentUser?.badgeNumber || 'Verified Resident',
      userId: currentUser?.id || finalCitizenEmail,
      userEmail: finalCitizenEmail,
      officerNotes: [
        {
          id: `n-${Date.now()}`,
          author: 'Elena Vance',
          role: 'Chief Field Auditor (Central Delhi)',
          time: 'Just now',
          text: `Ticket ingested into municipal dispatch. Auto-routing active to ${assignedDepartment}.`
        }
      ]
    };

    onSubmitComplaint(newTicket);
    setSubmittedTicket(newTicket);
  };

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="bento-badge-indigo">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            Automated Civic Dispatch
          </span>
          <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">• Delhi NCT Telemetry Protocol</span>
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-[32px] font-black text-[#111827] tracking-tight">
          File a Municipal Civic Complaint
        </h1>
        <p className="text-[14px] text-gray-500 mt-1 max-w-2xl font-medium">
          Report municipal defects, infrastructure hazards, and municipal service interruptions directly to assigned Delhi municipal response units.
        </p>
      </div>

      {submittedTicket ? (
        <div className="bg-white rounded-[32px] p-8 sm:p-10 border border-gray-200 shadow-sm text-center max-w-2xl mx-auto">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-3 animate-bounce" />
          
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="font-mono text-[14px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3.5 py-1 rounded-full">
              Complaint Number: {submittedTicket.complaintNumber || submittedTicket.id}
            </span>
          </div>

          <h2 className="font-['Plus_Jakarta_Sans'] text-[26px] font-extrabold text-[#111827] mt-1">
            Complaint Dispatched Successfully!
          </h2>
          <p className="text-[13px] text-gray-500 mt-1 mb-6 font-normal">
            Your incident report has been registered in the municipal system and routed to District 04 field response units.
          </p>

          {/* Incident Summary Card */}
          <div className="text-left bg-gray-50 border border-gray-200 rounded-2xl p-5 mb-6 space-y-2.5 text-[12px]">
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
              <span className="text-gray-500 font-medium">Citizen Name:</span>
              <span className="font-bold text-[#111827]">
                {submittedTicket.citizenName}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
              <span className="text-gray-500 font-medium">Incident Title:</span>
              <span className="font-bold text-[#111827] max-w-xs truncate text-right">
                {submittedTicket.title}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
              <span className="text-gray-500 font-medium">Category &amp; Priority:</span>
              <span className="font-bold text-[#111827]">
                {submittedTicket.category} • <span className="text-red-600 font-extrabold">{submittedTicket.priority}</span>
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
              <span className="text-gray-500 font-medium">Assigned Department:</span>
              <span className="font-bold text-indigo-700">
                {submittedTicket.department}
              </span>
            </div>
            <div className="flex justify-between items-center border-b border-gray-200/80 pb-2">
              <span className="text-gray-500 font-medium">Location:</span>
              <span className="font-bold text-[#111827] max-w-xs truncate text-right">
                {submittedTicket.location}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">Dispatched At:</span>
              <span className="font-mono text-gray-700">
                {new Date(submittedTicket.dateTime || submittedTicket.createdAt || Date.now()).toLocaleString()}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <button
              onClick={() => onNavigateToTrack(submittedTicket)}
              className="w-full sm:w-auto px-6 py-3 bg-indigo-600 text-white rounded-xl text-[14px] font-bold hover:bg-indigo-700 flex items-center justify-center gap-2 shadow-sm active:scale-95 transition-all cursor-pointer"
            >
              <span>Track Ticket in Telemetry Matrix</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => {
                setSubmittedTicket(null);
                setTitle('');
                setDescription('');
                setLocation('');
              }}
              className="w-full sm:w-auto px-5 py-3 bg-gray-100 text-[#111827] rounded-xl text-[14px] font-bold hover:bg-gray-200 transition-colors cursor-pointer"
            >
              File Another Complaint
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Form Fields */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            {/* Category Selector */}
            <div className="bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm">
              <label className="block text-[12px] uppercase tracking-wider font-extrabold text-[#111827] mb-4">
                1. Select Municipal Defect Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
                {categories.map(cat => {
                  const isSelected = category === cat.name;
                  return (
                    <button
                      type="button"
                      key={cat.name}
                      onClick={() => setCategory(cat.name)}
                      className={`p-4 rounded-2xl text-left border transition-all flex flex-col justify-between ${
                        isSelected 
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-600 shadow-sm' 
                          : 'border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[26px] text-indigo-600 mb-2.5">
                        {cat.icon}
                      </span>
                      <div>
                        <span className="text-[13px] font-bold text-[#111827] block leading-tight">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-gray-400 mt-1 block font-medium">
                          {cat.count}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description & Location */}
            <div className="bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm space-y-5">
              <label className="block text-[12px] uppercase tracking-wider font-extrabold text-[#111827]">
                2. Incident Location & Specifics
              </label>

              {/* Citizen Details Recorded with Complaint */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1.5">
                    Citizen Name
                  </label>
                  <input
                    type="text"
                    id="citizen-name-input"
                    value={citizenName}
                    onChange={(e) => setCitizenName(e.target.value)}
                    placeholder="Full Legal Name"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111827] focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1.5">
                    Citizen Email / Mail ID
                  </label>
                  <input
                    type="email"
                    id="citizen-email-input"
                    value={citizenEmail}
                    onChange={(e) => setCitizenEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111827] focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1.5">
                  Incident Title / Headline
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Deep Pothole in Bus Lane on 14th St."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111827] focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] text-gray-400 font-bold uppercase">
                    Street Address or Landmark
                  </label>
                  <button
                    type="button"
                    onClick={handleCaptureLiveLocation}
                    disabled={isLocating}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                  >
                    <span className={`material-symbols-outlined text-[16px] ${isLocating ? 'animate-spin' : ''}`}>my_location</span>
                    <span>{isLocating ? 'Acquiring GPS...' : 'Use Live Location'}</span>
                  </button>
                </div>
                
                <div className="relative">
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => {
                      setLocation(e.target.value);
                      setLiveGpsLocked(false);
                    }}
                    placeholder="e.g. Oak Ave Crossway 4402"
                    className="w-full pl-4 pr-11 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111827] focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCaptureLiveLocation}
                    disabled={isLocating}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
                    title="Capture My Live GPS Coordinates"
                  >
                    <span className={`material-symbols-outlined text-[22px] ${isLocating ? 'animate-spin' : ''}`}>my_location</span>
                  </button>
                </div>

                {/* Live GPS Lock Indicator */}
                {liveGpsLocked && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between text-[11px] text-emerald-800">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="font-bold">Live GPS Locked</span>
                      <span className="text-emerald-600 font-mono">
                        ({coordinates.lat.toFixed(5)}, {coordinates.lng.toFixed(5)})
                      </span>
                    </div>
                    {gpsAccuracy && (
                      <span className="font-mono font-bold text-emerald-700">
                        ±{Math.round(gpsAccuracy)}m accuracy
                      </span>
                    )}
                  </div>
                )}

                {/* Error feedback if any */}
                {locError && (
                  <div className="mt-2 px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center justify-between">
                    <span>{locError}</span>
                    <button
                      type="button"
                      onClick={() => setLocError(null)}
                      className="font-bold text-amber-600 hover:text-amber-800 ml-2"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Interactive Pin Locator with OpenStreetMap & Live Location */}
                <CivicLocationPicker
                  coordinates={coordinates}
                  onChangeCoordinates={(coords) => {
                    setCoordinates(coords);
                    setLiveGpsLocked(false);
                  }}
                  locationName={location}
                  onUseLiveLocation={handleCaptureLiveLocation}
                  isLocating={isLocating}
                />
              </div>

              <div>
                <label className="block text-[11px] text-gray-400 font-bold uppercase mb-1.5">
                  Detailed Hazard Description
                </label>
                <textarea
                  rows={4}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe severity, hazards to pedestrians, vehicles, or surrounding structures..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[14px] text-[#111827] focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  required
                />
              </div>
            </div>

            {/* Photo Upload & AI Pre-Inspection */}
            <div className="bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <label className="text-[12px] uppercase tracking-wider font-extrabold text-[#111827]">
                  3. Photographic Evidence & AI Forensics
                </label>
                <button
                  type="button"
                  onClick={handleSimulateAiAnalysis}
                  disabled={aiAnalyzing}
                  className="text-[12px] font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{aiAnalyzing ? 'Analyzing Image...' : 'Run AI Severity Scan'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                <div className="relative rounded-2xl overflow-hidden h-44 bg-gray-100 border border-gray-200">
                  <img
                    src={photoUrl}
                    alt="Evidence Preview"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-black/75 backdrop-blur text-white text-[10px] px-2.5 py-1 rounded-lg font-mono">
                    GEO-TAG: 28.6315° N, 77.2167° E
                  </span>
                </div>

                <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
                  {aiAnalysisResult ? (
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] uppercase font-bold text-gray-500">AI Severity Score</span>
                        <span className="text-[14px] font-extrabold text-red-600">
                          {aiAnalysisResult.severityScore} / 10
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div className="bg-red-600 h-2 rounded-full" style={{ width: '86%' }}></div>
                      </div>
                      <p className="text-[12px] text-gray-600 mt-1 leading-relaxed">
                        {aiAnalysisResult.hazardDetails}
                      </p>
                      <span className="inline-block text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-lg">
                        Target Crew: {aiAnalysisResult.crewType}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center py-5">
                      <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-[12px] text-[#111827] font-bold">
                        Photo attached and ready for triage
                      </p>
                      <button
                        type="button"
                        onClick={handleSimulateAiAnalysis}
                        className="mt-2 text-[12px] font-bold text-indigo-600 hover:underline"
                      >
                        Click to generate AI severity estimate
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Submission Controls */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white p-7 sm:p-8 rounded-[32px] border border-gray-200 shadow-sm space-y-6">
              <h3 className="font-['Plus_Jakarta_Sans'] text-[18px] font-extrabold text-[#111827]">
                Dispatch Parameters
              </h3>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-bold text-gray-400 mb-2">
                  Priority Classification
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['Critical', 'High', 'Medium', 'Low'] as const).map(p => {
                    const isSelected = priority === p;
                    const IconComp = 
                      p === 'Critical' ? ShieldAlert :
                      p === 'High' ? AlertTriangle :
                      p === 'Medium' ? AlertCircle :
                      ArrowDownCircle;

                    return (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`py-2.5 px-3 rounded-xl text-[12px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
                          isSelected
                            ? p === 'Critical'
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : p === 'High'
                              ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                              : 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                            : p === 'Critical'
                            ? 'bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100/70'
                            : p === 'High'
                            ? 'bg-amber-50/70 text-amber-800 border-amber-200 hover:bg-amber-100/70'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5 shrink-0" />
                        <span>{p}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="p-4 bg-gray-50 rounded-2xl space-y-2 text-[12px] text-gray-600 border border-gray-100">
                <div className="flex justify-between">
                  <span>Guaranteed SLA:</span>
                  <span className="font-bold text-[#111827]">
                    {priority === 'Critical' ? '4 Hours' : priority === 'High' ? '24 Hours' : '48 Hours'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Geofence Zone:</span>
                  <span className="font-bold text-[#111827]">District 04 (Central)</span>
                </div>
                <div className="flex justify-between">
                  <span>Report Status:</span>
                  <span className="text-emerald-700 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    Verified & Ready
                  </span>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold text-[14px] shadow-lg hover:bg-indigo-700 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Submit & Dispatch Case</span>
              </button>
            </div>

            {/* Assistance card */}
            <div className="p-5 rounded-[28px] bg-indigo-50/70 border border-indigo-100 text-indigo-950">
              <div className="flex items-center gap-2 mb-1.5">
                <Info className="w-4 h-4 text-indigo-600" />
                <span className="text-[12px] font-bold">Emergency Notice</span>
              </div>
              <p className="text-[12px] text-indigo-900 leading-relaxed font-normal">
                If this incident represents an active live-wire or gas fracture, do not use the web form. Call hotline <span className="font-bold">311-990</span> immediately.
              </p>
            </div>
          </div>
        </form>
      )}
    </div>
  );
};
