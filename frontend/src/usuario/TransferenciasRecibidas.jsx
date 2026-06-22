import { useEffect, useMemo, useState } from 'react'
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
    <div className="buy-view">
      <header className="buy-header">
        <div>
          <h1 id="dashboard-title">Transferencias Recibidas</h1>
          <p>Historial de entradas que otros usuarios te enviaron</p>
        </div>
      </header>

      <div className="reservas-tabs-new" role="tablist" style={{ marginBottom: 0 }}>
        {tabs.map((currentTab) => (
          <button
            aria-selected={tab === currentTab.id}
            className={`reservas-tab-new ${tab === currentTab.id ? 'is-active' : ''}`}
            key={currentTab.id}
            onClick={() => setTab(currentTab.id)}
            role="tab"
            type="button"
          >
            {currentTab.label}
          </button>
        ))}
      </div>
      <div className="filters-divider" style={{ marginTop: 16 }} />

      {loading && <p className="matches-status">Cargando transferencias...</p>}
      {!loading && error && <p className="matches-status is-error">{error}</p>}
      {!loading && resolveError && <p className="matches-status is-error">{resolveError}</p>}

      {!loading && !error && transferenciasFiltradas.length === 0 && (
        <p className="matches-status">{getEmptyMessage(tab)}</p>
      )}

      {!loading && !error && transferenciasFiltradas.length > 0 && (
        <div className="reservas-list-new" style={{ marginTop: 16 }}>
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
  const stMap = {
    pendiente: { bg: '#FFF7ED', border: 'rgba(245,158,11,0.25)', dot: '#F59E0B', color: '#92400E', label: 'Pendiente' },
    aceptada:  { bg: '#F0FDF4', border: 'rgba(34,197,94,0.25)',   dot: '#22C55E', color: '#15803D', label: 'Aceptada' },
    rechazada: { bg: '#FEF2F2', border: 'rgba(239,68,68,0.25)',   dot: '#EF4444', color: '#B91C1C', label: 'Rechazada' },
  }
  const st = stMap[estado] ?? stMap.pendiente

  return (
    <article className="reserva-card-new">
      <div className="reserva-card-head-new">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 70% 50%, rgba(124,58,237,0.1) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div className="reserva-card-comp">
            <span className="match-competition-dot" />
            Copa Mundial FIFA 2026
          </div>
          <div className="reserva-card-title">{transferencia.equipoLocal} vs {transferencia.equipoVisitante}</div>
        </div>
        <div style={{ position: 'relative', textAlign: 'right' }}>
          <div className="reserva-card-id-label">Transferencia</div>
          <div className="reserva-card-id">{formatTransferCode(transferencia.id)}</div>
        </div>
      </div>

      <div className="reserva-card-body-new">
        <div>
          <div className="reserva-card-info-new">
            <div className="reserva-info-row-new">
              <TrxUserSvg />
              <span>Recibido de <strong style={{ color: '#130F1E' }}>{transferencia.emisor || '-'}</strong></span>
            </div>
            <div className="reserva-info-row-new">
              <TrxCalSvg />
              <span>{formatTransferDate(transferencia.fecha)}</span>
            </div>
            <div className="reserva-info-row-new">
              <TrxPinSvg />
              <span>{transferencia.nombreEstadio || '-'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="reserva-sector-chip">
              {transferencia.nombreSector || 'Sector'}
              <span className="reserva-sector-chip-qty">× {cantidad}</span>
            </span>
            <span className="reserva-sector-chip" style={{ background: '#F3F4F6', borderColor: '#E5E7EB', color: '#6B7280' }}>
              Entrada #{transferencia.idEntrada}
            </span>
          </div>
        </div>

        <div className="reserva-card-side-new">
          <div className="reserva-status-badge" style={{ background: st.bg, borderColor: st.border }}>
            <span className="reserva-status-dot" style={{ background: st.dot }} />
            <span style={{ color: st.color }}>{st.label}</span>
          </div>

          {estado === 'pendiente' && (
            <div className="reserva-card-actions" style={{ marginTop: 'auto' }}>
              <button
                className="reserva-btn-secondary"
                disabled={isResolving}
                onClick={() => onResolve(transferencia.id, 'rechazada')}
                type="button"
                style={{ color: '#DC2626', borderColor: 'rgba(239,68,68,0.2)' }}
              >
                Rechazar
              </button>
              <button
                className="reserva-btn-primary"
                disabled={isResolving}
                onClick={() => onResolve(transferencia.id, 'aceptada')}
                type="button"
                style={{ background: isResolving ? '#9CA3AF' : undefined }}
              >
                {isResolving ? 'Procesando...' : 'Aceptar'}
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

function TrxUserSvg() {
  return <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true"><circle cx="7" cy="4.5" r="2.5" /><path d="M2 12c0-2.2 2.2-4 5-4s5 1.8 5 4" /></svg>
}
function TrxCalSvg() {
  return <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true"><rect x="1.5" y="2" width="11" height="10" rx="1.5" /><line x1="1.5" y1="5.5" x2="12.5" y2="5.5" /><line x1="4.5" y1="1" x2="4.5" y2="3.5" /><line x1="9.5" y1="1" x2="9.5" y2="3.5" /></svg>
}
function TrxPinSvg() {
  return <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><path d="M7 13S2 8.5 2 5.5a5 5 0 0 1 10 0C12 8.5 7 13 7 13z" /><circle cx="7" cy="5.5" r="1.5" /></svg>
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
