import React, { useState } from 'react';
import { CivicComplaint } from '../types';
import { X, Upload, CheckCircle, Camera } from 'lucide-react';
import { PriorityBadge } from './PriorityBadge';

interface UploadPhotoModalProps {
  complaint: CivicComplaint | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (complaintId: string, photoUrl: string) => void;
}

export const UploadPhotoModal: React.FC<UploadPhotoModalProps> = ({
  complaint,
  isOpen,
  onClose,
  onUploadSuccess
}) => {
  const [selectedPhoto, setSelectedPhoto] = useState<string>(
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDGor6GIQRztnq1Fn78tsRToKFXcyUfB2pCehvBgbC2kfy02JB_bh2NghGkyRghoQj5IEktqAY81JDt6YBAmwkTlubTXGizz8H6Vi8rON_8DP5hd8B9P9ujYDsLNW5b_4wB6tmI6waZ5YIOkK1cmaNEjE4688acIWA1vStVXJ4OqshCrvbLsM3xRfbzUpsGGnJe94b7W2Xif13ILNOi08le2cwUqTgoVhbTj4M37AvPjCd6eyynr66LLg'
  );
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedDone, setUploadedDone] = useState(false);

  if (!isOpen || !complaint) return null;

  const handleUpload = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadedDone(true);
      onUploadSuccess(complaint.id, selectedPhoto);
      setTimeout(() => {
        setUploadedDone(false);
        onClose();
      }, 1000);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl p-6 sm:p-7 relative border border-gray-200">
        <div className="flex items-center justify-between pb-3.5 mb-3 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-['Plus_Jakarta_Sans'] font-extrabold text-[17px] text-[#111827]">
                Upload Evidence Snapshot
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="font-mono text-[12px] font-bold text-indigo-600">
                  {complaint.id}
                </span>
                <PriorityBadge priority={complaint.priority} size="xs" />
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

        {uploadedDone ? (
          <div className="py-8 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-2 animate-bounce" />
            <p className="font-bold text-[#111827]">Forensic Snapshot Attached</p>
            <p className="text-[12px] text-gray-400 font-medium">Telemetry coordinates synchronized.</p>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[13px] text-gray-500 font-medium">
              Add supplementary photo telemetry to assist the assigned rapid response crew at <span className="font-bold text-[#111827]">{complaint.location}</span>.
            </p>

            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50">
              <img 
                src={selectedPhoto} 
                alt="Selected file" 
                className="h-32 w-full object-cover rounded-xl mb-2"
                referrerPolicy="no-referrer"
              />
              <span className="text-[11px] text-gray-400 font-medium block">
                JPEG • 2.4 MB • GPS Metatag Attached
              </span>
            </div>

            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-[13px] text-gray-600 hover:bg-gray-100 rounded-xl font-bold transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isUploading}
                onClick={handleUpload}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-[13px] font-bold hover:bg-indigo-700 flex items-center gap-2 shadow-sm active:scale-95 transition-all"
              >
                {isUploading ? (
                  <span className="material-symbols-outlined text-[16px] animate-spin">refresh</span>
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                <span>Upload & Link to Case</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
