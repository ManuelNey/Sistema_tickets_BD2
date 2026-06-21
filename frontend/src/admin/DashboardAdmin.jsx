import { useEffect, useMemo, useState } from 'react'
import './DashboardAdmin.css'

const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#16A34A', '#D97706', '#DB2777']

function DashboardAdmin() {
  const [topEncuentros, setTopEncuentros] = useState([])
  const [topEstadios, setTopEstadios] = useState([])
  const [topUsuarios, setTopUsuarios] = useState([])
  const [topTransferidores, setTopTransferidores] = useState([])
  const [canceladas, setCanceladas] = useState(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState('')
  const [statsPeriod, setStatsPeriod] = useState('mes')
  const [desdePersonalizado, setDesdePersonalizado] = useState('')
  const [hastaPersonalizado, setHastaPersonalizado] = useState('')

  const rangoFechas = useMemo(
    () => getDateRange(statsPeriod, desdePersonalizado, hastaPersonalizado),
    [statsPeriod, desdePersonalizado, hastaPersonalizado]
  )

  useEffect(() => {
    const loadDashboardStats = async () => {
      setLoadingStats(true)
      setError('')

      try {
        const [
          encuentrosResult,
          estadiosResult,
          usuariosResult,
          transferidoresResult,
          canceladasResult,
        ] = await Promise.allSettled([
          fetchStatsEndpoint('TopEncuentros', rangoFechas),
          fetchStatsEndpoint('EntradasPorEstadio', rangoFechas),
          fetchStatsEndpoint('TopUsuarios', rangoFechas),
          fetchStatsEndpoint('UsuariosTransferencias', rangoFechas),
          fetchStatsEndpoint('Canceladas', rangoFechas),
        ])

        setTopEncuentros(getSettledValue(encuentrosResult, []))
        setTopEstadios(getSettledValue(estadiosResult, []))
        setTopUsuarios(getSettledValue(usuariosResult, []))
        setTopTransferidores(getSettledValue(transferidoresResult, []))
        setCanceladas(getSettledValue(canceladasResult, null))

        const failedRequests = [
          encuentrosResult,
          estadiosResult,
          usuariosResult,
          transferidoresResult,
          canceladasResult,
        ].some((result) => result.status === 'rejected')

        if (failedRequests) {
          setError('Algunas estadisticas no se pudieron cargar.')
        }
      } finally {
        setLoadingStats(false)
      }
    }

    loadDashboardStats()
  }, [rangoFechas])

  const entradasVendidas = topEstadios.reduce(
    (total, estadio) => total + getEstadioVendidas(estadio),
    0
  )
  const transferencias = topTransferidores.reduce(
    (total, usuario) => total + getCantidadUsuario(usuario),
    0
  )
  const porcentajeCanceladas = getPorcentajeCanceladas(canceladas)
  const maxEncuentros = Math.max(...topEncuentros.map(getVendidas), 1)
  const maxEstadios = Math.max(...topEstadios.map(getEstadioVendidas), 1)
  const maxCompradores = Math.max(...topUsuarios.map(getCantidadUsuario), 1)
  const maxTransferidores = Math.max(...topTransferidores.map(getCantidadUsuario), 1)

  return (
    <div className="admin-view stats-view">
      <header className="stats-header">
        <div>
          <h1 id="dashboard-title">Estadisticas Generales</h1>
          <p>Copa Mundial FIFA 2026 - datos filtrados por periodo</p>
        </div>
      </header>

      <section className="stats-filters" aria-label="Filtros de estadisticas">
        <label className="stats-filter-field">
          Periodo
          <select value={statsPeriod} onChange={(event) => setStatsPeriod(event.target.value)}>
            <option value="semana">Esta semana</option>
            <option value="mes">Este mes</option>
            <option value="anio">Este anio</option>
            <option value="todo">Todo</option>
            <option value="personalizado">Personalizado</option>
          </select>
        </label>

        {statsPeriod === 'personalizado' && (
          <>
            <label className="stats-filter-field">
              Desde
              <input
                type="date"
                value={desdePersonalizado}
                onChange={(event) => setDesdePersonalizado(event.target.value)}
              />
            </label>
            <label className="stats-filter-field">
              Hasta
              <input
                type="date"
                value={hastaPersonalizado}
                onChange={(event) => setHastaPersonalizado(event.target.value)}
              />
            </label>
          </>
        )}
      </section>

      {loadingStats && <p className="matches-status">Cargando estadisticas...</p>}
      {error && <p className="matches-status is-error">{error}</p>}

      <div className="kpi-row">
        <KpiCard
          icon={<TicketIcon />}
          colorClass="is-purple"
          label="Entradas Vendidas"
          value={formatCount(entradasVendidas)}
        />
        <KpiCard
          icon={<MoneyIcon />}
          colorClass="is-green"
          label="Ingresos Totales"
          value="Pendiente"
        />
        <KpiCard
          icon={<AlertIcon />}
          colorClass="is-amber"
          label="Reservas Canceladas"
          value={`${formatDecimal(porcentajeCanceladas)}%`}
        />
        <KpiCard
          icon={<SendIcon />}
          colorClass="is-blue"
          label="Transferencias"
          value={formatCount(transferencias)}
        />
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <h2>Top Partidos por Ventas</h2>
              <p>Encuentros con mas entradas vendidas</p>
            </div>
            {topEncuentros.length > 0 && (
              <span className="stat-pill">TOP {topEncuentros.length}</span>
            )}
          </div>

          <div className="top-list">
            {topEncuentros.length === 0 && !loadingStats && (
              <p className="matches-status">Sin datos disponibles.</p>
            )}
            {topEncuentros.map((encuentro, index) => {
              const vendidas = getVendidas(encuentro)

              return (
                <div className="top-list-item" key={encuentro.id ?? index}>
                  <span className="top-rank">{index + 1}</span>
                  <div className="top-match-info">
                    <div className="top-match-name">
                      {encuentro.equipoLocal} vs {encuentro.equipoVisitante}
                    </div>
                    <div className="top-match-venue">{encuentro.nombreEstadio}</div>
                    <div className="top-bar-wrap">
                      <div
                        className="top-bar-fill"
                        style={{ width: `${(vendidas / maxEncuentros) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="top-count">{formatCount(vendidas)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <h2>Ranking de Estadios</h2>
              <p>Por volumen de entradas vendidas</p>
            </div>
          </div>

          <div className="top-list">
            {topEstadios.length === 0 && !loadingStats && (
              <p className="matches-status">Sin datos disponibles.</p>
            )}
            {topEstadios.map((estadio, index) => {
              const vendidas = getEstadioVendidas(estadio)

              return (
                <div className="top-list-item" key={estadio.nombreEstadio ?? index}>
                  <span className="top-rank">#{index + 1}</span>
                  <div className="top-match-info is-estadio">
                    <div className="top-match-name">{estadio.nombreEstadio}</div>
                    <div className="top-bar-wrap">
                      <div
                        className="top-bar-fill"
                        style={{ width: `${(vendidas / maxEstadios) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="top-count">{formatCount(vendidas)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <h2>Top Usuarios Compradores</h2>
              <p>Usuarios con mas entradas adquiridas</p>
            </div>
          </div>

          <div className="top-list">
            {topUsuarios.length === 0 && !loadingStats && (
              <p className="matches-status">Sin datos disponibles.</p>
            )}
            {topUsuarios.map((usuario, index) => {
              const cantidad = getCantidadUsuario(usuario)

              return (
                <div className="top-list-item" key={usuario.mail ?? index}>
                  <span className="top-rank">{index + 1}</span>
                  <div className="user-cell">
                    <span
                      className="user-avatar"
                      style={{ background: avatarColor(usuario.mail, index) }}
                    >
                      {avatarInitials(usuario.mail)}
                    </span>
                    <div className="top-match-info">
                      <div className="user-email">{usuario.mail}</div>
                      <div className="user-bar-wrap">
                        <div
                          className="user-bar-fill"
                          style={{ width: `${(cantidad / maxCompradores) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="top-count">{formatCount(cantidad)}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <h2>Top Usuarios Transferidores</h2>
              <p>Usuarios con mas entradas transferidas</p>
            </div>
          </div>

          <div className="top-list">
            {topTransferidores.length === 0 && !loadingStats && (
              <p className="matches-status">Sin datos disponibles.</p>
            )}
            {topTransferidores.map((usuario, index) => {
              const cantidad = getCantidadUsuario(usuario)

              return (
                <div className="top-list-item" key={usuario.mail ?? index}>
                  <span className="top-rank">{index + 1}</span>
                  <div className="user-cell">
                    <span
                      className="user-avatar"
                      style={{ background: avatarColor(usuario.mail, index) }}
                    >
                      {avatarInitials(usuario.mail)}
                    </span>
                    <div className="top-match-info">
                      <div className="user-email">{usuario.mail}</div>
                      <div className="user-bar-wrap">
                        <div
                          className="user-bar-fill is-amber"
                          style={{ width: `${(cantidad / maxTransferidores) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  <span className="top-count">{formatCount(cantidad)}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="stat-card" style={{ marginBottom: 12 }}>
        <div className="stat-card-head">
          <div>
            <h2>Reservas Canceladas / No Pagadas</h2>
            <p>Porcentaje de compras canceladas en el periodo seleccionado</p>
          </div>
        </div>

        <div className="canceladas-kpis">
          <div className="canceladas-kpi">
            <span className="canceladas-kpi-value is-red">
              {formatDecimal(porcentajeCanceladas)}%
            </span>
            <span className="canceladas-kpi-label">tasa de cancelacion</span>
          </div>
          <div className="canceladas-kpi">
            <span className="canceladas-kpi-value is-amber">Pendiente</span>
            <span className="canceladas-kpi-label">total canceladas</span>
          </div>
          <div className="canceladas-kpi">
            <span className="canceladas-kpi-value">Pendiente</span>
            <span className="canceladas-kpi-label">monto perdido</span>
          </div>
        </div>
      </div>
    </div>
  )
}

async function fetchStatsEndpoint(endpoint, rangoFechas) {
  const token = localStorage.getItem('ticketmatch-token')
  const response = await fetch(buildStatsUrl(endpoint, rangoFechas), {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) {
    throw new Error(`No se pudo cargar ${endpoint}`)
  }

  return response.json()
}

function getSettledValue(result, fallback) {
  return result.status === 'fulfilled' ? result.value : fallback
}

function KpiCard({ icon, colorClass, label, value }) {
  return (
    <div className="kpi-card">
      <div className="kpi-top">
        <span className={`kpi-icon ${colorClass}`}>{icon}</span>
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
    </div>
  )
}

function getVendidas(encuentro) {
  return encuentro.entradasVendidas ?? encuentro.cantidadEntradasVendidas ?? 0
}

function getEstadioVendidas(estadio) {
  return estadio.cantidadEntradas ?? estadio.vendidas ?? 0
}

function getCantidadUsuario(usuario) {
  return usuario.cantidad ?? usuario.entradas ?? usuario.transferencias ?? 0
}

function getPorcentajeCanceladas(canceladas) {
  return canceladas?.porcentaje ?? canceladas?.Porcentaje ?? 0
}

function avatarColor(email, index) {
  return AVATAR_COLORS[index % AVATAR_COLORS.length]
}

function avatarInitials(email) {
  return (email?.[0] ?? '?').toUpperCase()
}

function formatCount(value) {
  return new Intl.NumberFormat('es-UY').format(Math.round(value ?? 0))
}

function formatDecimal(value) {
  return new Intl.NumberFormat('es-UY', {
    maximumFractionDigits: 1,
  }).format(value ?? 0)
}

function buildStatsUrl(endpoint, rangoFechas) {
  const url = new URL(`http://localhost:8080/api/Estadisticas/${endpoint}`)

  if (rangoFechas.desde) {
    url.searchParams.set('desde', rangoFechas.desde)
  }

  if (rangoFechas.hasta) {
    url.searchParams.set('hasta', rangoFechas.hasta)
  }

  return url.toString()
}

function getDateRange(selectedPeriod, desdePersonalizado, hastaPersonalizado) {
  if (selectedPeriod === 'todo') {
    return { desde: '', hasta: '' }
  }

  if (selectedPeriod === 'personalizado') {
    return { desde: desdePersonalizado, hasta: hastaPersonalizado }
  }

  const today = new Date()
  const desde = new Date(today)

  if (selectedPeriod === 'semana') {
    const day = today.getDay()
    const diffToMonday = day === 0 ? -6 : 1 - day
    desde.setDate(today.getDate() + diffToMonday)
  }

  if (selectedPeriod === 'mes') {
    desde.setDate(1)
  }

  if (selectedPeriod === 'anio') {
    desde.setMonth(0, 1)
  }

  return {
    desde: formatDateInput(desde),
    hasta: formatDateInput(today),
  }
}

function formatDateInput(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function TicketIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
    </svg>
  )
}

function MoneyIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-5 2.5-5 4a2.5 2.5 0 0 0 5 0" />
    </svg>
  )
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M22 2 11 13M22 2 15 22l-4-9-9-4 20-7Z" />
    </svg>
  )
}

export default DashboardAdmin
