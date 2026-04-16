export interface ElementDef {
  index: number;
  atomicNumber: number;
  symbol: string;
  name: string;
  color: string;
  glowColor: string;
  mergeCost: number;
  passiveHPerSec: number;
}

export const ELEMENTS: ElementDef[] = [
  { index: 0,  atomicNumber: 1,  symbol: 'H',  name: 'Hydrogen',    color: '#00ffff', glowColor: 'rgba(0,255,255,0.6)',   mergeCost: 0,   passiveHPerSec: 0 },
  { index: 1,  atomicNumber: 2,  symbol: 'He', name: 'Helium',      color: '#4488ff', glowColor: 'rgba(68,136,255,0.6)',  mergeCost: 5,   passiveHPerSec: 0.5 },
  { index: 2,  atomicNumber: 3,  symbol: 'Li', name: 'Lithium',     color: '#44ff88', glowColor: 'rgba(68,255,136,0.6)',  mergeCost: 5,   passiveHPerSec: 2 },
  { index: 3,  atomicNumber: 4,  symbol: 'Be', name: 'Beryllium',   color: '#88ff44', glowColor: 'rgba(136,255,68,0.6)',  mergeCost: 5,   passiveHPerSec: 8 },
  { index: 4,  atomicNumber: 5,  symbol: 'B',  name: 'Boron',       color: '#ccff44', glowColor: 'rgba(204,255,68,0.6)',  mergeCost: 5,   passiveHPerSec: 30 },
  { index: 5,  atomicNumber: 6,  symbol: 'C',  name: 'Carbon',      color: '#ffdd44', glowColor: 'rgba(255,221,68,0.6)',  mergeCost: 10,  passiveHPerSec: 100 },
  { index: 6,  atomicNumber: 7,  symbol: 'N',  name: 'Nitrogen',    color: '#ff8844', glowColor: 'rgba(255,136,68,0.6)',  mergeCost: 10,  passiveHPerSec: 350 },
  { index: 7,  atomicNumber: 8,  symbol: 'O',  name: 'Oxygen',      color: '#ff4444', glowColor: 'rgba(255,68,68,0.6)',   mergeCost: 10,  passiveHPerSec: 1_200 },
  { index: 8,  atomicNumber: 9,  symbol: 'F',  name: 'Fluorine',    color: '#ff44aa', glowColor: 'rgba(255,68,170,0.6)',  mergeCost: 15,  passiveHPerSec: 4_000 },
  { index: 9,  atomicNumber: 10, symbol: 'Ne', name: 'Neon',        color: '#ff44ff', glowColor: 'rgba(255,68,255,0.6)',  mergeCost: 15,  passiveHPerSec: 12_000 },
  { index: 10, atomicNumber: 11, symbol: 'Na', name: 'Sodium',      color: '#aa44ff', glowColor: 'rgba(170,68,255,0.6)',  mergeCost: 20,  passiveHPerSec: 40_000 },
  { index: 11, atomicNumber: 12, symbol: 'Mg', name: 'Magnesium',   color: '#8844ff', glowColor: 'rgba(136,68,255,0.6)',  mergeCost: 20,  passiveHPerSec: 120_000 },
  { index: 12, atomicNumber: 13, symbol: 'Al', name: 'Aluminium',   color: '#4466ff', glowColor: 'rgba(68,102,255,0.6)',  mergeCost: 25,  passiveHPerSec: 400_000 },
  { index: 13, atomicNumber: 14, symbol: 'Si', name: 'Silicon',     color: '#44aaff', glowColor: 'rgba(68,170,255,0.6)',  mergeCost: 25,  passiveHPerSec: 1.2e6 },
  { index: 14, atomicNumber: 15, symbol: 'P',  name: 'Phosphorus',  color: '#44ffcc', glowColor: 'rgba(68,255,204,0.6)',  mergeCost: 30,  passiveHPerSec: 4e6 },
  { index: 15, atomicNumber: 16, symbol: 'S',  name: 'Sulfur',      color: '#aaff44', glowColor: 'rgba(170,255,68,0.6)',  mergeCost: 30,  passiveHPerSec: 12e6 },
  { index: 16, atomicNumber: 17, symbol: 'Cl', name: 'Chlorine',    color: '#ffcc44', glowColor: 'rgba(255,204,68,0.6)',  mergeCost: 40,  passiveHPerSec: 40e6 },
  { index: 17, atomicNumber: 18, symbol: 'Ar', name: 'Argon',       color: '#ffaa44', glowColor: 'rgba(255,170,68,0.6)',  mergeCost: 40,  passiveHPerSec: 120e6 },
  { index: 18, atomicNumber: 19, symbol: 'K',  name: 'Potassium',   color: '#ff6666', glowColor: 'rgba(255,102,102,0.6)', mergeCost: 50,  passiveHPerSec: 400e6 },
  { index: 19, atomicNumber: 20, symbol: 'Ca', name: 'Calcium',     color: '#ff66aa', glowColor: 'rgba(255,102,170,0.6)', mergeCost: 50,  passiveHPerSec: 1.2e9 },
  { index: 20, atomicNumber: 21, symbol: 'Sc', name: 'Scandium',    color: '#ff66ff', glowColor: 'rgba(255,102,255,0.6)', mergeCost: 75,  passiveHPerSec: 4e9 },
  { index: 21, atomicNumber: 22, symbol: 'Ti', name: 'Titanium',    color: '#cc66ff', glowColor: 'rgba(204,102,255,0.6)', mergeCost: 75,  passiveHPerSec: 12e9 },
  { index: 22, atomicNumber: 23, symbol: 'V',  name: 'Vanadium',    color: '#9966ff', glowColor: 'rgba(153,102,255,0.6)', mergeCost: 100, passiveHPerSec: 40e9 },
  { index: 23, atomicNumber: 24, symbol: 'Cr', name: 'Chromium',    color: '#66aaff', glowColor: 'rgba(102,170,255,0.6)', mergeCost: 100, passiveHPerSec: 120e9 },
  { index: 24, atomicNumber: 25, symbol: 'Mn', name: 'Manganese',   color: '#66ffaa', glowColor: 'rgba(102,255,170,0.6)', mergeCost: 150, passiveHPerSec: 400e9 },
  { index: 25, atomicNumber: 26, symbol: 'Fe', name: 'Iron',        color: '#ffd700', glowColor: 'rgba(255,215,0,0.6)',   mergeCost: 200, passiveHPerSec: 1.2e12 },
];

export const ELEMENT_COUNT = ELEMENTS.length;
