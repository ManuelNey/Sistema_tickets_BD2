import { useState } from 'react'
import BallLogo from '../shared/BallLogo'
import Sidebar from '../shared/Sidebar'

const funcionarioTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: 'chart' },
  { id: 'dispositivos', label: 'Dispositivos', icon: 'device' },
  { id: 'validaciones', label: 'Validaciones', icon: 'qr' },
]

function FuncionarioPanel({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('dashboard')
  const selectedTab = funcionarioTabs.find((tab) => tab.id === activeTab)

  return (
    <main className="dashboard-shell">
      <Sidebar
        activeTab={activeTab}
        brandIcon="device"
        brandSubtitle="Panel Funcionario"
        label="Opciones de funcionario"
        onLogout={onLogout}
        onTabChange={setActiveTab}
        tabs={funcionarioTabs}
      />

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        <div className="dashboard-card">
          <BallLogo />
          <p className="dashboard-kicker">{selectedTab?.label}</p>
          <h1 id="dashboard-title">Bienvenido {user.nombre}</h1>
          <p>Esta seccion del panel funcionario todavia no esta conectada.</p>
        </div>
      </section>
    </main>
  )
}

export default FuncionarioPanel
