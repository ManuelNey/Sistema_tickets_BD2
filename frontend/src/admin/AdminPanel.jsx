import { useState } from 'react'
import BallLogo from '../shared/BallLogo'
import Sidebar from '../shared/Sidebar'
import EncuentrosAdmin from './EncuentrosAdmin'
import DispositivosAdmin from './DispositivosAdmin'
import EstadiosAdmin from './EstadiosAdmin'
import SectoresAdmin from './SectoresAdmin'

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'estadios', label: 'Estadios', icon: 'stadium' },
  { id: 'eventos', label: 'Encuentros', icon: 'calendar' },
  { id: 'dispositivos', label: 'Dispositivos', icon: 'device' },
]

function AdminPanel({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('estadios')
  const [selectedStadiumForSectors, setSelectedStadiumForSectors] = useState(null)
  const selectedTab = adminTabs.find((tab) => tab.id === activeTab)

  const changeTab = (tabId) => {
    setSelectedStadiumForSectors(null)
    setActiveTab(tabId)
  }

  return (
    <main className="dashboard-shell">
      <Sidebar
        activeTab={activeTab}
        brandIcon="chart"
        brandSubtitle="Panel Admin"
        label="Opciones de administrador"
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
