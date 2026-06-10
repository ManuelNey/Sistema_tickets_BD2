import { useState } from 'react'
import BallLogo from '../shared/BallLogo'
import Sidebar from '../shared/Sidebar'
import ComprarEntradas from './ComprarEntradas'
import CodigoQr from './CodigoQr'

const userTabs = [
  { id: 'comprar', label: 'Comprar Entradas', icon: 'bag' },
  { id: 'entradas', label: 'Mis Entradas', icon: 'ticket' },
  { id: 'mapa', label: 'Mapa de Estadios', icon: 'map' },
  { id: 'qr', label: 'Codigos QR', icon: 'qr' },
  { id: 'enviadas', label: 'Enviadas', icon: 'send' },
  { id: 'recibidas', label: 'Recibidas', icon: 'inbox' },
]

function UsuarioPanel({ onLogout, user }) {
  const [activeTab, setActiveTab] = useState('comprar')
  const selectedTab = userTabs.find((tab) => tab.id === activeTab)

  return (
    <main className="dashboard-shell">
      <Sidebar
        activeTab={activeTab}
        brandSubtitle="Portal de Usuario"
        label="Opciones de usuario"
        onLogout={onLogout}
        onTabChange={setActiveTab}
        tabs={userTabs}
      />

      <section className="dashboard-content" aria-labelledby="dashboard-title">
        {activeTab === 'comprar' ? (
          <ComprarEntradas />
        ) : activeTab === 'qr' ? (
          <CodigoQr />
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
