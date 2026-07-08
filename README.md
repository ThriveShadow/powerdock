# ⚡ Power Dock

**IoT-based smart powerbank rental & charging station**, built around an MQTT-driven hardware/software stack — from a coin-sized RISC-V MCU inside every powerbank, up to a NextJS web-app users tap to rent one.

![Station Layout](https://raw.githubusercontent.com/ThriveShadow/powerdock/refs/heads/master/Images/Layout.png)

> Rent. Charge. Go.

[![Firmware](https://img.shields.io/badge/firmware-ESP32--S3%20%2B%20CH32V003-yellow)]()
[![Backend](https://img.shields.io/badge/backend-MQTT%20%2B%20n8n-orange)]()
[![Web](https://img.shields.io/badge/web--app-NextJS%20%2B%20Firebase-black)]()
[![DB](https://img.shields.io/badge/database-PostgreSQL%20(AWS%20RDS)-blue)]()

---

## 🧭 Overview

Smartphones and portable devices are essential in daily life, but heavy usage drains batteries fast — and outlets aren't always nearby. Power Dock is a centralized, IoT-enabled powerbank rental system that lets users grab a charged powerbank from any station, use it on the go, and return it (at any station) when they're done.

Unlike many existing rental kiosks, every station and every individual powerbank in Power Dock reports live telemetry — status, temperature, docking state — back to a central backend over **MQTT**, giving operators real-time visibility instead of a black box.

### Goals
- Design a reliable **MQTT-based communication system** between stations and the server.
- Measure and validate that reliability: **connection latency, delivery success rate, transmission consistency**.
- Validate telemetry accuracy (battery status, temperature) against reference measurements and track power draw per station.

### Scope
- IoT-based smart powerbank rental & charging station using MQTT.
- Telemetry limited to **temperature** and **powerbank status**.
- Prototype station holds **6 powerbank slots**.
- Software stack limited to **NextJS**, **Firebase**, and **n8n**, deployed on **AWS EC2**.

---

## 🏗️ System Architecture

```
                         IoT — Powerbank Rental System
┌───────────────────────────┐        ┌────────────┐      ┌────────────┐
│  Powerbank 1..n modules   │        │ Solenoid 1 │      │ Solenoid n │
│  CH32V003 MCU             │        │ (dock lock)│ ...  │(dock lock) │
│  [UID, temp sensor]       │        └─────▲──────┘      └─────▲──────┘
└─────────────┬─────────────┘              │                   │
              │ I2C                        │                   │
              ▼                            │                   │
       ┌─────────────┐                     │                   │
       │  I2C MUX    │     ┌───────────────┴───────────────────┘
       │ (TCA9548A)  │     │ 
       └──────┬──────┘     │
         I2C  │   ┌────────┘
              ▼   │
        ┌───────────┐   SPI    ┌──────────┐
        │   ESP32   │─────────►│  TFT LCD │  (station status UI)
        └─────┬─────┘          └──────────┘
              │   HARDWARE
     ─ ─ ─ ─ ─┼─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─
        MQTT  │   SOFTWARE            AWS EC2
              ▼
      ┌───────────────┐    ┌─────────────┐    ┌──────────────┐
      │ MQTT Broker   │◄──►│ n8n Backend │◄──►│ Amazon RDS   │
      │ (Mosquitto)   │    └─────────────┘    │ (PostgreSQL) │
      └───────────────┘           ▲           └──────────────┘
                                  │
                            ┌─────────────┐
      ┌───────────────┐     │   NextJS    │
      │ Firebase Auth │◄───►│   Web-app   │
      └───────────────┘     └─────────────┘
              ▲                    ▲
              │                    │
      ┌────────────────────┐       │
      │Midtrans Payment GW │◄──────┘
      └────────────────────┘
```

Each powerbank carries its own **CH32V003** MCU (UID + onboard temperature sensing). Up to 8 sit behind an **I2C multiplexer** on the station, read out by an **ESP32-S3**, which also drives solenoid locks per slot and a TFT status display. The station talks to the backend purely over MQTT; an **n8n** workflow engine ingests those messages, writes to Postgres, and exposes webhooks the web-app calls for renting/returning/top-ups.

---

## 📁 Repository Structure

```
.
├── Firmware/
│   ├── Station/       # ESP32-S3 firmware — I2C mux scanning, solenoid control,
│   │                  # TFT UI, MQTT publish/subscribe
│   └── Powerbank/      # CH32V003 firmware — UID reporting, temperature sensing
│                       # over I2C to the station
└── NextJS-Web-App/     # User-facing web app (rent/return, QR scan, wallet top-up)
                         # + Prisma schema, Firebase auth, Midtrans integration
```

| Folder | Role | Key details |
|---|---|---|
| `Firmware/Station` | Station controller | ESP32-S3, TCA9548A I2C mux, solenoid drivers, TFT LCD, MQTT client |
| `Firmware/Powerbank` | Per-powerbank module | CH32V003J4M6, NTC temperature sensing, I2C slave, unique UID |
| `NextJS-Web-App` | User & admin surface | NextJS + Prisma, Firebase Auth, Midtrans payment gateway |

---

## 🔩 Hardware

![PCB Layout](https://raw.githubusercontent.com/ThriveShadow/powerdock/refs/heads/master/Images/PCB.png)

**Station board** (`Power Dock — Rev 0`)
- **MCU:** ESP32-S3 (WROOM-1-N16R8)
- **I2C fan-out:** TCA9548A 8-channel multiplexer to up to 8 powerbank slots
- **Actuation:** 8× solenoid locks, each switched via AO3400A MOSFET
- **Display:** SPI TFT LCD for live station/powerbank status
- **Power in:** USB-C with CH224K PD trigger, stepped down to 3.3V (AMS1117-3.3)
- **Flashing:** onboard CH340X USB-to-UART
- **Extras:** spare I2C breakout header

**Powerbank module**
- **MCU:** CH32V003J4M6 (RISC-V)
- **Sensing:** NTC 10K thermistor voltage-divider for temperature
- **Interface:** I2C slave (SDA/SCL) to the station's mux, reporting UID + temp

---

## ☁️ Software Stack & Deployment

| Component | Stack |
|---|---|
| **AWS EC2 #1** | Mosquitto (MQTT broker) · n8n (backend/automation) · Grafana (monitoring) |
| **AWS EC2 #2** | NextJS + Prisma (web-app) |
| **Amazon RDS** | PostgreSQL |
| **Cloudflare** | DNS · Tunnel |

### Backend flow (n8n)
Three webhook-driven workflows tie the system together:
1. **Powerbank Rent Webhook** → looks up/aggregates station rows → inserts/updates Postgres → calls out via HTTP.
2. **Slot Open Webhook** → formats the unlock command → publishes to MQTT.
3. **MQTT Trigger** (telemetry ingest) → splits incoming payloads → upserts/updates powerbank & station rows in Postgres.

### Core user flows
- **Telemetry reporting:** Station → JSON payload → MQTT → n8n parses → stored in Postgres. *(machine-to-server, internal operation)*
- **Balance top-up:** User taps top-up → Midtrans payment → n8n verifies → Firebase/Postgres balance updated → user notified.
- **Renting:** User scans station QR → app checks balance → unlock request → MQTT → ESP32 fires solenoid → transaction logged.
- **Returning:** ESP32 detects powerbank reinsertion via I2C scan → MQTT return event → backend calculates rental duration, deducts balance, updates Postgres, notifies user.

---

## 📱 Web-App

Built with **NextJS**, **Prisma**, and **Firebase Auth** (email/password + Google sign-in). Users can:
- Browse nearby stations and live slot availability
- Top up their wallet balance (via Midtrans)
- Scan a station QR to rent a powerbank
- Track active rentals, rates, and return terms

## 📊 Admin Dashboard

A **Grafana** dashboard (fed by the same PostgreSQL data) gives operators station status (online/offline), powerbank circulation counts, live temperature trends, station map, and revenue tracking (top-ups vs. rental revenue vs. balance in circulation).

---

## ✅ Validation Results

Over a ~1 hour test run (5-second sampling interval, 729 records logged):

| Metric | Result |
|---|---|
| MQTT delivery success rate | **100%** (no data loss) |
| Backend latency (MQTT → DB write) — min | 45 ms |
| Backend latency — max | 52 ms |
| Backend latency — average | 48.43 ms |

Hosting the backend on AWS EC2 and PostgreSQL on AWS RDS within the same region (Asia Pacific – Singapore) kept network latency low and consistent.

---

## 🔭 Future Improvements

- Active cooling or automatic charge-current throttling as battery temperature nears safety limits
- Temperature-based early-warning notifications for operators/users
- Longer-duration testing across varied environmental conditions
- Move high-frequency telemetry (e.g. temperature every 5s per powerbank) to a **time-series database** (e.g. Prometheus) to keep the Postgres logs table scalable

---

## 🎥 Demo

Video walkthrough: [Google Drive link](https://drive.google.com/file/d/122qnrVt2bwimFIO7LWl8ttcuse4L7c3p/view?usp=sharing)
