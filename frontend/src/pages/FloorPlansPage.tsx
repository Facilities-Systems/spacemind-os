import { useState } from 'react'
import { Download, LayoutGrid, Maximize2, RefreshCw } from 'lucide-react'
import { Header } from '../components/layout/Header'

// ─── Data ─────────────────────────────────────────────────────────────────────

const BUILDINGS = [
  { id: 'fp1', name: 'FP1 HQ — Durban',   floors: ['Ground Floor', 'Level 1', 'Level 2', 'Level 3', 'Rooftop'] },
  { id: 'fp2', name: 'FP2 Office Park',   floors: ['Ground Floor', 'Level 1', 'Level 2'] },
  { id: 'lnd', name: 'London UK',          floors: ['Ground Floor', 'Level 1'] },
  { id: 'nbi', name: 'Nairobi KE',         floors: ['Ground Floor', 'Level 1'] },
  { id: 'lag', name: 'Lagos NG',            floors: ['Ground Floor'] },
]

const LEGEND = [
  { color: '#1e3a5f',             border: '#6366f1', label: 'Open Office / Workstations' },
  { color: 'rgba(0,128,128,0.4)', border: '#008080', label: 'Meeting Rooms' },
  { color: 'rgba(99,102,241,0.3)',border: '#6366f1', label: 'Executive / Private Offices' },
  { color: 'rgba(16,185,129,0.3)',border: '#10b981', label: 'Breakout / Lounge Areas' },
  { color: 'rgba(245,158,11,0.3)',border: '#f59e0b', label: 'Facilities / Storeroom' },
  { color: 'rgba(239,68,68,0.25)',border: '#ef4444', label: 'Server Room / IT' },
  { color: 'rgba(156,163,175,0.2)',border: '#6b7280',label: 'Amenities (Bathrooms / Kitchen)' },
]

// ─── Space stats per floor ────────────────────────────────────────────────────

const STATS: Record<string, { area: number; desks: number; occupied: number; rooms: number; capacity: number }> = {
  'fp1-Ground Floor': { area: 1840, desks: 0,   occupied: 0,   rooms: 4,  capacity: 120 },
  'fp1-Level 1':      { area: 2100, desks: 96,  occupied: 72,  rooms: 8,  capacity: 200 },
  'fp1-Level 2':      { area: 2100, desks: 104, occupied: 88,  rooms: 6,  capacity: 200 },
  'fp1-Level 3':      { area: 1900, desks: 48,  occupied: 30,  rooms: 12, capacity: 150 },
  'fp1-Rooftop':      { area: 600,  desks: 0,   occupied: 0,   rooms: 1,  capacity: 80  },
  'fp2-Ground Floor': { area: 1200, desks: 0,   occupied: 0,   rooms: 3,  capacity: 80  },
  'fp2-Level 1':      { area: 1400, desks: 64,  occupied: 50,  rooms: 5,  capacity: 120 },
  'fp2-Level 2':      { area: 1400, desks: 68,  occupied: 44,  rooms: 4,  capacity: 120 },
}

function getStats(buildingId: string, floor: string) {
  return STATS[`${buildingId}-${floor}`] ?? { area: 800, desks: 24, occupied: 16, rooms: 3, capacity: 60 }
}

// ─── SVG Floor Plan ────────────────────────────────────────────────────────────
// A representative office floor plan as an inline SVG.
// Uses fixed layout for Level 1 type floors; simpler layout for others.

type FloorVariant = 'office' | 'ground' | 'rooftop'

function floorVariant(floor: string): FloorVariant {
  if (floor === 'Rooftop') return 'rooftop'
  if (floor === 'Ground Floor') return 'ground'
  return 'office'
}

const ROOM_TEXT: React.CSSProperties = {
  fontSize: 9,
  fill: '#9ca3af',
  fontFamily: 'monospace',
  userSelect: 'none',
}

const ROOM_TITLE: React.CSSProperties = {
  fontSize: 8,
  fill: '#6b7280',
  fontFamily: 'monospace',
  userSelect: 'none',
}

function OfficePlan() {
  return (
    <svg viewBox="0 0 800 500" width="100%" style={{ display: 'block' }}>
      {/* Background */}
      <rect width={800} height={500} fill="#0f172a" rx={8} />

      {/* Core grid lines (structural) */}
      {[0, 160, 320, 480, 640, 800].map(x => (
        <line key={x} x1={x} y1={0} x2={x} y2={500} stroke="rgba(0,128,128,0.08)" strokeWidth={1} />
      ))}
      {[0, 100, 200, 300, 400, 500].map(y => (
        <line key={y} x1={0} y1={y} x2={800} y2={y} stroke="rgba(0,128,128,0.08)" strokeWidth={1} />
      ))}

      {/* ── North corridor ── */}
      <rect x={0} y={0} width={800} height={50} fill="rgba(0,128,128,0.06)" stroke="rgba(0,128,128,0.2)" strokeWidth={1} />
      <text x={400} y={29} textAnchor="middle" style={{ fontSize: 9, fill: '#2dd4bf', fontFamily: 'monospace', userSelect: 'none' }}>NORTH CORRIDOR</text>

      {/* ── South corridor ── */}
      <rect x={0} y={440} width={800} height={60} fill="rgba(0,128,128,0.06)" stroke="rgba(0,128,128,0.2)" strokeWidth={1} />
      <text x={400} y={474} textAnchor="middle" style={{ fontSize: 9, fill: '#2dd4bf', fontFamily: 'monospace', userSelect: 'none' }}>SOUTH CORRIDOR · LIFTS & STAIRS</text>

      {/* ── Open office (main) ── */}
      <rect x={10} y={60} width={420} height={200} fill="#1e3a5f" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={220} y={82} textAnchor="middle" style={ROOM_TEXT}>OPEN OFFICE — WORKSTATIONS</text>
      {/* Desk rows */}
      {[0, 1, 2, 3, 4].map(row =>
        [0, 1, 2, 3, 4, 5, 6, 7].map(col => (
          <rect key={`${row}-${col}`} x={20 + col * 52} y={92 + row * 34} width={42} height={24} fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.25)" strokeWidth={0.8} rx={2} />
        ))
      )}

      {/* ── Open office (east) ── */}
      <rect x={450} y={60} width={340} height={200} fill="#1e3a5f" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={620} y={82} textAnchor="middle" style={ROOM_TEXT}>OPEN OFFICE — EAST WING</text>
      {[0, 1, 2, 3, 4].map(row =>
        [0, 1, 2, 3, 4, 5].map(col => (
          <rect key={`e-${row}-${col}`} x={460 + col * 52} y={92 + row * 34} width={42} height={24} fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.25)" strokeWidth={0.8} rx={2} />
        ))
      )}

      {/* ── Meeting rooms (west cluster) ── */}
      <rect x={10} y={270} width={130} height={90} fill="rgba(0,128,128,0.35)" stroke="#008080" strokeWidth={1.5} rx={2} />
      <text x={75} y={312} textAnchor="middle" style={ROOM_TEXT}>MEETING</text>
      <text x={75} y={325} textAnchor="middle" style={ROOM_TEXT}>ROOM 1</text>
      <text x={75} y={338} textAnchor="middle" style={ROOM_TITLE}>12 pax</text>

      <rect x={150} y={270} width={130} height={90} fill="rgba(0,128,128,0.35)" stroke="#008080" strokeWidth={1.5} rx={2} />
      <text x={215} y={312} textAnchor="middle" style={ROOM_TEXT}>MEETING</text>
      <text x={215} y={325} textAnchor="middle" style={ROOM_TEXT}>ROOM 2</text>
      <text x={215} y={338} textAnchor="middle" style={ROOM_TITLE}>8 pax</text>

      <rect x={290} y={270} width={130} height={90} fill="rgba(0,128,128,0.35)" stroke="#008080" strokeWidth={1.5} rx={2} />
      <text x={355} y={312} textAnchor="middle" style={ROOM_TEXT}>BOARD</text>
      <text x={355} y={325} textAnchor="middle" style={ROOM_TEXT}>ROOM</text>
      <text x={355} y={338} textAnchor="middle" style={ROOM_TITLE}>20 pax</text>

      {/* ── Executive offices (east) ── */}
      <rect x={450} y={270} width={105} height={85} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={502} y={305} textAnchor="middle" style={ROOM_TEXT}>CEO</text>
      <text x={502} y={318} textAnchor="middle" style={ROOM_TITLE}>Private</text>

      <rect x={565} y={270} width={105} height={85} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={617} y={305} textAnchor="middle" style={ROOM_TEXT}>CFO</text>
      <text x={617} y={318} textAnchor="middle" style={ROOM_TITLE}>Private</text>

      <rect x={680} y={270} width={110} height={85} fill="rgba(99,102,241,0.3)" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={735} y={305} textAnchor="middle" style={ROOM_TEXT}>COO</text>
      <text x={735} y={318} textAnchor="middle" style={ROOM_TITLE}>Private</text>

      {/* ── Breakout / lounge ── */}
      <rect x={10} y={370} width={210} height={60} fill="rgba(16,185,129,0.25)" stroke="#10b981" strokeWidth={1.5} rx={2} />
      <text x={115} y={404} textAnchor="middle" style={ROOM_TEXT}>BREAKOUT / LOUNGE</text>

      {/* ── Facilities storeroom ── */}
      <rect x={430} y={370} width={120} height={60} fill="rgba(245,158,11,0.25)" stroke="#f59e0b" strokeWidth={1.5} rx={2} />
      <text x={490} y={397} textAnchor="middle" style={ROOM_TEXT}>STOREROOM</text>
      <text x={490} y={410} textAnchor="middle" style={ROOM_TITLE}>Facilities</text>

      {/* ── Server room ── */}
      <rect x={560} y={370} width={100} height={60} fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth={1.5} rx={2} />
      <text x={610} y={397} textAnchor="middle" style={ROOM_TEXT}>SERVER</text>
      <text x={610} y={410} textAnchor="middle" style={ROOM_TITLE}>IT / Rack Room</text>

      {/* ── Amenities ── */}
      <rect x={230} y={370} width={90} height={60} fill="rgba(156,163,175,0.15)" stroke="#6b7280" strokeWidth={1.5} rx={2} />
      <text x={275} y={398} textAnchor="middle" style={ROOM_TEXT}>ABLUTIONS</text>
      <text x={275} y={411} textAnchor="middle" style={ROOM_TITLE}>M / F / DIS</text>

      <rect x={330} y={370} width={90} height={60} fill="rgba(156,163,175,0.15)" stroke="#6b7280" strokeWidth={1.5} rx={2} />
      <text x={375} y={398} textAnchor="middle" style={ROOM_TEXT}>KITCHEN</text>
      <text x={375} y={411} textAnchor="middle" style={ROOM_TITLE}>Staff canteen</text>

      {/* ── Compass ── */}
      <circle cx={760} cy={30} r={16} fill="rgba(0,128,128,0.15)" stroke="rgba(0,128,128,0.3)" strokeWidth={1} />
      <text x={760} y={34} textAnchor="middle" style={{ fontSize: 11, fill: '#2dd4bf', fontFamily: 'monospace' }}>N</text>

      {/* ── Scale bar ── */}
      <rect x={20} y={488} width={80} height={3} fill="rgba(0,128,128,0.5)" />
      <text x={20} y={498} style={{ fontSize: 7, fill: '#6b7280', fontFamily: 'monospace' }}>0</text>
      <text x={90} y={498} style={{ fontSize: 7, fill: '#6b7280', fontFamily: 'monospace' }}>10m</text>
    </svg>
  )
}

function GroundPlan() {
  return (
    <svg viewBox="0 0 800 500" width="100%" style={{ display: 'block' }}>
      <rect width={800} height={500} fill="#0f172a" rx={8} />
      {/* Main entrance lobby */}
      <rect x={280} y={10} width={240} height={120} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth={1.5} rx={2} />
      <text x={400} y={65} textAnchor="middle" style={ROOM_TEXT}>MAIN ENTRANCE LOBBY</text>
      <text x={400} y={80} textAnchor="middle" style={ROOM_TITLE}>Reception & Visitor Management</text>

      {/* Parking / loading bay */}
      <rect x={10} y={10} width={250} height={240} fill="rgba(0,128,128,0.08)" stroke="rgba(0,128,128,0.25)" strokeWidth={1} rx={2} />
      <text x={135} y={130} textAnchor="middle" style={ROOM_TEXT}>BASEMENT PARKING</text>
      <text x={135} y={145} textAnchor="middle" style={ROOM_TITLE}>P1 — 48 bays</text>

      {/* Security */}
      <rect x={540} y={10} width={100} height={80} fill="rgba(99,102,241,0.25)" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={590} y={52} textAnchor="middle" style={ROOM_TEXT}>SECURITY</text>
      <text x={590} y={65} textAnchor="middle" style={ROOM_TITLE}>Control Room</text>

      {/* Facilities workshop */}
      <rect x={650} y={10} width={140} height={150} fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth={1.5} rx={2} />
      <text x={720} y={82} textAnchor="middle" style={ROOM_TEXT}>FACILITIES</text>
      <text x={720} y={95} textAnchor="middle" style={ROOM_TEXT}>WORKSHOP</text>

      {/* Loading dock */}
      <rect x={280} y={140} width={240} height={100} fill="rgba(156,163,175,0.1)" stroke="#6b7280" strokeWidth={1.5} rx={2} />
      <text x={400} y={195} textAnchor="middle" style={ROOM_TEXT}>LOADING / DELIVERY BAY</text>

      {/* Canteen */}
      <rect x={10} y={270} width={350} height={200} fill="rgba(16,185,129,0.2)" stroke="#10b981" strokeWidth={1.5} rx={2} />
      <text x={185} y={370} textAnchor="middle" style={ROOM_TEXT}>STAFF CANTEEN</text>
      <text x={185} y={385} textAnchor="middle" style={ROOM_TITLE}>Seating: 80 pax · Full catering kitchen</text>

      {/* Ablutions ground floor */}
      <rect x={540} y={100} width={100} height={80} fill="rgba(156,163,175,0.12)" stroke="#6b7280" strokeWidth={1} rx={2} />
      <text x={590} y={143} textAnchor="middle" style={ROOM_TEXT}>ABLUTIONS</text>

      {/* Gym / wellness */}
      <rect x={380} y={270} width={250} height={200} fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" strokeWidth={1.5} rx={2} />
      <text x={505} y={370} textAnchor="middle" style={ROOM_TEXT}>GYM & WELLNESS CENTRE</text>

      {/* Storeroom */}
      <rect x={640} y={270} width={150} height={120} fill="rgba(245,158,11,0.2)" stroke="#f59e0b" strokeWidth={1.5} rx={2} />
      <text x={715} y={328} textAnchor="middle" style={ROOM_TEXT}>STOREROOM</text>
      <text x={715} y={341} textAnchor="middle" style={ROOM_TITLE}>GF Facilities</text>

      <circle cx={760} cy={30} r={16} fill="rgba(0,128,128,0.15)" stroke="rgba(0,128,128,0.3)" strokeWidth={1} />
      <text x={760} y={34} textAnchor="middle" style={{ fontSize: 11, fill: '#2dd4bf', fontFamily: 'monospace' }}>N</text>
    </svg>
  )
}

function RooftopPlan() {
  return (
    <svg viewBox="0 0 800 500" width="100%" style={{ display: 'block' }}>
      <rect width={800} height={500} fill="#0f172a" rx={8} />
      <rect x={60} y={60} width={680} height={380} fill="rgba(0,128,128,0.05)" stroke="rgba(0,128,128,0.2)" strokeWidth={1} rx={4} />

      {/* HVAC */}
      <rect x={80} y={80} width={200} height={160} fill="rgba(99,102,241,0.15)" stroke="#6366f1" strokeWidth={1.5} rx={2} />
      <text x={180} y={165} textAnchor="middle" style={ROOM_TEXT}>HVAC PLANT ROOM</text>
      <text x={180} y={178} textAnchor="middle" style={ROOM_TITLE}>Air Handling Units</text>

      {/* Solar */}
      <rect x={300} y={80} width={250} height={160} fill="rgba(16,185,129,0.15)" stroke="#10b981" strokeWidth={1.5} rx={2} />
      <text x={425} y={165} textAnchor="middle" style={ROOM_TEXT}>SOLAR PANEL ARRAY</text>
      <text x={425} y={178} textAnchor="middle" style={ROOM_TITLE}>48 × 415W panels</text>

      {/* Water tanks */}
      <rect x={570} y={80} width={150} height={100} fill="rgba(14,165,233,0.15)" stroke="#0ea5e9" strokeWidth={1.5} rx={2} />
      <text x={645} y={133} textAnchor="middle" style={ROOM_TEXT}>WATER TANKS</text>

      {/* Rooftop terrace */}
      <rect x={80} y={260} width={350} height={160} fill="rgba(16,185,129,0.1)" stroke="#10b981" strokeWidth={1.5} rx={8} />
      <text x={255} y={345} textAnchor="middle" style={ROOM_TEXT}>ROOFTOP TERRACE</text>
      <text x={255} y={360} textAnchor="middle" style={ROOM_TITLE}>Breakout · 80 pax · Event space</text>

      {/* Generator */}
      <rect x={450} y={260} width={120} height={100} fill="rgba(239,68,68,0.15)" stroke="#ef4444" strokeWidth={1.5} rx={2} />
      <text x={510} y={313} textAnchor="middle" style={ROOM_TEXT}>GENERATOR</text>
      <text x={510} y={326} textAnchor="middle" style={ROOM_TITLE}>1000 kVA</text>

      {/* Access */}
      <rect x={590} y={260} width={130} height={100} fill="rgba(156,163,175,0.1)" stroke="#6b7280" strokeWidth={1} rx={2} />
      <text x={655} y={313} textAnchor="middle" style={ROOM_TEXT}>STAIRWELL /</text>
      <text x={655} y={326} textAnchor="middle" style={ROOM_TEXT}>LIFT ACCESS</text>

      <circle cx={750} cy={90} r={18} fill="rgba(0,128,128,0.15)" stroke="rgba(0,128,128,0.3)" strokeWidth={1} />
      <text x={750} y={95} textAnchor="middle" style={{ fontSize: 11, fill: '#2dd4bf', fontFamily: 'monospace' }}>N</text>
    </svg>
  )
}

function FloorPlan({ variant }: { variant: FloorVariant }) {
  if (variant === 'ground')  return <GroundPlan />
  if (variant === 'rooftop') return <RooftopPlan />
  return <OfficePlan />
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function FloorPlansPage() {
  const [buildingIdx, setBuildingIdx] = useState(0)
  const [floorIdx, setFloorIdx]       = useState(1)  // default Level 1
  const [fullscreen, setFullscreen]   = useState(false)

  const building = BUILDINGS[buildingIdx]
  const floor    = building.floors[floorIdx] ?? building.floors[0]
  const stats    = getStats(building.id, floor)
  const variant  = floorVariant(floor)
  const occupancy = stats.desks > 0 ? Math.round((stats.occupied / stats.desks) * 100) : 0

  function handleBuildingChange(idx: number) {
    setBuildingIdx(idx)
    setFloorIdx(0)
  }

  return (
    <div className="flex flex-col h-full">
      <Header title="Floor Plans" subtitle="Facilities Operations — Space & Layout Management" />

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-5">

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Building selector */}
          <div className="flex gap-1 p-1 rounded-xl" style={{ backgroundColor: '#1e3a5f' }}>
            {BUILDINGS.map((b, i) => (
              <button
                key={b.id}
                onClick={() => handleBuildingChange(i)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap"
                style={buildingIdx === i
                  ? { backgroundColor: '#008080', color: '#fff' }
                  : { color: '#9ca3af' }
                }
              >
                {b.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={() => setFloorIdx(f => f)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={() => setFullscreen(v => !v)}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-all"
              title="Toggle fullscreen view"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-400 hover:text-white hover:bg-white/5 transition-all"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </button>
          </div>
        </div>

        <div className={`grid gap-5 ${fullscreen ? '' : 'lg:grid-cols-4'}`}>

          {/* ── Left panel — floor selector + stats ── */}
          {!fullscreen && (
            <div className="space-y-4">

              {/* Floor selector */}
              <div className="rounded-xl p-4 border-2 space-y-1" style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3 flex items-center gap-2">
                  <LayoutGrid className="h-3.5 w-3.5 text-teal-400" />
                  Floors
                </p>
                {building.floors.map((f, i) => (
                  <button
                    key={f}
                    onClick={() => setFloorIdx(i)}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-all"
                    style={floorIdx === i
                      ? { backgroundColor: 'rgba(0,128,128,0.25)', color: '#2dd4bf', border: '1px solid rgba(0,128,128,0.5)' }
                      : { color: '#9ca3af' }
                    }
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* Space stats */}
              <div className="rounded-xl p-4 border-2 space-y-3" style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Space Stats</p>

                {[
                  { label: 'Total Area',    value: `${stats.area.toLocaleString()} m²` },
                  { label: 'Capacity',      value: `${stats.capacity} pax` },
                  { label: 'Meeting Rooms', value: `${stats.rooms}` },
                ].map(s => (
                  <div key={s.label} className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">{s.label}</p>
                    <p className="text-sm font-bold text-white">{s.value}</p>
                  </div>
                ))}

                {stats.desks > 0 && (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500">Workstations</p>
                      <p className="text-sm font-bold text-white">{stats.desks}</p>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-xs text-gray-500">Occupancy</p>
                        <p
                          className="text-sm font-bold"
                          style={{ color: occupancy > 90 ? '#f87171' : occupancy > 70 ? '#fcd34d' : '#6ee7b7' }}
                        >
                          {occupancy}%
                        </p>
                      </div>
                      <div className="h-1.5 rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                        <div
                          className="h-1.5 rounded-full transition-all"
                          style={{
                            width: `${occupancy}%`,
                            backgroundColor: occupancy > 90 ? '#ef4444' : occupancy > 70 ? '#f59e0b' : '#10b981',
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1">{stats.occupied} / {stats.desks} occupied</p>
                    </div>
                  </>
                )}
              </div>

              {/* Legend */}
              <div className="rounded-xl p-4 border-2 space-y-2" style={{ backgroundColor: '#1e3a5f', borderColor: '#008080' }}>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Legend</p>
                {LEGEND.map(l => (
                  <div key={l.label} className="flex items-center gap-2">
                    <div
                      className="h-3 w-5 rounded shrink-0"
                      style={{ backgroundColor: l.color, border: `1px solid ${l.border}` }}
                    />
                    <p className="text-xs text-gray-400 leading-tight">{l.label}</p>
                  </div>
                ))}
              </div>

              {/* Quick actions */}
              <div className="space-y-2">
                {[
                  { label: 'Request Space Change', desc: 'Submit a space modification request' },
                  { label: 'Book a Meeting Room',  desc: 'Reserve a room for an event' },
                  { label: 'Report an Issue',      desc: 'Log a space-related fault' },
                ].map(a => (
                  <button
                    key={a.label}
                    className="w-full text-left rounded-xl p-3 border transition-all hover:-translate-y-0.5"
                    style={{ backgroundColor: '#1e3a5f', borderColor: 'rgba(0,128,128,0.4)' }}
                  >
                    <p className="text-white text-xs font-semibold">{a.label}</p>
                    <p className="text-gray-500 text-xs mt-0.5">{a.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Floor plan SVG ── */}
          <div className={fullscreen ? 'w-full' : 'lg:col-span-3'}>
            <div
              className="rounded-xl border-2 overflow-hidden"
              style={{ backgroundColor: '#0f172a', borderColor: '#008080' }}
            >
              {/* Plan header */}
              <div
                className="flex items-center justify-between px-4 py-2.5 border-b"
                style={{ backgroundColor: 'rgba(0,128,128,0.1)', borderColor: 'rgba(0,128,128,0.25)' }}
              >
                <p className="text-xs font-bold text-white uppercase tracking-widest">
                  {building.name} — {floor}
                </p>
                <p className="text-xs text-gray-500 font-mono">Scale 1:200 · Not to precise scale</p>
              </div>

              <div className="p-2">
                <FloorPlan variant={variant} />
              </div>
            </div>

            {fullscreen && (
              <button
                onClick={() => setFullscreen(false)}
                className="mt-3 text-xs text-gray-500 hover:text-white transition-colors"
              >
                ← Show side panel
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
