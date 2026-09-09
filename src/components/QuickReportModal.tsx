import React, { useState } from 'react';
import { CivicComplaint } from '../types';
import { X, Send, MapPin, Camera, Sparkles, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface QuickReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newComplaint: Partial<CivicComplaint>) => void;
}

export const QuickReportModal: React.FC<QuickReportModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { currentUser } = useAuth();
  const [category, setCategory] = useState('Pothole / Road Surface Damage');
  const [location, setLocation] = useState('Outer Circle, Connaught Place, Block C (New Delhi)');
  const [description, setDescription] = useState(
    'Deep hole growing larger near Metro gate. Threat to two-wheelers and transit traffic.'
  );
  const [photoSelected, setPhotoSelected] = useState<string | null>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCKUAmlJjfN4RPAZeqjdSap1DcOB1SYBxe9IkhPw69OcoRfzN6QW9RK5jlq0V3osMWttxlXtj53GJfTbQbMI2vEXOSab5pM0XkL7HHqx-jkf0jcmFZmz1f5yERzYI6vkssUgfhDTo1-7KYKHVDNp4gR9lv-EHqArNSk7ZuN_YooteMhIj4twCqPXhqRGdkoNpbuQfy7hBtDugONdYHXl9vkcEryHWAtX6PzW_paboSR2AIZcrcsGVrk7A'
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [priority, setPriority] = useState<'Critical' | 'High' | 'Medium' | 'Low'>('High');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    setTimeout(() => {
      setIsSubmitting(false);
      setSubmittedSuccess(true);

      const generatedId = `#ICMRS-2026-${Math.floor(100000 + Math.random() * 900000)}`;
      onSubmit({
        id: generatedId,
        title: `${category.split('/')[0].trim()} Incident Report`,
        category: category.includes('Pothole') 
          ? 'Roads & Bridges' 
          : category.includes('Streetlight') 
          ? 'Electrical & Lighting' 
          : category.includes('Water') 
          ? 'Water & Sanitation' 
          : 'Public Safety & Transit',
        location: location,
        description: description,
        priority: priority,
        status: 'In Progress',
        pipelineStep: 1,
        pipelineStepName: 'Step 1 of 5: Telemetry Received & Dispatched',
        pipelinePercent: 20,
        assignedCrew: 'Auto-Routing to Nearest Delhi MCD / NDMC Patrol',
        timeLogged: 'Just now',
        slaRemaining: '24h 00m SLA remaining',
        totalSlaHours: 24,
        slaStatus: 'nominal',
        imageUrl: photoSelected || undefined,
        gpsTagged: true,
        citizenToken: currentUser?.badgeNumber || 'Verified Resident',
        userId: currentUser?.id,
        userEmail: currentUser?.email,
        officerNotes: [
          {
            id: `note-${Date.now()}`,
            author: 'AI Civic Telemetry Engine',
            role: 'System Dispatch',
            time: 'Just now',
            text: 'Neural triage verified location. High-priority dispatch packet broadcast to Delhi municipal rapid response queue.'
          }
        ]
      });

      setTimeout(() => {
        setSubmittedSuccess(false);
        onClose();
      }, 1200);
    }, 1000);
  };

  const handleSimulateFileSelect = () => {
    // Toggle simulated attached picture
    if (!photoSelected) {
      setPhotoSelected('https://lh3.googleusercontent.com/aida-public/AB6AXuDGor6GIQRztnq1Fn78tsRToKFXcyUfB2pCehvBgbC2kfy02JB_bh2NghGkyRghoQj5IEktqAY81JDt6YBAmwkTlubTXGizz8H6Vi8rON_8DP5hd8B9P9ujYDsLNW5b_4wB6tmI6waZ5YIOkK1cmaNEjE4688acIWA1vStVXJ4OqshCrvbLsM3xRfbzUpsGGnJe94b7W2Xif13ILNOi08le2cwUqTgoVhbTj4M37AvPjCd6eyynr66LLg');
    } else {
      setPhotoSelected(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 transition-all">
      <div className="bg-white w-full max-w-xl rounded-[32px] shadow-2xl p-6 sm:p-7 relative border border-gray-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <span className="material-symbols-outlined text-[24px]">add_task</span>
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[18px] text-[#111827]">
                Fast Civic Report
              </h3>
              <p className="text-[12px] text-gray-500 flex items-center gap-1 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                AI Auto-geotagging will pin your device location
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submittedSuccess ? (
          <div className="py-12 flex flex-col items-center justify-center text-center">
            <CheckCircle className="w-16 h-16 text-green-600 animate-bounce mb-3" />
            <h4 className="font-['Plus_Jakarta_Sans'] font-black text-[22px] text-[#111827]">
              Incident Dispatched!
            </h4>
            <p className="text-[14px] text-gray-500 max-w-sm mt-1 font-medium">
              Your civic incident has been logged and assigned to the nearest municipal response team.
            </p>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">
                Category of Civic Incident
              </label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-[14px] text-[#111827] focus:outline-none focus:bg-white border border-gray-200 focus:border-indigo-600 transition-colors font-medium"
              >
                <option>Pothole / Road Surface Damage</option>
                <option>Streetlight Outage / Electrical Line</option>
                <option>Water Main Leak / Sewage Blockage</option>
                <option>Illegal Dumping / Waste Accumulation</option>
                <option>Traffic Signal Timing Defect</option>
                <option>Fallen Tree Limb / Park Obstruction</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">
                Location Description / Landmark
              </label>
              <div className="relative">
                <input 
                  className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-[14px] text-[#111827] focus:outline-none focus:bg-white border border-gray-200 focus:border-indigo-600 transition-colors font-medium pr-10"
                  type="text" 
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Street or intersection name..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setLocation('4402 Oak Ave Crossway (GPS ±3m)')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-600 hover:text-indigo-700"
                  title="Detect Device Coordinates"
                >
                  <span className="material-symbols-outlined text-[20px]">my_location</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">
                Incident Details
              </label>
              <textarea 
                className="w-full px-4 py-2.5 bg-gray-50 rounded-xl text-[14px] text-[#111827] focus:outline-none focus:bg-white border border-gray-200 focus:border-indigo-600 transition-colors font-medium"
                placeholder="Describe the hazard clearly..." 
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              />
            </div>

            {/* Photo Attachment Section */}
            <div className="p-4 bg-gray-50 rounded-2xl flex items-center justify-between border border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white rounded-xl text-indigo-600 shadow-sm border border-gray-200/60">
                  <Camera className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[13px] font-bold text-[#111827] block">
                    {photoSelected ? 'Photo Tagged & Geo-Verified' : 'Auto-attach camera snapshot'}
                  </span>
                  <span className="text-[11px] text-gray-400 font-medium">
                    {photoSelected ? '1 high-resolution civic snapshot attached' : 'Visual forensics helps crews dispatch equipment'}
                  </span>
                </div>
              </div>
              <button 
                className={`px-3.5 py-1.5 rounded-xl text-[12px] font-bold transition-colors ${
                  photoSelected 
                    ? 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-100' 
                    : 'bg-white border border-gray-200 text-[#111827] hover:bg-gray-100'
                }`}
                type="button"
                onClick={handleSimulateFileSelect}
              >
                {photoSelected ? 'Change Photo' : 'Select File'}
              </button>
            </div>

            {/* Photo Preview if selected */}
            {photoSelected && (
              <div className="relative rounded-2xl overflow-hidden h-28 border border-gray-200 shadow-inner">
                <img 
                  src={photoSelected} 
                  alt="Attached evidence preview" 
                  className="w-full h-full object-cover" 
                  referrerPolicy="no-referrer"
                />
                <span className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm text-white text-[10px] px-2.5 py-0.5 rounded-md font-mono">
                  GPS: 28.6315° N, 77.2167° E
                </span>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3.5 border-t border-gray-100">
              <button 
                className="px-5 py-2.5 rounded-xl text-[13px] font-bold text-gray-600 hover:bg-gray-100 transition-colors"
                type="button"
                onClick={onClose}
              >
                Cancel
              </button>
              <button 
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-xl bg-indigo-600 text-white text-[13px] font-bold shadow-sm hover:bg-indigo-700 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
                type="submit"
              >
                {isSubmitting ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">refresh</span>
                    <span>Dispatching...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Dispatch to Field Crew</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
