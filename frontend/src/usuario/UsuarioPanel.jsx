import { useState } from 'react'
import BallLogo from '../shared/BallLogo'
import Sidebar from '../shared/Sidebar'
import SidebarIcon from '../shared/SidebarIcon'
import ComprarEntradas from './ComprarEntradas'
import MisReservas from './MisReservas'
import MisEntradas from './MisEntradas'
import CodigoQr from './CodigoQr'
import TransferenciasEnviadas from './TransferenciasEnviadas'
import TransferenciasRecibidas from './TransferenciasRecibidas'
import Ticket from '../assets/ticket.png'

// Panel del costadito, no es side bar pero es maso así.
const userTabs = [
  { id: 'comprar', label: 'Comprar Entradas', icon: 'bag' },
  { id: 'entradas', label: 'Mis Entradas', icon: 'ticket' },
  { id: 'reservas', label: 'Mis Reservas', icon: 'bookmark' },
  { id: 'mapa', label: 'Mapa de Estadios', icon: 'map' },
  { id: 'qr', label: 'Codigos QR', icon: 'qr' },
  { id: 'enviadas', label: 'Enviadas', icon: 'send' },
  { id: 'recibidas', label: 'Recibidas', icon: 'inbox' },
]

//Panel principal del usuario, con el sidebar y el contenido de cada sección.
function UsuarioPanel({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('comprar')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const selectedTab = userTabs.find((tab) => tab.id === activeTab)

  // Cambia tab y cierra el drawer en mobile.
  const handleTabChange = (id) => {
    setActiveTab(id)
    setSidebarOpen(false)
  }

  return (
    <main className="dashboard-shell">
      {/* Header móvil — oculto en desktop vía CSS */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <img src={Ticket} alt="TicketMatch" className="mobile-header-logo" />
          <span>TicketMatch</span>
        </div>
        <button
          className="mobile-menu-btn"
          type="button"
          onClick={() => setSidebarOpen(true)}
          aria-label="Abrir menú"
        >
          <SidebarIcon name="menu" />
        </button>
      </header>

      <Sidebar
        activeTab={activeTab}
        brandSubtitle="Portal de Usuario"
        isOpen={sidebarOpen}
        label="Opciones de usuario"
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onTabChange={handleTabChange}
        tabs={userTabs}
      />

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        {activeTab === 'comprar' ? (
          <ComprarEntradas />
        ) : activeTab === 'entradas' ? (
          <MisEntradas />
        ) : activeTab === 'reservas' ? (
          <MisReservas />
        ) : activeTab === 'qr' ? (
          <CodigoQr />
        ) : activeTab === 'enviadas' ? (
          <TransferenciasEnviadas />
        ) : activeTab === 'recibidas' ? (
          <TransferenciasRecibidas />
        ) : (
          <div className="dashboard-card">
            <BallLogo />
            <p className="dashboard-kicker">{selectedTab?.label}</p>
            <h1 id="dashboard-title">Bienvenido {user.nombre}</h1>
            <p>Esta seccion del portal de usuario todavia no esta conectada.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default UsuarioPanel
