import { PassengerTicket, ConductorSession, SyncAuditRecord, DeviceTelemetry, ActiveTrip, TripAuditRecord } from '../types/tim';
import { DEFAULT_CONDUCTOR_SESSION, DEMO_ROUTES } from '../data/apsrtcData';

const TICKETS_STORAGE_KEY = 'apsrtc_smart_tim_tickets_v2';
const SESSION_STORAGE_KEY = 'apsrtc_smart_tim_session_v2';
const SYNC_AUDIT_KEY = 'apsrtc_smart_tim_sync_audit_v2';
const TELEMETRY_KEY = 'apsrtc_smart_tim_telemetry_v2';
const ACTIVE_TRIP_KEY = 'apsrtc_active_trip_v2';

class LocalDatabase {
  // Active Trip Management
  getActiveTrip(): ActiveTrip | null {
    try {
      const data = localStorage.getItem(ACTIVE_TRIP_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }

    // Initialize default active trip if none configured
    const defaultRoute = DEMO_ROUTES[0];
    const initialTrip: ActiveTrip = {
      tripId: `TRIP-20261103-${Math.floor(100 + Math.random() * 900)}`,
      tripNumber: 3,
      busNumber: 'AP29Z 4582',
      serviceType: 'PALLE_VELUGU',
      routeId: defaultRoute.routeId,
      routeNumber: defaultRoute.routeNumber,
      routeName: defaultRoute.name,
      startingFromStop: defaultRoute.stops[0], // Vijayawada PNBS
      tripStartTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE',
      totalTicketsIssued: 2,
      totalRevenue: 120,
      auditLogs: [
        {
          id: `AUD-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
          action: 'CONFIGURED',
          note: 'Trip initialized at origin depot with Palle Velugu service',
          authorizedByStaffId: 'EMP-9482'
        }
      ]
    };

    try {
      localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(initialTrip));
    } catch {}
    return initialTrip;
  }

  saveActiveTrip(trip: ActiveTrip): void {
    try {
      localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(trip));
    } catch {}
  }

  endActiveTrip(authorizedByStaffId: string): ActiveTrip | null {
    const current = this.getActiveTrip();
    if (!current) return null;

    const now = new Date();
    const timestamp = `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const endedTrip: ActiveTrip = {
      ...current,
      status: 'ENDED',
      endedAt: timestamp,
      auditLogs: [
        ...current.auditLogs,
        {
          id: `AUD-${Date.now()}`,
          timestamp,
          action: 'ENDED',
          note: `Trip officially ended. Final collection: ₹${current.totalRevenue}, Total tickets: ${current.totalTicketsIssued}`,
          authorizedByStaffId
        }
      ]
    };

    try {
      localStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify(endedTrip));
    } catch {}
    return endedTrip;
  }

  correctActiveTrip(
    updates: Partial<ActiveTrip>,
    note: string,
    authorizedByStaffId: string
  ): ActiveTrip {
    const current = this.getActiveTrip() || {
      tripId: `TRIP-20261103-${Math.floor(100 + Math.random() * 900)}`,
      tripNumber: 1,
      busNumber: 'AP29Z 4582',
      serviceType: 'PALLE_VELUGU',
      routeId: DEMO_ROUTES[0].routeId,
      routeNumber: DEMO_ROUTES[0].routeNumber,
      routeName: DEMO_ROUTES[0].name,
      startingFromStop: DEMO_ROUTES[0].stops[0],
      tripStartTimestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
      status: 'ACTIVE',
      totalTicketsIssued: 0,
      totalRevenue: 0,
      auditLogs: []
    };

    const now = new Date();
    const timestamp = `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const newAudit: TripAuditRecord = {
      id: `AUD-${Date.now()}`,
      timestamp,
      action: 'CORRECTION',
      note: note || 'Authorized correction of trip parameters',
      authorizedByStaffId
    };

    const corrected: ActiveTrip = {
      ...current,
      ...updates,
      auditLogs: [...current.auditLogs, newAudit]
    };

    this.saveActiveTrip(corrected);
    return corrected;
  }

  // Get all stored tickets
  getTickets(): PassengerTicket[] {
    try {
      const data = localStorage.getItem(TICKETS_STORAGE_KEY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  }

  // Save new ticket
  saveTicket(ticket: PassengerTicket): void {
    const list = this.getTickets();
    list.unshift(ticket);
    try {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(list));
    } catch {
      if (list.length > 500) {
        localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(list.slice(0, 500)));
      }
    }

    // Update active trip counters
    const activeTrip = this.getActiveTrip();
    if (activeTrip && activeTrip.status === 'ACTIVE') {
      const updatedTrip: ActiveTrip = {
        ...activeTrip,
        totalTicketsIssued: activeTrip.totalTicketsIssued + 1,
        totalRevenue: activeTrip.totalRevenue + (ticket.fare.isZeroFare ? 0 : ticket.fare.totalFare)
      };
      this.saveActiveTrip(updatedTrip);
    }
  }

  // Get ticket by ID or short number
  getTicketById(ticketIdOrNumber: string): PassengerTicket | undefined {
    const list = this.getTickets();
    const query = ticketIdOrNumber.trim().toLowerCase();
    return list.find(t => 
      t.ticketId.toLowerCase() === query || 
      t.ticketNumber.toLowerCase() === query
    );
  }

  // Increment reprint count
  incrementReprintCount(ticketId: string): number {
    const list = this.getTickets();
    let newCount = 1;
    const updated = list.map(t => {
      if (t.ticketId === ticketId) {
        newCount = (t.reprintCount || 0) + 1;
        return { ...t, reprintCount: newCount };
      }
      return t;
    });
    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
    return newCount;
  }

  // Cancel Ticket with supervisor or conductor authorization
  cancelTicket(ticketId: string, reason: string, staffId: string): boolean {
    const list = this.getTickets();
    let found = false;
    const now = new Date();
    const timestampStr = `${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`;

    const updated = list.map(t => {
      if (t.ticketId === ticketId) {
        found = true;
        return {
          ...t,
          paymentStatus: 'CANCELLED' as const,
          cancelledAt: timestampStr,
          cancellationReason: reason,
          cancelledByStaffId: staffId,
          syncedToCloud: false // mark for re-sync to cancel on server
        };
      }
      return t;
    });

    if (found) {
      localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
    }
    return found;
  }

  // Mark un-synced tickets as synced
  markTicketsAsSynced(ticketIds: string[]): number {
    const list = this.getTickets();
    const idSet = new Set(ticketIds);
    let count = 0;
    const now = new Date().toISOString();
    
    const updated = list.map(t => {
      if (idSet.has(t.ticketId) || (!ticketIds.length && !t.syncedToCloud)) {
        count++;
        return { ...t, syncedToCloud: true, syncedTimestamp: now };
      }
      return t;
    });

    localStorage.setItem(TICKETS_STORAGE_KEY, JSON.stringify(updated));
    return count;
  }

  // Get un-synced tickets count and list
  getPendingSyncTickets(): PassengerTicket[] {
    return this.getTickets().filter(t => !t.syncedToCloud);
  }

  // Session
  getSession(): ConductorSession {
    try {
      const data = localStorage.getItem(SESSION_STORAGE_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_CONDUCTOR_SESSION;
  }

  saveSession(session: ConductorSession): void {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {
      // fallback
    }
  }

  // Sync Audit Records
  getSyncAuditLogs(): SyncAuditRecord[] {
    try {
      const data = localStorage.getItem(SYNC_AUDIT_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return [];
  }

  saveSyncAuditLog(log: SyncAuditRecord): void {
    const logs = this.getSyncAuditLogs();
    logs.unshift(log);
    try {
      localStorage.setItem(SYNC_AUDIT_KEY, JSON.stringify(logs.slice(0, 50)));
    } catch {
      // fallback
    }
  }

  // Telemetry
  getTelemetry(): DeviceTelemetry {
    try {
      const data = localStorage.getItem(TELEMETRY_KEY);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return {
      timDeviceId: 'AP-TIM-7052',
      batteryPercentage: 92,
      isCharging: false,
      paperRollPercentage: 78,
      networkMode: 'OFFLINE',
      syncState: 'OFFLINE',
      gpsLocked: true,
      currentLatLong: '16.5062° N, 80.6480° E (Vijayawada)',
      firmwareVersion: 'v4.3.0-APSRTC-SECURE',
      lastSyncTime: null
    };
  }

  saveTelemetry(telemetry: DeviceTelemetry): void {
    try {
      localStorage.setItem(TELEMETRY_KEY, JSON.stringify(telemetry));
    } catch {
      // fallback
    }
  }

  // Shift ledger stats (properly excluding cancelled tickets)
  getShiftStats() {
    const tickets = this.getTickets();
    const session = this.getSession();
    const shiftTickets = tickets.filter(t => t.waybillNumber === session.waybillNumber);

    let totalValidTickets = 0;
    let totalCancelledTickets = 0;
    let totalCash = 0;
    let totalUpi = 0;
    let totalZeroFarePassengers = 0;
    let totalAdults = 0;
    let totalChildren = 0;

    shiftTickets.forEach(t => {
      if (t.paymentStatus === 'CANCELLED') {
        totalCancelledTickets++;
        return; // do not include cancelled in revenue or active passengers
      }

      totalValidTickets++;
      if (t.paymentMethod === 'CASH') {
        totalCash += t.fare.totalFare;
      } else if (t.paymentMethod === 'UPI') {
        totalUpi += t.fare.totalFare;
      } else if (t.paymentMethod === 'ZERO_FARE_SCHEME') {
        totalZeroFarePassengers += t.passengers.adult;
      }

      totalAdults += t.passengers.adult;
      totalChildren += t.passengers.child;
    });

    return {
      totalTickets: totalValidTickets,
      totalCancelledTickets,
      totalRevenue: totalCash + totalUpi,
      totalCash,
      totalUpi,
      totalZeroFarePassengers,
      totalPassengers: totalAdults + totalChildren,
      totalAdults,
      totalChildren,
      pendingSyncCount: tickets.filter(t => !t.syncedToCloud).length
    };
  }

  // Clear demo data
  resetDatabase(): void {
    localStorage.removeItem(TICKETS_STORAGE_KEY);
    localStorage.removeItem(SYNC_AUDIT_KEY);
  }

  // Export tickets to CSV
  exportTicketsCSV(): string {
    const tickets = this.getTickets();
    const headers = [
      'Ticket ID',
      'Short Tkt No',
      'Transaction ID',
      'Timestamp',
      'Route',
      'Service',
      'From Stop',
      'To Stop',
      'Stages',
      'Adults',
      'Children',
      'Total Fare',
      'Payment Method',
      'Status',
      'Cancelled Reason',
      'Reprint Count'
    ];

    const rows = tickets.map(t => [
      t.ticketId,
      t.ticketNumber,
      t.transactionId || 'N/A',
      `"${t.issueTimestamp}"`,
      `"${t.routeNumber} - ${t.routeName}"`,
      t.serviceType,
      `"${t.fromStop.name}"`,
      `"${t.toStop.name}"`,
      t.stagesTravelled,
      t.passengers.adult,
      t.passengers.child,
      t.fare.totalFare,
      t.paymentMethod,
      t.paymentStatus,
      `"${t.cancellationReason || ''}"`,
      t.reprintCount || 0
    ]);

    return [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  }
}

export const localDb = new LocalDatabase();
