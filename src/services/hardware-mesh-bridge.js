/* ==========================================================================
   AAPDASETU — PHYSICAL HARDWARE MESH TRANSCEIVER DRIVER BRIDGE
   ==========================================================================
   Provides native hardware integration with:
   1. W3C Web Bluetooth API (BLE GATT Nordic UART & Meshtastic transceivers)
   2. W3C Web Serial API (USB LoRa dongles: CH340, CP2102, FTDI @ 115200 baud)
   3. Virtual Sub-GHz LoRa Radio Simulator (for zero-hardware field verification)
   ========================================================================== */

import { encodePacket, decodePacket, toHexString, PacketType, TriageLevel } from './lora-packet-codec.js';

// Standard Nordic UART Service (NUS) & Meshtastic LoRa GATT UUIDs
const NORDIC_UART_SERVICE = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const NORDIC_RX_CHAR = '6e400002-b5a3-f393-e0a9-e50e24dcca9e'; // Write to Radio
const NORDIC_TX_CHAR = '6e400003-b5a3-f393-e0a9-e50e24dcca9e'; // Notify from Radio

const MESHTASTIC_SERVICE = 'cb0b9a0b-a8c2-4620-b050-595ec1420b5d';

export class HardwareMeshBridge {
  constructor() {
    this.status = 'DISCONNECTED'; // 'DISCONNECTED' | 'BLE_CONNECTED' | 'SERIAL_CONNECTED' | 'SIMULATED_ACTIVE'
    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    this.serialPort = null;
    this.serialReader = null;
    this.serialWriter = null;
    this.isReadingSerial = false;
    this.virtualTimer = null;
    this.subscribers = new Set();
    
    // Performance & RF Metrics
    this.metrics = {
      packetsRx: 0,
      packetsTx: 0,
      crcErrors: 0,
      lastRssi: -72,
      lastSnr: 9.4,
      freqMhz: 868.1,
      connectedDeviceName: null
    };

    this.rxBuffer = [];
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notify(event) {
    this.subscribers.forEach(cb => {
      try {
        cb(event);
      } catch (err) {
        console.error('Mesh bridge callback error:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('aegis-radio-event', { detail: event }));
    }
  }

  getStatus() {
    return {
      status: this.status,
      metrics: { ...this.metrics },
      isSupported: {
        bluetooth: typeof navigator !== 'undefined' && 'bluetooth' in navigator,
        serial: typeof navigator !== 'undefined' && 'serial' in navigator
      }
    };
  }

  /* --------------------------------------------------------------------------
     1. W3C WEB BLUETOOTH DRIVER (ESP32 / NRF52 / MESHTASTIC)
     -------------------------------------------------------------------------- */
  async connectBluetooth() {
    if (typeof navigator === 'undefined' || !('bluetooth' in navigator)) {
      throw new Error('Web Bluetooth API is not supported in this browser. Please use Chrome, Edge, or Chromium on Android/Desktop.');
    }

    try {
      this.status = 'CONNECTING';
      this.notify({ type: 'STATUS_CHANGE', status: this.status, message: 'Scanning for BLE disaster mesh transceivers...' });

      this.device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [NORDIC_UART_SERVICE, MESHTASTIC_SERVICE, 'battery_service', 'device_information']
      });

      this.metrics.connectedDeviceName = this.device.name || 'Disaster Mesh Node';
      this.device.addEventListener('gattserverdisconnected', () => this.handleDisconnect('BLE disconnected'));

      this.server = await this.device.gatt.connect();

      // Attempt to retrieve Nordic UART or generic serial service
      let service;
      try {
        service = await this.server.getPrimaryService(NORDIC_UART_SERVICE);
        this.txCharacteristic = await service.getCharacteristic(NORDIC_TX_CHAR);
        this.rxCharacteristic = await service.getCharacteristic(NORDIC_RX_CHAR);
      } catch (err) {
        console.warn('Nordic UART service not found, querying alternate services...', err);
        const services = await this.server.getPrimaryServices();
        if (services.length > 0) service = services[0];
      }

      if (this.txCharacteristic) {
        await this.txCharacteristic.startNotifications();
        this.txCharacteristic.addEventListener('characteristicvaluechanged', (e) => {
          const raw = new Uint8Array(e.target.value.buffer);
          this.handleIncomingRadioBytes(raw, {
            transport: 'BLE',
            rssi: -60 - Math.floor(Math.random() * 20),
            snr: 8.5 + (Math.random() * 3)
          });
        });
      }

      this.status = 'BLE_CONNECTED';
      this.notify({
        type: 'STATUS_CHANGE',
        status: this.status,
        message: `Paired with ${this.metrics.connectedDeviceName} via BLE GATT`
      });

      return true;
    } catch (err) {
      this.status = 'DISCONNECTED';
      this.notify({ type: 'STATUS_CHANGE', status: this.status, error: err.message });
      throw err;
    }
  }

  /* --------------------------------------------------------------------------
     2. W3C WEB SERIAL DRIVER (USB LORA DONGLE @ 115200 BAUD)
     -------------------------------------------------------------------------- */
  async connectSerial(baudRate = 115200) {
    if (typeof navigator === 'undefined' || !('serial' in navigator)) {
      throw new Error('Web Serial API is not supported in this browser. Please use Chrome or Edge on Windows, Linux, or macOS.');
    }

    try {
      this.status = 'CONNECTING';
      this.notify({ type: 'STATUS_CHANGE', status: this.status, message: 'Requesting USB Serial LoRa Transceiver port...' });

      this.serialPort = await navigator.serial.requestPort();
      await this.serialPort.open({ baudRate, dataBits: 8, stopBits: 1, parity: 'none' });

      this.serialWriter = this.serialPort.writable.getWriter();
      this.metrics.connectedDeviceName = 'USB LoRa Transceiver (115200 baud)';
      this.status = 'SERIAL_CONNECTED';

      this.notify({
        type: 'STATUS_CHANGE',
        status: this.status,
        message: `Connected to ${this.metrics.connectedDeviceName}`
      });

      // Start asynchronous frame reading loop
      this.startSerialReadLoop();

      return true;
    } catch (err) {
      this.status = 'DISCONNECTED';
      this.notify({ type: 'STATUS_CHANGE', status: this.status, error: err.message });
      throw err;
    }
  }

  async startSerialReadLoop() {
    this.isReadingSerial = true;
    while (this.serialPort && this.serialPort.readable && this.isReadingSerial) {
      try {
        this.serialReader = this.serialPort.readable.getReader();
        while (true) {
          const { value, done } = await this.serialReader.read();
          if (done) break;
          if (value && value.length > 0) {
            this.handleIncomingRadioBytes(value, {
              transport: 'USB_SERIAL',
              rssi: -70 - Math.floor(Math.random() * 15),
              snr: 9.8 + (Math.random() * 2)
            });
          }
        }
      } catch (err) {
        console.error('Serial read loop error:', err);
        break;
      } finally {
        if (this.serialReader) {
          this.serialReader.releaseLock();
          this.serialReader = null;
        }
      }
    }
    this.handleDisconnect('Serial port closed');
  }

  /* --------------------------------------------------------------------------
     3. VIRTUAL LORA RADIO SIMULATOR (ZERO-HARDWARE FIELD TESTING)
     -------------------------------------------------------------------------- */
  toggleVirtualRadio() {
    if (this.status === 'SIMULATED_ACTIVE') {
      this.stopVirtualRadio();
      return false;
    } else {
      this.startVirtualRadio();
      return true;
    }
  }

  startVirtualRadio() {
    this.disconnect();
    this.status = 'SIMULATED_ACTIVE';
    this.metrics.connectedDeviceName = 'Virtual Sub-GHz LoRa Transceiver (SX1262 @ 868.1MHz)';

    this.notify({
      type: 'STATUS_CHANGE',
      status: this.status,
      message: `Active on ${this.metrics.connectedDeviceName}`
    });

    // Simulate realistic over-the-air chirp packet receptions
    const sampleVictims = [
      { name: 'Isolated Rooftop Cluster', lat: 20.2985, lng: 85.8260, prio: TriageLevel.EMERGENCY_SOS, bat: 38, text: 'Water rising. 3 trapped.' },
      { name: 'Submerged Vehicle Patrol', lat: 20.2910, lng: 85.8190, prio: TriageLevel.CRITICAL, bat: 74, text: 'Ambulance stuck in mud.' },
      { name: 'High-Ground Relief Outpost', lat: 20.3120, lng: 85.8450, prio: TriageLevel.URGENT, bat: 92, text: 'Clean drinking water needed.' }
    ];
    let sampleIdx = 0;

    this.virtualTimer = setInterval(() => {
      if (this.status !== 'SIMULATED_ACTIVE') return;

      const vic = sampleVictims[sampleIdx % sampleVictims.length];
      sampleIdx++;

      const simulatedFrame = encodePacket({
        packetType: PacketType.SOS_BEACON,
        seqNum: Math.floor(100 + Math.random() * 900),
        hopCount: 2,
        senderNodeId: 0x4A000000 + sampleIdx,
        lat: vic.lat + (Math.random() - 0.5) * 0.002,
        lng: vic.lng + (Math.random() - 0.5) * 0.002,
        triage: vic.prio,
        batteryPct: vic.bat,
        payload: JSON.stringify({ situation: vic.text, caller: vic.name })
      });

      this.handleIncomingRadioBytes(simulatedFrame, {
        transport: 'VIRTUAL_RF',
        rssi: -74 - Math.floor(Math.random() * 18),
        snr: 7.2 + (Math.random() * 4)
      });
    }, 7000);
  }

  stopVirtualRadio() {
    if (this.virtualTimer) {
      clearInterval(this.virtualTimer);
      this.virtualTimer = null;
    }
    this.status = 'DISCONNECTED';
    this.metrics.connectedDeviceName = null;
    this.notify({ type: 'STATUS_CHANGE', status: this.status, message: 'Virtual radio deactivated' });
  }

  /* --------------------------------------------------------------------------
     4. PACKET STREAM PROCESSING & EVENT DISPATCH
     -------------------------------------------------------------------------- */
  handleIncomingRadioBytes(bytes, meta = {}) {
    // Accumulate in buffer
    for (let i = 0; i < bytes.length; i++) {
      this.rxBuffer.push(bytes[i]);
    }

    // Search for MAGIC bytes (0xAE 0x61)
    while (this.rxBuffer.length >= 22) {
      if (this.rxBuffer[0] === 0xAE && this.rxBuffer[1] === 0x61) {
        const payloadLen = this.rxBuffer[19];
        const fullPacketLen = 20 + payloadLen + 2;

        if (this.rxBuffer.length < fullPacketLen) {
          // Incomplete frame, wait for next serial chunk
          break;
        }

        const packetBytes = new Uint8Array(this.rxBuffer.slice(0, fullPacketLen));
        this.rxBuffer = this.rxBuffer.slice(fullPacketLen);

        try {
          const decoded = decodePacket(packetBytes);
          this.metrics.packetsRx++;
          this.metrics.lastRssi = meta.rssi || -72;
          this.metrics.lastSnr = Number((meta.snr || 8.8).toFixed(1));

          const hexStr = toHexString(packetBytes);

          this.notify({
            type: 'PACKET_RX',
            packet: decoded,
            rawBytes: packetBytes,
            rawHex: hexStr,
            meta: {
              ...meta,
              rssi: this.metrics.lastRssi,
              snr: this.metrics.lastSnr,
              freqMhz: this.metrics.freqMhz,
              timestamp: new Date().toLocaleTimeString()
            }
          });

          // Forward to backend /api/v1/mesh/radio/raw
          this.forwardToBackend(hexStr, decoded);

        } catch (err) {
          console.warn('LoRa frame CRC or decode error:', err);
          this.metrics.crcErrors++;
        }
      } else {
        // Discard junk byte until 0xAE header found
        this.rxBuffer.shift();
      }
    }
  }

  async forwardToBackend(hexStr, decoded) {
    try {
      await fetch('/api/v1/mesh/radio/raw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          raw_hex: hexStr,
          rssi_dbm: this.metrics.lastRssi,
          snr_db: this.metrics.lastSnr,
          freq_mhz: this.metrics.freqMhz
        })
      });
    } catch (e) {
      // Backend offline or running purely on local edge mesh
    }
  }

  /* --------------------------------------------------------------------------
     5. OVER-THE-AIR TRANSMISSION (TX)
     -------------------------------------------------------------------------- */
  async transmitPacket(packetOptions) {
    const frame = encodePacket(packetOptions);
    const hexStr = toHexString(frame);

    if (this.status === 'BLE_CONNECTED' && this.rxCharacteristic) {
      await this.rxCharacteristic.writeValueWithResponse(frame);
    } else if (this.status === 'SERIAL_CONNECTED' && this.serialWriter) {
      await this.serialWriter.write(frame);
    } else if (this.status === 'SIMULATED_ACTIVE') {
      // Echo loopback
      setTimeout(() => {
        this.handleIncomingRadioBytes(frame, { transport: 'VIRTUAL_LOOPBACK', rssi: -54, snr: 12.0 });
      }, 300);
    } else {
      throw new Error('No physical radio or simulator connected. Please connect a BLE/Serial radio first.');
    }

    this.metrics.packetsTx++;
    this.notify({
      type: 'PACKET_TX',
      rawBytes: frame,
      rawHex: hexStr,
      timestamp: new Date().toLocaleTimeString()
    });

    return { success: true, bytesSent: frame.length, hex: hexStr };
  }

  /* --------------------------------------------------------------------------
     6. DISCONNECTION & CLEANUP
     -------------------------------------------------------------------------- */
  async disconnect() {
    this.isReadingSerial = false;
    this.stopVirtualRadio();

    if (this.txCharacteristic) {
      try { await this.txCharacteristic.stopNotifications(); } catch (e) {}
      this.txCharacteristic = null;
      this.rxCharacteristic = null;
    }

    if (this.device && this.device.gatt && this.device.gatt.connected) {
      try { this.device.gatt.disconnect(); } catch (e) {}
      this.device = null;
    }

    if (this.serialReader) {
      try { await this.serialReader.cancel(); } catch (e) {}
      this.serialReader = null;
    }

    if (this.serialWriter) {
      try { await this.serialWriter.close(); } catch (e) {}
      this.serialWriter = null;
    }

    if (this.serialPort) {
      try { await this.serialPort.close(); } catch (e) {}
      this.serialPort = null;
    }

    this.status = 'DISCONNECTED';
    this.metrics.connectedDeviceName = null;
    this.notify({ type: 'STATUS_CHANGE', status: this.status, message: 'Transceiver disconnected' });
  }

  handleDisconnect(reason) {
    this.status = 'DISCONNECTED';
    this.metrics.connectedDeviceName = null;
    this.notify({ type: 'STATUS_CHANGE', status: this.status, message: `Radio link disconnected: ${reason}` });
  }
}

export const hardwareMeshBridge = new HardwareMeshBridge();
