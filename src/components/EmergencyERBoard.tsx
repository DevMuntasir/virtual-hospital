import React from 'react';
import { 
  Building2, 
  Bed, 
  PhoneCall, 
  Ambulance, 
  Navigation, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  HeartPulse
} from 'lucide-react';
import { HospitalEmergencyUnit, Prescription } from '../types/hospital';
import { translations } from '../translations';

interface EmergencyERBoardProps {
  emergencyUnits: HospitalEmergencyUnit[];
  prescriptions: Prescription[];
  language: 'bn' | 'en';
}

export const EmergencyERBoard: React.FC<EmergencyERBoardProps> = ({
  emergencyUnits,
  prescriptions,
  language,
}) => {
  const t = translations[language];
  const isBn = language === 'bn';

  // Filter cases routed to physical hospital ER
  const inboundERReferrals = prescriptions.filter(
    (p) => p.triageCode === 'RED' || p.status === 'PHYSICAL_ER_DISPATCH'
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-rose-900 to-red-950 text-white rounded-2xl p-6 shadow-sm mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <ShieldAlert className="w-6 h-6 text-rose-400 animate-pulse" />
            <h2 className="text-xl font-bold">
              {isBn ? 'হাসপাতাল জরুরি বিভাগ (ER) ও বেড ট্র্যাকার' : 'Hospital Emergency ER & Bed Tracker'}
            </h2>
          </div>
          <p className="text-xs text-rose-200 max-w-xl">
            {isBn
              ? 'কোড রেড জরুরি ট্রায়াজ রোগীদের সরাসরি শারীরিক হাসপাতালে রেফারেল এবং জরুরি বেড ও অ্যাম্বুলেন্স প্রস্তুতি ব্যবস্থা'
              : 'Direct physical hospital dispatch for Code Red triage emergencies with live bed counts & trauma routing'}
          </p>
        </div>

        <div className="bg-rose-800/80 px-4 py-2.5 rounded-xl border border-rose-700/80 flex items-center gap-3">
          <PhoneCall className="w-5 h-5 text-rose-300 animate-bounce" />
          <div>
            <span className="text-[10px] text-rose-300 block font-semibold">
              {isBn ? 'জাতীয় জরুরি সেবা' : 'National Emergency Hotline'}
            </span>
            <span className="text-lg font-black tracking-wider">৯৯৯ / 16263</span>
          </div>
        </div>
      </div>

      {/* Hospital ER Centers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
        {emergencyUnits.map((unit) => (
          <div
            key={unit.id}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    {unit.type}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    {isBn ? unit.nameBn : unit.name}
                  </h3>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <Navigation className="w-3.5 h-3.5 text-slate-400" />
                    <span>{unit.location} · {unit.distanceKm}</span>
                  </p>
                </div>
              </div>

              {/* Bed metrics */}
              <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
                    <Bed className="w-3.5 h-3.5 text-slate-600" />
                    <span>{isBn ? 'জরুরি ইআর বেড ফাঁকা' : 'ER Beds Available'}</span>
                  </span>
                  <span className="text-lg font-black text-slate-900 font-mono mt-0.5 block">
                    {unit.erBedsAvailable} বেড
                  </span>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-500 font-semibold block flex items-center gap-1">
                    <HeartPulse className="w-3.5 h-3.5 text-rose-600" />
                    <span>{isBn ? 'আইসিইউ (ICU) বেড' : 'ICU Beds Available'}</span>
                  </span>
                  <span className="text-lg font-black text-rose-900 font-mono mt-0.5 block">
                    {unit.icuBedsAvailable} বেড
                  </span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">
                {unit.ambulanceAvailable ? (
                  <span className="text-emerald-700 flex items-center gap-1 font-semibold">
                    <Ambulance className="w-3.5 h-3.5" />
                    <span>{isBn ? 'অ্যাম্বুলেন্স প্রস্তুত' : 'Ambulance Standby'}</span>
                  </span>
                ) : (
                  <span className="text-slate-400">{isBn ? 'অ্যাম্বুলেন্স ব্যস্ত' : 'Ambulance Busy'}</span>
                )}
              </span>

              <a
                href={`tel:${unit.emergencyPhone.split('/')[0].trim()}`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold transition-all shadow-2xs"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>{isBn ? 'ইআর কল করুন' : 'Call ER'}</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Inbound Code Red Triage Dispatches Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{isBn ? 'ভার্চুয়াল এআই ট্রায়াজ থেকে ইনবাউন্ড জরুরি রোগী তালিকা' : 'Inbound Code Red Triage Dispatches'}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isBn ? 'জরুরি কোড রেড রোগীদের ট্রায়াজ স্লিপ হাসপাতালের জন্য প্রস্তুত' : 'Pre-hospital arrival triage files ready for emergency reception'}
            </p>
          </div>
          <span className="text-xs font-bold bg-rose-100 text-rose-900 px-2.5 py-1 rounded-full">
            {inboundERReferrals.length} {isBn ? 'টি রোগী' : 'cases'}
          </span>
        </div>

        <div className="space-y-3">
          {inboundERReferrals.map((rx) => (
            <div
              key={rx.id}
              className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 flex flex-wrap items-center justify-between gap-3 text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold bg-rose-200 text-rose-950 px-2 py-0.5 rounded text-[11px]">
                    {rx.tokenNumber}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {rx.patient.name} ({rx.patient.age}y / {rx.patient.gender})
                  </span>
                  <span className="text-rose-700 font-bold bg-white px-2 py-0.5 rounded border border-rose-300 text-[10px]">
                    CODE RED
                  </span>
                </div>
                <p className="text-slate-700 mt-1 font-medium">
                  {rx.clinicalSummary}
                </p>
                <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                  <span>BP: {rx.patient.vitals?.bp || '165/100'}</span>
                  <span>•</span>
                  <span>Pulse: {rx.patient.vitals?.pulse || '98'}</span>
                  <span>•</span>
                  <span>{rx.referralDetails?.hospitalName || 'DMCH Emergency'}</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-500 block mb-1">
                  {new Date(rx.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <span className="inline-flex items-center gap-1 font-bold text-rose-800 bg-white px-2.5 py-1 rounded border border-rose-200">
                  <Clock className="w-3 h-3 animate-spin" />
                  <span>{isBn ? 'হাসপাতালে গমনাধীন' : 'En Route / Transferring'}</span>
                </span>
              </div>
            </div>
          ))}

          {inboundERReferrals.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-500">
              {isBn ? 'বর্তমানে কোনো জরুরি কোড রেড ডিসপ্যাচ অপেক্ষমাণ নেই' : 'No active Code Red emergency transfers at this moment.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
