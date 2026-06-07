import { useState } from 'react'
import BallLogo from '../shared/BallLogo'
import Sidebar from '../shared/Sidebar'
import EstadiosAdmin from './EstadiosAdmin'

const adminTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'estadios', label: 'Estadios', icon: 'stadium' },
  { id: 'eventos', label: 'Eventos', icon: 'calendar' },
  { id: 'dispositivos', label: 'Dispositivos', icon: 'device' },
]

function AdminPanel({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('estadios')
  const selectedTab = adminTabs.find((tab) => tab.id === activeTab)

  return (
    <main className="dashboard-shell">
      <Sidebar
        activeTab={activeTab}
        brandIcon="chart"
        brandSubtitle="Panel Admin"
        label="Opciones de administrador"
        onLogout={onLogout}
        onTabChange={setActiveTab}
        tabs={adminTabs}
      />

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        {activeTab === 'estadios' ? (
          <EstadiosAdmin />
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
