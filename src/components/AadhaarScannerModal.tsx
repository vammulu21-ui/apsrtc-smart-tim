import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  QrCode, 
  Camera, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Sparkles, 
  User, 
  ArrowRight,
  X,
  Send,
  Info
} from 'lucide-react';
import { DEMO_AADHAAR_DATABASE, DemoAadhaarCard } from '../data/apsrtcData';
import { AadhaarVerificationData } from '../types/tim';
import { soundEffects } from '../services/soundEffects';
import { smsService, SMSNotificationRecord } from '../services/smsService';

interface AadhaarScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVerified: (verificationData: AadhaarVerificationData, smsRecord?: SMSNotificationRecord) => void;
  currentBusNumber: string;
  currentRouteNumber: string;
  fromStopName: string;
  toStopName: string;
}

export const AadhaarScannerModal: React.FC<AadhaarScannerModalProps> = ({
  isOpen,
  onClose,
  onVerified,
  currentBusNumber,
  currentRouteNumber,
  fromStopName,
  toStopName
}) => {
  const [selectedDemoCard, setSelectedDemoCard] = useState<DemoAadhaarCard | null>(DEMO_AADHAAR_DATABASE[0]);
  const [scanState, setScanState] = useState<'IDLE' | 'SCANNING' | 'VERIFIED' | 'SMS_PREVIEW'>('IDLE');
  const [cameraActive, setCameraActive] = useState(false);
  const [lastDispatchedSMS, setLastDispatchedSMS] = useState<SMSNotificationRecord | null>(null);
  const [showIntegrationDetails, setShowIntegrationDetails] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setScanState('IDLE');
      setCameraActive(false);
      setLastDispatchedSMS(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSimulateScan = (card: DemoAadhaarCard) => {
    setSelectedDemoCard(card);
    setScanState('SCANNING');
    soundEffects.playScannerBeep();

    setTimeout(() => {
      setScanState('VERIFIED');
      soundEffects.playSuccess();
    }, 800);
  };

  const handleConfirmAndTriggerSMS = () => {
    if (!selectedDemoCard) return;

    soundEffects.playKeyClick();
    const isEligibleMahila = selectedDemoCard.gender === 'FEMALE' && selectedDemoCard.state === 'Andhra Pradesh';
    const tempTicketNumber = `PV-${Math.floor(100000 + Math.random() * 900000)}`;

    // Dispatch SMS notification workflow immediately
    const sms = smsService.dispatchDemoSMS({
      recipientPhoneMasked: selectedDemoCard.mobileMasked,
      passengerName: selectedDemoCard.name,
      maskedAadhaar: selectedDemoCard.maskedAadhaar,
      ticketNumber: tempTicketNumber,
      busNumber: currentBusNumber,
      routeNumber: currentRouteNumber,
      fromStop: fromStopName,
      toStop: toStopName,
      isZeroFare: isEligibleMahila
    });

    setLastDispatchedSMS(sms);
    setScanState('SMS_PREVIEW');
  };

  const handleFinishVerification = () => {
    if (!selectedDemoCard) return;

    const isEligibleMahila = selectedDemoCard.gender === 'FEMALE' && selectedDemoCard.state === 'Andhra Pradesh';

    const verificationPayload: AadhaarVerificationData = {
      aadhaarNumberMasked: selectedDemoCard.maskedAadhaar,
      name: selectedDemoCard.name,
      gender: selectedDemoCard.gender,
      yearOfBirth: selectedDemoCard.dob.split('-')[0],
      age: selectedDemoCard.age,
      state: selectedDemoCard.state,
      schemeName: isEligibleMahila ? 'Maha Lakshmi / Stree Shakti Free Travel' : selectedDemoCard.schemeTitle,
      verificationMethod: 'AADHAAR_SECURE_QR_DEMO',
      verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isEligibleForFreeTravel: isEligibleMahila,
      mobileNumberMasked: selectedDemoCard.mobileMasked,
      smsNotificationSent: true,
      smsNotificationId: lastDispatchedSMS?.id,
      smsTimestamp: lastDispatchedSMS?.timestamp
    };

    onVerified(verificationPayload, lastDispatchedSMS || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-bold text-white tracking-wide">Aadhaar Secure QR Verification</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  Demo Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-400">UIDAI 2048-bit RSA Secure QR Decoder Simulation</p>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Integration statutory banner */}
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 leading-snug">
            <span className="font-semibold text-amber-300">Authorisation & Privacy Notice:</span> Real Aadhaar QR decoding and Aadhaar-linked SMS delivery require registered UIDAI Sub-AUA access and telecom DLT gateways. Simulated demo data is used here.
            <button 
              onClick={() => setShowIntegrationDetails(!showIntegrationDetails)}
              className="ml-1.5 underline text-amber-300 font-semibold hover:text-amber-100"
            >
              {showIntegrationDetails ? 'Hide details' : 'View API specs'}
            </button>
          </div>
        </div>

        {showIntegrationDetails && (
          <div className="px-5 py-3 bg-slate-950/90 border-b border-slate-800 text-[11px] font-mono text-slate-300 space-y-1">
            <p className="text-emerald-400 font-semibold">API Architecture Contract:</p>
            <p>1. QR Decoder: `org.uidai.auth.qr.SecureQrV4` (2048-bit PKCS#1 v1.5 RSA)</p>
            <p>2. SMS Delivery: `APSRTC-APGOVT` via C-DAC National Mobile Governance Gateway (NMGGP)</p>
            <p>3. Passenger Data Privacy: No raw 12-digit UID stored; masked SHA-256 tokens only.</p>
          </div>
        )}

        {/* Body content based on state */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {scanState === 'IDLE' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/60 text-center">
                <div className="relative w-28 h-28 mx-auto my-2 rounded-xl bg-slate-950 border-2 border-dashed border-emerald-500/50 flex flex-col items-center justify-center group overflow-hidden">
                  <QrCode className="w-12 h-12 text-emerald-400 group-hover:scale-110 transition-transform" />
                  <span className="text-[10px] text-emerald-400/80 mt-1 font-mono">TIM SCANNER</span>
                  <div className="absolute inset-x-0 h-0.5 bg-emerald-400 shadow-[0_0_8px_#34d399] animate-bounce top-1/2" />
                </div>
                <p className="text-sm font-semibold text-white">Point TIM scanner at passenger Aadhaar card QR</p>
                <p className="text-xs text-slate-400 mt-1">Or choose a pre-configured demo passenger profile below for instant testing:</p>
              </div>

              {/* Quick Demo Aadhaar Card Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 block flex items-center justify-between">
                  <span>Realistic Sample APSRTC Passengers</span>
                  <span className="text-[10px] text-slate-400 font-normal">Click to simulate scan</span>
                </label>
                <div className="grid grid-cols-1 gap-2.5">
                  {DEMO_AADHAAR_DATABASE.map(card => (
                    <button
                      key={card.id}
                      onClick={() => handleSimulateScan(card)}
                      className="w-full text-left p-3.5 rounded-xl border border-slate-700/70 bg-slate-800/40 hover:bg-slate-800 hover:border-emerald-500/50 transition-all flex items-center justify-between group cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${card.avatarBg} text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-md`}>
                          {card.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition-colors">
                              {card.name}
                            </span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-700 text-slate-300 font-mono">
                              {card.gender === 'FEMALE' ? 'F' : 'M'}, {card.age}y
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 font-mono mt-0.5 flex items-center gap-2">
                            <span>{card.maskedAadhaar}</span>
                            <span>•</span>
                            <span className={card.gender === 'FEMALE' ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                              {card.schemeTitle}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="text-xs px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 group-hover:bg-emerald-500 group-hover:text-slate-950 font-semibold transition-all flex items-center gap-1">
                          Scan <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Hardware barcode scanner option */}
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-slate-500" />
                  TIM Optical Scanner Ready
                </span>
                <span className="text-[11px] text-emerald-400 font-mono">PORT: /dev/ttyS0 (2D-CMOS)</span>
              </div>
            </div>
          )}

          {scanState === 'SCANNING' && (
            <div className="py-12 flex flex-col items-center justify-center space-y-4">
              <div className="w-20 h-20 rounded-full border-4 border-slate-700 border-t-emerald-500 animate-spin flex items-center justify-center">
                <QrCode className="w-8 h-8 text-emerald-400" />
              </div>
              <div className="text-center">
                <h4 className="text-base font-bold text-white">Decoding Secure QR Payload...</h4>
                <p className="text-xs text-slate-400 mt-1 font-mono">Verifying UIDAI 2048-bit digital signature</p>
              </div>
            </div>
          )}

          {scanState === 'VERIFIED' && selectedDemoCard && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-emerald-300">Aadhaar Secure QR Successfully Verified</h4>
                  <p className="text-xs text-emerald-400/80">UIDAI Digital Certificate: AP-UIDAI-SIGN-VALID</p>
                </div>
              </div>

              {/* Verified Card Details */}
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700 space-y-3">
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl ${selectedDemoCard.avatarBg} text-white font-bold text-lg flex items-center justify-center shadow-md`}>
                      {selectedDemoCard.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-base text-white">{selectedDemoCard.name}</div>
                      <div className="text-xs text-slate-400">{selectedDemoCard.teluguName}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                      Signature OK
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block">Masked Aadhaar:</span>
                    <span className="font-mono font-bold text-slate-200 text-sm">{selectedDemoCard.maskedAadhaar}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Gender & Age:</span>
                    <span className="font-semibold text-slate-200">{selectedDemoCard.gender}, {selectedDemoCard.age} yrs</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Domicile State:</span>
                    <span className="font-semibold text-slate-200">{selectedDemoCard.state}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block">Mobile (Aadhaar-Linked):</span>
                    <span className="font-mono text-slate-200">{selectedDemoCard.mobileMasked}</span>
                  </div>
                </div>

                {/* Eligibility verdict banner */}
                <div className="mt-2 p-3 rounded-lg bg-slate-900 border border-slate-700 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-slate-400 uppercase font-semibold">Fare Entitlement:</span>
                    <div className="font-bold text-sm text-emerald-400">
                      {selectedDemoCard.gender === 'FEMALE' && selectedDemoCard.state === 'Andhra Pradesh'
                        ? '100% Free Travel (Maha Lakshmi Scheme)'
                        : selectedDemoCard.schemeTitle}
                    </div>
                  </div>
                  <Sparkles className="w-5 h-5 text-emerald-400" />
                </div>
              </div>

              {/* Action */}
              <button
                onClick={handleConfirmAndTriggerSMS}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-98 transition-all"
              >
                <Send className="w-4 h-4" />
                Confirm & Dispatch Immediate SMS Notification
              </button>
            </div>
          )}

          {scanState === 'SMS_PREVIEW' && lastDispatchedSMS && selectedDemoCard && (
            <div className="space-y-4 animate-in fade-in duration-300">
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                  <Smartphone className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-blue-300">Immediate SMS Notification Dispatched</h4>
                  <p className="text-xs text-blue-400/80">Delivered to passenger's Aadhaar-linked mobile</p>
                </div>
              </div>

              {/* Mobile Phone Mockup for SMS preview */}
              <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 space-y-3 font-sans">
                <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-mono text-slate-300">SENDER: VK-APSRTC</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{lastDispatchedSMS.timestamp}</span>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-700/80 text-xs text-slate-200 leading-relaxed font-mono">
                  {lastDispatchedSMS.messageContent}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>To: <strong className="text-slate-200 font-mono">{lastDispatchedSMS.recipientPhoneMasked}</strong></span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-semibold">
                    DELIVERY ACKNOWLEDGED
                  </span>
                </div>
              </div>

              {/* Finalise ticket generation */}
              <button
                onClick={handleFinishVerification}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/30 cursor-pointer active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                Apply Concession & Issue Ticket
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
          <span>APSRTC TIM Secure Enclave v4.2</span>
          <span>UIDAI Certified Specification</span>
        </div>
      </div>
    </div>
  );
};
