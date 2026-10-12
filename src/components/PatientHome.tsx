import { lazy, Suspense } from 'react';
import { ArrowRight, ArrowUpRight, FileText, Stethoscope, HeartPulse, CalendarDays, PhoneCall } from 'lucide-react';
import { Prescription } from '../types/hospital';

const HospitalReception = lazy(() => import('./HospitalReception'));

interface Props {
  language: 'bn' | 'en';
  prescriptions: Prescription[];
  loading: boolean;
  loadError: boolean;
  onStart: () => void;
  onReport: () => void;
  onSpecialist: (department: string) => void;
  onEmergency: () => void;
  onPrescription: (prescription: Prescription) => void;
}

export function PatientHome({ language, prescriptions, loading, loadError, onStart, onReport, onSpecialist, onEmergency, onPrescription }: Props) {
  const bn = language === 'bn';
  const copy = (bangla: string, english: string) => bn ? bangla : english;
  return (
    <div className="patient-home">
      <section className="reception-hero" aria-labelledby="hero-heading">
        <div className="reception-heading">
          <span className="reception-eyebrow"><span />{copy('আপনার ভার্চুয়াল হাসপাতাল', 'YOUR VIRTUAL HOSPITAL')}</span>
          <h1 id="hero-heading">{copy('স্বাস্থ্যসেবার রিসেপশনে স্বাগতম', 'Welcome to your hospital.')}</h1>
          <p>{copy('কী ধরনের সেবা প্রয়োজন? নিচের একটি পথ বেছে নিন।', 'How can we help you today? Choose your next step below.')}</p>
        </div>
        <div className="reception-stage">
          <div className="reception-visual" aria-hidden="true"><Suspense fallback={null}><HospitalReception /></Suspense></div>
          <div className="reception-paths">
            <button className="reception-path emergency-path" onClick={onEmergency}>
              <span className="path-topline"><span className="path-icon"><HeartPulse size={27} /></span><span>01 / {copy('জরুরি বিভাগ', 'EMERGENCY')}</span></span>
              <strong>{copy('জরুরি সেবা', 'Emergency')}</strong>
              <span className="path-description">{copy('জরুরি চিকিৎসার জন্য হাসপাতাল খুঁজুন।', 'Find a hospital for urgent medical care.')}</span>
              <span className="path-next">{copy('জরুরি হাসপাতাল দেখুন', 'Find emergency care')}<ArrowRight size={20} /></span>
            </button>
            <button type="button" className="reception-desk-label reception-gp-button" onClick={onStart} aria-haspopup="dialog">
              <strong><HeartPulse size={19} />{copy('ইমার্জেন্সি', 'Emergency')}<ArrowRight size={17} /></strong>
              <small>{copy('AI-সহায়িত GP পরামর্শ · ৳ ১০০', 'AI-assisted GP consultation · ৳ 100')}</small>
            </button>
            <button className="reception-path schedule-path" onClick={() => onSpecialist('ALL')}>
              <span className="path-topline"><span className="path-icon"><CalendarDays size={27} /></span><span>02 / {copy('অ্যাপয়েন্টমেন্ট', 'APPOINTMENTS')}</span></span>
              <strong>{copy('সময় নিয়ে ডাক্তার দেখান', 'Schedule Book')}</strong>
              <span className="path-description">{copy('বিশেষজ্ঞ ডাক্তার, চেম্বারের সময় ও ফি দেখুন।', 'Explore specialists, chamber hours and visit fees.')}</span>
              <span className="path-next">{copy('ডাক্তার ও সময়সূচি দেখুন', 'Find doctors & schedules')}<ArrowRight size={20} /></span>
            </button>
          </div>
          <div className="reception-floor-label" aria-hidden="true">{copy('স্বাস্থ্যসেবা', 'SHASTHYASHEBA')}<span>VIRTUAL HOSPITAL</span></div>
        </div>
        <div className="reception-helpbar">
          <span><PhoneCall size={16} />{copy('জীবনসংকট হলে', 'Life-threatening emergency?')} <a href="tel:999">{copy('৯৯৯ কল করুন', 'Call 999')}<ArrowUpRight size={14} /></a></span>
          <button onClick={onStart}><Stethoscope size={17} />{copy('অনলাইন পরামর্শ নিন · ৳ ১০০', 'Start online consultation · ৳ 100')}<ArrowRight size={16} /></button>
        </div>
      </section>

      <button className="followup-access" onClick={onReport}><span className="followup-icon"><FileText size={23} /></span><span><strong>{copy('রিপোর্ট দেখাবেন বা ফলোআপ প্রয়োজন?', 'Have a report or need a follow-up?')}</strong><small>{copy('আগের রিপোর্ট নিয়ে এখান থেকে শুরু করুন', 'Start here with your existing report')}</small></span><span className="followup-cta">{copy('রিপোর্ট দেখান', 'Review report')}<ArrowRight size={18} /></span></button>

      <section className="recent-section" aria-labelledby="recent-heading"><div className="section-heading"><div><h2 id="recent-heading">{copy('সাম্প্রতিক প্রেসক্রিপশন', 'Recent prescriptions')}</h2></div><FileText className="recent-heading-icon" size={25} /></div>
        {loading ? <p className="record-notice" role="status">{copy('প্রেসক্রিপশন লোড হচ্ছে…', 'Loading prescriptions…')}</p> : loadError ? <p className="record-notice" role="status">{copy('এই মুহূর্তে প্রেসক্রিপশন লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন।', 'Prescriptions could not be loaded. Please try again later.')}</p> : prescriptions.length ? <div className="prescription-list">{prescriptions.map(rx => <button className="prescription-row" key={rx.id} onClick={() => onPrescription(rx)}><span className="record-icon"><FileText size={20} /></span><span className="record-name"><strong>{rx.patient.name}</strong><small>{rx.tokenNumber} · {new Date(rx.createdAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB')}</small></span><span className={`record-status ${rx.status === 'PENDING_DOCTOR_APPROVAL' ? 'pending' : ''}`}>{rx.status === 'PENDING_DOCTOR_APPROVAL' ? copy('অনুমোদনের অপেক্ষায়', 'Awaiting approval') : rx.status === 'APPROVED_BY_SPECIALIST' ? copy('অনুমোদিত', 'Approved') : copy('রেফার করা হয়েছে', 'Referred')}</span><ArrowUpRight size={20} /></button>)}</div> : <div className="empty-record"><span className="record-icon"><FileText size={24} /></span><div><h3>{copy('এখনও কোনো প্রেসক্রিপশন নেই', 'No prescriptions yet')}</h3><p>{copy('পরামর্শ নেওয়ার পর প্রেসক্রিপশন ও অনুমোদনের অবস্থা এখানে পাবেন।', 'Your prescriptions and approval status will appear here after a consultation.')}</p></div><button className="text-action" onClick={onStart}>{copy('শুরু করুন', 'Get started')}<ArrowRight size={16} /></button></div>}
      </section>
    </div>
  );
}
