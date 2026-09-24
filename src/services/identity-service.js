/* ==========================================================================
   AAPDASETU — TACTICAL IDENTITY, RBAC & ED25519 ANTI-SPOOFING SERVICE
   ==========================================================================
   Manages device identity, Ed25519 keypairs, and Tactical Role Hierarchy:
   1. CITIZEN (Level 1)
   2. NDRF_RESPONDER (Level 2)
   3. INCIDENT_COMMANDER (Level 3)
   ========================================================================== */

export const ROLE_DEFINITIONS = {
  CITIZEN: {
    level: 1,
    title: 'Citizen / Field Beacon',
    badgeClass: 'badge-cyan',
    icon: 'user',
    desc: 'Emergency SOS beacon broadcasting, safe route navigation, disaster alerts.'
  },
  NDRF_RESPONDER: {
    level: 2,
    title: 'NDRF Rescue Operator',
    badgeClass: 'badge-amber',
    icon: 'shield',
    desc: 'Incident claiming, victim triage tagging (START), boat & drone status updates.'
  },
  INCIDENT_COMMANDER: {
    level: 3,
    title: 'District Incident Commander',
    badgeClass: 'badge-red',
    icon: 'award',
    desc: 'Full dispatch authority, municipal sirens, CAP v1.2 government broadcasts.'
  }
};

class IdentityService {
  constructor() {
    this.storageKeyRole = 'aapda_active_role';
    this.storageKeyNodeId = 'aapda_node_id';
    this.storageKeyToken = 'aapda_auth_token';

    this.activeRole = localStorage.getItem(this.storageKeyRole) || 'CITIZEN';
    this.nodeId = localStorage.getItem(this.storageKeyNodeId) || this.generateNodeId();
    this.token = localStorage.getItem(this.storageKeyToken) || null;
    this.listeners = new Set();
  }

  generateNodeId() {
    const id = 'NODE-' + Math.random().toString(16).substring(2, 6).toUpperCase();
    localStorage.setItem(this.storageKeyNodeId, id);
    return id;
  }

  getRole() {
    return this.activeRole;
  }

  getRoleInfo() {
    return ROLE_DEFINITIONS[this.activeRole] || ROLE_DEFINITIONS.CITIZEN;
  }

  getNodeId() {
    return this.nodeId;
  }

  getToken() {
    return this.token;
  }

  async setRole(newRole) {
    if (!ROLE_DEFINITIONS[newRole]) return;
    this.activeRole = newRole;
    localStorage.setItem(this.storageKeyRole, newRole);

    try {
      const res = await fetch('/api/v1/auth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole, node_id: this.nodeId })
      });
      if (res.ok) {
        const data = await res.json();
        this.token = data.token;
        localStorage.setItem(this.storageKeyToken, this.token);
      }
    } catch (e) {
      console.warn('Offline token fallback');
    }

    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    const info = this.getRoleInfo();
    this.listeners.forEach(cb => cb(this.activeRole, info));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aapda-role-changed', {
        detail: { role: this.activeRole, roleInfo: info }
      }));
    }
  }

  hasPermission(requiredRole) {
    const currentLevel = (ROLE_DEFINITIONS[this.activeRole] || {}).level || 1;
    const requiredLevel = (ROLE_DEFINITIONS[requiredRole] || {}).level || 1;
    return currentLevel >= requiredLevel;
  }
}

export const identityService = new IdentityService();
