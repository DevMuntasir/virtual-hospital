import { lazy, Suspense } from 'react';
import { ArrowRight, ArrowLeft, ArrowUpRight, FileText, Stethoscope, HeartPulse, CalendarDays, PhoneCall } from 'lucide-react';
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
          {/* <span className="reception-eyebrow"><span />{copy('আপনার ভার্চুয়াল হাসপাতাল', 'YOUR VIRTUAL HOSPITAL')}</span> */}
          <h1 id="hero-heading">{copy('স্বাস্থ্যসেবার রিসেপশনে স্বাগতম', 'Welcome to your hospital.')}</h1>
          <p>{copy('কী ধরনের সেবা প্রয়োজন? নিচের একটি পথ বেছে নিন।', 'How can we help you today? Choose your next step below.')}</p>
        </div>

        <div className="reception-stage">
          <div className="reception-visual" aria-hidden="true">
            <Suspense fallback={null}>
              <HospitalReception />
            </Suspense>
          </div>

          {/* Hospital Directional Signboards (দিকনির্দেশক সাইনবোর্ড) on the upper two sides */}
          <div className="reception-wayfinding">
            <button
              type="button"
              className="hospital-signboard emergency-signboard"
              onClick={onEmergency}
              aria-label={copy('জরুরি সেবা - হাসপাতাল খুঁজুন', 'Emergency Care - Find Hospital')}
            >
              <span className="signboard-pin" aria-hidden="true" />
              <div className="signboard-arrow-wrap" aria-hidden="true">
                <ArrowLeft size={16} />
              </div>
              <div className="signboard-body">
                <div className="signboard-header">
                  {/* <span className="signboard-badge emergency-badge">
                    <HeartPulse size={12} /> {copy('জরুরি বিভাগ', 'EMERGENCY')}
                  </span> */}
                  {/* <span className="signboard-wing">{copy('উইং-এ', 'WING-A')}</span> */}
                </div>
                <strong className="signboard-title">{copy('জরুরি বিভাগ', 'Emergency Care')}</strong>
                <span className="signboard-hint">{copy('জরুরি হাসপাতাল খুঁজুন', 'Find urgent hospital')}</span>
              </div>
            </button>

            <button
              type="button"
              className="hospital-signboard schedule-signboard"
              onClick={() => onSpecialist('ALL')}
              aria-label={copy('সময় নিয়ে ডাক্তার দেখান - বিশেষজ্ঞ ও চেম্বার', 'Doctor Appointments - Specialists')}
            >
              <span className="signboard-pin" aria-hidden="true" />
              <div className="signboard-body">
                <div className="signboard-header">
                  {/* <span className="signboard-wing">{copy('উইং-বি', 'WING-B')}</span> */}
                  {/* <span className="signboard-badge schedule-badge">
                    <CalendarDays size={12} /> {copy('ওপিডি চেম্বার', 'OPD CLINIC')}
                  </span> */}
                </div>
                <strong className="signboard-title">{copy('সময় নিয়ে ডাক্তার', 'Schedule Doctor')}</strong>
                <span className="signboard-hint">{copy('বিশেষজ্ঞ ও চেম্বার সময়', 'Specialists & hours')}</span>
              </div>
              <div className="signboard-arrow-wrap" aria-hidden="true">
                <ArrowRight size={16} />
              </div>
            </button>
          </div>

          {/* Center Reception Desk GP Consultation Button */}
          <div className="reception-center-action">
            <button
              type="button"
              className="reception-gp-button"
              onClick={onStart}
              aria-haspopup="dialog"
            >
              {/* <div className="gp-button-status">
                <span className="gp-live-dot" />
                <span>{copy('রিসেপশন ডেস্ক · তাৎক্ষণিক সেবা', 'RECEPTION DESK · IMMEDIATE CARE')}</span>
              </div> */}
              <div className="gp-button-content">
                <span className="gp-button-icon">
                  <HeartPulse size={20} />
                </span>
                <span className="gp-button-label">
                  <strong>{copy('ইমার্জেন্সি GP পরামর্শ', 'Emergency GP Consultation')}</strong>
                  <small>{copy('AI-সহায়িত তাৎক্ষণিক চিকিৎসা পরামর্শ · ৳ ১০০', 'AI-assisted immediate medical triage · ৳ 100')}</small>
                </span>
                <span className="gp-button-arrow">
                  <ArrowRight size={18} />
                </span>
              </div>
            </button>
          </div>

          {/* <div className="reception-floor-label" aria-hidden="true">
            {copy('স্বাস্থ্যসেবা', 'SHASTHYASHEBA')}
            <span>VIRTUAL HOSPITAL</span>
          </div> */}
        </div>

        <div className="reception-helpbar">
          <span>
            <PhoneCall size={16} />
            {copy('জীবনসংকট হলে', 'Life-threatening emergency?')} <a href="tel:999">{copy('৯৯৯ কল করুন', 'Call 999')}<ArrowUpRight size={14} /></a>
          </span>
          <button onClick={onStart}>
            <Stethoscope size={17} />
            {copy('অনলাইন পরামর্শ নিন · ৳ ১০০', 'Start online consultation · ৳ 100')}
            <ArrowRight size={16} />
          </button>
        </div>
      </section>

      <button className="followup-access" onClick={onReport}>
        <span className="followup-icon"><FileText size={23} /></span>
        <span>
          <strong>{copy('রিপোর্ট দেখাবেন বা ফলোআপ প্রয়োজন?', 'Have a report or need a follow-up?')}</strong>
          <small>{copy('আগের রিপোর্ট নিয়ে এখান থেকে শুরু করুন', 'Start here with your existing report')}</small>
        </span>
        <span className="followup-cta">
          {copy('রিপোর্ট দেখান', 'Review report')}
          <ArrowRight size={18} />
        </span>
      </button>

      <section className="recent-section" aria-labelledby="recent-heading">
        <div className="section-heading">
          <div>
            <h2 id="recent-heading">{copy('সাম্প্রতিক প্রেসক্রিপশন', 'Recent prescriptions')}</h2>
          </div>
          <FileText className="recent-heading-icon" size={25} />
        </div>
        {loading ? (
          <p className="record-notice" role="status">{copy('প্রেসক্রিপশন লোড হচ্ছে…', 'Loading prescriptions…')}</p>
        ) : loadError ? (
          <p className="record-notice" role="status">{copy('এই মুহূর্তে প্রেসক্রিপশন লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন।', 'Prescriptions could not be loaded. Please try again later.')}</p>
        ) : prescriptions.length ? (
          <div className="prescription-list">
            {prescriptions.map(rx => (
              <button className="prescription-row" key={rx.id} onClick={() => onPrescription(rx)}>
                <span className="record-icon"><FileText size={20} /></span>
                <span className="record-name">
                  <strong>{rx.patient.name}</strong>
                  <small>{rx.tokenNumber} · {new Date(rx.createdAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB')}</small>
                </span>
                <span className={`record-status ${rx.status === 'PENDING_DOCTOR_APPROVAL' ? 'pending' : ''}`}>
                  {rx.status === 'PENDING_DOCTOR_APPROVAL' ? copy('অনুমোদনের অপেক্ষায়', 'Awaiting approval') : rx.status === 'APPROVED_BY_SPECIALIST' ? copy('অনুমোদিত', 'Approved') : copy('রেফার করা হয়েছে', 'Referred')}
                </span>
                <ArrowUpRight size={20} />
              </button>
            ))}
          </div>
        ) : (
          <div className="empty-record">
            <span className="record-icon"><FileText size={24} /></span>
            <div>
              <h3>{copy('এখনও কোনো প্রেসক্রিপশন নেই', 'No prescriptions yet')}</h3>
              <p>{copy('পরামর্শ নেওয়ার পর প্রেসক্রিপশন ও অনুমোদনের অবস্থা এখানে পাবেন।', 'Your prescriptions and approval status will appear here after a consultation.')}</p>
            </div>
            <button className="text-action" onClick={onStart}>
              {copy('শুরু করুন', 'Get started')}
              <ArrowRight size={16} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
