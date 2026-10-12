import React, { useState } from 'react';
import { X, Sparkles, Activity, ArrowRight } from 'lucide-react';
import { PatientInfo } from '../types/hospital';

interface TokenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { patient: PatientInfo; chiefComplaint: string; paymentMethod: string }) => void;
  language: 'bn' | 'en';
}

export const TokenModal: React.FC<TokenModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  language,
}) => {
  const isBn = language === 'bn';

  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [phone, setPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Card' | 'Hospital_Counter'>('bKash');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleCreateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !name.trim() || !phone.trim()) return;
    setIsSubmitting(true);

    const patientInfo: PatientInfo = {
      name: name.trim(),
      age: Number(age),
      phone: phone.trim(),
    };

    setTimeout(() => {
      onSubmit({
        patient: patientInfo,
        chiefComplaint: '',
        paymentMethod,
      });
      setIsSubmitting(false);
    }, 400);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
          
            <div>
              <h3 className="text-lg font-bold">
                {isBn ? 'জরুরি জিপি টিকিট' : 'Emergency AI GP Ticket'}
              </h3>
              {/* <p className="text-xs text-teal-100">
                {isBn ? 'চেম্বারের ভিড় এড়িয়ে তাৎক্ষণিক প্রাথমিক ক্লিনিক্যাল ইনভেস্টিগেশন' : 'Skip physical chamber queues with instant AI doctor investigation'}
              </p> */}
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleCreateToken} className="p-6 space-y-5">
          {/* Patient Details */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">
              {isBn ? '১. রোগীর মৌলিক তথ্য' : '1. Patient Demographics'}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'রোগীর পূর্ণ নাম *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  placeholder={isBn ? 'যেমন: মোঃ আব্দুল্লাহ' : 'Full name'}
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'বয়স *' : 'Age *'}
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  max={120}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {isBn ? 'মোবাইল নম্বর *' : 'Phone Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500"
                  placeholder="01XXXXXXXXX"
                />
              </div>

            </div>
          </div>

          {/* <p className="text-sm text-teal-800 bg-teal-50 border border-teal-100 rounded-xl p-3">
            {isBn
              ? 'টিকিটের জন্য শুধু নাম, বয়স ও মোবাইল নম্বর দিন। এরপর AI আপনার প্রধান সমস্যা, উপসর্গ ও অন্যান্য প্রয়োজনীয় তথ্য একে একে জিজ্ঞেস করবে। আপনি লিখে বা কথা বলে উত্তর দিতে পারবেন।'
              : 'Only your name, age and mobile number are needed for a ticket. The AI will then ask about your main concern, symptoms and other necessary details step by step. You can type or speak your answers.'}
          </p> */}

          {/* Token Fee & Payment Method */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700">
                {isBn ? 'ভার্চুয়াল ফি:' : 'Virtual Fee:'}
              </span>
              <span className="text-sm font-bold text-teal-700 bg-teal-100/70 px-2.5 py-0.5 rounded">
                ৳ ১০০ (১০০ টাকা)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mb-3">
              {isBn
                ? 'এই ফি দিয়ে আপনি পাবেন তাৎক্ষণিক এআই জিপি ডাক্তার কনসালটেশন ও বিশেষায়িত খসড়া প্রেসক্রিপশন যা অন-ডিউটি স্পেশালিস্ট ডাক্তার দ্বারা যাচাই হবে।'
                : 'Includes live AI triage investigation and structured clinical draft prescription routed to on-duty specialists.'}
            </p>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'bKash', name: 'bKash (বিকাশ)' },
                { id: 'Nagad', name: 'Nagad (নগদ)' },
                { id: 'Hospital_Counter', name: isBn ? 'জরুরি ওয়েভার (Free)' : 'Emergency Waiver' },
              ].map((method) => (
                <button
                  key={method.id}
                  type="button"
                  onClick={() => setPaymentMethod(method.id as any)}
                  className={`text-xs py-2 px-2 rounded-lg border text-center transition-all ${
                    paymentMethod === method.id
                      ? 'border-teal-600 bg-teal-50 text-teal-900 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {paymentMethod === method.id && '✓ '}
                  {method.name}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              {isBn ? 'বাতিল' : 'Cancel'}
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-xs transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {/* <Sparkles className="w-4 h-4 text-amber-300" /> */}
              <span>
                {isSubmitting
                  ? (isBn ? 'টোকেন প্রস্তুত হচ্ছে...' : 'Issuing Token...')
                  : (isBn ? 'ডাক্তারের কাছে যান' : 'Start Triage')}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
