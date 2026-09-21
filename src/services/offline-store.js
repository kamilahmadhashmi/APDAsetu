/* ==========================================================================
   AEGIS-MESH / AAPDASETU - INDEXEDDB OFFLINE STORE & FORWARD QUEUE
   Guarantees persistent disaster survival of distress signals when cellular
   and internet connections are completely down. Automatically syncs with
   backend gateway when connectivity returns.
   ========================================================================== */

const DB_NAME = 'AapdaSetuDisasterDB';
const DB_VERSION = 1;
const STORE_NAME = 'pending_distress_packets';

class OfflineStoreService {
  constructor() {
    this.db = null;
    this.initPromise = this.openDatabase();
    this.initNetworkListener();
  }

  openDatabase() {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('indexedDB' in window)) {
        console.warn('[OfflineStore] IndexedDB not available');
        resolve(null);
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('status', 'status', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this.db = e.target.result;
        resolve(this.db);
      };

      request.onerror = (e) => {
        console.error('[OfflineStore] Failed to open IndexedDB:', e);
        reject(e);
      };
    });
  }

  async enqueueDistressPacket(packet) {
    await this.initPromise;
    if (!this.db) return false;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const record = {
        ...packet,
        queued_at: Date.now(),
        sync_status: 'PENDING_OFFLINE_QUEUE'
      };

      const req = store.put(record);
      req.onsuccess = () => {
        console.log(`[OfflineStore] Distress packet ${packet.id} safely stored in local IndexedDB.`);
        resolve(true);
      };
      req.onerror = (err) => reject(err);
    });
  }

  async getPendingPackets() {
    await this.initPromise;
    if (!this.db) return [];

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = (err) => reject(err);
    });
  }

  async removePacket(id) {
    await this.initPromise;
    if (!this.db) return;

    return new Promise((resolve, reject) => {
      const tx = this.db.transaction([STORE_NAME], 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(id);
      req.onsuccess = () => resolve(true);
      req.onerror = (err) => reject(err);
    });
  }

  initNetworkListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[OfflineStore] Network restored! Flushing offline distress queue...');
        this.flushPendingPackets();
      });
    }
  }

  async flushPendingPackets() {
    try {
      const packets = await this.getPendingPackets();
      if (!packets.length) return;

      console.log(`[OfflineStore] Syncing ${packets.length} pending packets to dispatch gateway...`);
      for (const p of packets) {
        try {
          const res = await fetch('/api/v1/incidents/ingest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p)
          });
          if (res.ok) {
            await this.removePacket(p.id);
            console.log(`[OfflineStore] Successfully synced packet ${p.id}`);
          }
        } catch (err) {
          console.warn(`[OfflineStore] Could not sync packet ${p.id} yet:`, err);
        }
      }
    } catch (e) {
      console.error('[OfflineStore] Error flushing packets:', e);
    }
  }
}

export const offlineStore = new OfflineStoreService();
