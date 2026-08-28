/* ==========================================================================
   AEGIS-MESH / RESQNET — CENTRALIZED LIVE USER LOCATION SERVICE (SIMULATION LAYER)
   Provides single-source-of-truth user location state, browser Geolocation
   continuous watching with graceful fallback, movement simulation, nearest-entity
   distance calculations, and cross-context BroadcastChannel synchronization.
   ========================================================================== */

export const DEMO_USER_LOCATION = Object.freeze({
  latitude: 20.2961,
  longitude: 85.8245,
  accuracy: 14, // meters
  altitude: 42,
  heading: null,
  speed: null,
  label: 'Bhubaneswar Sector B4 (Disaster Inundation Zone)'
});

export const mockShelters = [
  { id: 'SHELTER-01', name: 'St. Jude Relief Hub & School', lat: 20.2850, lng: 85.8120, capacity: '76/80', type: 'High Ground Auditorium', color: '#10b981' },
  { id: 'SHELTER-02', name: 'Apex Kalinga Stadium Shelter', lat: 20.3300, lng: 85.8500, capacity: '15/50', type: 'NDRF Field Complex', color: '#0ea5e9' },
  { id: 'SHELTER-03', name: 'Baramunda Elevated Relief Camp', lat: 20.2780, lng: 85.8390, capacity: '120/150', type: 'Municipal Relief Center', color: '#8b5cf6' }
];

export const mockHospitals = [
  { id: 'HOSP-01', name: 'Apex General Trauma Center', occupied: 102, total: 120, pct: 85, lat: 20.3200, lng: 85.8100, status: 'HIGH_LOAD', color: '#f59e0b' },
  { id: 'HOSP-02', name: 'St. Jude Emergency Relief Hub', occupied: 76, total: 80, pct: 95, lat: 20.2700, lng: 85.8000, status: 'CRITICAL_CAPACITY', color: '#ef4444' },
  { id: 'HOSP-03', name: 'NDRF Mobile Field Hospital', occupied: 15, total: 50, pct: 30, lat: 20.3300, lng: 85.8500, status: 'OPERATIONAL_FREE', color: '#10b981' }
];

export const mockUtilityFleet = [
  { id: 'FLEET-BOAT-1', name: 'NDRF Rescue Boat Alpha', type: 'Rescue Boat', crew: '4 Rescue Specialists', status: 'DISPATCHED', lat: 20.2920, lng: 85.8200, icon: 'directions_boat', color: '#0ea5e9' },
  { id: 'FLEET-CHOP-2', name: 'Air Force Chopper 2', type: 'Rescue Chopper', crew: '3 Air Crew + Winch', status: 'PATROLLING', lat: 20.3100, lng: 85.8250, icon: 'helicopter', color: '#a855f7' },
  { id: 'FLEET-AMPH-1', name: 'Coast Guard Amphibious-1', type: 'Amphibious Vehicle', crew: '6 Crew', status: 'AVAILABLE', lat: 20.2750, lng: 85.8100, icon: 'directions_car', color: '#10b981' },
  { id: 'FLEET-PUMP-4', name: 'High Capacity Pumper Truck 04', type: 'Utility Pumper', crew: '5000L/min Pump', status: 'DEPLOYED', lat: 20.2880, lng: 85.8180, icon: 'fire_truck', color: '#f59e0b' }
];

class LocationService {
  constructor() {
    this.state = {
      latitude: DEMO_USER_LOCATION.latitude,
      longitude: DEMO_USER_LOCATION.longitude,
      accuracy: DEMO_USER_LOCATION.accuracy,
      altitude: DEMO_USER_LOCATION.altitude,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      source: 'DEMO', // 'GPS' | 'DEMO' | 'SIMULATED'
      status: 'ACTIVE', // 'ACTIVE' | 'LOCATING' | 'DENIED' | 'UNAVAILABLE' | 'ERROR'
      tracking: false,
      connectionStatus: 'ONLINE', // 'ONLINE' | 'OFFLINE' | 'BLACKOUT_MESH'
      errorMessage: null
    };

    this.subscribers = new Set();
    this.watchId = null;
    this.simulationTimer = null;
    this.simulationIndex = 0;
    this.broadcastChannel = null;

    this.initBroadcastChannel();
    this.initStorageListener();
  }

  initBroadcastChannel() {
    try {
      if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
        this.broadcastChannel = new BroadcastChannel('resqnet_user_location_sync');
        this.broadcastChannel.onmessage = (event) => {
          if (event.data && event.data.type === 'USER_LOCATION_UPDATE') {
            this.applyExternalState(event.data.payload);
          } else if (event.data && event.data.type === 'DISTRESS_PACKET_BROADCAST') {
            this.handleIncomingDistressPacket(event.data.payload);
          }
        };
      }
    } catch (e) {
      console.warn('[LocationService] BroadcastChannel unavailable, using in-memory / storage sync.');
    }
  }

  initStorageListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (e) => {
        if (e.key === 'resqnet_user_location' && e.newValue) {
          try {
            const data = JSON.parse(e.newValue);
            this.applyExternalState(data);
          } catch (err) {}
        }
      });
    }
  }

  applyExternalState(newState) {
    if (!newState || typeof newState.latitude !== 'number') return;
    this.state = { ...this.state, ...newState, timestamp: Date.now() };
    this.notifySubscribers();
  }

  getState() {
    return { ...this.state };
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    try {
      callback(this.getState());
    } catch (err) {
      console.error('[LocationService] Subscriber error:', err);
    }
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers() {
    const currentState = this.getState();
    this.subscribers.forEach(cb => {
      try {
        cb(currentState);
      } catch (e) {
        console.error('[LocationService] Subscriber callback error:', e);
      }
    });

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'USER_LOCATION_UPDATE',
          payload: currentState
        });
      } catch (e) {}
    }

    if (typeof localStorage !== 'undefined') {
      try {
        localStorage.setItem('resqnet_user_location', JSON.stringify(currentState));
      } catch (e) {}
    }
  }

  startWatchingGPS() {
    this.stopMovementSimulation();

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.state.status = 'UNAVAILABLE';
      this.state.source = 'DEMO';
      this.state.tracking = false;
      this.state.errorMessage = 'Browser does not support Geolocation API';
      this.notifySubscribers();
      return;
    }

    this.state.status = 'LOCATING';
    this.state.tracking = true;
    this.state.errorMessage = null;
    this.notifySubscribers();

    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }

    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    const successHandler = (position) => {
      const { latitude, longitude, accuracy, altitude, heading, speed } = position.coords;
      this.state = {
        ...this.state,
        latitude,
        longitude,
        accuracy: Math.round(accuracy || 10),
        altitude: altitude !== null ? Math.round(altitude) : null,
        heading: heading !== null ? Math.round(heading) : null,
        speed: speed !== null ? Math.round(speed * 3.6) : null,
        timestamp: position.timestamp || Date.now(),
        source: 'GPS',
        status: 'ACTIVE',
        tracking: true,
        errorMessage: null
      };
      this.notifySubscribers();
    };

    const errorHandler = (error) => {
      let errorText = 'Location unavailable';
      let status = 'UNAVAILABLE';

      switch (error.code) {
        case 1:
          errorText = 'Location permission denied by user';
          status = 'DENIED';
          break;
        case 2:
          errorText = 'GPS position unavailable';
          status = 'UNAVAILABLE';
          break;
        case 3:
          errorText = 'GPS location request timed out';
          status = 'UNAVAILABLE';
          break;
      }

      this.state = {
        ...this.state,
        latitude: DEMO_USER_LOCATION.latitude,
        longitude: DEMO_USER_LOCATION.longitude,
        accuracy: DEMO_USER_LOCATION.accuracy,
        source: 'DEMO',
        status,
        tracking: false,
        errorMessage: errorText
      };
      this.notifySubscribers();
    };

    try {
      this.watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, options);
    } catch (err) {
      errorHandler({ code: 0, message: err.message });
    }
  }

  stopWatchingGPS() {
    if (this.watchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.state.tracking = false;
  }

  setDemoLocation() {
    this.stopWatchingGPS();
    this.stopMovementSimulation();

    this.state = {
      ...this.state,
      latitude: DEMO_USER_LOCATION.latitude,
      longitude: DEMO_USER_LOCATION.longitude,
      accuracy: DEMO_USER_LOCATION.accuracy,
      altitude: DEMO_USER_LOCATION.altitude,
      heading: null,
      speed: null,
      timestamp: Date.now(),
      source: 'DEMO',
      status: 'ACTIVE',
      tracking: false,
      errorMessage: null
    };
    this.notifySubscribers();
  }

  startMovementSimulation() {
    this.stopWatchingGPS();
    this.stopMovementSimulation();

    const waypoints = [
      [20.2961, 85.8245],
      [20.2945, 85.8225],
      [20.2925, 85.8198],
      [20.2895, 85.8170],
      [20.2865, 85.8140],
      [20.2850, 85.8120],
      [20.2880, 85.8160],
      [20.2930, 85.8210],
      [20.2961, 85.8245]
    ];

    let currentWpIdx = 0;
    let step = 0;
    const totalSteps = 30;

    this.state.source = 'SIMULATED';
    this.state.status = 'ACTIVE';
    this.state.tracking = true;
    this.state.accuracy = 8;
    this.notifySubscribers();

    this.simulationTimer = setInterval(() => {
      const startWp = waypoints[currentWpIdx];
      const nextWp = waypoints[(currentWpIdx + 1) % waypoints.length];

      step++;
      const progress = step / totalSteps;

      const lat = startWp[0] + (nextWp[0] - startWp[0]) * progress;
      const lng = startWp[1] + (nextWp[1] - startWp[1]) * progress;
      const heading = this.calculateBearing(startWp[0], startWp[1], nextWp[0], nextWp[1]);

      this.state = {
        ...this.state,
        latitude: parseFloat(lat.toFixed(6)),
        longitude: parseFloat(lng.toFixed(6)),
        heading: Math.round(heading),
        speed: 14,
        timestamp: Date.now(),
        source: 'SIMULATED',
        status: 'ACTIVE',
        tracking: true
      };
      this.notifySubscribers();

      if (step >= totalSteps) {
        step = 0;
        currentWpIdx = (currentWpIdx + 1) % (waypoints.length - 1);
      }
    }, 400);
  }

  stopMovementSimulation() {
    if (this.simulationTimer) {
      clearInterval(this.simulationTimer);
      this.simulationTimer = null;
    }
  }

  setConnectionStatus(status) {
    this.state.connectionStatus = status;
    this.notifySubscribers();
  }

  calculateDistanceKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  formatDistance(distanceKm) {
    if (distanceKm < 1) {
      return `${Math.round(distanceKm * 1000)} m`;
    }
    return `${distanceKm.toFixed(1)} km`;
  }

  calculateBearing(lat1, lon1, lat2, lon2) {
    const toRad = Math.PI / 180;
    const y = Math.sin((lon2 - lon1) * toRad) * Math.cos(lat2 * toRad);
    const x =
      Math.cos(lat1 * toRad) * Math.sin(lat2 * toRad) -
      Math.sin(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.cos((lon2 - lon1) * toRad);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
  }

  getNearestHospital() {
    const { latitude, longitude } = this.state;
    let nearest = null;
    let minDistance = Infinity;

    mockHospitals.forEach(h => {
      const dist = this.calculateDistanceKm(latitude, longitude, h.lat, h.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { ...h, distanceKm: dist, formattedDistance: this.formatDistance(dist) };
      }
    });
    return nearest;
  }

  getNearestShelter() {
    const { latitude, longitude } = this.state;
    let nearest = null;
    let minDistance = Infinity;

    mockShelters.forEach(s => {
      const dist = this.calculateDistanceKm(latitude, longitude, s.lat, s.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { ...s, distanceKm: dist, formattedDistance: this.formatDistance(dist) };
      }
    });
    return nearest;
  }

  getNearestRescueTeam() {
    const { latitude, longitude } = this.state;
    let nearest = null;
    let minDistance = Infinity;

    mockUtilityFleet.forEach(f => {
      const dist = this.calculateDistanceKm(latitude, longitude, f.lat, f.lng);
      if (dist < minDistance) {
        minDistance = dist;
        nearest = { ...f, distanceKm: dist, formattedDistance: this.formatDistance(dist) };
      }
    });
    return nearest;
  }

  transmitDistressPacket(details = {}) {
    const state = this.getState();
    const packetId = `SOS-${Math.floor(1000 + Math.random() * 9000)}`;

    const packet = {
      id: packetId,
      title: details.situation || 'Critical Survivor Distress',
      desc: details.notes || 'Emergency distress packet broadcast from field operator.',
      lat: state.latitude,
      lng: state.longitude,
      accuracy: state.accuracy,
      source: state.source === 'GPS' ? 'LIVE BROWSER GPS' : 'DEMO/SIMULATED GPS',
      timestamp: Date.now(),
      prio: 'Priority 1',
      prioType: 'red',
      meshHop: 'BLE Mesh Direct Hop #1',
      tags: ['Emergency SOS', 'Immediate Evac'],
      time: 'Just now'
    };

    if (this.broadcastChannel) {
      try {
        this.broadcastChannel.postMessage({
          type: 'DISTRESS_PACKET_BROADCAST',
          payload: packet
        });
      } catch (e) {}
    }

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resqnet-distress-packet', { detail: packet }));
    }

    return packet;
  }

  handleIncomingDistressPacket(packet) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('resqnet-distress-packet', { detail: packet }));
    }
  }
}

export const locationService = new LocationService();

if (typeof window !== 'undefined') {
  window.aegisLocationService = locationService;
}
