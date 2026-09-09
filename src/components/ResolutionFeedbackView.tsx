import React, { useState } from 'react';
import { CivicComplaint } from '../types';
import { 
  CheckCircle, 
  Star, 
  MessageSquare, 
  ShieldCheck, 
  Award, 
  Send,
  Sparkles
} from 'lucide-react';

interface ResolutionFeedbackViewProps {
  complaints: CivicComplaint[];
  onRateIncident: (complaintId: string, rating: number) => void;
}

export const ResolutionFeedbackView: React.FC<ResolutionFeedbackViewProps> = ({
  complaints,
  onRateIncident
}) => {
  const [feedbackSent, setFeedbackSent] = useState<string | null>(null);
  const [generalComment, setGeneralComment] = useState('');
  const [generalCommentSent, setGeneralCommentSent] = useState(false);

  const resolved = complaints.filter(c => c.status === 'Resolved');

  const handleRate = (complaintId: string, stars: number) => {
    onRateIncident(complaintId, stars);
    setFeedbackSent(complaintId);
    setTimeout(() => setFeedbackSent(null), 3000);
  };

  const handleGeneralSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!generalComment.trim()) return;
    setGeneralCommentSent(true);
    setTimeout(() => {
      setGeneralCommentSent(false);
      setGeneralComment('');
    }, 2500);
  };

  return (
    <div className="w-full max-w-[100rem] mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="bento-badge-indigo">
            <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
            Verified Forensic Audits
          </span>
          <span className="text-gray-400 text-[11px] font-mono uppercase tracking-wider">• District 04 Citizen Feedback Channel</span>
        </div>
        <h1 className="font-['Plus_Jakarta_Sans'] text-[32px] font-black text-[#111827] tracking-tight">
          Resolution Archive & Citizen Quality Ratings
        </h1>
        <p className="text-[14px] text-gray-500 mt-1 max-w-2xl font-medium">
          Examine certified municipal remediations, inspect before/after forensic photographic proofs, and submit verified citizen feedback.
        </p>
      </div>

      {/* Grid: Resolved Cards + Overall District Satisfaction */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main 8-col: List of resolved incidents */}
        <div className="lg:col-span-8 space-y-6">
          {resolved.map(incident => (
            <div 
              key={incident.id}
              className="bg-white rounded-[32px] p-7 sm:p-8 border border-gray-200 shadow-sm space-y-5"
            >
              {/* Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[13px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                    {incident.id}
                  </span>
                  <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                    {incident.category}
                  </span>
                </div>
                <span className="px-3 py-1 bg-green-50 border border-green-200 text-green-700 text-[12px] font-bold rounded-full flex items-center gap-1.5 self-start sm:self-auto">
                  <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                  <span>Resolved {incident.resolvedTime || 'Certified'}</span>
                </span>
              </div>

              <div>
                <h3 className="font-['Plus_Jakarta_Sans'] text-[20px] font-extrabold text-[#111827]">
                  {incident.title}
                </h3>
                <p className="text-[13px] text-gray-600 mt-1 font-normal leading-relaxed">
                  {incident.description}
                </p>
                <p className="text-[12px] text-gray-400 mt-1 font-medium flex items-center gap-1">
                  <span>📍 {incident.location}</span>
                </p>
              </div>

              {/* Dual Photographic Evidence */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="relative rounded-2xl overflow-hidden h-48 bg-gray-100 border border-gray-200">
                  <img
                    src={incident.beforeImageUrl || incident.imageUrl}
                    alt={incident.beforeImageAlt || 'Before Repair'}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2.5 left-2.5 bg-red-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-lg">
                    BEFORE REPAIR
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden h-48 bg-gray-100 border border-gray-200">
                  <img
                    src={incident.afterImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2l8HaUVF9slNV9YxOmbqq1WjycFPXVErGy_cOc0QCGQTRJQsKGTtoIjrQ3EbbZ_293VRfFB0jDzrilVBQFy2m8gLtbeuD-imZ-bfwsLmZjdMPV6jb41KKUghwKP2j1Qow8xFhNXJ5JWJnw4pbdWF2Xn9JX4080XkmGAxy7u85Xf-udf8rFj2tvGwU7OqPN7YyM0Y6R9YYhnXFmrqsXdeSBkS-wrpMWM-PUyU8gSxE5zs9b5LofG3rIw'}
                    alt={incident.afterImageAlt || 'After Remediation'}
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-2.5 left-2.5 bg-indigo-600 text-white text-[10px] font-bold tracking-wider px-2.5 py-1 rounded-lg">
                    AFTER REMEDIATION
                  </span>
                </div>
              </div>

              {/* Inspector Sign-off & Citizen 5-Star Rating */}
              <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gray-50 p-4 sm:p-5 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-3">
                  {incident.inspector?.avatar ? (
                    <img 
                      src={incident.inspector.avatar} 
                      alt={incident.inspector.name} 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-[12px] shadow-sm">
                      {incident.inspector?.initials || 'OFF'}
                    </div>
                  )}
                  <div>
                    <span className="text-[13px] font-bold text-[#111827] block">
                      Signed off by {incident.inspector?.name || 'Chief Auditor'}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {incident.inspector?.title || 'Ward Officer 04'}
                    </span>
                  </div>
                </div>

                {/* Rating Widget */}
                <div className="flex flex-col sm:items-end">
                  <span className="text-[11px] uppercase font-bold text-gray-400 mb-1">
                    Rate Repair Quality:
                  </span>
                  <div className="flex items-center gap-1 text-amber-500">
                    {[1, 2, 3, 4, 5].map((starIdx) => {
                      const currentRating = incident.rating || 5;
                      const isFilled = starIdx <= Math.floor(currentRating);
                      return (
                        <button
                          key={starIdx}
                          type="button"
                          onClick={() => handleRate(incident.id, starIdx)}
                          className="hover:scale-125 transition-transform"
                          title={`Rate ${starIdx} stars`}
                        >
                          <span 
                            className="material-symbols-outlined text-[22px]"
                            style={{ fontVariationSettings: `'FILL' ${isFilled ? 1 : 0}` }}
                          >
                            star
                          </span>
                        </button>
                      );
                    })}
                    <span className="font-mono text-[14px] font-bold text-[#111827] ml-2">
                      {incident.rating || 5}.0
                    </span>
                  </div>
                  {feedbackSent === incident.id && (
                    <span className="text-[11px] font-bold text-green-600 mt-1">
                      ✓ Rating recorded. Thank you for your feedback!
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right 4-col: Overall Quality & Feedback submission */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Award className="w-4 h-4" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
                Citizen Satisfaction Standard
              </h3>
            </div>

            <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 text-center">
              <span className="font-['Plus_Jakarta_Sans'] text-[48px] font-black text-indigo-600 leading-none">
                4.91
              </span>
              <div className="flex justify-center text-amber-500 my-2.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <span key={i} className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                    star
                  </span>
                ))}
              </div>
              <p className="text-[12px] text-indigo-900 font-bold">
                District 04 Quality Certified (126 Surveys)
              </p>
            </div>

            <p className="text-[12px] text-gray-500 leading-relaxed font-normal">
              Every completed case is subjected to a 72-hour review window where registered voters can inspect photographic proofs or request a supervisor re-audit.
            </p>
          </div>

          {/* Submit General Feedback */}
          <div className="bg-white rounded-[32px] p-7 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4" />
              </div>
              <h3 className="font-['Plus_Jakarta_Sans'] text-[17px] font-extrabold text-[#111827]">
                Submit Ward Quality Commentary
              </h3>
            </div>

            {generalCommentSent ? (
              <div className="p-4 bg-indigo-50 text-indigo-800 text-[12px] rounded-2xl font-bold flex items-center gap-2 border border-indigo-100">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>Commentary submitted to Delhi Municipal Citizen Council!</span>
              </div>
            ) : (
              <form onSubmit={handleGeneralSubmit} className="space-y-3.5">
                <textarea
                  rows={3}
                  value={generalComment}
                  onChange={(e) => setGeneralComment(e.target.value)}
                  placeholder="Share suggestions for road maintenance, lighting schedules, or response crews..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-[#111827] focus:bg-white focus:outline-none focus:border-indigo-600 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Feedback</span>
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
