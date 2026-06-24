import { useEffect, useState } from 'react'

const API = 'http://localhost:8080'

function getAuthHeaders(extra = {}) {
  const token = localStorage.getItem('ticketmatch-token')
  return { ...extra, Authorization: `Bearer ${token}` }
}

const FORM_VACIO = {
  mail: '', contrasena: '',
  nombre: '', apellido: '', fechaNacimiento: '',
  tipoDocumento: 'Cédula de identidad', paisDocumento: 'Uruguay', numeroDocumento: '',
  paisCasa: 'Uruguay', localidad: '', calle: '', numeroCasa: '', codigoPostal: '',
}

const TIPOS_DOC = ['Cédula de identidad', 'Pasaporte', 'DNI', 'Licencia de conducir']
const PAISES    = ['Uruguay', 'Argentina', 'Brasil', 'Chile', 'México', 'Canadá', 'USA', 'Otro']

function iniciales(nombre, apellido) {
  return (nombre?.[0] ?? '').toUpperCase() + (apellido?.[0] ?? '').toUpperCase()
}

function FuncionariosAdmin() {
  const [lista,        setLista]        = useState([])
  const [loading,      setLoading]      = useState(true)
  const [error,        setError]        = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [form,         setForm]         = useState(FORM_VACIO)
  const [formError,    setFormError]    = useState('')
  const [guardando,    setGuardando]    = useState(false)
  const [eliminando,   setEliminando]   = useState(null)
  const [deleteError,  setDeleteError]  = useState('')

  const cargar = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${API}/api/funcionarios/admin`, { headers: getAuthHeaders() })
      if (!res.ok) throw new Error()
      setLista(await res.json())
    } catch {
      setError('No se pudieron cargar los funcionarios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(cargar) }, [])

  const abrirModal = () => {
    setForm(FORM_VACIO)
    setFormError('')
    setModalAbierto(true)
  }

  const cerrarModal = () => {
    setModalAbierto(false)
    setFormError('')
    setGuardando(false)
  }

  const setField = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const submitForm = async (e) => {
    e.preventDefault()
    setFormError('')
    setGuardando(true)
    try {
      const body = {
        mail:            form.mail.trim(),
        contrasena:      form.contrasena,
        nombre:          form.nombre.trim(),
        apellido:        form.apellido.trim(),
        fechaNacimiento: form.fechaNacimiento || null,
        tipoDocumento:   form.tipoDocumento,
        paisDocumento:   form.paisDocumento,
        numeroDocumento: form.numeroDocumento.trim(),
        paisCasa:        form.paisCasa,
        localidad:       form.localidad.trim(),
        calle:           form.calle.trim(),
        numeroCasa:      form.numeroCasa.trim(),
        codigoPostal:    form.codigoPostal.trim(),
      }
      const res = await fetch(`${API}/api/funcionarios`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(body),
      })
      if (res.status === 409) { setFormError((await res.json()).message ?? 'El mail ya está registrado.'); return }
      if (res.status === 400) { setFormError((await res.json()).message ?? 'Datos inválidos.'); return }
      if (!res.ok) throw new Error()
      await cargar()
      cerrarModal()
    } catch {
      setFormError('No se pudo crear el funcionario.')
    } finally {
      setGuardando(false)
    }
  }

  const eliminar = async (mail) => {
    setDeleteError('')
    setEliminando(mail)
    try {
      const res = await fetch(`${API}/api/funcionarios/${encodeURIComponent(mail)}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.status === 404) { setDeleteError('Funcionario no encontrado.'); return }
      if (!res.ok) throw new Error()
      await cargar()
    } catch {
      setDeleteError('No se pudo eliminar el funcionario.')
    } finally {
      setEliminando(null)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: '#F6F5F8', padding: '28px 32px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 19, fontWeight: 800, color: '#130F1E', letterSpacing: '-0.4px' }}>Funcionarios</div>
          <div style={{ fontSize: 12.5, fontWeight: 500, color: '#9490A0', marginTop: 3 }}>Gestioná el personal del sistema</div>
        </div>
        <button onClick={abrirModal} style={estilos.btnPrimario}>
          <IconPlus />
          Agregar Funcionario
        </button>
      </div>

      {/* Errores globales */}
      {deleteError && (
        <div style={{ marginBottom: 12, padding: '10px 14px', borderRadius: 9, background: '#FEF2F2', border: '1.5px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
          {deleteError}
        </div>
      )}

      {/* Tabla */}
      <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 3px 12px rgba(0,0,0,0.04)' }}>
        {/* Encabezado */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '11px 18px', background: '#F8F7FB', borderBottom: '1px solid #ECEAF2' }}>
          {['Funcionario', 'Email', 'Legajo', 'Documento', 'Acciones'].map((col) => (
            <span key={col} style={{ fontSize: 10.5, fontWeight: 700, color: '#9490A0', textTransform: 'uppercase', letterSpacing: '0.3px' }}>{col}</span>
          ))}
        </div>

        {loading && (
          <div style={{ padding: '24px 18px', fontSize: 13, color: '#9490A0' }}>Cargando funcionarios...</div>
        )}
        {error && (
          <div style={{ padding: '24px 18px', fontSize: 13, color: '#B91C1C' }}>{error}</div>
        )}
        {!loading && !error && lista.length === 0 && (
          <div style={{ padding: '24px 18px', fontSize: 13, color: '#9490A0' }}>No hay funcionarios registrados.</div>
        )}

        {!loading && !error && lista.map((fc) => (
          <FilaFuncionario
            key={fc.mail}
            fc={fc}
            eliminando={eliminando === fc.mail}
            onEliminar={() => eliminar(fc.mail)}
          />
        ))}
      </div>

      {/* Modal */}
      {modalAbierto && (
        <div
          onClick={cerrarModal}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,8,18,0.65)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 560, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.3)' }}
          >
            {/* Cabecera modal */}
            <div style={{ padding: '16px 22px', borderBottom: '1px solid #F0EEF5', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 'none' }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#130F1E', letterSpacing: '-0.3px' }}>Agregar Funcionario</div>
                <div style={{ fontSize: 12, fontWeight: 500, color: '#9490A0', marginTop: 2 }}>Completá los datos de la persona</div>
              </div>
              <button onClick={cerrarModal} style={estilos.btnCerrar}>
                <IconClose />
              </button>
            </div>

            {/* Cuerpo modal */}
            <form onSubmit={submitForm} style={{ overflowY: 'auto', padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Sección: Cuenta */}
              <Seccion icono={<IconUser />} titulo="Cuenta">
                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo label="Email">
                    <input required type="email" placeholder="juan.perez@ticketmatch.com" value={form.mail} onChange={setField('mail')} style={estilos.input} />
                  </Campo>
                </div>
                <Campo label="Contraseña">
                  <input required type="password" placeholder="••••••••" minLength={6} value={form.contrasena} onChange={setField('contrasena')} style={estilos.input} />
                </Campo>
                <Campo label="Nº de Legajo">
                  <input disabled value="Auto-asignado" style={{ ...estilos.input, border: '1.5px solid #C4B5FD', background: '#F5F3FF', color: '#7C3AED', fontWeight: 600, cursor: 'not-allowed' }} />
                </Campo>
              </Seccion>

              {/* Sección: Datos personales */}
              <Seccion icono={<IconDoc />} titulo="Datos personales">
                <Campo label="Nombre">
                  <input required type="text" placeholder="Juan" value={form.nombre} onChange={setField('nombre')} style={estilos.input} />
                </Campo>
                <Campo label="Apellido">
                  <input required type="text" placeholder="Pérez" value={form.apellido} onChange={setField('apellido')} style={estilos.input} />
                </Campo>
                <Campo label="Fecha de nacimiento">
                  <input type="date" value={form.fechaNacimiento} onChange={setField('fechaNacimiento')} style={{ ...estilos.input, color: form.fechaNacimiento ? '#130F1E' : '#9490A0' }} />
                </Campo>
              </Seccion>

              {/* Sección: Documento */}
              <Seccion icono={<IconId />} titulo="Documento de identidad">
                <Campo label="Tipo">
                  <select value={form.tipoDocumento} onChange={setField('tipoDocumento')} style={estilos.select}>
                    {TIPOS_DOC.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Campo>
                <Campo label="País emisor">
                  <select value={form.paisDocumento} onChange={setField('paisDocumento')} style={estilos.select}>
                    {PAISES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Campo>
                <div style={{ gridColumn: '1 / -1' }}>
                  <Campo label="Número de documento">
                    <input type="text" placeholder="12345678" value={form.numeroDocumento} onChange={setField('numeroDocumento')} style={estilos.input} />
                  </Campo>
                </div>
              </Seccion>

              {/* Sección: Dirección */}
              <Seccion icono={<IconPin />} titulo="Dirección">
                <Campo label="País de residencia">
                  <select value={form.paisCasa} onChange={setField('paisCasa')} style={estilos.select}>
                    {PAISES.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </Campo>
                <Campo label="Localidad">
                  <input type="text" placeholder="Montevideo" value={form.localidad} onChange={setField('localidad')} style={estilos.input} />
                </Campo>
                <Campo label="Calle">
                  <input type="text" placeholder="Av. 18 de Julio" value={form.calle} onChange={setField('calle')} style={estilos.input} />
                </Campo>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <Campo label="Número">
                    <input type="text" placeholder="1234" value={form.numeroCasa} onChange={setField('numeroCasa')} style={estilos.input} />
                  </Campo>
                  <Campo label="Cód. postal">
                    <input type="text" placeholder="11100" value={form.codigoPostal} onChange={setField('codigoPostal')} style={estilos.input} />
                  </Campo>
                </div>
              </Seccion>

              {formError && (
                <div style={{ padding: '10px 14px', borderRadius: 9, background: '#FEF2F2', border: '1.5px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#B91C1C', fontWeight: 500 }}>
                  {formError}
                </div>
              )}
            </form>

            {/* Footer modal */}
            <div style={{ padding: '12px 22px 18px', borderTop: '1px solid #F0EEF5', flex: 'none' }}>
              <button
                type="submit"
                form=""
                onClick={submitForm}
                disabled={guardando}
                style={{ ...estilos.btnPrimario, width: '100%', justifyContent: 'center', padding: 13, fontSize: 14, opacity: guardando ? 0.7 : 1 }}
              >
                <IconAddUser />
                {guardando ? 'Guardando...' : 'Crear Funcionario'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function FilaFuncionario({ fc, eliminando, onEliminar }) {
  const [hover, setHover] = useState(false)
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ display: 'grid', gridTemplateColumns: '2fr 1.5fr 1fr 1fr 1fr', padding: '13px 18px', borderBottom: '1px solid #F5F4F8', alignItems: 'center', background: hover ? '#FDFCFF' : '#fff', transition: 'background 0.12s' }}
    >
      {/* Nombre */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', boxShadow: '0 2px 6px rgba(124,58,237,0.25)' }}>
          <span style={{ color: '#fff', fontSize: 11, fontWeight: 800 }}>{iniciales(fc.nombre, fc.apellido)}</span>
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2638' }}>{fc.nombre} {fc.apellido}</div>
          <div style={{ fontSize: 11, color: '#B0ACBA', marginTop: 1 }}>{fc.paisCasa || '—'}</div>
        </div>
      </div>

      {/* Email */}
      <div style={{ fontSize: 12.5, color: '#5B4E70', fontWeight: 500 }}>{fc.mail}</div>

      {/* Legajo */}
      <div style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 100, background: '#EDE9FE', width: 'fit-content' }}>
        <span style={{ fontSize: 11.5, fontWeight: 700, color: '#7C3AED' }}>#{fc.numeroLegajo}</span>
      </div>

      {/* Documento */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 600, color: '#2D2638' }}>{fc.numeroDocumento || '—'}</div>
        <div style={{ fontSize: 10.5, color: '#B0ACBA' }}>
          {[fc.tipoDocumento, fc.paisDocumento].filter(Boolean).join(' · ') || '—'}
        </div>
      </div>

      {/* Acciones */}
      <div>
        <BtnEliminar onClick={onEliminar} disabled={eliminando} />
      </div>
    </div>
  )
}

function Seccion({ icono, titulo, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
        <div style={{ width: 20, height: 20, borderRadius: 5, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          {icono}
        </div>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#3A3445' }}>{titulo}</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {children}
      </div>
    </div>
  )
}

function Campo({ label, children }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 10.5, fontWeight: 700, color: '#46404F', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.3px' }}>{label}</label>
      {children}
    </div>
  )
}

function BtnEliminar({ onClick, disabled }) {
  const [hover, setHover] = useState(false)
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ width: 30, height: 30, borderRadius: 7, border: `1.5px solid ${hover ? '#EF4444' : 'rgba(239,68,68,0.18)'}`, background: hover ? '#FEE2E2' : '#FEF2F2', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transition: 'all 0.15s', opacity: disabled ? 0.5 : 1 }}
      aria-label="Eliminar funcionario"
    >
      <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="1 3 11 3" /><path d="M4.5 3V2h3v1M2 3l.7 7.5A1 1 0 0 0 3.7 11h4.6a1 1 0 0 0 1-.9L10 3" />
      </svg>
    </button>
  )
}

const estilos = {
  input: { width: '100%', height: 40, padding: '0 12px', borderRadius: 9, border: '1.5px solid #E2E0E8', background: '#F8F7FB', fontFamily: 'inherit', fontSize: 13, color: '#130F1E', boxSizing: 'border-box' },
  select: { width: '100%', height: 40, padding: '0 12px', borderRadius: 9, border: '1.5px solid #E2E0E8', background: '#F8F7FB', fontFamily: 'inherit', fontSize: 13, color: '#130F1E', cursor: 'pointer', boxSizing: 'border-box' },
  btnPrimario: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 10, border: 'none', background: 'linear-gradient(135deg,#7C3AED,#9333EA)', cursor: 'pointer', color: '#fff', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, boxShadow: '0 3px 10px rgba(124,58,237,0.3)' },
  btnCerrar: { width: 28, height: 28, borderRadius: '50%', border: '1.5px solid #E2E0E8', background: '#F8F7FB', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' },
}

function IconPlus() {
  return <svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ flex: 'none' }}><line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" /></svg>
}
function IconClose() {
  return <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="#9490A0" strokeWidth="1.8" strokeLinecap="round"><line x1="2" y1="2" x2="8" y2="8" /><line x1="8" y1="2" x2="2" y2="8" /></svg>
}
function IconUser() {
  return <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"><circle cx="6" cy="4.5" r="2" /><path d="M2 10c0-2.2 1.8-4 4-4s4 1.8 4 4" /></svg>
}
function IconDoc() {
  return <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="1" width="8" height="10" rx="1" /><line x1="4" y1="4.5" x2="8" y2="4.5" /><line x1="4" y1="7" x2="8" y2="7" /></svg>
}
function IconId() {
  return <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"><rect x="3.5" y="1.5" width="5" height="6" rx="0.8" /><path d="M2 10.5A1.5 1.5 0 0 1 3.5 9h5A1.5 1.5 0 0 1 10 10.5v.5H2v-.5z" /></svg>
}
function IconPin() {
  return <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 11S2.5 7.5 2.5 5a3.5 3.5 0 0 1 7 0C9.5 7.5 6 11 6 11z" /><circle cx="6" cy="5" r="1.3" /></svg>
}
function IconAddUser() {
  return <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }}><circle cx="5.5" cy="4.5" r="2.5" /><path d="M1 11c0-2.5 2-4.5 4.5-4.5" /><path d="M10.5 8v4M8.5 10h4" /></svg>
}

export default FuncionariosAdmin
