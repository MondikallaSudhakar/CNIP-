# MediNet – Hospital Emergency Communication Network
### Intelligent, Reliable and Fault-Tolerant Interdepartmental Communication System

> **Tagline:** Reliable Communication. Faster Coordination. Better Emergency Response.

MediNet is a comprehensive, production-grade Computer Networks academic project demonstrating reliable medical message transmission between five hospital departments:
1. **Emergency Department (ER)** — `192.168.10.1`
2. **Intensive Care Unit (ICU)** — `192.168.10.2`
3. **Diagnostic Laboratory (LAB)** — `192.168.10.3`
4. **Central Pharmacy (PHARM)** — `192.168.10.4`
5. **Hospital Administration (ADMIN)** — `192.168.10.5`

---

## 1. Project Modules & Features

MediNet implements 15 dedicated modules:
- **Command Center:** Real-time operational dashboard with PDR, delay, and event feeds.
- **Live Hospital Network:** Interactive SVG hospital mesh topology with configurable edge costs, propagation delays, link failure simulation, and animated packet pulse.
- **Department Communication:** Interdepartmental medical message composer with CRITICAL/HIGH/NORMAL/LOW priorities, clinical templates, and full transmission pipeline receipts.
- **Data Link Layer:** Conceptual foundation of framing, error control, and flow regulation.
- **Framing Laboratory:** Interactive framing with Character Count, Byte Stuffing (FLAG/ESC), and HDLC Bit Stuffing (5-ones rule) with receiver extraction.
- **CRC Error Detection:** Modulo-2 binary polynomial long division for CRC-8, CRC-16, and CRC-32 with step-by-step XOR division trace and interactive bit-corruption testing.
- **Flow Control:** Sliding Window Flow Control demonstrating how window limits prevent receiver buffer overflow.
- **Go-Back-N ARQ:** Complete Go-Back-N state machine with sequence numbers modulo $2^m$, cumulative ACKs, out-of-order rejection, timeout detection, and window retransmissions.
- **Intelligent Routing:** Dijkstra's algorithm calculating lowest-cost paths, dynamic failure rerouting, and loopless alternatives.
- **NS2 Simulation Lab:** Genuine NS2 Tcl script generator for 6 university experiments, trace parser (.tr), sample traces, and downloadable scripts.
- **Congestion Monitoring:** Evaluation of Low, Medium, and High traffic loads comparing DropTail and RED (Random Early Detection).
- **Wireshark Packet Inspector:** Valid binary libpcap (.pcap) generation and parsing with protocol filtering (TCP/UDP/ICMP), TCP flags, and hex payload dumps.
- **Network Analytics:** Statistical time-series charts, PDR, latency, and CSV/PDF export.
- **Experiment History:** SQLite schema and audit log database.
- **Documentation & Automated Test Suite:** 23-point academic report and 15+ automated unit tests with PASS/FAIL verification.

---

## 2. Technology Architecture

- **Frontend:** React 19, TypeScript, Tailwind CSS, Lucide Icons, Canvas Confetti.
- **Integrated Full-Stack Server:** Express + Vite middlewares in `server.ts` running on port 3000.
- **Standalone Python Backend:** FastAPI + NetworkX + Scapy in `python_backend/`.
- **PCAP Generation:** Standard 24-byte libpcap binary encoder compatible with Wireshark and tcpdump.

---

## 3. Quickstart

### Running the Integrated Full-Stack Application
```bash
npm run dev
# MediNet starts on http://localhost:3000
```

### Running the Python Backend (Optional)
```bash
cd python_backend
pip install -r requirements.txt
python main.py
# FastAPI starts on http://localhost:8000
```

### Running NS-2.35 Simulation on Ubuntu / WSL2
```bash
sudo apt update && sudo apt install ns2 nam
ns medinet_exp1_normal.tcl
nam medinet_exp1_normal.nam
```

---

## 4. Verification Test Suites
Run the automated test suite directly in the UI under **Documentation & Tests** or via `npm run lint`.
