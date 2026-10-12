import React, { useState } from 'react';
import { 
  Stethoscope, 
  MapPin, 
  Calendar, 
  Clock, 
  Star, 
  ShieldCheck, 
  PhoneCall, 
  Search, 
  Building2, 
  ArrowRight,
  CheckCircle2
} from 'lucide-react';
import { SpecialistDoctor } from '../types/hospital';
import { translations } from '../translations';

interface SpecialistDirectoryProps {
  specialists: SpecialistDoctor[];
  language: 'bn' | 'en';
  onBookAppointment: (doctor: SpecialistDoctor) => void;
  filterDepartment?: string;
}

export const SpecialistDirectory: React.FC<SpecialistDirectoryProps> = ({
  specialists,
  language,
  onBookAppointment,
  filterDepartment,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  const [selectedDept, setSelectedDept] = useState<string>(filterDepartment || 'ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [bookedDoctorId, setBookedDoctorId] = useState<string | null>(null);

  const departments = [
    { id: 'ALL', label: isBn ? 'সকল বিভাগ' : 'All Specialties' },
    { id: 'Cardiology', label: isBn ? 'কার্ডিওলজি (হৃদরোগ)' : 'Cardiology' },
    { id: 'Medicine', label: isBn ? 'মেডিসিন' : 'Internal Medicine' },
    { id: 'Orthopedics', label: isBn ? 'অর্থোপেডিকস (হাড়-জোড়)' : 'Orthopedics' },
    { id: 'Pediatrics', label: isBn ? 'শিশু রোগ' : 'Pediatrics' },
    { id: 'Pulmonology', label: isBn ? 'বক্ষব্যাধি ও শ্বাসকষ্ট' : 'Pulmonology' },
  ];

  const filteredDoctors = specialists.filter((doc) => {
    const matchesDept = selectedDept === 'ALL' || doc.department === selectedDept;
    const matchesSearch =
      doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialty.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.hospital.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  const handleBook = (doctor: SpecialistDoctor) => {
    setBookedDoctorId(doctor.id);
    onBookAppointment(doctor);
    setTimeout(() => {
      setBookedDoctorId(null);
    }, 2500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Stethoscope className="w-5 h-5 text-teal-700" />
          <h2 className="text-xl font-bold text-slate-900">
            {isBn ? 'বিশেষজ্ঞ ডাক্তার চেম্বার ও টেলি-কনসালটেশন' : 'Specialist Directory & Chamber Booking'}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          {isBn
            ? 'এআই ট্রায়াজ রেফারেল অনুসারে বিশেষায়িত কনসালটেশন নিন বা সরাসরি চেম্বারে অ্যাপয়েন্টমেন্ট বুক করুন'
            : 'Book confirmed physical chamber or telemedicine slots directly based on AI Triage referrals'}
        </p>
      </div>

      {/* Filter and Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs mb-6 flex flex-wrap items-center justify-between gap-3">
        {/* Dept filter pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDept(dept.id)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                selectedDept === dept.id
                  ? 'bg-teal-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {dept.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isBn ? 'ডাক্তার বা হাসপাতাল খুঁজুন...' : 'Search doctor or hospital...'}
            className="text-xs pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg w-full focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Specialists Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredDoctors.map((doc) => {
          const isJustBooked = bookedDoctorId === doc.id;
          return (
            <div
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-teal-300 p-5 shadow-xs transition-all flex flex-col justify-between"
            >
              <div>
                {/* Doctor Top Row */}
                <div className="flex items-start gap-3.5 mb-3">
                  <img
                    src={doc.avatarUrl}
                    alt={doc.name}
                    className="w-14 h-14 rounded-xl object-cover ring-2 ring-slate-100 shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-slate-900 text-sm">{doc.name}</h3>
                      {doc.isOnline && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" title="Online" />
                      )}
                    </div>
                    <p className="text-xs font-semibold text-teal-700 mt-0.5">
                      {isBn ? doc.specialtyBn : doc.specialty}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{doc.qualification}</p>
                  </div>
                </div>

                {/* Details */}
                <div className="space-y-2 text-xs text-slate-700 pt-2 border-t border-slate-100">
                  <div className="flex items-start gap-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] font-medium text-slate-800">{doc.hospital}</span>
                  </div>

                  <div className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span className="text-[11px] text-slate-600">{doc.chamberAddress}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-600">{doc.availableDays}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-[11px] text-slate-600">{doc.availableTime}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Row */}
              <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-600 font-semibold block">{isBn ? 'ভিজিট ফি' : 'Consultation Fee'}</span>
                  <span className="text-sm font-bold text-slate-900">৳ {doc.visitFee}</span>
                </div>

                <button
                  onClick={() => handleBook(doc)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                    isJustBooked
                      ? 'bg-emerald-600 text-white'
                      : 'bg-teal-700 hover:bg-teal-800 text-white active:scale-95'
                  }`}
                >
                  {isJustBooked ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{isBn ? 'স্লট নিশ্চিত!' : 'Slot Booked!'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isBn ? 'চেম্বার বুক করুন' : 'Book Chamber'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
