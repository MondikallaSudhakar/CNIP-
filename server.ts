/**
 * MediNet - Hospital Emergency Communication Network
 * Full-Stack Express Server & Vite Dev Middleware
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

import { clinicalStore } from './src/services/store';
import { computeCrc } from './src/networking/crc';
import { frameCharacterCount, frameByteStuffing, frameBitStuffing } from './src/networking/framing';
import { computeDijkstra } from './src/networking/dijkstra';
import { NS2_EXPERIMENTS, generateNs2TclScript, parseNs2TraceFile, generateRealisticTraceFile } from './src/networking/ns2Engine';
import { generateHospitalPcapBuffer, parsePcapBuffer } from './src/networking/pcapEngine';
import { runAllAutomatedTests } from './src/networking/testRunner';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- REST API ENDPOINTS ---

app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'MediNet Hospital Emergency Communication Network',
    nodeVersion: process.version,
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/departments', (req: Request, res: Response) => {
  res.json(clinicalStore.getDepartments());
});

app.get('/api/links', (req: Request, res: Response) => {
  res.json(clinicalStore.getLinks());
});

app.post('/api/links/:id/toggle', (req: Request, res: Response) => {
  const { id } = req.params;
  const { enabled } = req.body;
  clinicalStore.setLinkEnabled(id, Boolean(enabled));
  res.json({ success: true, links: clinicalStore.getLinks() });
});

app.get('/api/messages', (req: Request, res: Response) => {
  res.json({
    messages: clinicalStore.getMessages(),
    events: clinicalStore.getEvents(),
    stats: clinicalStore.getStatistics(),
  });
});

app.post('/api/messages/send', (req: Request, res: Response) => {
  const { source, destination, subject, content, priority, framingTechnique, crcAlgorithm, simulateBitError } = req.body;
  if (!source || !destination || !content) {
    return res.status(400).json({ error: 'Missing required message parameters' });
  }

  const message = clinicalStore.transmitMessage({
    source,
    destination,
    subject: subject || 'Emergency Requisition',
    content,
    priority: priority || 'NORMAL',
    framingTechnique,
    crcAlgorithm,
    simulateBitError,
  });

  res.json({
    success: true,
    message,
    events: clinicalStore.getEvents().slice(0, 5),
    stats: clinicalStore.getStatistics(),
  });
});

app.post('/api/crc/compute', (req: Request, res: Response) => {
  const { message, algorithm, corruptBitIndex } = req.body;
  const result = computeCrc(message || '', algorithm || 'CRC-8', corruptBitIndex ?? null);
  res.json(result);
});

app.post('/api/framing/process', (req: Request, res: Response) => {
  const { text, technique, chunkSize } = req.body;
  let result;
  if (technique === 'CHARACTER_COUNT') {
    result = frameCharacterCount(text, chunkSize || 4);
  } else if (technique === 'BYTE_STUFFING') {
    result = frameByteStuffing(text, 'F', 'E', chunkSize || 6);
  } else {
    result = frameBitStuffing(text, chunkSize || 4);
  }
  res.json(result);
});

app.post('/api/routing/dijkstra', (req: Request, res: Response) => {
  const { source, destination } = req.body;
  const links = clinicalStore.getLinks();
  const result = computeDijkstra(source || 'ER', destination || 'PHARM', links);
  res.json(result);
});

app.get('/api/ns2/experiments', (req: Request, res: Response) => {
  res.json(NS2_EXPERIMENTS);
});

app.post('/api/ns2/generate-script', (req: Request, res: Response) => {
  const config = req.body;
  const tcl = generateNs2TclScript(config);
  res.json({ script: tcl, experimentId: config.id });
});

app.post('/api/ns2/parse-trace', (req: Request, res: Response) => {
  const { traceContent } = req.body;
  const metrics = parseNs2TraceFile(traceContent || '');
  res.json(metrics);
});

app.get('/api/pcap/download', (req: Request, res: Response) => {
  const count = parseInt(req.query.count as string, 10) || 10;
  const buffer = generateHospitalPcapBuffer(count);
  res.setHeader('Content-Type', 'application/vnd.tcpdump.pcap');
  res.setHeader('Content-Disposition', 'attachment; filename="medinet_hospital_traffic.pcap"');
  res.send(Buffer.from(buffer));
});

app.post('/api/pcap/parse', (req: Request, res: Response) => {
  const { base64Data } = req.body;
  if (!base64Data) {
    const defaultBuf = generateHospitalPcapBuffer(10);
    return res.json({ packets: parsePcapBuffer(defaultBuf) });
  }
  try {
    const raw = Buffer.from(base64Data, 'base64');
    const packets = parsePcapBuffer(new Uint8Array(raw));
    res.json({ packets });
  } catch (err: any) {
    res.status(400).json({ error: 'Failed to decode PCAP buffer: ' + err.message });
  }
});

app.get('/api/tests/run', (req: Request, res: Response) => {
  const results = runAllAutomatedTests();
  const passed = results.filter((r) => r.status === 'PASS').length;
  res.json({
    totalTests: results.length,
    passedCount: passed,
    failedCount: results.length - passed,
    allPassed: passed === results.length,
    results,
  });
});

// --- VITE MIDDLEWARE / STATIC MOUNT ---

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[MediNet] Hospital Emergency Communication Network running on port ${port}`);
  });
}

startServer();
