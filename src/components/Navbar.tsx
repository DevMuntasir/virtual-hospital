import { Activity, Stethoscope, Building2, PhoneCall, Globe2, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  currentView: 'patient' | 'doctor' | 'hospital';
  setCurrentView: (view: 'patient' | 'doctor' | 'hospital') => void;
  language: 'bn' | 'en';
  setLanguage: (lang: 'bn' | 'en') => void;
  onOpenTokenModal: () => void;
  pendingDoctorApprovalsCount: number;
}

export function Navbar({ currentView, setCurrentView, language, setLanguage, onOpenTokenModal, pendingDoctorApprovalsCount }: NavbarProps) {
  const bn = language === 'bn';
  return <header className="site-header">
    {/* <div className="emergency-strip"><div><span><Activity size={14} />{bn ? 'জরুরি অবস্থায় অনলাইন পরামর্শের জন্য অপেক্ষা করবেন না।' : 'In an emergency, do not wait for an online consultation.'}</span><a href="tel:999"><PhoneCall size={14} />{bn ? 'জরুরি কল ৯৯৯' : 'Emergency 999'}<ArrowUpRight size={13} /></a></div></div> */}
    <div className="main-navigation">
      <button className="brand" onClick={() => setCurrentView('patient')} aria-label={bn ? 'স্বাস্থ্যসেবা হোম' : 'ShasthyaSheba home'}><span className="brand-mark"><Activity size={26} /></span><span><strong>{bn ? 'স্বাস্থ্যসেবা' : 'ShasthyaSheba'}<i /></strong><small>{bn ? 'যত্নের শুরু এখানেই' : 'Your care starts here'}</small></span></button>
      <nav className="primary-navigation" aria-label={bn ? 'প্রধান নেভিগেশন' : 'Main navigation'}>
        <button aria-current={currentView === 'patient' ? 'page' : undefined} onClick={() => setCurrentView('patient')}>{bn ? 'হোম' : 'Home'}</button>
        <button aria-current={currentView === 'hospital' ? 'page' : undefined} onClick={() => setCurrentView('hospital')}><Building2 size={16} />{bn ? 'হাসপাতাল' : 'Hospitals'}</button>
        <button aria-current={currentView === 'doctor' ? 'page' : undefined} onClick={() => setCurrentView('doctor')}><Stethoscope size={16} />{bn ? 'ডাক্তার পোর্টাল' : 'Doctor portal'}{pendingDoctorApprovalsCount > 0 && <span className="approval-count">{pendingDoctorApprovalsCount}</span>}</button>
      </nav>
      <div className="navigation-actions"><button className="language-button" onClick={() => setLanguage(bn ? 'en' : 'bn')} aria-label={bn ? 'Switch to English' : 'বাংলায় দেখুন'}><Globe2 size={16} />{bn ? 'English' : 'বাংলা'}</button><button className="nav-start" onClick={onOpenTokenModal}>{bn ? 'পরামর্শ নিন' : 'Get care'}<ArrowUpRight size={16} /></button></div>
    </div>
  </header>;
}
