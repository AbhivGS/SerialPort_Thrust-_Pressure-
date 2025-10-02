# Serial Port Data Reader - Design Guidelines

## Design Approach
**System:** Material Design with Data Dashboard Aesthetic  
**Justification:** This is a utility-focused data acquisition tool requiring clarity, precision, and real-time monitoring capabilities. Drawing inspiration from professional monitoring tools like Grafana and industrial control interfaces.

## Core Design Elements

### A. Color Palette

**Dark Mode (Primary):**
- Background: 217 20% 12% (deep navy-gray)
- Surface: 217 18% 18% (elevated panels)
- Primary: 210 100% 60% (bright blue for actions)
- Success: 142 76% 45% (connection status)
- Warning: 38 92% 50% (data alerts)
- Error: 0 84% 60% (connection errors)
- Text Primary: 0 0% 95%
- Text Secondary: 0 0% 70%

**Graph Colors:**
- Thrust Line: 31 97% 62% (vibrant orange)
- Pressure Line: 198 93% 60% (cyan blue)
- Grid Lines: 0 0% 25% (subtle)

### B. Typography
**Fonts:**
- Primary: 'Inter' (Google Fonts) - UI and controls
- Monospace: 'JetBrains Mono' - numerical data display

**Hierarchy:**
- Headers: font-semibold text-lg
- Controls/Labels: font-medium text-sm
- Data Values: font-mono text-2xl font-bold
- Secondary Info: font-normal text-xs

### C. Layout System
**Spacing:** Use Tailwind units of 2, 4, 6, and 8 for consistency (p-4, gap-6, m-8)

**Grid Structure:**
- Control Panel (left): Fixed width 320px, full height
- Graph Area (right): Flexible, takes remaining space
- Data Cards: Grid within control panel, gap-4

### D. Component Library

**Control Panel (Left Sidebar):**
- Port Configuration Card: Dropdown for COM port, baud rate selector, connect/disconnect button with status indicator
- Live Data Display: Large numerical readouts for current timestamp, thrust (g), pressure (bar) with labeled units
- Data Controls: Start/Stop recording buttons, Clear data button, Export CSV button with download icon

**Graph Area (Main):**
- Dual-axis chart with auto-scaling Y-axes (thrust on left, pressure on right)
- Shared X-axis showing elapsed time or timestamp
- Real-time updating with smooth transitions
- Legend showing thrust (orange) and pressure (cyan) with current values
- Gridlines and axis labels in subtle gray

**Status Indicators:**
- Connection status badge (green=connected, red=disconnected, yellow=connecting)
- Data buffer indicator showing number of data points
- Frame rate/update frequency display

**Modals/Dialogs:**
- Port selection: Centered modal, 400px width, list of available COM ports
- Export confirmation: Simple success toast notification

### E. Visual Hierarchy & Interaction

**Primary Actions:**
- Connect button: Prominent, filled primary color, disabled state when no port selected
- Export CSV: Secondary button style, always accessible

**Data Presentation:**
- Current values: Prominently displayed in cards with clear labels and units
- Historical data: Clean line graphs with smooth animations
- Grid and axes: Subtle, non-distracting

**State Management:**
- Connected: Green indicator, live graph updating, data streaming
- Disconnected: Red indicator, graph frozen, controls disabled except port selection
- Recording: Pulsing indicator on data cards

### F. Responsive Behavior
- Desktop (>1024px): Side-by-side layout with control panel + graph
- Tablet (768-1024px): Control panel collapses to top bar, graph below
- Mobile: Stack vertically, collapsible control panel

## Key Design Principles
1. **Clarity First:** All numerical values must be instantly readable with monospace fonts
2. **Real-time Focus:** Graph updates smoothly without jarring redraws
3. **Status Awareness:** Always show connection state and data flow status
4. **One-Click Actions:** Connect, record, export - all primary actions accessible immediately
5. **Professional Aesthetic:** Clean, technical, purpose-built for data monitoring

## Special Considerations
- Graph auto-scaling must be smooth, not jumpy - implement with animation constraints
- Use Canvas or SVG-based charting library (Chart.js or Recharts)
- Ensure high contrast for data readability in various lighting conditions
- Minimize animations except for essential feedback (connection status, data streaming indicator)