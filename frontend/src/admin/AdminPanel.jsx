import { useState } from 'react'
import BallLogo from '../shared/BallLogo'
import Sidebar from '../shared/Sidebar'
import SidebarIcon from '../shared/SidebarIcon'
import DashboardAdmin from './DashboardAdmin'
import EncuentrosAdmin from './EncuentrosAdmin'
import DispositivosAdmin from './DispositivosAdmin'
import EstadiosAdmin from './EstadiosAdmin'
import SectoresAdmin from './SectoresAdmin'
import ComisionAdmin from './ComisionAdmin'
import FuncionariosAdmin from './FuncionariosAdmin'
import ValidacionesAdmin from './ValidacionesAdmin'
import Ticket from '../assets/ticket.png'
import './AdminPanel.css'

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'estadios', label: 'Estadios', icon: 'stadium' },
  { id: 'eventos', label: 'Encuentros', icon: 'calendar' },
  { id: 'dispositivos', label: 'Dispositivos', icon: 'device' },
  { id: 'comisiones', label: 'Comisiones', icon: 'percent' },
  { id: 'funcionarios',  label: 'Funcionarios',  icon: 'profile' },
  { id: 'validaciones', label: 'Validaciones',  icon: 'check'   },
]

function AdminPanel({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('estadios')
  const [selectedStadiumForSectors, setSelectedStadiumForSectors] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const selectedTab = adminTabs.find((tab) => tab.id === activeTab)

  const changeTab = (tabId) => {
    setSelectedStadiumForSectors(null)
    setActiveTab(tabId)
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
        brandSubtitle="Panel Admin"
        isOpen={sidebarOpen}
        label="Opciones de administrador"
        onClose={() => setSidebarOpen(false)}
        onLogout={onLogout}
        onTabChange={changeTab}
        tabs={adminTabs}
      />

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        {activeTab === 'estadios' && selectedStadiumForSectors ? (
          <SectoresAdmin
            onBack={() => setSelectedStadiumForSectors(null)}
            stadium={selectedStadiumForSectors}
            user={user}
          />
        ) : activeTab === 'estadios' ? (
          <EstadiosAdmin onOpenSectors={setSelectedStadiumForSectors} user={user} />
        ) : activeTab === 'eventos' ? (
          <EncuentrosAdmin user={user} />
        ) : activeTab === 'dispositivos' ? (
          <DispositivosAdmin />
        ) : activeTab === 'comisiones' ? (
          <ComisionAdmin />
        ) : activeTab === 'funcionarios' ? (
          <FuncionariosAdmin />
        ) : activeTab === 'validaciones' ? (
          <ValidacionesAdmin user={user} />
        ) : activeTab === 'dashboard' ? (
          <DashboardAdmin />
        ) : (
          <div className="dashboard-card">
            <BallLogo />
            <p className="dashboard-kicker">{selectedTab?.label}</p>
            <h1 id="dashboard-title">Bienvenido {user.nombre}</h1>
            <p>Esta seccion del panel admin todavia no esta conectada.</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default AdminPanel
