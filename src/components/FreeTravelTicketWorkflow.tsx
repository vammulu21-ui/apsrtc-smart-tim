import React, { useState, useMemo, useEffect } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  Send, 
  MapPin, 
  ArrowLeft, 
  Printer, 
  Smartphone, 
  AlertTriangle, 
  CheckCircle2, 
  QrCode,
  Bus,
  ChevronRight,
  ArrowRight,
  Clock,
  Calendar,
  RotateCcw,
  Check,
  Search,
  Lock
} from 'lucide-react';
import { 
  ConductorSession, 
  PassengerTicket, 
  AadhaarVerificationData, 
  BusStop, 
  ActiveTrip 
} from '../types/tim';
import { 
  DEMO_ROUTES, 
  DEMO_AADHAAR_DATABASE, 
  DemoAadhaarCard, 
  generateCollisionResistantTicketId 
} from '../data/apsrtcData';
import { soundEffects } from '../services/soundEffects';
import { localDb } from '../services/db';
import { smsService, SMSNotificationRecord } from '../services/smsService';
import { ActiveTripBanner } from './ActiveTripBanner';

interface FreeTravelTicketWorkflowProps {
  session: ConductorSession;
  activeTrip: ActiveTrip;
  onBack: () => void;
  onTicketIssued: (ticket: PassengerTicket) => void;
  onOpenTripSetup: () => void;
  onOpenTripCorrection: () => void;
  onEndTrip: () => void;
  lang: 'en' | 'te';
}

export const FreeTravelTicketWorkflow: React.FC<FreeTravelTicketWorkflowProps> = ({
  session,
  activeTrip,
  onBack,
  onTicketIssued,
  onOpenTripSetup,
  onOpenTripCorrection,
  onEndTrip,
  lang
}) => {
  // WORKFLOW STEPS:
  // Step 1: 'SCAN' -> Conductor scans passenger's Aadhaar Secure QR
  // Step 2: 'SELECT_STOPS' -> Immediate SMS trigger + Conductor selects FROM boarding stop, then TO destination
  const [step, setStep] = useState<'SCAN' | 'SELECT_STOPS'>('SCAN');
  
  const [selectedDemoCard, setSelectedDemoCard] = useState<DemoAadhaarCard | null>(null);
  const [verifiedData, setVerifiedData] = useState<AadhaarVerificationData | null>(null);
  const [dispatchedSms, setDispatchedSms] = useState<SMSNotificationRecord | null>(null);
  const [fromSearchQuery, setFromSearchQuery] = useState('');
  const [toSearchQuery, setToSearchQuery] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Current route from Active Trip (bus number, bus type, route are preserved without re-asking)
  const currentRoute = useMemo(() => {
    return DEMO_ROUTES.find(r => r.routeId === activeTrip.routeId) || DEMO_ROUTES[0];
  }, [activeTrip.routeId]);

  // ALL stops on the active route are available for passenger FROM selection
  // (Do NOT automatically lock to trip's starting FROM location!)
  const allRouteStops = useMemo(() => {
    return currentRoute.stops;
  }, [currentRoute.stops]);

  // Selected FROM boarding stop for this specific free ticket (defaults to first stop on active route)
  const [selectedFromStopId, setSelectedFromStopId] = useState<string>(
    allRouteStops[0]?.id || ''
  );

  const selectedFromStop = useMemo(() => {
    return allRouteStops.find(s => s.id === selectedFromStopId) || allRouteStops[0];
  }, [allRouteStops, selectedFromStopId]);

  // Downstream TO stops: Only stops that come AFTER the passenger's selected FROM stop on the active route
  const availableToStops = useMemo(() => {
    if (!selectedFromStop) return [];
    const fromIndex = allRouteStops.findIndex(s => s.id === selectedFromStop.id);
    if (fromIndex === -1) return [];
    
    // Strict requirement: TO must occur after FROM along the route
    const downstream = allRouteStops.filter((s, idx) => idx > fromIndex && s.stageNumber >= selectedFromStop.stageNumber);
    return downstream;
  }, [allRouteStops, selectedFromStop]);

  // Selected TO destination stop for this specific free ticket
  const [selectedToStopId, setSelectedToStopId] = useState<string>('');

  // When selectedFromStop changes or downstream stops update, ensure selectedToStop is valid and downstream
  useEffect(() => {
    if (availableToStops.length > 0) {
      const isCurrentToValid = availableToStops.some(s => s.id === selectedToStopId);
      if (!isCurrentToValid) {
        // Default to the last destination stop on the route or first downstream stop
        setSelectedToStopId(availableToStops[availableToStops.length - 1].id);
      }
    } else {
      setSelectedToStopId('');
    }
  }, [availableToStops, selectedToStopId]);

  const selectedToStop = useMemo(() => {
    return availableToStops.find(s => s.id === selectedToStopId) || availableToStops[0] || null;
  }, [availableToStops, selectedToStopId]);

  // Dynamic stages and distance calculation based on passenger's selected FROM and TO
  const stagesTravelled = useMemo(() => {
    if (!selectedFromStop || !selectedToStop) return 1;
    return Math.max(1, selectedToStop.stageNumber - selectedFromStop.stageNumber);
  }, [selectedFromStop, selectedToStop]);

  const distanceKm = useMemo(() => {
    if (!selectedFromStop || !selectedToStop) return 10;
    return Math.max(1, Math.abs(selectedToStop.distanceFromOriginKm - selectedFromStop.distanceFromOriginKm));
  }, [selectedFromStop, selectedToStop]);

  // STEP 1: SCAN AADHAAR SECURE QR & IMMEDIATE SMS TRIGGER
  const handleSimulateScan = (card: DemoAadhaarCard) => {
    soundEffects.playScannerBeep();
    setSelectedDemoCard(card);
    setValidationError(null);

    // Verify AP Domicile and Female eligibility for Stree Shakti / Maha Lakshmi Scheme
    const isMahilaEligible = card.gender === 'FEMALE' && card.state === 'Andhra Pradesh';

    if (!isMahilaEligible && card.eligibleCategory !== 'FREE_MAHILA') {
      soundEffects.playErrorBuzz();
      alert(`Passenger ${card.name} is NOT eligible for Zero-Fare Mahila Free Travel.\n\nStatutory Rule: Only Andhra Pradesh domicile female passengers or registered scheme holders qualify for 100% government zero-fare subsidy.`);
      return;
    }

    const verificationPayload: AadhaarVerificationData = {
      aadhaarNumberMasked: card.maskedAadhaar,
      name: card.name,
      gender: card.gender,
      yearOfBirth: card.dob.split('-')[0],
      age: card.age,
      state: card.state,
      schemeName: card.schemeTitle,
      verificationMethod: 'AADHAAR_SECURE_QR_DEMO',
      verifiedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      isEligibleForFreeTravel: true,
      mobileNumberMasked: card.mobileMasked,
      smsNotificationSent: true
    };

    // REQUIREMENT 3: IMMEDIATELY TRIGGER THE SMS NOTIFICATION WORKFLOW TO VERIFIED LINKED MOBILE NUMBER
    const initialFrom = allRouteStops[0]?.name || 'Origin';
    const initialTo = allRouteStops[allRouteStops.length - 1]?.name || 'Destination';
    const tempTicketNumber = `PV-FREE-${Math.floor(100000 + Math.random() * 900000)}`;

    const smsRecord = smsService.dispatchDemoSMS({
      recipientPhoneMasked: card.mobileMasked,
      passengerName: card.name,
      maskedAadhaar: card.maskedAadhaar,
      ticketNumber: tempTicketNumber,
      busNumber: activeTrip.busNumber,
      routeNumber: activeTrip.routeNumber,
      fromStop: initialFrom,
      toStop: initialTo,
      isZeroFare: true
    });

    verificationPayload.smsNotificationId = smsRecord.id;
    verificationPayload.smsTimestamp = smsRecord.timestamp;

    setDispatchedSms(smsRecord);
    setVerifiedData(verificationPayload);
    
    // Set initial stops for this ticket (defaults to origin -> terminus, but conductor selects both)
    setSelectedFromStopId(allRouteStops[0]?.id || '');
    if (allRouteStops.length > 1) {
      setSelectedToStopId(allRouteStops[allRouteStops.length - 1].id);
    }

    soundEffects.playSuccess();
    // Move immediately to stop selection
    setStep('SELECT_STOPS');
  };

  // Rescan / Change Passenger
  const handleRescan = () => {
    soundEffects.playKeyClick();
    setStep('SCAN');
    setSelectedDemoCard(null);
    setVerifiedData(null);
    setDispatchedSms(null);
    setValidationError(null);
  };

  // STEP 8, 9, 10: GENERATE FREE TICKET & PRINT
  const handleGenerateFreeTicket = () => {
    setValidationError(null);

    if (!selectedFromStop) {
      soundEffects.playErrorBuzz();
      setValidationError('Please select the passenger boarding stop (FROM)!');
      return;
    }

    if (!selectedToStop) {
      soundEffects.playErrorBuzz();
      setValidationError('Please select the passenger destination stop (TO)!');
      return;
    }

    if (selectedFromStop.id === selectedToStop.id) {
      soundEffects.playErrorBuzz();
      setValidationError('Destination stop (TO) cannot be the same as boarding stop (FROM)!');
      return;
    }

    const fromIdx = allRouteStops.findIndex(s => s.id === selectedFromStop.id);
    const toIdx = allRouteStops.findIndex(s => s.id === selectedToStop.id);
    if (toIdx <= fromIdx) {
      soundEffects.playErrorBuzz();
      setValidationError('Destination stop (TO) must come AFTER boarding stop (FROM) on the route!');
      return;
    }

    soundEffects.playSuccess();
    soundEffects.playPrinterFeed();

    // Unique collision-resistant ticket ID and transaction ID
    const { ticketId, ticketNumber, transactionId } = generateCollisionResistantTicketId(
      session.timDeviceId,
      activeTrip.tripNumber,
      activeTrip.serviceType
    );

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Update SMS record with confirmed ticket number and exact selected FROM/TO
    if (selectedDemoCard) {
      smsService.dispatchDemoSMS({
        recipientPhoneMasked: selectedDemoCard.mobileMasked,
        passengerName: selectedDemoCard.name,
        maskedAadhaar: selectedDemoCard.maskedAadhaar,
        ticketNumber,
        busNumber: activeTrip.busNumber,
        routeNumber: activeTrip.routeNumber,
        fromStop: selectedFromStop.name,
        toStop: selectedToStop.name,
        isZeroFare: true
      });
    }

    // Build confirmed free passenger ticket
    const freeTicket: PassengerTicket = {
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
      fromStop: selectedFromStop,
      toStop: selectedToStop,
      stagesTravelled,
      distanceKm,
      passengers: { adult: 1, child: 0, luggageKg: 0 },
      category: 'FREE_MAHILA',
      fare: {
        baseFare: 0,
        stageFare: 0,
        tollTax: 0,
        luggageFare: 0,
        concessionDiscount: 35,
        grossAmount: 0,
        totalFare: 0,
        isZeroFare: true
      },
      paymentMethod: 'ZERO_FARE_SCHEME',
      paymentStatus: 'ZERO_FARE_EXEMPT',
      aadhaarDetails: verifiedData || undefined,
      // Collision-resistant QR code payload with exact selected FROM and TO stops
      qrPayload: `APSRTC-SECURE-TKT:${ticketId}:${session.timDeviceId}:FROM-${selectedFromStop.id}-TO-${selectedToStop.id}:FARE0:ZERO_FARE_MAHILA`,
      syncedToCloud: false,
      timDeviceId: session.timDeviceId,
      conductorId: session.conductorId,
      busNumber: activeTrip.busNumber,
      reprintCount: 0
    };

    // Save ticket in local database and invoke print output modal
    localDb.saveTicket(freeTicket);
    onTicketIssued(freeTicket);
  };

  // Filtered lists for fast searching
  const filteredFromStops = useMemo(() => {
    if (!fromSearchQuery.trim()) return allRouteStops;
    const q = fromSearchQuery.toLowerCase();
    return allRouteStops.filter(s => s.name.toLowerCase().includes(q) || s.teluguName.includes(q));
  }, [allRouteStops, fromSearchQuery]);

  const filteredToStops = useMemo(() => {
    if (!toSearchQuery.trim()) return availableToStops;
    const q = toSearchQuery.toLowerCase();
    return availableToStops.filter(s => s.name.toLowerCase().includes(q) || s.teluguName.includes(q));
  }, [availableToStops, toSearchQuery]);

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto p-3 sm:p-4 space-y-3 font-sans">
      
      {/* Top Navigation */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <button
          onClick={() => { soundEffects.playKeyClick(); onBack(); }}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-400" />
          <span>Home</span>
        </button>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
            Free Travel Ticket Workflow (Maha Lakshmi)
          </span>
        </div>
      </div>

      {/* Active Trip Banner - Preserving Saved Bus, Service Type, and Route */}
      <ActiveTripBanner
        activeTrip={activeTrip}
        onOpenTripSetup={onOpenTripSetup}
        onOpenTripCorrection={onOpenTripCorrection}
        onEndTrip={onEndTrip}
        compact
      />

      {/* Statutory Notice */}
      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-2.5 text-xs text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="leading-snug text-[11px]">
          <strong className="text-amber-300">Authorized Prototype Mode:</strong> Real Aadhaar verification & mobile SMS dispatch require UIDAI Sub-AUA statutory authorization, TRAI DLT approved headers (APSRTC-APGOVT), and production C-DAC telecom gateways. High-fidelity demo pipelines are active below.
        </div>
      </div>

      {/* ================= STEP 1: SCAN AADHAAR SECURE QR ================= */}
      {step === 'SCAN' && (
        <div className="space-y-3 animate-in fade-in duration-200">
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-teal-500/20 border border-teal-500/40 flex items-center justify-center text-teal-300 mx-auto">
              <QrCode className="w-7 h-7" />
            </div>
            <h3 className="text-sm font-bold text-white">1. Scan Passenger Aadhaar Secure QR</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Select an eligible sample passenger below to simulate offline Aadhaar QR scanning, verify AP Mahila domicile, and trigger immediate SMS notification:
            </p>
          </div>

          <div className="space-y-2">
            {DEMO_AADHAAR_DATABASE.map(card => {
              const isEligible = card.gender === 'FEMALE' && card.state === 'Andhra Pradesh';
              return (
                <button
                  key={card.id}
                  onClick={() => handleSimulateScan(card)}
                  className={`w-full p-3.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer group ${
                    isEligible
                      ? 'bg-slate-900 hover:bg-slate-850 border-teal-500/30 hover:border-teal-400 shadow-sm'
                      : 'bg-slate-950/60 border-slate-800 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${card.avatarBg} text-white font-bold text-xs flex items-center justify-center shrink-0`}>
                      {card.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold text-xs text-white group-hover:text-teal-300 transition-colors flex items-center gap-2">
                        <span>{card.name}</span>
                        {isEligible && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-teal-950 text-teal-300 border border-teal-800 font-normal">
                            AP Mahila
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {card.maskedAadhaar} • {card.gender}, {card.age}y • {card.district}, {card.state}
                      </div>
                      <div className="text-[10px] text-teal-400/80 font-mono">
                        Mobile: {card.mobileMasked}
                      </div>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border block ${
                      isEligible ? 'bg-teal-500/20 border-teal-500/40 text-teal-300' : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {isEligible ? 'Scan & Verify QR' : 'Ineligible'}
                    </span>
                    <span className="text-[9px] text-slate-500 block mt-1">
                      {isEligible ? 'Instant SMS trigger' : 'Not 100% Zero-Fare'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= STEP 2: SELECT PASSENGER FROM & TO SEPARATELY ================= */}
      {step === 'SELECT_STOPS' && verifiedData && selectedDemoCard && (
        <div className="space-y-3.5 animate-in fade-in duration-200">
          
          {/* REQUIREMENT 3: IMMEDIATE SMS NOTIFICATION STATUS BANNER */}
          {dispatchedSms && (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-500/40 shadow-sm space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400 shrink-0">
                    <Smartphone className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-bold text-blue-300">
                    Immediate SMS Notification Triggered
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1">
                  <Check className="w-3 h-3" /> DELIVERED (SIMULATED)
                </span>
              </div>
              <div className="text-[11px] text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1 pl-8">
                <span>Sent to: <strong className="font-mono text-white">{dispatchedSms.recipientPhoneMasked}</strong></span>
                <span>Ref: <strong className="font-mono text-blue-300">{dispatchedSms.id}</strong></span>
                <span className="text-slate-400">{dispatchedSms.timestamp}</span>
              </div>
            </div>
          )}

          {/* VERIFIED PASSENGER CREDENTIAL CARD */}
          <div className="p-3.5 rounded-2xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${selectedDemoCard.avatarBg} text-white font-black text-sm flex items-center justify-center shrink-0`}>
                {selectedDemoCard.name.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-white">{verifiedData.name}</span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    Maha Lakshmi Beneficiary
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Aadhaar: {verifiedData.aadhaarNumberMasked} • {verifiedData.gender}, {verifiedData.age}y • AP Domicile
                </div>
              </div>
            </div>
            <button
              onClick={handleRescan}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold flex items-center gap-1 border border-slate-700 cursor-pointer transition-colors"
              title="Scan a different passenger"
            >
              <RotateCcw className="w-3 h-3 text-slate-400" />
              <span>Rescan</span>
            </button>
          </div>

          {/* ACTIVE TRIP LOCKED PARAMETERS (Bus Number, Service Type, Route are reused, NOT asked again) */}
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 grid grid-cols-3 gap-2 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 block flex items-center justify-center gap-1">
                <Bus className="w-3 h-3 text-emerald-400" /> Bus Number
              </span>
              <span className="font-bold font-mono text-slate-200 mt-0.5 block">{activeTrip.busNumber}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Service Type</span>
              <span className="font-bold text-emerald-400 mt-0.5 block">{activeTrip.serviceType.replace('_', ' ')}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 block">Active Route</span>
              <span className="font-bold font-mono text-slate-200 mt-0.5 block">{activeTrip.routeNumber}</span>
            </div>
          </div>

          {/* REQUIREMENT 4: ASK CONDUCTOR TO SELECT PASSENGER'S FROM BOARDING LOCATION */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800">
              <div>
                <label className="text-xs font-bold text-emerald-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-400" />
                  <span>Step 1: Select Passenger FROM Boarding Location (ఎక్కే ప్రదేశం)</span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Select passenger's boarding stop separately for this free ticket:
                </p>
              </div>
              {selectedFromStop && (
                <div className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold font-mono">
                  FROM: {selectedFromStop.name} (Stg {selectedFromStop.stageNumber})
                </div>
              )}
            </div>

            {/* Quick Search for FROM */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search boarding stop name..."
                value={fromSearchQuery}
                onChange={e => setFromSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Touch grid of all stops along the active route */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
              {filteredFromStops.map((stop, idx) => {
                const isSelected = stop.id === selectedFromStop?.id;
                const isTerminal = idx === allRouteStops.length - 1;
                return (
                  <button
                    key={stop.id}
                    onClick={() => {
                      soundEffects.playKeyClick();
                      setSelectedFromStopId(stop.id);
                      setValidationError(null);
                    }}
                    disabled={isTerminal}
                    title={isTerminal ? 'Cannot board at route terminus' : undefined}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                      isTerminal
                        ? 'opacity-40 cursor-not-allowed bg-slate-950 border-slate-800'
                        : isSelected
                        ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-md ring-2 ring-emerald-500/40'
                        : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-300">
                        STG {stop.stageNumber}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                    </div>
                    <div className="font-bold text-xs mt-1 truncate">{stop.name}</div>
                    <div className="text-[10px] text-slate-400 truncate">{stop.teluguName}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* REQUIREMENT 5: ASK CONDUCTOR TO SELECT PASSENGER'S TO DESTINATION */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2 border-b border-slate-800">
              <div>
                <label className="text-xs font-bold text-teal-400 uppercase tracking-wide flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-teal-400" />
                  <span>Step 2: Select Passenger TO Destination (దిగే ప్రదేశం)</span>
                </label>
                <p className="text-[10px] text-slate-400">
                  Strictly allows valid stops occurring after <strong className="text-emerald-400">{selectedFromStop?.name}</strong>:
                </p>
              </div>
              {selectedToStop && (
                <div className="px-2.5 py-1 rounded-lg bg-teal-500/20 border border-teal-500/40 text-teal-300 text-xs font-bold font-mono">
                  TO: {selectedToStop.name} (Stg {selectedToStop.stageNumber})
                </div>
              )}
            </div>

            {/* Quick Search for TO */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search destination stop name..."
                value={toSearchQuery}
                onChange={e => setToSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
              />
            </div>

            {/* Touch grid of downstream stops only */}
            {availableToStops.length === 0 ? (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs text-center">
                Selected boarding stop is at the route terminus. Please select an earlier boarding stop above.
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1">
                {filteredToStops.map(stop => {
                  const isSelected = stop.id === selectedToStop?.id;
                  const deltaStages = selectedFromStop ? Math.max(1, stop.stageNumber - selectedFromStop.stageNumber) : 1;
                  return (
                    <button
                      key={stop.id}
                      onClick={() => {
                        soundEffects.playKeyClick();
                        setSelectedToStopId(stop.id);
                        setValidationError(null);
                      }}
                      className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                        isSelected
                          ? 'bg-teal-500/20 border-teal-400 text-white shadow-md ring-2 ring-teal-500/40'
                          : 'bg-slate-950/80 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-slate-800 text-teal-300">
                          STG {stop.stageNumber}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-teal-400" />}
                      </div>
                      <div className="font-bold text-xs mt-1 truncate">{stop.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">
                        {stop.teluguName} • {deltaStages} Stg
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Validation Error Banner */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/40 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* REQUIREMENT 9: DISPLAY PASSENGER ELIGIBILITY CATEGORY, FROM, TO, BUS NUMBER, SERVICE TYPE, DATE AND TIME */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Ticket Issuing Summary & Tariff Details</span>
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-bold font-mono">
                100% GOVT SUBSIDY
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Eligibility Category:</span>
                <span className="font-bold text-teal-300 text-xs mt-0.5 block">
                  Maha Lakshmi Zero-Fare (AP Mahila)
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Beneficiary & Aadhaar:</span>
                <span className="font-bold text-white text-xs mt-0.5 block truncate">
                  {verifiedData.name} ({verifiedData.aadhaarNumberMasked})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Bus Number & Service:</span>
                <span className="font-bold text-white text-xs mt-0.5 block">
                  {activeTrip.busNumber} • {activeTrip.serviceType.replace('_', ' ')}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">From Boarding:</span>
                <span className="font-bold text-emerald-400 text-xs mt-0.5 block truncate">
                  {selectedFromStop?.name} (Stg {selectedFromStop?.stageNumber})
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">To Destination:</span>
                <span className="font-bold text-teal-300 text-xs mt-0.5 block truncate">
                  {selectedToStop ? `${selectedToStop.name} (Stg ${selectedToStop.stageNumber})` : 'Select Destination'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-850">
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Issue Date & Time:</span>
                <span className="font-mono font-bold text-slate-200 text-xs mt-0.5 block">
                  {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })} • {new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>

            {/* Fare strip */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-emerald-500/40 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-semibold">
                  Maha Lakshmi Zero-Fare Tariff:
                </span>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-black font-mono text-emerald-400">₹0.00</span>
                  <span className="text-xs text-slate-400">
                    ({stagesTravelled} Stages • ~{distanceKm} km)
                  </span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block font-mono">Fare Status:</span>
                <span className="text-xs font-bold text-emerald-300">GOVT EXEMPTION</span>
              </div>
            </div>
          </div>

          {/* REQUIREMENT 8 & 10: GENERATE FREE TICKET & PRINT */}
          <button
            onClick={handleGenerateFreeTicket}
            disabled={!selectedToStop}
            className={`w-full py-4 px-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2.5 shadow-xl transition-all cursor-pointer active:scale-98 ${
              selectedToStop
                ? 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Printer className="w-5 h-5" />
            <span>Generate & Print Free Ticket (ఉచిత టికెట్ జారీ)</span>
          </button>
        </div>
      )}

    </div>
  );
};
