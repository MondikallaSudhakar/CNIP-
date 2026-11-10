/**
 * MediNet - Dijkstra Shortest-Path Routing Engine
 * Implements weighted graph routing, alternative path exploration, and link failure rerouting.
 */

import { DepartmentId, DijkstraResult, NetworkLink } from '../types/network';

export const DEPARTMENTS: Array<{
  id: DepartmentId;
  name: string;
  ip: string;
  mac: string;
  subnet: string;
  role: string;
  location: string;
  x: number;
  y: number;
}> = [
  {
    id: 'ER',
    name: 'Emergency Department',
    ip: '192.168.10.1',
    mac: '02:00:AA:01:00:01',
    subnet: '255.255.255.0',
    role: 'Triage, Trauma Reception & Acute Resuscitation',
    location: 'Ground Floor, Wing A',
    x: 120,
    y: 220,
  },
  {
    id: 'ICU',
    name: 'Intensive Care Unit',
    ip: '192.168.10.2',
    mac: '02:00:AA:01:00:02',
    subnet: '255.255.255.0',
    role: 'Critical Care Monitoring & Life Support Telemetry',
    location: '2nd Floor, Wing B',
    x: 320,
    y: 80,
  },
  {
    id: 'LAB',
    name: 'Diagnostic Laboratory',
    ip: '192.168.10.3',
    mac: '02:00:AA:01:00:03',
    subnet: '255.255.255.0',
    role: 'Blood Analysis, Pathology & Microbiology Tests',
    location: '1st Floor, Wing C',
    x: 480,
    y: 280,
  },
  {
    id: 'PHARM',
    name: 'Central Pharmacy',
    ip: '192.168.10.4',
    mac: '02:00:AA:01:00:04',
    subnet: '255.255.255.0',
    role: 'Medication Dispensing & Emergency Drug Requisition',
    location: 'Ground Floor, Wing D',
    x: 640,
    y: 110,
  },
  {
    id: 'ADMIN',
    name: 'Hospital Administration',
    ip: '192.168.10.5',
    mac: '02:00:AA:01:00:05',
    subnet: '255.255.255.0',
    role: 'Operations, Bed Management & Billing Records',
    location: '3rd Floor, Executive Wing',
    x: 820,
    y: 240,
  },
];

export const INITIAL_LINKS: NetworkLink[] = [
  { id: 'ER-ICU', source: 'ER', target: 'ICU', cost: 2, bandwidthMbps: 1000, propagationDelayMs: 1.2, packetLossProb: 0.001, queueCapacity: 100, enabled: true },
  { id: 'ER-LAB', source: 'ER', target: 'LAB', cost: 4, bandwidthMbps: 1000, propagationDelayMs: 2.5, packetLossProb: 0.002, queueCapacity: 80, enabled: true },
  { id: 'ER-PHARM', source: 'ER', target: 'PHARM', cost: 7, bandwidthMbps: 500, propagationDelayMs: 4.0, packetLossProb: 0.005, queueCapacity: 50, enabled: true },
  { id: 'ICU-LAB', source: 'ICU', target: 'LAB', cost: 3, bandwidthMbps: 1000, propagationDelayMs: 1.8, packetLossProb: 0.001, queueCapacity: 90, enabled: true },
  { id: 'ICU-PHARM', source: 'ICU', target: 'PHARM', cost: 5, bandwidthMbps: 500, propagationDelayMs: 3.2, packetLossProb: 0.003, queueCapacity: 60, enabled: true },
  { id: 'LAB-PHARM', source: 'LAB', target: 'PHARM', cost: 2, bandwidthMbps: 1000, propagationDelayMs: 1.5, packetLossProb: 0.001, queueCapacity: 100, enabled: true },
  { id: 'LAB-ADMIN', source: 'LAB', target: 'ADMIN', cost: 6, bandwidthMbps: 200, propagationDelayMs: 5.0, packetLossProb: 0.008, queueCapacity: 40, enabled: true },
  { id: 'PHARM-ADMIN', source: 'PHARM', target: 'ADMIN', cost: 3, bandwidthMbps: 500, propagationDelayMs: 2.8, packetLossProb: 0.002, queueCapacity: 70, enabled: true },
  { id: 'ER-ADMIN', source: 'ER', target: 'ADMIN', cost: 8, bandwidthMbps: 200, propagationDelayMs: 6.5, packetLossProb: 0.010, queueCapacity: 30, enabled: true },
];

/**
 * Executes Dijkstra shortest path algorithm on the active network topology
 */
export function computeDijkstra(
  source: DepartmentId,
  destination: DepartmentId,
  links: NetworkLink[]
): DijkstraResult {
  const nodeIds: DepartmentId[] = ['ER', 'ICU', 'LAB', 'PHARM', 'ADMIN'];
  const distances: Record<DepartmentId, number> = {
    ER: Infinity,
    ICU: Infinity,
    LAB: Infinity,
    PHARM: Infinity,
    ADMIN: Infinity,
  };
  const previous: Record<DepartmentId, DepartmentId | null> = {
    ER: null,
    ICU: null,
    LAB: null,
    PHARM: null,
    ADMIN: null,
  };
  const visited = new Set<DepartmentId>();
  const visitedNodesOrder: DepartmentId[] = [];

  distances[source] = 0;

  // Build bidirectional adjacency list of active enabled links
  const adj = new Map<DepartmentId, Array<{ target: DepartmentId; cost: number; delay: number }>>();
  nodeIds.forEach((n) => adj.set(n, []));

  links.forEach((link) => {
    if (link.enabled) {
      adj.get(link.source)?.push({ target: link.target, cost: link.cost, delay: link.propagationDelayMs });
      adj.get(link.target)?.push({ target: link.source, cost: link.cost, delay: link.propagationDelayMs });
    }
  });

  while (visited.size < nodeIds.length) {
    // Find unvisited node with minimum distance
    let minNode: DepartmentId | null = null;
    let minDist = Infinity;

    for (const node of nodeIds) {
      if (!visited.has(node) && distances[node] < minDist) {
        minDist = distances[node];
        minNode = node;
      }
    }

    if (!minNode || minDist === Infinity) break;

    visited.add(minNode);
    visitedNodesOrder.push(minNode);

    if (minNode === destination) break;

    const neighbors = adj.get(minNode) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor.target)) {
        const alt = distances[minNode] + neighbor.cost;
        if (alt < distances[neighbor.target]) {
          distances[neighbor.target] = alt;
          previous[neighbor.target] = minNode;
        }
      }
    }
  }

  // Reconstruct shortest path
  const path: DepartmentId[] = [];
  let curr: DepartmentId | null = destination;

  if (distances[destination] !== Infinity) {
    while (curr) {
      path.unshift(curr);
      curr = previous[curr];
    }
  }

  // Calculate total latency
  let totalLatencyMs = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const link = links.find(
      (l) => l.enabled && ((l.source === u && l.target === v) || (l.source === v && l.target === u))
    );
    if (link) totalLatencyMs += link.propagationDelayMs;
  }

  // Alternative paths (DFS with cutoff to find other valid loopless paths)
  const allPaths: Array<{ path: DepartmentId[]; cost: number }> = [];

  function findPaths(current: DepartmentId, end: DepartmentId, currentPath: DepartmentId[], currentCost: number) {
    if (current === end) {
      allPaths.push({ path: [...currentPath], cost: currentCost });
      return;
    }
    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      if (!currentPath.includes(edge.target)) {
        currentPath.push(edge.target);
        findPaths(edge.target, end, currentPath, currentCost + edge.cost);
        currentPath.pop();
      }
    }
  }

  findPaths(source, destination, [source], 0);

  const shortestCost = distances[destination];
  const alternativeRoutes = allPaths
    .sort((a, b) => a.cost - b.cost)
    .filter((p) => p.path.join('-') !== path.join('-'))
    .slice(0, 3)
    .map((p) => ({
      path: p.path,
      totalCost: p.cost,
      differenceFromShortest: shortestCost === Infinity ? 0 : p.cost - shortestCost,
    }));

  return {
    source,
    destination,
    path,
    totalCost: distances[destination] === Infinity ? -1 : distances[destination],
    totalLatencyMs,
    visitedNodesOrder,
    distances,
    previous,
    alternativeRoutes,
  };
}
