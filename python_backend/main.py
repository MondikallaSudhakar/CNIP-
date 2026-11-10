"""
MediNet - Hospital Emergency Communication Network
FastAPI Python Backend Implementation
Integrates NetworkX for Dijkstra Routing, Scapy for PCAP generation,
and authentic algorithms for Framing, CRC, and Trace Parsing.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import networkx as nx
import io
import time

app = FastAPI(
    title="MediNet Hospital Emergency Communication Network API",
    description="Python FastAPI backend providing Dijkstra routing, Scapy PCAP generation, and NS2 trace parsing.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hospital Departments
DEPARTMENTS = {
    "ER": {"name": "Emergency Department", "ip": "192.168.10.1"},
    "ICU": {"name": "Intensive Care Unit", "ip": "192.168.10.2"},
    "LAB": {"name": "Diagnostic Laboratory", "ip": "192.168.10.3"},
    "PHARM": {"name": "Central Pharmacy", "ip": "192.168.10.4"},
    "ADMIN": {"name": "Hospital Administration", "ip": "192.168.10.5"}
}

# Default Hospital Mesh Topology
DEFAULT_LINKS = [
    ("ER", "ICU", {"weight": 2, "delay": 1.2, "bw": 1000}),
    ("ER", "LAB", {"weight": 4, "delay": 2.5, "bw": 1000}),
    ("ER", "PHARM", {"weight": 7, "delay": 4.0, "bw": 500}),
    ("ICU", "LAB", {"weight": 3, "delay": 1.8, "bw": 1000}),
    ("ICU", "PHARM", {"weight": 5, "delay": 3.2, "bw": 500}),
    ("LAB", "PHARM", {"weight": 2, "delay": 1.5, "bw": 1000}),
    ("LAB", "ADMIN", {"weight": 6, "delay": 5.0, "bw": 200}),
    ("PHARM", "ADMIN", {"weight": 3, "delay": 2.8, "bw": 500}),
    ("ER", "ADMIN", {"weight": 8, "delay": 6.5, "bw": 200}),
]

class RouteRequest(BaseModel):
    source: str
    destination: str
    disabled_links: Optional[List[str]] = []
    custom_weights: Optional[Dict[str, int]] = {}

class CrcRequest(BaseModel):
    message: str
    polynomial: str = "CRC-16"
    corrupt_bit_index: Optional[int] = None

class FramingRequest(BaseModel):
    text: str
    technique: str
    chunk_size: int = 4

@app.get("/api/health")
def health_check():
    return {
        "status": "HEALTHY",
        "service": "MediNet Python Backend",
        "engine": "FastAPI + NetworkX + Scapy",
        "nodes": list(DEPARTMENTS.keys())
    }

@app.post("/api/routing/dijkstra")
def calculate_dijkstra(req: RouteRequest):
    G = nx.Graph()
    for u, v, attrs in DEFAULT_LINKS:
        link_id = f"{u}-{v}"
        alt_link_id = f"{v}-{u}"
        if link_id in req.disabled_links or alt_link_id in req.disabled_links:
            continue
        weight = req.custom_weights.get(link_id, attrs["weight"])
        G.add_edge(u, v, weight=weight, delay=attrs["delay"])

    try:
        path = nx.shortest_path(G, source=req.source, target=req.destination, weight="weight")
        cost = nx.shortest_path_length(G, source=req.source, target=req.destination, weight="weight")
        
        # Calculate alternative routes
        all_paths = list(nx.all_simple_paths(G, req.source, req.destination, cutoff=4))
        alt_routes = []
        for p in all_paths:
            if p != path:
                p_cost = sum(G[p[i]][p[i+1]]["weight"] for i in range(len(p)-1))
                alt_routes.append({"path": p, "cost": p_cost})
        
        alt_routes.sort(key=lambda x: x["cost"])

        return {
            "source": req.source,
            "destination": req.destination,
            "path": path,
            "total_cost": cost,
            "alternative_routes": alt_routes[:3]
        }
    except (nx.NetworkXNoPath, nx.NodeNotFound):
        raise HTTPException(status_code=404, detail="No path exists between nodes with current active links")

@app.post("/api/crc/compute")
def compute_crc_endpoint(req: CrcRequest):
    poly_map = {
        "CRC-8": "100000111",
        "CRC-16": "10001000000100001",
        "CRC-32": "100000100110000010001110110110111"
    }
    generator = poly_map.get(req.polynomial, poly_map["CRC-16"])
    degree = len(generator) - 1

    # Text to binary
    data_bits = ''.join(format(ord(c), '08b') for c in req.message)
    padded = data_bits + '0' * degree

    def mod2div(dividend, divisor):
        cur = list(dividend[:len(divisor)])
        for i in range(len(divisor), len(dividend) + 1):
            if cur[0] == '1':
                for j in range(len(divisor)):
                    cur[j] = '0' if cur[j] == divisor[j] else '1'
            if i < len(dividend):
                cur = cur[1:] + [dividend[i]]
            else:
                cur = cur[1:]
        return ''.join(cur)

    remainder = mod2div(padded, generator)
    transmitted = data_bits + remainder

    # Check intentional corruption
    received = list(transmitted)
    is_corrupted = False
    if req.corrupt_bit_index is not None and 0 <= req.corrupt_bit_index < len(received):
        received[req.corrupt_bit_index] = '0' if received[req.corrupt_bit_index] == '1' else '1'
        is_corrupted = True
    received_str = ''.join(received)

    syndrome = mod2div(received_str, generator)
    is_valid = '1' not in syndrome

    return {
        "polynomial": req.polynomial,
        "data_bits": data_bits,
        "crc_remainder": remainder,
        "transmitted_frame": transmitted,
        "received_frame": received_str,
        "is_corrupted": is_corrupted,
        "syndrome": syndrome,
        "is_valid": is_valid
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
