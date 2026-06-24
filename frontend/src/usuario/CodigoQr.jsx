import { useCallback, useEffect, useState } from 'react'
import QRCode from 'react-qr-code'
import { flagUrl } from './teamFlags'
import './CodigoQr.css'

function CodigoQr() {
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busqueda, setBusqueda] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [entradaSeleccionada, setEntradaSeleccionada] = useState(null)
  const [qrContenido, setQrContenido] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

  const obtenerEntradasQr = useCallback(async () => {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('ticketmatch-token')

      const response = await fetch('http://localhost:8080/api/Entradas/codigosQr', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('No se pudieron obtener las entradas para QR')
      }

      const data = await response.json()
      setEntradas(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const generarQr = useCallback(async (idEntrada) => {
    try {
      setQrLoading(true)
      setQrError('')

      const token = localStorage.getItem('ticketmatch-token')

      const response = await fetch(`http://localhost:8080/api/Entradas/${idEntrada}/qr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo generar el QR')
      }

      setQrContenido(data.qrContenido)
    } catch (error) {
      setQrError(error.message)
    } finally {
      setQrLoading(false)
    }
  }, [])

  useEffect(() => {
  const timeout = setTimeout(() => {
    obtenerEntradasQr()
  }, 0)

  return () => clearTimeout(timeout)
}, [obtenerEntradasQr])

useEffect(() => {
  if (!modalAbierto || !entradaSeleccionada) return undefined

  const timeout = setTimeout(() => {
    generarQr(entradaSeleccionada.idEntrada)
  }, 0)

  const intervalo = setInterval(() => {
    generarQr(entradaSeleccionada.idEntrada)
  }, 25000)

  return () => {
    clearTimeout(timeout)
    clearInterval(intervalo)
  }
}, [modalAbierto, entradaSeleccionada, generarQr])

  function abrirModalQr(entrada) {
    setEntradaSeleccionada(entrada)
    setQrContenido('')
    setQrError('')
    setModalAbierto(true)
  }

  function cerrarModalQr() {
    setModalAbierto(false)
    setEntradaSeleccionada(null)
    setQrContenido('')
    setQrError('')
  }

  function formatearFecha(fecha) {
    const date = new Date(fecha)
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const anio = date.getFullYear()

    return `${dia}/${mes}/${anio}`
  }

  function formatearHora(fecha) {
    const date = new Date(fecha)
    const horas = date.getHours().toString().padStart(2, '0')
    const minutos = date.getMinutes().toString().padStart(2, '0')

    return `${horas}:${minutos}`
  }

  const equiposUnicos = [...new Set(
    entradas.flatMap(e => [e.equipoLocal, e.equipoVisitante])
  )].sort((a, b) => a.localeCompare(b))

  const entradasFiltradas = entradas.filter(e => {
    if (!busqueda) return true
    return e.equipoLocal === busqueda || e.equipoVisitante === busqueda
  })

  return (
    <div className="buy-view">
      <header className="buy-header">
        <div>
          <h1 id="dashboard-title">Códigos QR</h1>
          <p>Accedé al QR de cada entrada para ingresar al estadio</p>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: '#A09AAC' }}>
          {!loading && !error && entradas.length > 0 ? `${entradasFiltradas.length} entrada${entradasFiltradas.length !== 1 ? 's' : ''}` : ''}
        </span>
      </header>

      <div className="filters-inline" role="search" aria-label="Filtros">
        <span className="filters-inline-label">
          <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M2 4h12M4 8h8M6 12h4" />
          </svg>
          Filtrar por
        </span>
        <div className="filters-inline-sep" />
        <div className="filters-inline-selects">
          <select
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            aria-label="Filtrar por equipo"
          >
            <option value="">Todos los equipos</option>
            {equiposUnicos.map(eq => (
              <option key={eq} value={eq}>{eq}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="filters-divider" />

      {loading && <p className="matches-status">Cargando entradas...</p>}
      {error && <p className="matches-status is-error">{error}</p>}
      {!loading && !error && entradas.length === 0 && (
        <p className="matches-status">No tenés entradas activas para generar QR.</p>
      )}
      {!loading && !error && entradas.length > 0 && entradasFiltradas.length === 0 && (
        <p className="matches-status">No hay entradas que coincidan con "{busqueda}".</p>
      )}

      {!loading && !error && entradasFiltradas.length > 0 && (
        <div className="matches-grid" style={{ marginTop: 16 }}>
          {entradasFiltradas.map((entrada) => (
            <QrCard key={entrada.idEntrada} entrada={entrada} formatearFecha={formatearFecha} formatearHora={formatearHora} onVerQr={abrirModalQr} />
          ))}
        </div>
      )}

      {modalAbierto && entradaSeleccionada && (
        <div className="qr-modal-backdrop" onClick={cerrarModalQr}>
          <div className="qr-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="qr-modal-close" onClick={cerrarModalQr}>×</button>

            <div className="qr-modal-header">
              <div style={{ fontSize: 10, fontWeight: 700, color: '#A78BFA', letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 }}>Entrada #{entradaSeleccionada.idEntrada}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#130F1E' }}>
                {entradaSeleccionada.equipoLocal} vs {entradaSeleccionada.equipoVisitante}
              </div>
              <div style={{ fontSize: 12.5, color: '#6B6480', marginTop: 4 }}>
                {formatearFecha(entradaSeleccionada.fechaEncuentro)} · {formatearHora(entradaSeleccionada.fechaEncuentro)} · {entradaSeleccionada.sector}
              </div>
            </div>

            <div className="qr-modal-code-box">
              {qrLoading && !qrContenido ? (
                <p className="qr-message">Generando QR...</p>
              ) : qrError ? (
                <p className="qr-error">{qrError}</p>
              ) : qrContenido ? (
                <QRCode value={qrContenido} size={300} />
              ) : null}
            </div>

            <p className="qr-modal-refresh">Se actualiza automáticamente cada 25 segundos.</p>
          </div>
        </div>
      )}
    </div>
  )
}

function QrCard({ entrada, formatearFecha, formatearHora, onVerQr }) {
  return (
    <article className="match-card">
      <div className="match-hero">
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% -10%, rgba(124,58,237,0.14) 0%, transparent 65%)', pointerEvents: 'none' }} />
        <div className="match-competition" style={{ marginBottom: 10 }}>
          <span className="match-competition-dot" />
          Copa Mundial FIFA 2026
          <span style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.65)', border: '1px solid rgba(255,255,255,0.1)', fontSize: 9.5, fontWeight: 700, padding: '2px 9px', borderRadius: 100 }}>
            {entrada.sector}
          </span>
        </div>
        <div className="match-teams">
          <div className="match-team">
            <FlagOrInitials name={entrada.equipoLocal} />
            <span className="match-team-name">{entrada.equipoLocal}</span>
          </div>
          <div className="match-vs-circle"><span>VS</span></div>
          <div className="match-team">
            <FlagOrInitials name={entrada.equipoVisitante} />
            <span className="match-team-name">{entrada.equipoVisitante}</span>
          </div>
        </div>
      </div>
      <div className="match-body">
        <div className="match-info-rows">
          <div className="match-info-row">
            <QrCalSvg />
            {formatearFecha(entrada.fechaEncuentro)} · {formatearHora(entrada.fechaEncuentro)}
          </div>
          <div className="match-info-row" style={{ color: '#A78BFA', fontWeight: 700, fontSize: 11 }}>
            <QrTickSvg />
            ID #{entrada.idEntrada}
          </div>
        </div>
        <div className="match-divider" />
        <button
          type="button"
          className="match-cta"
          onClick={() => onVerQr(entrada)}
          style={{ marginTop: 'auto' }}
        >
          <QrSvg />
          Ver código QR
        </button>
      </div>
    </article>
  )
}

function FlagOrInitials({ name }) {
  const [imgError, setImgError] = useState(false)
  const url = flagUrl(name)
  if (url && !imgError) {
    return (
      <img
        className="match-flag-img"
        src={url}
        alt={name}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    )
  }
  return (
    <span className="match-flag-fallback" style={{ fontSize: 9 }}>
      {name.slice(0, 2).toUpperCase()}
    </span>
  )
}

function QrCalSvg() {
  return <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true"><rect x="1.5" y="2" width="11" height="10" rx="1.5" /><line x1="1.5" y1="5.5" x2="12.5" y2="5.5" /><line x1="4.5" y1="1" x2="4.5" y2="3.5" /><line x1="9.5" y1="1" x2="9.5" y2="3.5" /></svg>
}
function QrTickSvg() {
  return <svg viewBox="0 0 14 14" width="11" height="11" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true"><path d="M2 6.5A1.5 1.5 0 0 1 3.5 5h7A1.5 1.5 0 0 1 12 6.5v.5a1 1 0 0 0 0 2v.5A1.5 1.5 0 0 1 10.5 11h-7A1.5 1.5 0 0 1 2 9.5V9a1 1 0 0 0 0-2v-.5z" /></svg>
}
function QrSvg() {
  return <svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true"><rect x="1" y="1" width="5" height="5" rx="1" /><rect x="10" y="1" width="5" height="5" rx="1" /><rect x="1" y="10" width="5" height="5" rx="1" /><rect x="2.5" y="2.5" width="2" height="2" /><rect x="11.5" y="2.5" width="2" height="2" /><rect x="2.5" y="11.5" width="2" height="2" /><path d="M10 10h2v2h-2zM12 12h3M12 10v3M10 12v3" /></svg>
}

export default CodigoQr