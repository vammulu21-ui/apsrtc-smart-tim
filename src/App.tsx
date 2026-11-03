/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ConductorSession, 
  PassengerTicket, 
  DeviceTelemetry,
  BusServiceType,
  ActiveTrip 
} from './types/tim';
import { DEFAULT_CONDUCTOR_SESSION, DEMO_ROUTES } from './data/apsrtcData';
import { localDb } from './services/db';
import { TIMChassis, TIMView } from './components/TIMChassis';
import { ConductorHomeScreen } from './components/ConductorHomeScreen';
import { TicketIssuingScreen } from './components/TicketIssuingScreen';
import { FreeTravelTicketWorkflow } from './components/FreeTravelTicketWorkflow';
import { TicketHistoryScreen } from './components/TicketHistoryScreen';
import { CancelTicketModal } from './components/CancelTicketModal';
import { TicketValidatorScreen } from './components/TicketValidatorScreen';
import { EditableFareChartModal } from './components/EditableFareChartModal';
import { ThermalTicketModal } from './components/ThermalTicketModal';
import { PassengerTicketDetails } from './components/PassengerTicketDetails';
import { SyncDashboard } from './components/SyncDashboard';
import { ConductorLoginModal } from './components/ConductorLoginModal';
import { WaybillSummaryModal } from './components/WaybillSummaryModal';
import { TripSetupModal } from './components/TripSetupModal';
import { soundEffects } from './services/soundEffects';

export default function App() {
  const [session, setSession] = useState<ConductorSession>(() => localDb.getSession());
  const [telemetry, setTelemetry] = useState<DeviceTelemetry>(() => localDb.getTelemetry());
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(() => localDb.getActiveTrip());
  const [activeView, setActiveView] = useState<TIMView>('HOME');
  const [lang, setLang] = useState<'en' | 'te'>('en');

  // Modals
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isFareChartModalOpen, setIsFareChartModalOpen] = useState(false);
  const [isThermalTicketModalOpen, setIsThermalTicketModalOpen] = useState(false);
  const [isWaybillSummaryModalOpen, setIsWaybillSummaryModalOpen] = useState(false);
  const [isTripSetupModalOpen, setIsTripSetupModalOpen] = useState(false);
  const [isTripCorrectionMode, setIsTripCorrectionMode] = useState(false);

  // Active Ticket
  const [activeTicket, setActiveTicket] = useState<PassengerTicket | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState<number>(0);

  const refreshSyncCount = () => {
    setPendingSyncCount(localDb.getPendingSyncTickets().length);
    setActiveTrip(localDb.getActiveTrip());
  };

  // Seed initial tickets if database is empty
  useEffect(() => {
    const existing = localDb.getTickets();
    if (existing.length === 0) {
      const route = DEMO_ROUTES[0];
      const initialTrip = localDb.getActiveTrip();
      
      const sampleTicket1: PassengerTicket = {
        ticketId: 'TIM7052-T3-20261103-1041',
        tripId: initialTrip?.tripId,
        ticketNumber: 'PV-1041',
        transactionId: 'TXN-7052-9841-8931',
        waybillNumber: session.waybillNumber,
        issueTimestamp: '03/11/2026 07:15 AM',
        routeId: route.routeId,
        routeNumber: route.routeNumber,
        routeName: route.name,
        serviceType: 'PALLE_VELUGU',
        fromStop: route.stops[0],
        toStop: route.stops[3],
        stagesTravelled: 3,
        distanceKm: 14,
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
        aadhaarDetails: {
          aadhaarNumberMasked: 'XXXX-XXXX-4921',
          name: 'Lakshmi Devi Chunduru',
          gender: 'FEMALE',
          yearOfBirth: '1988',
          age: 38,
          state: 'Andhra Pradesh',
          schemeName: 'Maha Lakshmi / Stree Shakti Free Travel Scheme',
          verificationMethod: 'AADHAAR_SECURE_QR_DEMO',
          verifiedAt: '07:14 AM',
          isEligibleForFreeTravel: true,
          mobileNumberMasked: '+91 9848X XX421',
          smsNotificationSent: true,
          smsNotificationId: 'SMS-884912',
          smsTimestamp: '03/11/2026 07:15:02 AM'
        },
        qrPayload: `APSRTC-SECURE-TKT:TIM7052-T3-20261103-1041:AP-TIM-7052:STG1-STG4:FARE0:ZERO_FARE_MAHILA`,
        syncedToCloud: false,
        timDeviceId: session.timDeviceId,
        conductorId: session.conductorId,
        busNumber: session.busNumber,
        reprintCount: 0
      };

      const sampleTicket2: PassengerTicket = {
        ticketId: 'TIM7052-T3-20261103-1042',
        tripId: initialTrip?.tripId,
        ticketNumber: 'PV-1042',
        transactionId: 'TXN-7052-9841-8932',
        waybillNumber: session.waybillNumber,
        issueTimestamp: '03/11/2026 07:22 AM',
        routeId: route.routeId,
        routeNumber: route.routeNumber,
        routeName: route.name,
        serviceType: 'PALLE_VELUGU',
        fromStop: route.stops[0],
        toStop: route.stops[7],
        stagesTravelled: 7,
        distanceKm: 34,
        passengers: { adult: 2, child: 1, luggageKg: 10 },
        category: 'PAID_GENERAL',
        fare: {
          baseFare: 25,
          stageFare: 80,
          tollTax: 15,
          luggageFare: 0,
          concessionDiscount: 0,
          grossAmount: 120,
          totalFare: 120,
          isZeroFare: false
        },
        paymentMethod: 'CASH',
        paymentStatus: 'PAID',
        cashTendered: 200,
        changeReturned: 80,
        qrPayload: `APSRTC-SECURE-TKT:TIM7052-T3-20261103-1042:AP-TIM-7052:STG1-STG8:FARE120:PAID_CASH`,
        syncedToCloud: false,
        timDeviceId: session.timDeviceId,
        conductorId: session.conductorId,
        busNumber: session.busNumber,
        reprintCount: 0
      };

      localDb.saveTicket(sampleTicket1);
      localDb.saveTicket(sampleTicket2);
    }
    refreshSyncCount();
  }, [session]);

  const handleTicketIssued = (ticket: PassengerTicket) => {
    refreshSyncCount();
    setActiveTicket(ticket);
    setIsThermalTicketModalOpen(true);
  };

  const handleReprintTicket = (ticket: PassengerTicket) => {
    setActiveTicket(ticket);
    setIsThermalTicketModalOpen(true);
  };

  const handleViewTicketDetails = (ticket: PassengerTicket) => {
    setActiveTicket(ticket);
    setIsThermalTicketModalOpen(false);
    setActiveView('DETAILS');
  };

  const handleToggleNetwork = () => {
    const nextMode = telemetry.networkMode === 'OFFLINE' ? '4G_ONLINE' : 'OFFLINE';
    const updated = { ...telemetry, networkMode: nextMode as 'OFFLINE' | '4G_ONLINE' };
    setTelemetry(updated);
    localDb.saveTelemetry(updated);
  };

  // Trip Handlers
  const handleOpenTripSetup = () => {
    soundEffects.playKeyClick();
    setIsTripCorrectionMode(false);
    setIsTripSetupModalOpen(true);
  };

  const handleOpenTripCorrection = () => {
    soundEffects.playKeyClick();
    setIsTripCorrectionMode(true);
    setIsTripSetupModalOpen(true);
  };

  const handleTripConfigured = (trip: ActiveTrip) => {
    setActiveTrip(trip);
    // Sync session serviceType and route
    const updatedSession = {
      ...session,
      busNumber: trip.busNumber,
      serviceType: trip.serviceType,
      routeId: trip.routeId
    };
    setSession(updatedSession);
    localDb.saveSession(updatedSession);
  };

  const handleEndTrip = () => {
    if (!activeTrip) return;
    soundEffects.playScannerBeep();

    const confirmed = window.confirm(
      `End Trip #${activeTrip.tripNumber} on Bus ${activeTrip.busNumber}?\n\nTotal Tickets Issued: ${activeTrip.totalTicketsIssued}\nTotal Revenue Collected: ₹${activeTrip.totalRevenue}\n\nEnding will close this trip's ledger and prompt configuration for the next trip.`
    );

    if (confirmed) {
      soundEffects.playSuccess();
      const ended = localDb.endActiveTrip(session.conductorId);
      setActiveTrip(ended);
      alert(`Trip #${activeTrip.tripNumber} ended successfully. Final Collection: ₹${activeTrip.totalRevenue}.`);
      // Prompt setup for the next trip
      setIsTripCorrectionMode(false);
      setIsTripSetupModalOpen(true);
    }
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-slate-950 font-sans">
      <TIMChassis
        session={session}
        telemetry={telemetry}
        activeView={activeView}
        onChangeView={view => {
          if (view === 'CANCEL_TICKET') {
            setIsCancelModalOpen(true);
          } else if (view === 'TRIP_SUMMARY') {
            setIsWaybillSummaryModalOpen(true);
          } else if (view === 'ISSUE_PAID') {
            if (!activeTrip || activeTrip.status !== 'ACTIVE') {
              handleOpenTripSetup();
            } else {
              setActiveView('ISSUE_PAID');
            }
          } else if (view === 'ISSUE_FREE') {
            if (!activeTrip || activeTrip.status !== 'ACTIVE') {
              handleOpenTripSetup();
            } else {
              setActiveView('ISSUE_FREE');
            }
          } else {
            setActiveView(view);
          }
        }}
        onOpenLogin={() => setIsLoginModalOpen(true)}
        pendingSyncCount={pendingSyncCount}
      >
        {/* 1. Conductor Home Screen (Primary Dashboard) */}
        {activeView === 'HOME' && (
          <ConductorHomeScreen
            session={session}
            telemetry={telemetry}
            activeTrip={activeTrip}
            lang={lang}
            onToggleLang={() => setLang(prev => prev === 'en' ? 'te' : 'en')}
            onNavigate={view => {
              if (view === 'CANCEL_TICKET') {
                setIsCancelModalOpen(true);
              } else if (view === 'TRIP_SUMMARY') {
                setIsWaybillSummaryModalOpen(true);
              } else if (view === 'FARE_CHART') {
                setIsFareChartModalOpen(true);
              } else {
                setActiveView(view);
              }
            }}
            onOpenLogin={() => setIsLoginModalOpen(true)}
            onOpenTripSetup={handleOpenTripSetup}
            onOpenTripCorrection={handleOpenTripCorrection}
            onEndTrip={handleEndTrip}
            onToggleNetwork={handleToggleNetwork}
          />
        )}

        {/* 2. Issue New Paid Ticket Screen (Active Trip Simplified Ticketing) */}
        {activeView === 'ISSUE_PAID' && activeTrip && activeTrip.status === 'ACTIVE' && (
          <TicketIssuingScreen
            session={session}
            activeTrip={activeTrip}
            onBack={() => setActiveView('HOME')}
            onTicketGenerated={handleTicketIssued}
            onOpenFareChart={() => setIsFareChartModalOpen(true)}
            onOpenTripSetup={handleOpenTripSetup}
            onOpenTripCorrection={handleOpenTripCorrection}
            onEndTrip={handleEndTrip}
            lang={lang}
          />
        )}

        {/* 3. Free Travel Ticket Screen */}
        {activeView === 'ISSUE_FREE' && activeTrip && activeTrip.status === 'ACTIVE' && (
          <FreeTravelTicketWorkflow
            session={session}
            activeTrip={activeTrip}
            onBack={() => setActiveView('HOME')}
            onTicketIssued={handleTicketIssued}
            onOpenTripSetup={handleOpenTripSetup}
            onOpenTripCorrection={handleOpenTripCorrection}
            onEndTrip={handleEndTrip}
            lang={lang}
          />
        )}

        {/* 4. Ticket History Screen */}
        {activeView === 'HISTORY' && (
          <TicketHistoryScreen
            onBack={() => setActiveView('HOME')}
            onViewDetails={handleViewTicketDetails}
            onReprintTicket={handleReprintTicket}
            lang={lang}
          />
        )}

        {/* 5. Ticket QR Inspector Screen */}
        {activeView === 'VALIDATE_QR' && (
          <TicketValidatorScreen
            onBack={() => setActiveView('HOME')}
            lang={lang}
          />
        )}

        {/* 6. Cloud Synchronisation Screen */}
        {activeView === 'SYNC' && (
          <SyncDashboard
            onBack={() => {
              setActiveView('HOME');
              refreshSyncCount();
            }}
            telemetry={telemetry}
            onUpdateTelemetry={setTelemetry}
          />
        )}

        {/* 7. Passenger Ticket Details Screen */}
        {activeView === 'DETAILS' && activeTicket && (
          <PassengerTicketDetails
            ticket={activeTicket}
            onBack={() => setActiveView('HISTORY')}
          />
        )}
      </TIMChassis>

      {/* Trip Setup & Authorised Correction Modal */}
      <TripSetupModal
        isOpen={isTripSetupModalOpen}
        onClose={() => setIsTripSetupModalOpen(false)}
        activeTrip={activeTrip}
        onTripConfigured={handleTripConfigured}
        isCorrectionMode={isTripCorrectionMode}
        supervisorPin={session.supervisorPin}
      />

      {/* Cancel Ticket Modal */}
      <CancelTicketModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        session={session}
        onTicketCancelled={() => refreshSyncCount()}
      />

      {/* Configurable Fare Chart Modal (DEMO DATA) */}
      <EditableFareChartModal
        isOpen={isFareChartModalOpen}
        onClose={() => setIsFareChartModalOpen(false)}
        onConfigsUpdated={() => {}}
      />

      {/* Thermal Ticket Printer Modal */}
      <ThermalTicketModal
        isOpen={isThermalTicketModalOpen}
        onClose={() => {
          setIsThermalTicketModalOpen(false);
          refreshSyncCount();
        }}
        ticket={activeTicket}
        onViewDetails={handleViewTicketDetails}
        onNewTicket={() => {
          setIsThermalTicketModalOpen(false);
          setActiveView('ISSUE_PAID');
        }}
      />

      {/* Conductor Login & Shift Modal */}
      <ConductorLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentSession={session}
        onSaveSession={updated => {
          setSession(updated);
          localDb.saveSession(updated);
        }}
      />

      {/* Waybill Summary Ledger Modal */}
      <WaybillSummaryModal
        isOpen={isWaybillSummaryModalOpen}
        onClose={() => setIsWaybillSummaryModalOpen(false)}
        session={session}
        currentStage={activeTrip?.startingFromStop.stageNumber || 1}
      />
    </div>
  );
}
