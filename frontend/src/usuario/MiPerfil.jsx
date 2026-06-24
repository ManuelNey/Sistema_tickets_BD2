import { useState } from 'react'
import { useAuth } from '../context/useAuth'

const API_URL = 'http://localhost:8080/api/usuario'

function MiPerfil({ user }) {
  const { updateUser } = useAuth()

  const [perfil, setPerfil] = useState(() => user || {})
  const [perfilGuardado, setPerfilGuardado] = useState(() => user || {})
  const [editandoSeccion, setEditandoSeccion] = useState(null)
  const [telefonos, setTelefonos] = useState(() => user?.telefonos || [])
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [passwords, setPasswords] = useState({ contrasenaActual: '', nuevaContrasena: '', confirmarNuevaContrasena: '' })
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const estaEditando = (s) => editandoSeccion === s
  const nombreCompleto = `${perfilGuardado?.nombre || ''} ${perfilGuardado?.apellido || ''}`.trim()
  const iniciales = `${perfilGuardado?.nombre?.[0] || ''}${perfilGuardado?.apellido?.[0] || ''}`.toUpperCase()

  const fechaNacimiento = perfil?.fechaNacimiento
    ? new Date(`${perfil.fechaNacimiento}T00:00:00`).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No registrada'

  const fechaRegistro = perfil?.fechaRegistro
    ? new Date(perfil.fechaRegistro).toLocaleDateString('es-UY', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'No registrada'

  const actualizarCampo = (e) => {
    const { name, value } = e.target
    setPerfil((p) => ({ ...p, [name]: value }))
  }

  const actualizarPassword = (e) => {
    const { name, value } = e.target
    setPasswords((p) => ({ ...p, [name]: value }))
  }

  const abrirEdicion = (seccion) => {
    setError('')
    setMensajeExito('')
    setEditandoSeccion(seccion)
  }

  const agregarTelefono = () => {
    const tel = nuevoTelefono.trim()
    if (!tel) return
    if (!/^\d+$/.test(tel)) { setError('El teléfono solo puede contener números.'); return }
    if (telefonos.includes(tel)) return
    setError('')
    setTelefonos((t) => [...t, tel])
    setNuevoTelefono('')
  }

  const eliminarTelefono = (tel) => setTelefonos((t) => t.filter((x) => x !== tel))

  const cancelarCambios = () => {
    setPerfil(perfilGuardado)
    setTelefonos(perfilGuardado?.telefonos || [])
    setNuevoTelefono('')
    setPasswords({ contrasenaActual: '', nuevaContrasena: '', confirmarNuevaContrasena: '' })
    setError('')
    setMensajeExito('')
    setEditandoSeccion(null)
  }

  const guardarCambios = async () => {
    if (!perfil?.mail) { setError('No se encontró el correo del usuario.'); return }
    setGuardando(true)
    setError('')
    setMensajeExito('')

    const telInvalido = telefonos.find((t) => !/^\d+$/.test(t))
    if (telInvalido) { setError('El teléfono solo puede contener números.'); setGuardando(false); return }

    const quiereCambiarPass = passwords.contrasenaActual.trim() || passwords.nuevaContrasena.trim() || passwords.confirmarNuevaContrasena.trim()
    if (quiereCambiarPass) {
      if (!passwords.contrasenaActual.trim()) { setError('Debés ingresar la contraseña actual.'); setGuardando(false); return }
      if (!passwords.nuevaContrasena.trim()) { setError('Debés ingresar la nueva contraseña.'); setGuardando(false); return }
      if (passwords.nuevaContrasena.length < 6) { setError('La nueva contraseña debe tener al menos 6 caracteres.'); setGuardando(false); return }
      if (passwords.nuevaContrasena !== passwords.confirmarNuevaContrasena) { setError('Las contraseñas no coinciden.'); setGuardando(false); return }
    }

    try {
      const token = localStorage.getItem('ticketmatch-token')
      const body = {
        nombre: perfil.nombre || '', apellido: perfil.apellido || '',
        fechaNacimiento: perfil.fechaNacimiento || null,
        tipoDocumento: perfil.tipoDocumento || '', numeroDocumento: perfil.numeroDocumento || '', paisDocumento: perfil.paisDocumento || '',
        paisCasa: perfil.paisCasa || '', localidad: perfil.localidad || '', calle: perfil.calle || '',
        numeroCasa: perfil.numeroCasa || '', codigoPostal: perfil.codigoPostal || '',
        telefonos,
        contrasenaActual: quiereCambiarPass ? passwords.contrasenaActual : null,
        nuevaContrasena: quiereCambiarPass ? passwords.nuevaContrasena : null,
        confirmarNuevaContrasena: quiereCambiarPass ? passwords.confirmarNuevaContrasena : null,
      }

      const res = await fetch(`${API_URL}/perfil/${encodeURIComponent(perfil.mail)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(body),
      })

      let data = null
      try { data = await res.json() } catch { data = null }
      if (!res.ok) throw new Error(data?.message || data?.title || 'No se pudieron guardar los cambios.')

      const actualizado = { ...perfil, ...body, mail: perfil.mail }
      delete actualizado.contrasenaActual
      delete actualizado.nuevaContrasena
      delete actualizado.confirmarNuevaContrasena

      updateUser(actualizado)
      setPerfil(actualizado)
      setPerfilGuardado(actualizado)
      setTelefonos(body.telefonos)
      setPasswords({ contrasenaActual: '', nuevaContrasena: '', confirmarNuevaContrasena: '' })
      setMensajeExito(quiereCambiarPass ? 'Perfil y contraseña actualizados.' : 'Cambios guardados correctamente.')
      setEditandoSeccion(null)
    } catch (err) {
      setError(err.message || 'Ocurrió un error al guardar los cambios.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div style={{ minHeight: '100%', background: '#F6F5F8', padding: '28px 32px' }}>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(150deg,#1B1428 0%,#2D1F4A 100%)', borderRadius: 16, padding: '24px 28px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 4px 20px rgba(124,58,237,0.15)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 80% 50%,rgba(124,58,237,0.14) 0%,transparent 60%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, position: 'relative' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg,#7C3AED,#A855F7)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 6px 20px rgba(124,58,237,0.4)', border: '3px solid rgba(255,255,255,0.12)' }}>
            <span style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{iniciales || 'U'}</span>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ color: '#fff', fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, marginBottom: 4 }}>{nombreCompleto || 'Usuario'}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12.5, fontWeight: 500 }}>{perfil?.mail}</span>
            </div>
            <div style={{ color: 'rgba(255,255,255,0.28)', fontSize: 11.5, fontWeight: 500, marginTop: 5 }}>Miembro desde {fechaRegistro}</div>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {error && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', color: '#B91C1C', fontSize: 13, fontWeight: 600 }}>{error}</div>
      )}
      {mensajeExito && (
        <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 10, background: '#F0FDF4', border: '1px solid rgba(34,197,94,0.2)', color: '#15803D', fontSize: 13, fontWeight: 600 }}>{mensajeExito}</div>
      )}

      {/* Grid 2 columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>

        {/* Datos personales */}
        <Card
          icono={<IconPersona />}
          titulo="Datos personales"
          editando={estaEditando('personal')}
          guardando={guardando}
          onEditar={() => abrirEdicion('personal')}
          onGuardar={guardarCambios}
          onCancelar={cancelarCambios}
        >
          {estaEditando('personal') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Campo label="Nombre" name="nombre" value={perfil?.nombre || ''} onChange={actualizarCampo} />
              <Campo label="Apellido" name="apellido" value={perfil?.apellido || ''} onChange={actualizarCampo} />
              <Campo label="Fecha de nacimiento" name="fechaNacimiento" type="date" value={perfil?.fechaNacimiento || ''} onChange={actualizarCampo} />
            </div>
          ) : (
            <>
              <Fila label="Nombre" value={perfil?.nombre || '-'} />
              <Fila label="Apellido" value={perfil?.apellido || '-'} />
              <Fila label="Nacimiento" value={fechaNacimiento} />
            </>
          )}
        </Card>

        {/* Documento */}
        <Card
          icono={<IconDocumento />}
          titulo="Documento de identidad"
          editando={estaEditando('documento')}
          guardando={guardando}
          onEditar={() => abrirEdicion('documento')}
          onGuardar={guardarCambios}
          onCancelar={cancelarCambios}
        >
          {estaEditando('documento') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <CampoSelect label="Tipo" name="tipoDocumento" value={perfil?.tipoDocumento || 'CI'} onChange={actualizarCampo}>
                <option value="CI">Cédula de identidad</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="DNI">DNI</option>
              </CampoSelect>
              <Campo label="País emisor" name="paisDocumento" value={perfil?.paisDocumento || ''} onChange={actualizarCampo} />
              <Campo label="Número" name="numeroDocumento" value={perfil?.numeroDocumento || ''} onChange={actualizarCampo} />
            </div>
          ) : (
            <>
              <Fila label="Tipo" value={perfil?.tipoDocumento || '-'} />
              <Fila label="País emisor" value={perfil?.paisDocumento || '-'} />
              <Fila label="Número" value={perfil?.numeroDocumento || '-'} />
            </>
          )}
        </Card>

        {/* Dirección */}
        <Card
          icono={<IconUbicacion />}
          titulo="Dirección"
          editando={estaEditando('direccion')}
          guardando={guardando}
          onEditar={() => abrirEdicion('direccion')}
          onGuardar={guardarCambios}
          onCancelar={cancelarCambios}
        >
          {estaEditando('direccion') ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Campo label="País" name="paisCasa" value={perfil?.paisCasa || ''} onChange={actualizarCampo} />
              <Campo label="Localidad" name="localidad" value={perfil?.localidad || ''} onChange={actualizarCampo} />
              <Campo label="Calle" name="calle" value={perfil?.calle || ''} onChange={actualizarCampo} />
              <Campo label="Número" name="numeroCasa" value={perfil?.numeroCasa || ''} onChange={actualizarCampo} />
              <Campo label="Código postal" name="codigoPostal" value={perfil?.codigoPostal || ''} onChange={actualizarCampo} />
            </div>
          ) : (
            <>
              <Fila label="País" value={perfil?.paisCasa || '-'} />
              <Fila label="Localidad" value={perfil?.localidad || '-'} />
              <Fila label="Dirección" value={perfil?.calle ? `${perfil.calle} ${perfil.numeroCasa || ''}`.trim() : '-'} />
              <Fila label="Cód. postal" value={perfil?.codigoPostal || '-'} />
            </>
          )}
        </Card>

        {/* Contacto */}
        <Card
          icono={<IconEmail />}
          titulo="Contacto"
          editando={estaEditando('contacto')}
          guardando={guardando}
          onEditar={() => abrirEdicion('contacto')}
          onGuardar={guardarCambios}
          onCancelar={cancelarCambios}
        >
          {/* Email siempre read-only */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 10 }}>
            <span style={estilos.label}>Email</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={estilos.valor}>{perfil?.mail || '-'}</span>
            </div>
          </div>
          <div style={estilos.divider} />

          {/* Teléfonos */}
          <div style={{ marginTop: 10 }}>
            {telefonos.length > 0 ? telefonos.map((tel, i) => (
              <div key={`${tel}-${i}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={estilos.label}>Teléfono</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={estilos.valor}>{tel}</span>
                  {estaEditando('contacto') && (
                    <button type="button" onClick={() => eliminarTelefono(tel)} disabled={guardando} style={{ width: 20, height: 20, borderRadius: '50%', background: '#FEF2F2', border: '1px solid rgba(239,68,68,0.2)', color: '#DC2626', fontSize: 10, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
                  )}
                </div>
              </div>
            )) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={estilos.label}>Teléfono</span>
                <span style={{ ...estilos.valor, color: '#B0ACBA' }}>No registrado</span>
              </div>
            )}

            {estaEditando('contacto') && (
              <div style={{ display: 'flex', gap: 7, marginTop: 10 }}>
                <input
                  type="tel"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); agregarTelefono() } }}
                  placeholder="099123456"
                  disabled={guardando}
                  style={{ flex: 1, height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #E2E0E8', background: '#F8F7FB', fontFamily: 'inherit', fontSize: 12, color: '#130F1E' }}
                />
                <button type="button" onClick={agregarTelefono} disabled={guardando} style={{ padding: '0 12px', height: 34, borderRadius: 8, border: '1.5px solid #C4B5FD', background: '#EDE9FE', color: '#7C3AED', fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>+ Agregar</button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Seguridad — fuera del grid, ancho completo */}
      <Card
        icono={<IconLock />}
        titulo="Seguridad"
        editando={estaEditando('seguridad')}
        guardando={guardando}
        onEditar={() => abrirEdicion('seguridad')}
        onGuardar={guardarCambios}
        onCancelar={cancelarCambios}
      >
        {estaEditando('seguridad') ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <Campo label="Contraseña actual" name="contrasenaActual" type="password" value={passwords.contrasenaActual} onChange={actualizarPassword} />
            </div>
            <Campo label="Nueva contraseña" name="nuevaContrasena" type="password" value={passwords.nuevaContrasena} onChange={actualizarPassword} />
            <Campo label="Confirmar nueva contraseña" name="confirmarNuevaContrasena" type="password" value={passwords.confirmarNuevaContrasena} onChange={actualizarPassword} />
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#2D2638', marginBottom: 3 }}>Contraseña configurada</div>
              <div style={{ fontSize: 12, fontWeight: 500, color: '#9490A0' }}>Hacé clic en <strong style={{ color: '#7C3AED' }}>Editar</strong> para cambiar tu contraseña actual</div>
            </div>
            <div style={{ marginLeft: 'auto', letterSpacing: 3, fontSize: 18, color: '#C4B5FD', fontWeight: 700 }}>••••••••</div>
          </div>
        )}
      </Card>
    </div>
  )
}

/* ── Sub-componentes ── */

function Card({ icono, titulo, editando, guardando, onEditar, onGuardar, onCancelar, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 2px rgba(0,0,0,0.05), 0 3px 12px rgba(0,0,0,0.04)' }}>
      <div style={{ padding: '14px 18px', borderBottom: '1px solid #F0EEF5', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 26, height: 26, borderRadius: 7, background: '#EDE9FE', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {icono}
          </div>
          <span style={{ fontSize: 13, fontWeight: 800, color: '#130F1E', letterSpacing: '-0.2px' }}>{titulo}</span>
        </div>
        {editando ? (
          <div style={{ display: 'flex', gap: 6 }}>
            <BtnAccion onClick={onCancelar} disabled={guardando} variante="secondary">Cancelar</BtnAccion>
            <BtnAccion onClick={onGuardar} disabled={guardando} variante="primary">{guardando ? 'Guardando…' : 'Guardar'}</BtnAccion>
          </div>
        ) : (
          <BtnEditar onClick={onEditar} />
        )}
      </div>
      <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 0 }}>
        {children}
      </div>
    </div>
  )
}

function Fila({ label, value }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
        <span style={estilos.label}>{label}</span>
        <span style={estilos.valor}>{value}</span>
      </div>
      <div style={estilos.divider} />
    </>
  )
}

function Campo({ label, name, type = 'text', value, onChange }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9490A0' }}>{label}</span>
      <input name={name} type={type} value={value} onChange={onChange} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #E2E0E8', background: '#F8F7FB', fontFamily: 'inherit', fontSize: 12.5, color: '#130F1E', outline: 'none' }} />
    </div>
  )
}

function CampoSelect({ label, name, value, onChange, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: '#9490A0' }}>{label}</span>
      <select name={name} value={value} onChange={onChange} style={{ height: 34, padding: '0 10px', borderRadius: 8, border: '1.5px solid #E2E0E8', background: '#F8F7FB', fontFamily: 'inherit', fontSize: 12.5, color: '#130F1E' }}>
        {children}
      </select>
    </div>
  )
}

function BtnEditar({ onClick }) {
  const [hover, setHover] = useState(false)
  return (
    <button type="button" onClick={onClick} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 7, border: hover ? '1.5px solid #C4B5FD' : '1.5px solid #E2E0E8', background: hover ? '#F5F3FF' : 'transparent', cursor: 'pointer', color: '#7C3AED', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, transition: 'all 0.15s' }}>
      <svg viewBox="0 0 10 10" width="9" height="9" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"><path d="M7 1a1.4 1.4 0 0 1 2 2L2.5 9.5 0 10l.5-2.5L7 1z" /></svg>
      Editar
    </button>
  )
}

function BtnAccion({ onClick, disabled, variante, children }) {
  const [hover, setHover] = useState(false)
  const base = variante === 'primary'
    ? { background: hover ? 'linear-gradient(135deg,#6D28D9,#7C3AED)' : 'linear-gradient(135deg,#7C3AED,#9333EA)', color: '#fff', border: 'none', boxShadow: hover ? '0 3px 12px rgba(124,58,237,0.42)' : '0 2px 8px rgba(124,58,237,0.28)' }
    : { background: hover ? '#F5F3FF' : '#fff', color: hover ? '#7C3AED' : '#5B4E70', border: hover ? '1.5px solid #C4B5FD' : '1.5px solid #E2E0E8' }
  return (
    <button type="button" onClick={onClick} disabled={disabled} onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      style={{ padding: '5px 12px', borderRadius: 7, cursor: disabled ? 'not-allowed' : 'pointer', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 700, opacity: disabled ? 0.6 : 1, transition: 'all 0.15s', ...base }}>
      {children}
    </button>
  )
}

/* ── Iconos ── */
const IconPersona = () => <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"><circle cx="7" cy="5" r="2.5" /><path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" /></svg>
const IconDocumento = () => <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="1" width="10" height="12" rx="1.5" /><line x1="5" y1="5" x2="9" y2="5" /><line x1="5" y1="8" x2="9" y2="8" /></svg>
const IconUbicacion = () => <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M7 13S2.5 8.5 2.5 5.5a4.5 4.5 0 0 1 9 0C11.5 8.5 7 13 7 13z" /><circle cx="7" cy="5.5" r="1.5" /></svg>
const IconEmail = () => <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="12" height="8" rx="1.5" /><path d="M1 5l6 4 6-4" /></svg>
const IconLock = () => <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#7C3AED" strokeWidth="1.5" strokeLinecap="round"><rect x="2.5" y="6" width="9" height="7" rx="1.5" /><path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" /></svg>

const estilos = {
  label: { fontSize: 11.5, fontWeight: 600, color: '#9490A0' },
  valor: { fontSize: 13, fontWeight: 700, color: '#2D2638' },
  divider: { height: 1, background: '#F8F7FB', margin: '2px 0' },
}

export default MiPerfil
