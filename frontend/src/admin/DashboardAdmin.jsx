import { useEffect, useMemo, useState } from 'react'
import './DashboardAdmin.css'

const MOCK_KPI = {
  semana: {
    entradasVendidas: 3210,
    ingresosTotales: 261000,
    reservasCanceladas: 212,
    transferencias: 308,
  },
  mes: {
    entradasVendidas: 12847,
    ingresosTotales: 1030000,
    reservasCanceladas: 847,
    transferencias: 1234,
  },
  total: {
    entradasVendidas: 38210,
    ingresosTotales: 3100000,
    reservasCanceladas: 2541,
    transferencias: 3701,
  },
}

const MOCK_TOP_COMPRADORES = [
  { email: 'user43@gmail.com', entradas: 8, total: 640 },
  { email: 'maria_p@hotmail.com', entradas: 6, total: 480 },
  { email: 'carlos99@gmail.com', entradas: 5, total: 400 },
  { email: 'ana_lopez@gmail.com', entradas: 4, total: 320 },
  { email: 'javier.m@gmail.com', entradas: 3, total: 240 },
]

const MOCK_TOP_TRANSFERIDORES = [
  { email: 'user43@gmail.com', transferencias: 5, estado: 'activo' },
  { email: 'carlos99@gmail.com', transferencias: 4, estado: 'activo' },
  { email: 'p.gonzalez@gmail.com', transferencias: 3, estado: 'pendiente' },
  { email: 'laura.r@gmail.com', transferencias: 2, estado: 'activo' },
  { email: 'm.ramirez@gmail.com', transferencias: 2, estado: 'inactivo' },
]

const MOCK_CANCELADAS = {
  total: 847,
  tasaCancelacion: 18.4,
  montoPerdido: 67760,
  topMatches: [
    { nombre: 'Mexico vs Sudafrica', venue: 'Est. Ciudad de Mexico - 11 Jun', cantidad: 214 },
    { nombre: 'Canada vs Bosnia y Herz.', venue: 'BMO Field - 12 Jun', cantidad: 189 },
    { nombre: 'Rep. Corea vs Rep. Checa', venue: 'Est. Guadalajara - 12 Jun', cantidad: 163 },
  ],
}

const AVATAR_COLORS = ['#7C3AED', '#2563EB', '#16A34A', '#D97706', '#DB2777']

function DashboardAdmin() {
  const [periodo, setPeriodo] = useState('mes')
  const [topEncuentros, setTopEncuentros] = useState([])
  const [loadingEncuentros, setLoadingEncuentros] = useState(false)
  const [error, setError] = useState('')
  const [statsPeriod, setStatsPeriod] = useState('mes')
  const [desdePersonalizado, setDesdePersonalizado] = useState('')
  const [hastaPersonalizado, setHastaPersonalizado] = useState('')

  const rangoFechas = useMemo(
    () => getDateRange(statsPeriod, desdePersonalizado, hastaPersonalizado),
    [statsPeriod, desdePersonalizado, hastaPersonalizado]
  )

  useEffect(() => {
    const loadTopEncuentros = async () => {
      setLoadingEncuentros(true)
      setError('')

      try {
        const token = localStorage.getItem('ticketmatch-token')
        const response = await fetch(buildStatsUrl('TopEncuentros', rangoFechas), {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!response.ok) {
          throw new Error('No se pudieron cargar los encuentros')
        }

        setTopEncuentros(await response.json())
      } catch (err) {
        setTopEncuentros([])
        setError(err.message || 'No se pudieron cargar las estadisticas.')
      } finally {
        setLoadingEncuentros(false)
      }
    }

    loadTopEncuentros()
  }, [rangoFechas])

  const kpi = MOCK_KPI[periodo]
  const topEstadios = deriveTopEstadios(topEncuentros)
  const maxEncuentros = Math.max(...topEncuentros.map(getVendidas), 1)
  const maxEstadios = Math.max(...topEstadios.map((estadio) => estadio.vendidas), 1)
  const maxCompradores = Math.max(...MOCK_TOP_COMPRADORES.map((usuario) => usuario.entradas), 1)
  const maxTransferidores = Math.max(
    ...MOCK_TOP_TRANSFERIDORES.map((usuario) => usuario.transferencias),
    1
  )

  return (
    <div className="admin-view stats-view">
      <header className="stats-header">
        <div>
          <h1 id="dashboard-title">Estadisticas Generales</h1>
          <p>Copa Mundial FIFA 2026 - Datos en Tiempo Real</p>
        </div>

        <div className="period-tabs" role="tablist">
          {[
            ['semana', 'Esta semana'],
            ['mes', 'Este mes'],
            ['total', 'Total'],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={periodo === id}
              className={`period-tab ${periodo === id ? 'is-active' : ''}`}
              onClick={() => setPeriodo(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </header>

      <section className="stats-filters" aria-label="Filtros de estadisticas">
        <label className="stats-filter-field">
          Periodo de graficas
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

      {error && <p className="matches-status is-error">{error}</p>}

      <div className="kpi-row">
        <KpiCard
          icon={<TicketIcon />}
          colorClass="is-purple"
          label="Entradas Vendidas"
          value={formatCount(kpi.entradasVendidas)}
        />
        <KpiCard
          icon={<MoneyIcon />}
          colorClass="is-green"
          label="Ingresos Totales"
          value={formatMoney(kpi.ingresosTotales)}
        />
        <KpiCard
          icon={<AlertIcon />}
          colorClass="is-amber"
          label="Reservas Canceladas"
          value={formatCount(kpi.reservasCanceladas)}
        />
        <KpiCard
          icon={<SendIcon />}
          colorClass="is-blue"
          label="Transferencias"
          value={formatCount(kpi.transferencias)}
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
            {loadingEncuentros && <p className="matches-status">Cargando...</p>}
            {!loadingEncuentros && topEncuentros.length === 0 && (
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
            {topEstadios.length === 0 && !loadingEncuentros && (
              <p className="matches-status">Sin datos disponibles.</p>
            )}
            {topEstadios.map((estadio, index) => (
              <div className="top-list-item" key={estadio.nombre}>
                <span className="top-rank">#{index + 1}</span>
                <div className="top-match-info is-estadio">
                  <div className="top-match-name">{estadio.nombre}</div>
                  <div className="top-bar-wrap">
                    <div
                      className="top-bar-fill"
                      style={{ width: `${(estadio.vendidas / maxEstadios) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="top-count">{formatCount(estadio.vendidas)}</span>
              </div>
            ))}
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

          <div className="top-users-table">
            <div className="top-users-head">
              <span>USUARIO</span>
              <span>ENTRADAS</span>
              <span>TOTAL</span>
            </div>
            {MOCK_TOP_COMPRADORES.map((usuario, index) => (
              <div className="top-users-row" key={usuario.email}>
                <div className="user-cell">
                  <span
                    className="user-avatar"
                    style={{ background: avatarColor(usuario.email, index) }}
                  >
                    {avatarInitials(usuario.email)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="user-email">{usuario.email}</div>
                    <div className="user-bar-wrap">
                      <div
                        className="user-bar-fill"
                        style={{ width: `${(usuario.entradas / maxCompradores) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
                <span className="user-num">{usuario.entradas}</span>
                <span className="user-total">${formatCount(usuario.total)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-head">
            <div>
              <h2>Top Usuarios Transferidores</h2>
              <p>Usuarios con mas entradas transferidas</p>
            </div>
          </div>

          <div className="top-users-table">
            <div className="top-users-head">
              <span>USUARIO</span>
              <span>TRANSF.</span>
              <span>ESTADO</span>
            </div>
            {MOCK_TOP_TRANSFERIDORES.map((usuario, index) => (
              <div className="top-users-row" key={usuario.email}>
                <div className="user-cell">
                  <span
                    className="user-avatar"
                    style={{ background: avatarColor(usuario.email, index) }}
                  >
                    {avatarInitials(usuario.email)}
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div className="user-email">{usuario.email}</div>
                    <div className="user-bar-wrap">
                      <div
                        className="user-bar-fill is-amber"
                        style={{
                          width: `${(usuario.transferencias / maxTransferidores) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
                <span className="user-num">{usuario.transferencias}</span>
                <span className={`estado-dot is-${usuario.estado}`}>
                  {capitalize(usuario.estado)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="stat-card" style={{ marginBottom: 12 }}>
        <div className="stat-card-head">
          <div>
            <h2>Reservas Canceladas / No Pagadas</h2>
            <p>Usuarios que reservaron pero no completaron el pago</p>
          </div>
        </div>

        <div className="canceladas-kpis">
          <div className="canceladas-kpi">
            <span className="canceladas-kpi-value is-red">{formatCount(MOCK_CANCELADAS.total)}</span>
            <span className="canceladas-kpi-label">total canceladas</span>
          </div>
          <div className="canceladas-kpi">
            <span className="canceladas-kpi-value is-amber">
              {MOCK_CANCELADAS.tasaCancelacion}%
            </span>
            <span className="canceladas-kpi-label">tasa de cancelacion</span>
          </div>
          <div className="canceladas-kpi">
            <span className="canceladas-kpi-value">
              {formatMoneyExact(MOCK_CANCELADAS.montoPerdido)}
            </span>
            <span className="canceladas-kpi-label">monto perdido</span>
          </div>
        </div>

        <div className="canceladas-list">
          {MOCK_CANCELADAS.topMatches.map((match) => (
            <div className="canceladas-match" key={match.nombre}>
              <div className="canceladas-match-name">{match.nombre}</div>
              <div className="canceladas-match-venue">{match.venue}</div>
              <div className="canceladas-match-count">{match.cantidad}</div>
              <div className="canceladas-match-count-label">reservas canceladas</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
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

function deriveTopEstadios(encuentros) {
  const map = new Map()

  encuentros.forEach((encuentro) => {
    const nombre = encuentro.nombreEstadio ?? '-'
    map.set(nombre, (map.get(nombre) ?? 0) + getVendidas(encuentro))
  })

  return Array.from(map, ([nombre, vendidas]) => ({ nombre, vendidas }))
    .sort((a, b) => b.vendidas - a.vendidas)
    .slice(0, 5)
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

function formatMoney(value) {
  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(2)}M`
  }

  if (value >= 1_000) {
    return `$${(value / 1_000).toFixed(0)}K`
  }

  return `$${formatCount(value)}`
}

function formatMoneyExact(value) {
  return new Intl.NumberFormat('es-UY', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function capitalize(value) {
  return value ? value[0].toUpperCase() + value.slice(1) : ''
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
