import React from 'react';
import { CivicComplaint } from '../types';

interface PrintableComplaintSummaryProps {
  complaint: CivicComplaint | null;
}

export const PrintableComplaintSummary: React.FC<PrintableComplaintSummaryProps> = ({ complaint }) => {
  if (!complaint) return null;

  const formattedDate = complaint.createdAt || complaint.timeLogged || new Date().toLocaleString();

  return (
    <div 
      id="printable-complaint-summary"
      className="print-only-summary p-8 max-w-4xl mx-auto bg-white text-black font-sans leading-relaxed text-[13px]"
    >
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold uppercase tracking-tight text-black">
            Intelligent Civic Response System (ICMRS)
          </h1>
          <p className="text-xs text-gray-700 font-semibold tracking-wide uppercase mt-1">
            Official Municipal Civic Incident Briefing &amp; Dispatch Summary
          </p>
        </div>
        <div className="text-right">
          <div className="text-xs text-gray-600 font-mono">Printed on:</div>
          <div className="text-xs font-semibold">{new Date().toLocaleString()}</div>
        </div>
      </div>

      {/* Incident ID & Priority Banner */}
      <div className="grid grid-cols-2 gap-4 border border-black p-4 mb-6 bg-gray-50">
        <div>
          <span className="block text-[10px] uppercase font-bold text-gray-600 tracking-wider">
            Incident Reference ID
          </span>
          <span className="text-lg font-mono font-black text-black">
            {complaint.id}
          </span>
        </div>
        <div className="text-right">
          <span className="block text-[10px] uppercase font-bold text-gray-600 tracking-wider">
            Priority &amp; Status
          </span>
          <span className="text-sm font-black uppercase text-black">
            Priority: {complaint.priority} &bull; Status: {complaint.status}
          </span>
        </div>
      </div>

      {/* Core Complaint Details */}
      <div className="space-y-4 mb-6">
        <div>
          <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
            Incident Title
          </h2>
          <p className="text-base font-bold text-black">{complaint.title}</p>
        </div>

        <div>
          <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
            Description
          </h2>
          <p className="text-sm text-gray-900 whitespace-pre-wrap">
            {complaint.description || 'No description logged.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
              Category
            </h2>
            <p className="text-sm font-medium text-black">{complaint.category}</p>
          </div>
          <div>
            <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
              Location / Jurisdiction
            </h2>
            <p className="text-sm font-medium text-black">{complaint.location}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
              Assigned Crew / Department
            </h2>
            <p className="text-sm font-medium text-black">
              {complaint.assignedCrew || complaint.department || 'Standby Civic Dispatch'}
            </p>
          </div>
          <div>
            <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
              SLA Window &amp; Telemetry
            </h2>
            <p className="text-sm font-medium text-black">
              {complaint.slaRemaining} (Logged: {formattedDate})
            </p>
          </div>
        </div>

        {complaint.coordinates && (
          <div>
            <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-1">
              GPS Coordinates
            </h2>
            <p className="text-xs font-mono text-gray-800">
              Latitude: {complaint.coordinates.lat}, Longitude: {complaint.coordinates.lng}
            </p>
          </div>
        )}

        {complaint.officerNotes && complaint.officerNotes.length > 0 && (
          <div>
            <h2 className="text-xs uppercase font-bold text-gray-600 tracking-wider border-b border-gray-300 pb-1 mb-2">
              Officer &amp; Dispatch Log Notes ({complaint.officerNotes.length})
            </h2>
            <ul className="space-y-1.5 list-disc list-inside text-xs text-gray-800">
              {complaint.officerNotes.map((note) => (
                <li key={note.id}>
                  <strong className="text-black">{note.author} ({note.role}) [{note.time}]:</strong>{' '}
                  {note.text}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer / Sign-off */}
      <div className="border-t-2 border-black pt-4 mt-8 flex items-center justify-between text-xs text-gray-600">
        <div>
          <span>Authorized Public Works / Emergency Operations Document</span>
        </div>
        <div>
          <span>Verification Token: {complaint.citizenToken || complaint.id}</span>
        </div>
      </div>
    </div>
  );
};
