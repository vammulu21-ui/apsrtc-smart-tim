import React, { useState, useMemo, useEffect } from 'react';
import QRCode from 'qrcode';
import { 
  Bus, 
  MapPin, 
  Users, 
  Printer, 
  Banknote, 
  QrCode, 
  Plus, 
  Minus, 
  ArrowLeft, 
  AlertCircle, 
  Sliders, 
  Sparkles,
  Lock,
  CheckCircle2,
  ChevronRight,
  RotateCcw
} from 'lucide-react';
import { 
  ActiveTrip, 
  BusStop, 
  TicketCategory, 
  PassengerTicket, 
  ConductorSession 
} from '../types/tim';
import { 
  DEMO_ROUTES, 
  calculateApsrtcTicketFare, 
  generateCollisionResistantTicketId 
} from '../data/apsrtcData';
import { soundEffects } from '../services/soundEffects';
import { localDb } from '../services/db';
import { ActiveTripBanner } from './ActiveTripBanner';

interface TicketIssuingScreenProps {
  session: ConductorSession;
  activeTrip: ActiveTrip;
  onBack: () => void;
  onTicketGenerated: (ticket: PassengerTicket) => void;
  onOpenFareChart: () => void;
  onOpenTripSetup: () => void;
  onOpenTripCorrection: () => void;
  onEndTrip: () => void;
  lang: 'en' | 'te';
}

export const TicketIssuingScreen: React.FC<TicketIssuingScreenProps> = ({
  session,
  activeTrip,
  onBack,
  onTicketGenerated,
  onOpenFareChart,
  onOpenTripSetup,
  onOpenTripCorrection,
  onEndTrip,
  lang
}) => {
  // Current route from Active Trip
  const currentRoute = useMemo(() => {
    return DEMO_ROUTES.find(r => r.routeId === activeTrip.routeId) || DEMO_ROUTES[0];
  }, [activeTrip.routeId]);

  // Locked FROM stop from Active Trip
  const lockedFromStop = activeTrip.startingFromStop;

  // VALIDATION: Only allow TO stops that occur after the starting FROM stop along the route
  const availableToStops = useMemo(() => {
    const afterStops = currentRoute.stops.filter(
      s => s.stageNumber > lockedFromStop.stageNumber
    );
    // If bus is near terminal or custom route, fallback to excluding same stop
    return afterStops.length > 0
      ? afterStops
      : currentRoute.stops.filter(s => s.id !== lockedFromStop.id);
  }, [currentRoute.stops, lockedFromStop]);

  // Selected TO stop (defaults to first available downstream stop)
  const [selectedToStopId, setSelectedToStopId] = useState<string>(
    availableToStops[0]?.id || currentRoute.stops[currentRoute.stops.length - 1].id
  );

  // Passenger counts
  const [adultCount, setAdultCount] = useState<number>(1);
  const [childCount, setChildCount] = useState<number>(0);
  const [luggageKg, setLuggageKg] = useState<number>(0);
  const [category, setCategory] = useState<TicketCategory>('PAID_GENERAL');

  // Payment method & cash tender
  const [paymentMode, setPaymentMode] = useState<'CASH' | 'UPI'>('CASH');
  const [cashReceived, setCashReceived] = useState<number>(0);
  const [upiQrUrl, setUpiQrUrl] = useState<string>('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Ensure selected TO stop is valid within available downstream stops
  useEffect(() => {
    if (!availableToStops.some(s => s.id === selectedToStopId) && availableToStops.length > 0) {
      setSelectedToStopId(availableToStops[0].id);
    }
  }, [availableToStops, selectedToStopId]);

  const selectedToStop = useMemo(() => {
    return availableToStops.find(s => s.id === selectedToStopId) || availableToStops[0];
  }, [availableToStops, selectedToStopId]);

  // Calculation parameters
  const stagesTravelled = useMemo(() => {
    if (!selectedToStop) return 1;
    return Math.max(1, selectedToStop.stageNumber - lockedFromStop.stageNumber);
  }, [selectedToStop, lockedFromStop]);

  const distanceKm = useMemo(() => {
    if (!selectedToStop) return 10;
    return Math.max(1, Math.abs(selectedToStop.distanceFromOriginKm - lockedFromStop.distanceFromOriginKm));
  }, [selectedToStop, lockedFromStop]);

  const tollApplicable = Boolean(selectedToStop?.tollApplicable || lockedFromStop.tollApplicable);

  let concessionType: 'NONE' | 'SENIOR' | 'STUDENT' | 'DIVYANGJAN' = 'NONE';
  if (category === 'CONCESSION_SENIOR') concessionType = 'SENIOR';
  else if (category === 'CONCESSION_STUDENT') concessionType = 'STUDENT';
  else if (category === 'CONCESSION_DIVYANGJAN') concessionType = 'DIVYANGJAN';

  // Calculate fare automatically using saved bus type and route chart
  const calculatedFare = useMemo(() => {
    return calculateApsrtcTicketFare({
      serviceType: activeTrip.serviceType,
      stagesTravelled,
      tollApplicable,
      adultCount,
      childCount,
      luggageKg,
      isMahilaZeroFare: false,
      concessionType
    });
  }, [activeTrip.serviceType, stagesTravelled, tollApplicable, adultCount, childCount, luggageKg, concessionType]);

  // Update cash received default
  useEffect(() => {
    setCashReceived(calculatedFare.totalFare);
  }, [calculatedFare.totalFare]);

  // Generate UPI QR dynamic payload when in UPI mode
  useEffect(() => {
    if (paymentMode === 'UPI') {
      const upiUri = `upi://pay?pa=apsrtc.${session.conductorId.toLowerCase()}@sbi&pn=APSRTC&am=${calculatedFare.totalFare}.00&cu=INR&tn=Ticket-${activeTrip.busNumber}`;
      QRCode.toDataURL(upiUri, {
        width: 170,
        margin: 1,
        color: { dark: '#020617', light: '#ffffff' }
      }).then(setUpiQrUrl).catch(console.error);
    }
  }, [paymentMode, calculatedFare.totalFare, session.conductorId, activeTrip.busNumber]);

  const changeDue = Math.max(0, cashReceived - calculatedFare.totalFare);

  const handleSelectToStop = (stopId: string) => {
    soundEffects.playKeyClick();
    setSelectedToStopId(stopId);
    setValidationError(null);
  };

  const handleIssueTicket = () => {
    if (!selectedToStop) {
      soundEffects.playErrorBuzz();
      setValidationError('Please select a valid passenger destination stop (TO).');
      return;
    }

    if (selectedToStop.id === lockedFromStop.id) {
      soundEffects.playErrorBuzz();
      setValidationError('Destination (TO) cannot be the same as the starting location (FROM)!');
      return;
    }

    if (paymentMode === 'CASH' && cashReceived < calculatedFare.totalFare) {
      soundEffects.playErrorBuzz();
      setValidationError(`Amount received (₹${cashReceived}) is less than payable fare (₹${calculatedFare.totalFare}).`);
      return;
    }

    soundEffects.playSuccess();

    // Generate collision-resistant unique ticket ID
    const { ticketId, ticketNumber, transactionId } = generateCollisionResistantTicketId(
      session.timDeviceId,
      activeTrip.tripNumber,
      activeTrip.serviceType
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Secure QR code payload (no sensitive passenger data)
    const qrPayload = `APSRTC-SECURE-TKT:${ticketId}:${session.timDeviceId}:STG${lockedFromStop.stageNumber}-TO-STG${selectedToStop.stageNumber}:FARE${calculatedFare.totalFare}:PAID_${paymentMode}`;

    const newTicket: PassengerTicket = {
      ticketId,
      tripId: activeTrip.tripId,
      ticketNumber,
      transactionId,
      waybillNumber: session.waybillNumber,
      issueTimestamp: `${dateStr} ${timeStr}`,
      routeId: activeTrip.routeId,
      routeNumber: activeTrip.routeNumber,
      routeName: activeTrip.routeName,
      serviceType: activeTrip.serviceType,
      fromStop: lockedFromStop,
      toStop: selectedToStop,
      stagesTravelled,
      distanceKm,
      passengers: { adult: adultCount, child: childCount, luggageKg },
      category,
      fare: calculatedFare,
      paymentMethod: paymentMode,
      paymentStatus: 'PAID',
      cashTendered: paymentMode === 'CASH' ? cashReceived : undefined,
      changeReturned: paymentMode === 'CASH' ? changeDue : undefined,
      upiTransactionRef: paymentMode === 'UPI' ? `UPI-NPCI-${Date.now().toString().slice(-6)}` : undefined,
      qrPayload,
      syncedToCloud: false,
      timDeviceId: session.timDeviceId,
      conductorId: session.conductorId,
      busNumber: activeTrip.busNumber,
      reprintCount: 0
    };

    localDb.saveTicket(newTicket);
    onTicketGenerated(newTicket);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans">
      
      {/* Top Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => { soundEffects.playKeyClick(); onBack(); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Home</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
            Issue Ticket • Rapid Ticketing
          </span>
        </div>
      </div>

      {/* Visible Active Trip Banner with Locked Parameters */}
      <ActiveTripBanner
        activeTrip={activeTrip}
        onOpenTripSetup={onOpenTripSetup}
        onOpenTripCorrection={onOpenTripCorrection}
        onEndTrip={onEndTrip}
      />

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500 text-xs text-rose-200 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          <span>{validationError}</span>
        </div>
      )}

      {/* ONLY ASK FOR: Destination Stop (TO) */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
          <span className="font-bold text-teal-300 uppercase tracking-wide flex items-center gap-1.5">
            <MapPin className="w-4 h-4 text-teal-400" />
            Select Passenger TO Destination:
          </span>
          <span className="text-[10px] text-slate-400 font-mono">
            {availableToStops.length} stops available downstream
          </span>
        </div>

        {/* Big Touch-Friendly Buttons for all downstream stops */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableToStops.map(stop => {
            const isSelected = stop.id === selectedToStopId;
            const stopStages = Math.max(1, stop.stageNumber - lockedFromStop.stageNumber);
            const stopKm = Math.abs(stop.distanceFromOriginKm - lockedFromStop.distanceFromOriginKm) || 6;

            return (
              <button
                key={stop.id}
                onClick={() => handleSelectToStop(stop.id)}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  isSelected
                    ? 'bg-teal-500/20 border-teal-400 text-white shadow-md ring-2 ring-teal-400/40'
                    : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div>
                  <div className="font-bold text-sm flex items-center gap-2">
                    <span>{stop.name}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-teal-950 text-teal-300 font-mono font-bold">
                      STG {stop.stageNumber}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-sans mt-0.5">
                    {stop.teluguName} • {stopStages} Stage{stopStages > 1 ? 's' : ''} (~{stopKm} km)
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <ChevronRight className={`w-5 h-5 transition-transform ${isSelected ? 'text-teal-300 translate-x-1' : 'text-slate-600'}`} />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Passenger Count & Concessions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {/* Adults */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Adults</span>
            <span className="font-mono text-emerald-400 font-bold">{adultCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { soundEffects.playKeyClick(); setAdultCount(Math.max(1, adultCount - 1)); }}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-black text-xl text-white">{adultCount}</span>
            <button
              onClick={() => { soundEffects.playKeyClick(); setAdultCount(Math.min(9, adultCount + 1)); }}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Children */}
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
          <div className="flex justify-between text-xs text-slate-400 font-semibold uppercase">
            <span>Children</span>
            <span className="font-mono text-blue-400 font-bold">{childCount}</span>
          </div>
          <div className="flex items-center justify-between">
            <button
              onClick={() => { soundEffects.playKeyClick(); setChildCount(Math.max(0, childCount - 1)); }}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-black text-xl text-white">{childCount}</span>
            <button
              onClick={() => { soundEffects.playKeyClick(); setChildCount(Math.min(6, childCount + 1)); }}
              className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category */}
        <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 col-span-2 sm:col-span-1 space-y-1">
          <span className="text-[10px] text-slate-400 uppercase font-semibold block">Concession</span>
          <select
            value={category}
            onChange={e => {
              soundEffects.playKeyClick();
              setCategory(e.target.value as TicketCategory);
            }}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg py-1.5 px-2 text-xs font-bold text-white focus:outline-none"
          >
            <option value="PAID_GENERAL">General Tariff (Full)</option>
            <option value="CONCESSION_SENIOR">Senior Citizen (25% Off)</option>
            <option value="CONCESSION_STUDENT">Student (50% Off)</option>
            <option value="CONCESSION_DIVYANGJAN">Divyangjan (50% Off)</option>
          </select>
        </div>
      </div>

      {/* Automatic Fare Calculation Display */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 shadow-xl space-y-2">
        <div className="flex items-baseline justify-between">
          <div>
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Automatic Fare Calculation
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {lockedFromStop.name} ➔ {selectedToStop?.name} ({stagesTravelled} Stages)
            </div>
          </div>

          <div className="text-right">
            <span className="text-3xl font-black font-mono text-white">
              ₹{calculatedFare.totalFare}.00
            </span>
            <span className="text-[10px] text-slate-400 block font-mono">
              Total {adultCount + childCount} Pax
            </span>
          </div>
        </div>

        {/* Fare breakdown chips */}
        <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 font-mono">
          <div>Base: <strong className="text-slate-200">₹{calculatedFare.baseFare}</strong></div>
          <div>Stage: <strong className="text-slate-200">₹{calculatedFare.stageFare}</strong></div>
          <div>Toll: <strong className="text-slate-200">₹{calculatedFare.tollTax}</strong></div>
          <div>Disc: <strong className="text-emerald-400">-₹{calculatedFare.concessionDiscount}</strong></div>
        </div>
      </div>

      {/* Payment Tender: Cash or UPI */}
      <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="font-bold text-slate-300 uppercase">Payment Mode:</span>
          <div className="flex gap-1">
            <button
              onClick={() => { soundEffects.playKeyClick(); setPaymentMode('CASH'); }}
              className={`py-1 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'CASH'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <Banknote className="w-3.5 h-3.5" /> Cash
            </button>
            <button
              onClick={() => { soundEffects.playKeyClick(); setPaymentMode('UPI'); }}
              className={`py-1 px-3 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                paymentMode === 'UPI'
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-950 text-slate-400 border border-slate-800'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" /> UPI QR
            </button>
          </div>
        </div>

        {paymentMode === 'CASH' ? (
          <div className="space-y-2">
            <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Tender:</span>
                <input
                  type="number"
                  value={cashReceived}
                  onChange={e => setCashReceived(Number(e.target.value))}
                  className="w-24 mt-0.5 px-2 py-1 rounded-lg bg-slate-900 border border-slate-700 text-base font-mono font-bold text-emerald-400"
                />
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Return Change:</span>
                <span className="text-xl font-black font-mono text-amber-400">₹{changeDue}</span>
              </div>
            </div>

            {/* Quick cash tender buttons */}
            <div className="flex gap-1.5">
              {[calculatedFare.totalFare, 50, 100, 200, 500].filter(v => v >= calculatedFare.totalFare).map((amt, idx) => (
                <button
                  key={`${amt}-${idx}`}
                  onClick={() => { soundEffects.playKeyClick(); setCashReceived(amt); }}
                  className="py-1 px-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono font-bold text-slate-200 border border-slate-700"
                >
                  ₹{amt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1.5">
            <div className="inline-block p-1.5 bg-white rounded-xl">
              {upiQrUrl ? (
                <img src={upiQrUrl} alt="UPI QR" className="w-28 h-28 mx-auto" />
              ) : (
                <div className="w-28 h-28 flex items-center justify-center text-slate-500 text-xs">Generating QR...</div>
              )}
            </div>
            <div className="text-xs text-slate-300 font-mono">
              ₹{calculatedFare.totalFare}.00 • <span className="text-amber-400 font-bold">DEMO UPI</span>
            </div>
          </div>
        )}
      </div>

      {/* 1-Click Ticket Generation CTA */}
      <button
        onClick={handleIssueTicket}
        className="w-full py-4 px-4 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-base flex items-center justify-center gap-2 shadow-xl shadow-emerald-950/50 cursor-pointer active:scale-98 transition-all"
      >
        <Printer className="w-5 h-5" />
        <span>Generate & Print Ticket (F1)</span>
      </button>

    </div>
  );
};
