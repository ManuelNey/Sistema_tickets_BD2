import { useEffect, useMemo, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'
import './reserva.css'

const tabs = [
  { id: 'pendiente', label: 'Pendientes' },
  { id: 'aceptada', label: 'Aceptadas' },
  { id: 'rechazada', label: 'Rechazadas' },
]

function TransferenciasRecibidas() {
  const [transferencias, setTransferencias] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('pendiente')
  const [resolvingId, setResolvingId] = useState(null)
  const [resolveError, setResolveError] = useState('')

  const cargarTransferencias = async () => {
    setLoading(true)
    setError('')

    try {
      const token = localStorage.getItem('ticketmatch-token')
      const response = await fetch('http://localhost:8080/api/Transferencia/recibidas', {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        throw new Error('Transferencias recibidas request failed')
      }

      setTransferencias(await response.json())
    } catch {
      setTransferencias([])
      setError('No se pudieron cargar tus transferencias recibidas.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(cargarTransferencias)
  }, [])

  const transferenciasFiltradas = useMemo(
    () => transferencias.filter((transferencia) => normalizeStatus(transferencia.estado) === tab),
    [tab, transferencias]
  )

  const resolverTransferencia = async (transferenciaId, estado) => {
    setResolveError('')
    setResolvingId(transferenciaId)

    try {
      const token = localStorage.getItem('ticketmatch-token')
      const response = await fetch(`http://localhost:8080/api/Transferencia/${transferenciaId}/resolver`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ estado }),
      })

      if (!response.ok) {
        throw new Error('Resolve transfer failed')
      }

      await cargarTransferencias()
      setTab(estado)
    } catch {
      setResolveError('No se pudo resolver la transferencia.')
    } finally {
      setResolvingId(null)
    }
  }

  return (
    <div className="reservas-view transferencias-view">
      <header className="buy-header">
        <h1 id="dashboard-title">Transferencias Recibidas</h1>
        <p>Historial de entradas que otros usuarios te enviaron</p>
      </header>

      <div className="reservas-tabs" role="tablist">
        {tabs.map((currentTab) => (
          <button
            aria-selected={tab === currentTab.id}
            className={`reservas-tab ${tab === currentTab.id ? 'is-active' : ''}`}
            key={currentTab.id}
            onClick={() => setTab(currentTab.id)}
            role="tab"
            type="button"
          >
            {currentTab.label}
          </button>
        ))}
      </div>

      {loading && <p className="matches-status">Cargando transferencias...</p>}
      {!loading && error && <p className="matches-status is-error">{error}</p>}
      {!loading && resolveError && <p className="matches-status is-error">{resolveError}</p>}

      {!loading && !error && transferenciasFiltradas.length === 0 && (
        <p className="matches-status">{getEmptyMessage(tab)}</p>
      )}

      {!loading && !error && transferenciasFiltradas.length > 0 && (
        <div className="transferencias-list">
          {transferenciasFiltradas.map((transferencia) => (
            <TransferenciaRecibidaCard
              isResolving={resolvingId === transferencia.id}
              key={transferencia.id}
              onResolve={resolverTransferencia}
              transferencia={transferencia}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TransferenciaRecibidaCard({ isResolving, onResolve, transferencia }) {
  const estado = normalizeStatus(transferencia.estado)
  const cantidad = transferencia.cantidadEntradas ?? 1

  return (
    <article className="transferencia-card">
      <div className="transferencia-icon" aria-hidden="true">
        <SidebarIcon name="inbox" />
      </div>

      <div className="transferencia-main">
        <div className="transferencia-title-row">
          <div>
            <h2>
              {transferencia.equipoLocal} vs {transferencia.equipoVisitante}
            </h2>
            <p>ID: {formatTransferCode(transferencia.id)}</p>
          </div>
          <EstadoTransferencia estado={estado} />
        </div>

        <div className="transferencia-details">
          <InfoItem label="Recibido de" value={transferencia.emisor} />
          <InfoItem label="Fecha" value={formatTransferDate(transferencia.fecha)} icon="calendar" />
          <InfoItem label="Estadio" value={transferencia.nombreEstadio} />
          <InfoItem label="Sector" value={transferencia.nombreSector} />
          <InfoItem
            label="Cantidad"
            value={`${cantidad} ${cantidad === 1 ? 'entrada' : 'entradas'}`}
          />
          <InfoItem label="Entrada" value={`#${transferencia.idEntrada}`} />
        </div>

        {estado === 'pendiente' && (
          <div className="transferencia-actions">
            <button
              className="transferencia-action is-accept"
              disabled={isResolving}
              onClick={() => onResolve(transferencia.id, 'aceptada')}
              type="button"
            >
              <SidebarIcon name="check" />
              {isResolving ? 'Resolviendo...' : 'Aceptar'}
            </button>
            <button
              className="transferencia-action is-reject"
              disabled={isResolving}
              onClick={() => onResolve(transferencia.id, 'rechazada')}
              type="button"
            >
              <SidebarIcon name="close" />
              Rechazar
            </button>
          </div>
        )}
      </div>
    </article>
  )
}

function InfoItem({ icon, label, value }) {
  return (
    <p className="transferencia-info-item">
      <span>{label}</span>
      <strong>
        {icon && <SidebarIcon name={icon} />}
        {value || '-'}
      </strong>
    </p>
  )
}

function EstadoTransferencia({ estado }) {
  const labels = {
    pendiente: 'Pendiente',
    aceptada: 'Aceptada',
    rechazada: 'Rechazada',
  }

  return (
    <span className={`transferencia-status is-${estado}`}>
      <SidebarIcon name={estado === 'aceptada' ? 'check' : estado === 'rechazada' ? 'close' : 'inbox'} />
      {labels[estado] ?? estado}
    </span>
  )
}

function normalizeStatus(status) {
  return String(status ?? '').trim().toLowerCase()
}

function formatTransferCode(id) {
  return `TRX-${String(id).padStart(3, '0')}`
}

function formatTransferDate(date) {
  if (!date) {
    return 'Fecha a confirmar'
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'numeric',
    year: 'numeric',
  }).format(new Date(date))
}

function getEmptyMessage(tab) {
  const messages = {
    pendiente: 'No tenes transferencias recibidas pendientes.',
    aceptada: 'Todavia no tenes transferencias recibidas aceptadas.',
    rechazada: 'Todavia no tenes transferencias recibidas rechazadas.',
  }

  return messages[tab] ?? 'No tenes transferencias recibidas.'
}

export default TransferenciasRecibidas
