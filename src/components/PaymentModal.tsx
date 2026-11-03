import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Banknote, 
  QrCode, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  RefreshCw, 
  Clock, 
  X,
  CreditCard,
  IndianRupee,
  ShieldCheck
} from 'lucide-react';
import { soundEffects } from '../services/soundEffects';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalAmount: number;
  ticketNumber: string;
  routeName: string;
  conductorId: string;
  onPaymentSuccess: (paymentMethod: 'CASH' | 'UPI', details: {
    tendered?: number;
    change?: number;
    upiRef?: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  totalAmount,
  ticketNumber,
  routeName,
  conductorId,
  onPaymentSuccess
}) => {
  const [method, setMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [cashTendered, setCashTendered] = useState<number>(totalAmount);
  const [upiQrDataUrl, setUpiQrDataUrl] = useState<string>('');
  const [upiTimeRemaining, setUpiTimeRemaining] = useState<number>(180);
  const [upiStatus, setUpiStatus] = useState<'WAITING' | 'RECEIVED' | 'FAILED'>('WAITING');
  const [upiTransactionRef, setUpiTransactionRef] = useState<string>('');
  const [showIntegrationDetails, setShowIntegrationDetails] = useState(false);

  // Quick cash tender options
  const tenderOptions = [
    totalAmount,
    Math.ceil(totalAmount / 50) * 50,
    Math.ceil(totalAmount / 100) * 100,
    200,
    500
  ].filter((v, idx, arr) => v >= totalAmount && arr.indexOf(v) === idx);

  useEffect(() => {
    if (isOpen) {
      setMethod('CASH');
      setCashTendered(totalAmount);
      setUpiStatus('WAITING');
      setUpiTimeRemaining(180);

      // Generate dynamic UPI URI
      const ref = `APSRTC${Date.now().toString().slice(-8)}`;
      setUpiTransactionRef(ref);
      
      const upiUrl = `upi://pay?pa=apsrtc.${conductorId.toLowerCase()}@sbi&pn=APSRTC&am=${totalAmount}.00&cu=INR&tn=Ticket-${ticketNumber}&tr=${ref}`;
      
      QRCode.toDataURL(upiUrl, {
        width: 260,
        margin: 1,
        color: {
          dark: '#020617',
          light: '#ffffff'
        }
      }).then(url => {
        setUpiQrDataUrl(url);
      }).catch(err => {
        console.error('QR Gen error', err);
      });
    }
  }, [isOpen, totalAmount, ticketNumber, conductorId]);

  // UPI countdown timer
  useEffect(() => {
    if (!isOpen || method !== 'UPI' || upiStatus !== 'WAITING') return;

    const timer = setInterval(() => {
      setUpiTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, method, upiStatus]);

  if (!isOpen) return null;

  const changeDue = Math.max(0, cashTendered - totalAmount);

  const handleCashConfirm = () => {
    if (cashTendered < totalAmount) {
      soundEffects.playErrorBuzz();
      return;
    }
    soundEffects.playSuccess();
    onPaymentSuccess('CASH', {
      tendered: cashTendered,
      change: changeDue
    });
  };

  const handleSimulateUpiSuccess = () => {
    soundEffects.playScannerBeep();
    setUpiStatus('RECEIVED');
    setTimeout(() => {
      soundEffects.playSuccess();
      onPaymentSuccess('UPI', {
        upiRef: upiTransactionRef
      });
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden text-slate-100 font-sans">
        
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-400 font-mono">TICKET #{ticketNumber}</div>
            <div className="text-lg font-bold text-white flex items-center gap-1.5">
              <span>Collect Fare:</span>
              <span className="text-emerald-400 text-2xl font-black">₹{totalAmount}</span>
            </div>
          </div>
          <button 
            onClick={() => { soundEffects.playKeyClick(); onClose(); }}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Method Switcher tabs */}
        <div className="grid grid-cols-2 p-1.5 bg-slate-950/60 border-b border-slate-800">
          <button
            onClick={() => { soundEffects.playKeyClick(); setMethod('CASH'); }}
            className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              method === 'CASH'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Banknote className="w-4 h-4" />
            Cash Payment
          </button>
          <button
            onClick={() => { soundEffects.playKeyClick(); setMethod('UPI'); }}
            className={`py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              method === 'UPI'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            Dynamic UPI QR
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {method === 'CASH' ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Total Ticket Fare:</span>
                  <span className="font-mono font-bold text-lg text-white">₹{totalAmount}</span>
                </div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                  <span className="text-xs text-slate-400">Cash Received:</span>
                  <span className="font-mono font-bold text-lg text-emerald-400">₹{cashTendered}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-semibold text-amber-300">Return Change to Passenger:</span>
                  <span className="font-mono font-black text-2xl text-amber-400">
                    ₹{changeDue}
                  </span>
                </div>
              </div>

              {/* Quick Cash Tender Pills */}
              <div>
                <label className="text-xs font-semibold text-slate-400 block mb-2">
                  Quick Cash Received Preset:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {tenderOptions.map(amt => (
                    <button
                      key={amt}
                      onClick={() => { soundEffects.playKeyClick(); setCashTendered(amt); }}
                      className={`py-2.5 rounded-lg border text-sm font-bold font-mono transition-all ${
                        cashTendered === amt
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
                          : 'bg-slate-800 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      ₹{amt}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Cash Tender Keypad */}
              <div className="grid grid-cols-3 gap-1.5 pt-2">
                {[10, 20, 50, 100, 200, 500].map(addVal => (
                  <button
                    key={addVal}
                    onClick={() => { soundEffects.playKeyClick(); setCashTendered(prev => prev + addVal); }}
                    className="py-2 rounded bg-slate-800/80 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700"
                  >
                    +{addVal}
                  </button>
                ))}
              </div>

              <button
                onClick={handleCashConfirm}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40 cursor-pointer active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-5 h-5" />
                Confirm Cash & Print Thermal Ticket
              </button>
            </div>
          ) : (
            <div className="space-y-4 text-center">
              {/* Integration Disclaimer */}
              <div className="p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-left text-xs text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="leading-tight">
                  <strong className="font-semibold text-amber-200">Integration Notice:</strong> Real-time automated UPI settlement requires bank merchant PSP webhooks. The QR code below is valid for testing.
                </div>
              </div>

              {/* Dynamic UPI QR Container */}
              <div className="p-4 rounded-2xl bg-white border border-slate-700 inline-block mx-auto shadow-xl">
                {upiQrDataUrl ? (
                  <img src={upiQrDataUrl} alt="APSRTC Dynamic UPI QR" className="w-52 h-52 mx-auto" />
                ) : (
                  <div className="w-52 h-52 flex items-center justify-center bg-slate-100 text-slate-400 text-xs">
                    Generating dynamic UPI QR...
                  </div>
                )}
                <div className="mt-2 text-slate-900 font-mono font-bold text-base">
                  ₹{totalAmount}.00
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  apsrtc.{conductorId.toLowerCase()}@sbi
                </div>
              </div>

              {/* Status and Timer */}
              <div className="flex items-center justify-center gap-4 text-xs font-mono text-slate-300">
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Expires in {Math.floor(upiTimeRemaining / 60)}:{(upiTimeRemaining % 60).toString().padStart(2, '0')}
                </span>
                <span className="text-slate-600">|</span>
                <span className="text-blue-400">Ref: {upiTransactionRef}</span>
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={handleSimulateUpiSuccess}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-900/40 cursor-pointer active:scale-98 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Simulate Bank UPI Payment Received Callback
                </button>

                <button
                  onClick={() => {
                    soundEffects.playKeyClick();
                    onPaymentSuccess('UPI', { upiRef: upiTransactionRef });
                  }}
                  className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Conductor Manual Override (Cash/UPI verified)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
          <span>APSRTC Secure Payment Terminal</span>
          <span className="font-mono">NPCI / SBI Merchant Demo</span>
        </div>
      </div>
    </div>
  );
};
