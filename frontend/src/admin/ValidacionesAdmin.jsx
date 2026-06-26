import { API_URL } from '../config.js'
import { useEffect, useState, useCallback } from 'react'

const API = `${API_URL}`
const POR_PAGINA = 20

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('ticketmatch-token')
  return { ...extra, Authorization: `Bearer ${token}` }
}

function formatFecha(fechaStr) {
  if (!fechaStr) return '—'
  return new Date(fechaStr).toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatHora(horaStr) {
  if (!horaStr) return '—'
  return horaStr.substring(0, 5)
}

function iniciales(nombre, apellido) {
  return (nombre?.[0] ?? '').toUpperCase() + (apellido?.[0] ?? '').toUpperCase()
}

function ValidacionesAdmin({ user }) {
  const paisNombre = user?.paisSede === 1 ? 'Canadá' : user?.paisSede === 2 ? 'México' : 'USA'

  const [resumen,      setResumen]      = useState(null)
  const [lista,        setLista]        = useState({ total: 0, numeroPagina: 1, items: [] })
  const [estadios,     setEstadios]     = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')

  const [filtros, setFiltros] = useState({ desde: '', hasta: '', estadioId: '', funcionarioMail: '' })
  const [filtrosActivos, setFiltrosActivos] = useState({ desde: '', hasta: '', estadioId: '', funcionarioMail: '' })
  const [pagina, setPagina] = useState(1)

  const cargarResumen = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/validaciones/resumen`, { headers: getAuthHeaders() })
      if (res.ok) setResumen(await res.json())
    } catch { /* silencioso, los KPIs son secundarios */ }
  }, [])

  const cargarLista = useCallback(async (f, pag) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ numeroPagina: pag, cantidadPorPagina: POR_PAGINA })
      if (f.desde)           params.set('desde',           f.desde)
      if (f.hasta)           params.set('hasta',           f.hasta)
      if (f.estadioId)       params.set('estadioId',       f.estadioId)
      if (f.funcionarioMail) params.set('funcionarioMail', f.funcionarioMail)

      const res = await fetch(`${API}/api/validaciones?${params}`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error()
      setLista(await res.json())
    } catch {
      setError('No se pudieron cargar las validaciones.')
    } finally {
      setLoading(false)
    }
  }, [])

  const cargarDropdowns = useCallback(async () => {
    try {
      const [resEst, resFun] = await Promise.all([
        fetch(`${API}/api/estadios/admin`,      { headers: getAuthHeaders() }),
        fetch(`${API}/api/funcionarios/admin`,  { headers: getAuthHeaders() }),
      ])
      if (resEst.ok) setEstadios(await resEst.json())
      if (resFun.ok) setFuncionarios(await resFun.json())
    } catch { /* silencioso */ }
  }, [])

  useEffect(() => {
    async function cargarDatosIniciales() {
      await Promise.all([cargarResumen(), cargarDropdowns()])
      await cargarLista(filtrosActivos, 1)
    }
    cargarDatosIniciales()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const buscar = () => {
    const f = { ...filtros }
    setFiltrosActivos(f)
    setPagina(1)
    cargarLista(f, 1)
  }

  const limpiar = () => {
    const vacio = { desde: '', hasta: '', estadioId: '', funcionarioMail: '' }
    setFiltros(vacio)
    setFiltrosActivos(vacio)
    setPagina(1)
    cargarLista(vacio, 1)
  }

  const cambiarPagina = (nueva) => {
    setPagina(nueva)
    cargarLista(filtrosActivos, nueva)
  }

  const totalPaginas = Math.max(1, Math.ceil(lista.total / POR_PAGINA))
  const setF = (key) => (e) => setFiltros((f) => ({ ...f, [key]: e.target.value }))

  return (
    <div style={{ minHeight: '100%', background: '#F6F5F8', padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#130F1E', letterSpacing: '-0.4px' }}>Historial de Validaciones</div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#9490A0', marginTop: 3 }}>Todas las validaciones registradas en tu país sede</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 14px', borderRadius: 100, background: '#EDE9FE', border: '1px solid rgba(124,58,237,0.15)' }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#7C3AED', flex: 'none' }} />
          <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7C3AED' }}>{paisNombre}</span>
        </div>
      </div>

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Total validaciones', value: resumen?.totalMes?.toLocaleString() ?? '—',    sub: 'Este mes'           },
          { label: 'Hoy',                value: resumen?.hoy?.toLocaleString() ?? '—',          sub: 'Últimas 24hs'       },
          { label: 'Funcionarios activos', value: resumen?.funcionariosActivosHoy ?? '—',       sub: 'En partidos hoy'    },
          { label: 'Dispositivos en uso',  value: resumen?.dispositivosEnUsoHoy ?? '—',         sub: 'Usados hoy'         },
        ].map((kpi) => (
          <div key={kpi.label} style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 3px 10px rgba(0,0,0,0.04)' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#B0ACBA', textTransform: 'uppercase', letterSpacing: '0.3px', marginBottom: 6 }}>{kpi.label}</div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#130F1E', letterSpacing: '-0.6px', lineHeight: 1 }}>{kpi.value}</div>
            <div style={{ fontSize: 11, fontWeight: 500, color: '#9490A0', marginTop: 3 }}>{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Filtros */}
      <div style={{ background: '#fff', borderRadius: 12, padding: '14px 16px', marginBottom: 16, boxShadow: '0 1px 2px rgba(0,0,0,0.04), 0 3px 10px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }}>
          <IconFiltro />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#5B4E70' }}>Filtros</span>
        </div>
        <div style={{ width: 1, height: 20, background: '#ECEAF2', flex: 'none' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 130 }}>
          <label style={estilos.labelFiltro}>Desde</label>
          <input type="date" value={filtros.desde} onChange={setF('desde')} style={estilos.inputFiltro} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flex: 1, minWidth: 130 }}>
          <label style={estilos.labelFiltro}>Hasta</label>
          <input type="date" value={filtros.hasta} onChange={setF('hasta')} style={estilos.inputFiltro} />
        </div>

        <select value={filtros.estadioId} onChange={setF('estadioId')} style={{ ...estilos.inputFiltro, flex: 1, minWidth: 150, cursor: 'pointer' }}>
          <option value="">Todos los estadios</option>
          {estadios.map((e) => <option key={e.id} value={e.id}>{e.nombre}</option>)}
        </select>

        <select value={filtros.funcionarioMail} onChange={setF('funcionarioMail')} style={{ ...estilos.inputFiltro, flex: 1, minWidth: 150, cursor: 'pointer' }}>
          <option value="">Todos los funcionarios</option>
          {funcionarios.map((f) => <option key={f.mail} value={f.mail}>{f.nombre} {f.apellido}</option>)}
        </select>

        <BtnFiltro onClick={buscar} variante="primary"><IconBuscar />Buscar</BtnFiltro>
        <BtnFiltro onClick={limpiar} variante="secondary"><IconX />Limpiar</BtnFiltro>
      </div>

      {/* Tabla */}
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 14 }}>
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 3px 12px rgba(0,0,0,0.04)', minWidth: 640 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.2fr 1.4fr 1fr 0.8fr', padding: '11px 18px', background: '#F8F7FB', borderBottom: '1px solid #ECEAF2' }}>
          {['Partido', 'Estadio · Sector', 'Funcionario', 'Dispositivo', 'Fecha · Hora', 'Token'].map((col) => (
            <span key={col} style={{ fontSize: 10.5, fontWeight: 700, color: '#9490A0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{col}</span>
          ))}
        </div>

        {loading && <div style={{ padding: '24px 18px', fontSize: 13, color: '#9490A0' }}>Cargando validaciones...</div>}
        {error   && <div style={{ padding: '24px 18px', fontSize: 13, color: '#B91C1C' }}>{error}</div>}
        {!loading && !error && lista.items.length === 0 && (
          <div style={{ padding: '24px 18px', fontSize: 13, color: '#9490A0' }}>No hay validaciones para los filtros seleccionados.</div>
        )}

        {!loading && !error && lista.items.map((val, i) => (
          <FilaValidacion key={i} val={val} />
        ))}

        {/* Paginación */}
        <div style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FDFCFF', borderTop: '1px solid #F0EEF5' }}>
          <span style={{ fontSize: 12, fontWeight: 500, color: '#9490A0' }}>
            {lista.total === 0
              ? 'Sin resultados'
              : `Mostrando ${((pagina - 1) * POR_PAGINA) + 1}–${Math.min(pagina * POR_PAGINA, lista.total)} de ${lista.total.toLocaleString()} validaciones`}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <BtnPagina onClick={() => cambiarPagina(pagina - 1)} disabled={pagina <= 1}>
              <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="#9490A0" strokeWidth="1.8" strokeLinecap="round"><path d="M6 2L4 5l2 4" /></svg>
            </BtnPagina>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#5B4E70', padding: '0 4px' }}>Pág. {pagina} / {totalPaginas}</span>
            <BtnPagina onClick={() => cambiarPagina(pagina + 1)} disabled={pagina >= totalPaginas}>
              <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="#9490A0" strokeWidth="1.8" strokeLinecap="round"><path d="M4 2l2 3-2 4" /></svg>
            </BtnPagina>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}

function FilaValidacion({ val }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.4fr 1.2fr 1.4fr 1fr 0.8fr', padding: '12px 18px', borderBottom: '1px solid #F5F4F8', alignItems: 'center', background: hover ? '#FDFCFF' : '#fff', transition: 'background 0.12s' }}
    >
      {/* Partido */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, color: '#2D2638', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {val.equipoLocal} vs {val.equipoVisitante}
          </div>
        </div>
      </div>

      {/* Estadio · Sector */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#2D2638' }}>{val.estadioNombre}</div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 2, padding: '2px 7px', borderRadius: 100, background: '#F5F3FF', border: '1px solid rgba(124,58,237,0.1)' }}>
          <span style={{ fontSize: 10.5, fontWeight: 700, color: '#7C3AED' }}>{val.sectorNombre}</span>
        </div>
      </div>

      {/* Funcionario */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <span style={{ color: '#fff', fontSize: 9, fontWeight: 800 }}>{iniciales(val.funcionarioNombre, val.funcionarioApellido)}</span>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#2D2638' }}>{val.funcionarioNombre} {val.funcionarioApellido}</div>
          <div style={{ fontSize: 10.5, color: '#B0ACBA' }}>#{val.funcionarioLegajo}</div>
        </div>
      </div>

      {/* Dispositivo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 24, height: 24, borderRadius: 6, background: '#F0EEF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#9490A0" strokeWidth="1.4" strokeLinecap="round">
            <rect x="2" y="1" width="8" height="10" rx="1.2" /><circle cx="6" cy="8.5" r="0.7" fill="#9490A0" />
          </svg>
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2638' }}>{val.numeroDispositivo}</div>
          <div style={{ fontSize: 10.5, color: '#B0ACBA' }}>{val.dispositivoDescripcion || '—'}</div>
        </div>
      </div>

      {/* Fecha · Hora */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2638' }}>{formatFecha(val.fecha)}</div>
        <div style={{ fontSize: 10.5, color: '#B0ACBA' }}>{formatHora(val.hora)}</div>
      </div>

      {/* Token */}
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, color: '#9490A0', fontFamily: 'monospace', letterSpacing: '0.5px', background: '#F8F7FB', padding: '3px 7px', borderRadius: 5, border: '1px solid #ECEAF2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 90 }}>
          {val.tokenResumen}…
        </div>
      </div>
    </div>
  )
}

function BtnFiltro({ onClick, variante, children }) {
  const [hover, setHover] = useState(false)
  const base = variante === 'primary'
    ? { background: hover ? 'linear-gradient(135deg,#6D28D9,#7C3AED)' : 'linear-gradient(135deg,#7C3AED,#9333EA)', color: '#fff', border: 'none', boxShadow: hover ? '0 3px 12px rgba(124,58,237,0.42)' : '0 2px 8px rgba(124,58,237,0.28)' }
    : { background: hover ? '#F5F3FF' : '#fff', color: hover ? '#7C3AED' : '#5B4E70', border: hover ? '1.5px solid #C4B5FD' : '1.5px solid #E2E0E8' }
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 14px', height: 34, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, flex: 'none', transition: 'all 0.18s', ...base }}
    >
      {children}
    </button>
  )
}

function BtnPagina({ onClick, disabled, children }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: 30, height: 30, borderRadius: 7, border: hover && !disabled ? '1.5px solid #C4B5FD' : '1.5px solid #E2E0E8', background: hover && !disabled ? '#F5F3FF' : '#fff', cursor: disabled ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: disabled ? 0.4 : 1, transition: 'all 0.15s' }}
    >
      {children}
    </button>
  )
}

const estilos = {
  labelFiltro: { fontSize: 11, fontWeight: 700, color: '#9490A0', whiteSpace: 'nowrap' },
  inputFiltro:  { flex: 1, height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #E2E0E8', background: '#F8F7FB', fontFamily: 'inherit', fontSize: 12, color: '#130F1E', boxSizing: 'border-box' },
}

function IconFiltro() {
  return <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="#9490A0" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }}><path d="M1 2.5h12M3.5 7h7M6 11.5h2" /></svg>
}
function IconBuscar() {
  return <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: 'none' }}><circle cx="5" cy="5" r="3.5" /><line x1="8" y1="8" x2="11" y2="11" /></svg>
}
function IconX() {
  return <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ flex: 'none' }}><path d="M2 2l8 8M10 2l-8 8" /></svg>
}

export default ValidacionesAdmin
