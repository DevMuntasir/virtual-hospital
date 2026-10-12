import { useState } from 'react';
import { ArrowRight, ArrowUpRight, FileText, Stethoscope, Building2, ShieldCheck, CalendarDays, PhoneCall } from 'lucide-react';
import { Prescription } from '../types/hospital';

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
  const [careMode, setCareMode] = useState<'appointment' | 'consultation'>('appointment');
  const [department, setDepartment] = useState('ALL');
  const specialties = [
    { id: 'ALL', name: copy('সব বিভাগ', 'All specialties') },
    { id: 'Medicine', name: copy('মেডিসিন', 'Medicine') },
    { id: 'Cardiology', name: copy('হৃদরোগ', 'Cardiology') },
    { id: 'Pediatrics', name: copy('শিশুরোগ', 'Pediatrics') },
    { id: 'Orthopedics', name: copy('হাড় ও জয়েন্ট', 'Orthopedics') },
    { id: 'Pulmonology', name: copy('বক্ষব্যাধি', 'Pulmonology') },
  ];
  return (
    <div className="patient-home">
      <section className="patient-hero" aria-labelledby="hero-heading">
        <div className="hero-emergency">
          <div className="hero-emergency-copy"><Building2 size={24} /><div><h2>{copy('জরুরি সাহায্য প্রয়োজন?', 'Need emergency help?')}</h2><p>{copy('অনলাইন পরামর্শের জন্য অপেক্ষা করবেন না।', 'Do not wait for an online consultation.')}</p></div></div>
          <div className="hero-emergency-actions"><a href="tel:999"><PhoneCall size={17} />{copy('৯৯৯ কল করুন', 'Call 999')}</a><button onClick={onEmergency}>{copy('জরুরি হাসপাতাল', 'Emergency hospitals')}<ArrowUpRight size={18} /></button></div>
        </div>
        <div className="hero-main">
          <div className="hero-introduction">
            <span className="hero-label"><span aria-hidden="true">+</span>{copy('স্বাস্থ্যসেবা / ভার্চুয়াল হাসপাতাল', 'SHASTHYASHEBA / VIRTUAL HOSPITAL')}</span>
            <h1 id="hero-heading">{copy('এখনই পরামর্শ,', 'Care for today.')}<br /><span>{copy('অথবা সময় করে', 'A visit that fits')}<br />{' '}{copy('ডাক্তার দেখান।', 'your schedule.')}</span></h1>
            <p>{copy('আপনার প্রয়োজন অনুযায়ী চিকিৎসাসেবার পরবর্তী ধাপ বেছে নিন।', 'Choose your next step, based on the care you need.')}</p>
            <a className="hero-record-link" href="#recent-heading"><FileText size={17} />{copy('আগের প্রেসক্রিপশন দেখুন', 'View previous prescriptions')}<ArrowUpRight size={16} /></a>
          </div>

          <div className="hero-care-panel">
            <fieldset className="care-mode-selector">
              <legend className="sr-only">{copy('সেবার ধরন বেছে নিন', 'Choose the type of care')}</legend>
              <label className={careMode === 'appointment' ? 'selected' : ''}><input type="radio" name="care-mode" value="appointment" checked={careMode === 'appointment'} onChange={() => setCareMode('appointment')} /><CalendarDays size={18} /><span>{copy('অ্যাপয়েন্টমেন্ট', 'Appointment')}</span></label>
              <label className={careMode === 'consultation' ? 'selected' : ''}><input type="radio" name="care-mode" value="consultation" checked={careMode === 'consultation'} onChange={() => setCareMode('consultation')} /><Stethoscope size={18} /><span>{copy('এখন পরামর্শ', 'Consult now')}</span></label>
            </fieldset>
            <div className="care-panel-content">
              {careMode === 'appointment' ? <>
                <h2>{copy('আপনার ডাক্তার খুঁজুন', 'Find your doctor')}</h2>
                <p>{copy('বিশেষজ্ঞ, চেম্বারের সময় ও ভিজিট ফি একসাথে।', 'Specialists, chamber schedules and fees in one place.')}</p>
                <label className="specialty-field" htmlFor="hero-specialty">{copy('কোন বিভাগের ডাক্তার?', 'Which specialty?')}<select id="hero-specialty" value={department} onChange={event => setDepartment(event.target.value)}>{specialties.map(specialty => <option key={specialty.id} value={specialty.id}>{specialty.name}</option>)}</select></label>
                <button className="hero-submit" onClick={() => onSpecialist(department)}>{copy('ডাক্তার ও সময়সূচি দেখুন', 'Find doctors & schedules')}<ArrowRight size={19} /></button>
                <span className="panel-footnote"><CalendarDays size={15} />{copy('ডাক্তারের তালিকা থেকে চেম্বারের সময় দেখুন', 'Check chamber hours in the doctor directory')}</span>
              </> : <>
                <h2>{copy('সমস্যা জানিয়ে শুরু করুন', 'Start with your symptoms')}</h2>
                <p>{copy('এআইয়ের প্রাথমিক মূল্যায়নের পর চিকিৎসক খসড়া প্রেসক্রিপশন যাচাই করবেন।', 'An AI-assisted assessment, followed by a doctor’s review of the draft prescription.')}</p>
                <div className="hero-token-fee"><span>{copy('প্রাথমিক ট্রায়াজ টোকেন', 'Initial triage token')}</span><strong>{copy('৳ ১০০', '৳ 100')}</strong></div>
                <button className="hero-submit" onClick={onStart}>{copy('পরামর্শ শুরু করুন', 'Start consultation')}<ArrowRight size={19} /></button>
                <span className="panel-footnote"><ShieldCheck size={15} />{copy('প্রেসক্রিপশনে চিকিৎসকের অনুমোদন আবশ্যক', 'Prescriptions require doctor approval')}</span>
              </>}
            </div>
          </div>
        </div>

      </section>

      <button className="followup-access" onClick={onReport}><span className="followup-icon"><FileText size={23} /></span><span><strong>{copy('রিপোর্ট দেখাবেন বা ফলোআপ প্রয়োজন?', 'Have a report or need a follow-up?')}</strong><small>{copy('আগের রিপোর্ট নিয়ে এখান থেকে শুরু করুন', 'Start here with your existing report')}</small></span><span className="followup-cta">{copy('রিপোর্ট দেখান', 'Review report')}<ArrowRight size={18} /></span></button>

      <section className="recent-section" aria-labelledby="recent-heading"><div className="section-heading"><div><h2 id="recent-heading">{copy('সাম্প্রতিক প্রেসক্রিপশন', 'Recent prescriptions')}</h2></div><FileText className="recent-heading-icon" size={25} /></div>
        {loading ? <p className="record-notice" role="status">{copy('প্রেসক্রিপশন লোড হচ্ছে…', 'Loading prescriptions…')}</p> : loadError ? <p className="record-notice" role="status">{copy('এই মুহূর্তে প্রেসক্রিপশন লোড করা যাচ্ছে না। পরে আবার চেষ্টা করুন।', 'Prescriptions could not be loaded. Please try again later.')}</p> : prescriptions.length ? <div className="prescription-list">{prescriptions.map(rx => <button className="prescription-row" key={rx.id} onClick={() => onPrescription(rx)}><span className="record-icon"><FileText size={20} /></span><span className="record-name"><strong>{rx.patient.name}</strong><small>{rx.tokenNumber} · {new Date(rx.createdAt).toLocaleDateString(bn ? 'bn-BD' : 'en-GB')}</small></span><span className={`record-status ${rx.status === 'PENDING_DOCTOR_APPROVAL' ? 'pending' : ''}`}>{rx.status === 'PENDING_DOCTOR_APPROVAL' ? copy('অনুমোদনের অপেক্ষায়', 'Awaiting approval') : rx.status === 'APPROVED_BY_SPECIALIST' ? copy('অনুমোদিত', 'Approved') : copy('রেফার করা হয়েছে', 'Referred')}</span><ArrowUpRight size={20} /></button>)}</div> : <div className="empty-record"><span className="record-icon"><FileText size={24} /></span><div><h3>{copy('এখনও কোনো প্রেসক্রিপশন নেই', 'No prescriptions yet')}</h3><p>{copy('পরামর্শ নেওয়ার পর প্রেসক্রিপশন ও অনুমোদনের অবস্থা এখানে পাবেন।', 'Your prescriptions and approval status will appear here after a consultation.')}</p></div><button className="text-action" onClick={onStart}>{copy('শুরু করুন', 'Get started')}<ArrowRight size={16} /></button></div>}
      </section>
    </div>
  );
}
