import React, { useState } from 'react';
import { CivicComplaint, OfficerNote } from '../types';
import { X, MessageSquare, Send, UserCheck, Shield } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

interface OfficerNotesModalProps {
  complaint: CivicComplaint | null;
  isOpen: boolean;
  onClose: () => void;
  onAddNote: (complaintId: string, note: OfficerNote) => void;
}

export const OfficerNotesModal: React.FC<OfficerNotesModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onAddNote
}) => {
  const [newNoteText, setNewNoteText] = useState('');

  if (!isOpen || !complaint) return null;

  const handlePostNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;

    const note: OfficerNote = {
      id: `n-${Date.now()}`,
      author: 'Elena Vance',
      role: 'Ward Officer 04',
      time: 'Just now',
      text: newNoteText.trim()
    };

    onAddNote(complaint.id, note);
    setNewNoteText('');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-lg rounded-[32px] shadow-2xl p-6 sm:p-7 relative border border-gray-200 flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[17px] text-[#111827]">
                Official Field Logs & Notes
              </h3>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className="font-mono text-[12px] font-bold text-indigo-600">
                  {complaint.id}
                </span>
                <PriorityBadge priority={complaint.priority} size="xs" />
                <span className="text-[11px] text-gray-500 truncate max-w-[200px]">
                  • {complaint.location}
                </span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notes List */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 my-2">
          {(!complaint.officerNotes || complaint.officerNotes.length === 0) ? (
            <p className="text-[13px] text-gray-400 text-center py-6 font-medium">
              No notes logged yet.
            </p>
          ) : (
            (complaint.officerNotes || []).map(note => (
              <div key={note.id} className="p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-indigo-600" />
                    <span className="text-[12px] font-bold text-[#111827]">{note.author}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 font-bold border border-indigo-100">
                      {note.role}
                    </span>
                  </div>
                  <span className="text-[11px] text-gray-400">{note.time}</span>
                </div>
                <p className="text-[13px] text-gray-600 leading-relaxed mt-1 font-normal">
                  {note.text}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Input box */}
        <form onSubmit={handlePostNote} className="pt-3.5 border-t border-gray-100">
          <label className="block text-[11px] uppercase tracking-wider text-gray-400 mb-1.5 font-bold">
            Append Field Audit Log
          </label>
          <div className="flex gap-2">
            <input 
              type="text"
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Enter field assessment or crew instructions..."
              className="flex-1 px-4 py-2.5 bg-gray-50 rounded-xl text-[13px] border border-gray-200 focus:bg-white focus:outline-none focus:border-indigo-600 text-[#111827] font-medium"
            />
            <button
              type="submit"
              className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
            >
              <Send className="w-4 h-4" />
              <span>Log</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
