import { useState } from 'react'
import './RegisterPage.css'
import soccerBall from './assets/pelota.png'

const PASOS = [
  { id: 1, key: 'personal',  nombre: 'Personal',  label: 'Datos personales'       },
  { id: 2, key: 'documento', nombre: 'Documento', label: 'Documento de identidad' },
  { id: 3, key: 'direccion', nombre: 'Dirección', label: 'Dirección'              },
  { id: 4, key: 'contacto',  nombre: 'Contacto',  label: 'Datos de contacto'      },
  { id: 5, key: 'seguridad', nombre: 'Seguridad', label: 'Contraseña'             },
]

const datosIniciales = {
  nombre: '', apellido: '', fechaNacimiento: '',
  tipoDocumento: 'CI', numeroDocumento: '', paisDocumento: 'Uruguay',
  paisCasa: 'Uruguay', localidad: '', calle: '', numeroCasa: '', codigoPostal: '',
  mail: '', telefono: '',
  contrasena: '', confirmarContrasena: '',
}

function RegisterPage({ onVolverLogin }) {
  const [pasoActual, setPasoActual] = useState(1)
  const [datos, setDatos]           = useState(datosIniciales)
  const [errores, setErrores]       = useState({})
  const [errorApi, setErrorApi]     = useState('')
  const [cargando, setCargando]     = useState(false)
  const [exitoModal, setExitoModal] = useState(false)

  const actualizarDato = (e) => {
    const { name, value } = e.target
    setDatos(d  => ({ ...d,  [name]: value }))
    setErrores(er => ({ ...er, [name]: '' }))
  }

  const validarPaso = () => {
    const err = {}
    if (pasoActual === 1) {
      if (!datos.nombre.trim())        err.nombre          = 'Requerido'
      if (!datos.apellido.trim())      err.apellido        = 'Requerido'
      if (!datos.fechaNacimiento)      err.fechaNacimiento = 'Requerido'
    }
    if (pasoActual === 2) {
      if (!datos.tipoDocumento)              err.tipoDocumento  = 'Requerido'
      if (!datos.numeroDocumento.trim())     err.numeroDocumento = 'Requerido'
      if (!datos.paisDocumento)              err.paisDocumento  = 'Requerido'
    }
    if (pasoActual === 3) {
      if (!datos.paisCasa)              err.paisCasa  = 'Requerido'
      if (!datos.localidad.trim())      err.localidad = 'Requerido'
      if (!datos.calle.trim())          err.calle     = 'Requerido'
      if (!datos.numeroCasa.trim())     err.numeroCasa = 'Requerido'
    }
    if (pasoActual === 4) {
      if (!datos.mail.trim())                        err.mail     = 'Requerido'
      else if (!/\S+@\S+\.\S+/.test(datos.mail))    err.mail     = 'Email inválido'
      if (!datos.telefono.trim())                    err.telefono = 'Requerido'
    }
    if (pasoActual === 5) {
      if (!datos.contrasena)                                        err.contrasena         = 'Requerido'
      else if (datos.contrasena.length < 6)                         err.contrasena         = 'Mínimo 6 caracteres'
      if (!datos.confirmarContrasena)                               err.confirmarContrasena = 'Requerido'
      else if (datos.contrasena !== datos.confirmarContrasena)      err.confirmarContrasena = 'Las contraseñas no coinciden'
    }
    setErrores(err)
    return Object.keys(err).length === 0
  }

  const siguiente = () => { if (validarPaso()) setPasoActual(p => Math.min(p + 1, 5)) }
  const atras     = () => { setErrorApi(''); setErrores({}); setPasoActual(p => Math.max(p - 1, 1)) }

  const registrarUsuario = async (e) => {
    e.preventDefault()
    if (!validarPaso()) return
    setCargando(true)
    setErrorApi('')
    const payload = {
      mail: datos.mail, nombre: datos.nombre, apellido: datos.apellido,
      tipoDocumento: datos.tipoDocumento, numeroDocumento: datos.numeroDocumento,
      paisDocumento: datos.paisDocumento, paisCasa: datos.paisCasa,
      localidad: datos.localidad, calle: datos.calle, numeroCasa: datos.numeroCasa,
      codigoPostal: datos.codigoPostal, telefono: datos.telefono,
      contrasena: datos.contrasena, fechaNacimiento: datos.fechaNacimiento || null,
    }
    try {
      const res = await fetch('http://localhost:8080/api/Usuario/registro', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      let resp = null
      try { resp = await res.json() } catch { resp = null }
      if (!res.ok) throw new Error(resp?.message || resp?.title || 'No se pudo crear la cuenta.')
      setDatos(datosIniciales)
      setErrores({})
      setPasoActual(1)
      setExitoModal(true)
    } catch (err) {
      setErrorApi(err.message || 'Ocurrió un error al crear la cuenta.')
    } finally {
      setCargando(false)
    }
  }

  const campoErr = (name) => errores[name]
    ? <small className="reg-field-error">{errores[name]}</small>
    : null

  return (
    <>
    {exitoModal && (
      <div className="reg-modal-overlay">
        <div className="reg-modal">
          <div className="reg-modal-icon">
            <svg viewBox="0 0 20 20" width="28" height="28" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 10 8 15 17 5" />
            </svg>
          </div>
          <h2 className="reg-modal-title">¡Cuenta creada!</h2>
          <p className="reg-modal-sub">Tu cuenta fue registrada correctamente. Ya podés iniciar sesión.</p>
          <button className="reg-modal-btn" type="button" onClick={onVolverLogin}>
            Ir al login
          </button>
        </div>
      </div>
    )}
    <div className="auth-shell">

      {/* ── Panel de marca ── */}
      <div className="auth-brand auth-brand--reg">
        <div className="auth-blob auth-blob--1" />
        <div className="auth-blob auth-blob--2" />
        <div className="auth-grid-bg" />
        <div className="auth-brand-content">
          <div className="auth-logo-box">
            <img src={soccerBall} alt="TicketMatch" className="auth-logo-img" />
          </div>
          <div className="auth-brand-title">TicketMatch</div>
          <div className="auth-brand-sub">
            Creá tu cuenta y empezá a comprar entradas para el Mundial FIFA 2026.
          </div>
          <div className="auth-fifa-badge">
            <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#A78BFA" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
              <circle cx="7" cy="7" r="5.5" /><path d="M7 3.5v3l2 2" />
            </svg>
            Copa Mundial FIFA 2026
          </div>

          {/* Resumen de pasos */}
          <div className="reg-steps-summary">
            {PASOS.map((p, i) => {
              const done   = i + 1 < pasoActual
              const active = i + 1 === pasoActual
              return (
                <div key={p.id} className={`reg-summary-item${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
                  <div className="reg-summary-dot">
                    {done
                      ? <svg viewBox="0 0 10 8" width="9" height="7" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 4 3.5 7 9 1" /></svg>
                      : <span>{p.id}</span>
                    }
                  </div>
                  <span className="reg-summary-label">{p.label}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Panel de formulario ── */}
      <div className="auth-form-panel reg-form-panel">
        <div className="reg-form-inner">

          <div className="auth-form-header" style={{ marginBottom: 24 }}>
            <div className="auth-form-title" style={{ fontSize: 22, letterSpacing: '-0.5px' }}>Crear cuenta</div>
            <div className="auth-form-sub" style={{ fontSize: 13 }}>Paso {pasoActual} de 5 — {PASOS[pasoActual - 1].label}</div>
          </div>

          {/* Stepper tabs */}
          <div className="reg-stepper">
            {PASOS.map((p, i) => {
              const done   = i + 1 < pasoActual
              const active = i + 1 === pasoActual
              return (
                <div key={p.id} className={`reg-stepper-tab${active ? ' is-active' : ''}${done ? ' is-done' : ''}`}>
                  <StepIcon stepKey={p.key} done={done} active={active} />
                  <span>{p.nombre}</span>
                </div>
              )
            })}
          </div>

          {/* Tarjeta del paso */}
          <form onSubmit={registrarUsuario}>
            <div className="reg-step-card">

              {pasoActual === 1 && (
                <>
                  <div className="reg-step-title">Datos personales</div>
                  <div className="reg-grid-2">
                    <div className="reg-field">
                      <label className="reg-label">Nombre</label>
                      <input className="reg-input" name="nombre" value={datos.nombre} onChange={actualizarDato} placeholder="Carlos" />
                      {campoErr('nombre')}
                    </div>
                    <div className="reg-field">
                      <label className="reg-label">Apellido</label>
                      <input className="reg-input" name="apellido" value={datos.apellido} onChange={actualizarDato} placeholder="García" />
                      {campoErr('apellido')}
                    </div>
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Fecha de nacimiento</label>
                    <input className="reg-input" type="date" name="fechaNacimiento" value={datos.fechaNacimiento} onChange={actualizarDato} />
                    {campoErr('fechaNacimiento')}
                  </div>
                </>
              )}

              {pasoActual === 2 && (
                <>
                  <div className="reg-step-title">Documento de identidad</div>
                  <div className="reg-field">
                    <label className="reg-label">Tipo de documento</label>
                    <select className="reg-select" name="tipoDocumento" value={datos.tipoDocumento} onChange={actualizarDato}>
                      <option value="CI">Cédula de identidad</option>
                      <option value="Pasaporte">Pasaporte</option>
                      <option value="DNI">DNI</option>
                      <option value="Licencia">Licencia de conducir</option>
                    </select>
                    {campoErr('tipoDocumento')}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">País emisor del documento</label>
                    <select className="reg-select" name="paisDocumento" value={datos.paisDocumento} onChange={actualizarDato}>
                      <option>Uruguay</option><option>Argentina</option><option>Brasil</option>
                      <option>Chile</option><option>Paraguay</option><option>México</option><option>Colombia</option><option>Perú</option>
                    </select>
                    {campoErr('paisDocumento')}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Número de documento</label>
                    <input className="reg-input" name="numeroDocumento" value={datos.numeroDocumento} onChange={actualizarDato} placeholder="12345678" />
                    {campoErr('numeroDocumento')}
                  </div>
                </>
              )}

              {pasoActual === 3 && (
                <>
                  <div className="reg-step-title">Dirección</div>
                  <div className="reg-field">
                    <label className="reg-label">País de residencia</label>
                    <select className="reg-select" name="paisCasa" value={datos.paisCasa} onChange={actualizarDato}>
                      <option>Uruguay</option><option>Argentina</option><option>Brasil</option>
                      <option>Chile</option><option>Paraguay</option><option>México</option>
                    </select>
                    {campoErr('paisCasa')}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Localidad / Ciudad</label>
                    <input className="reg-input" name="localidad" value={datos.localidad} onChange={actualizarDato} placeholder="Montevideo" />
                    {campoErr('localidad')}
                  </div>
                  <div className="reg-grid-calle">
                    <div className="reg-field">
                      <label className="reg-label">Calle</label>
                      <input className="reg-input" name="calle" value={datos.calle} onChange={actualizarDato} placeholder="Av. 18 de Julio" />
                      {campoErr('calle')}
                    </div>
                    <div className="reg-field">
                      <label className="reg-label">Número</label>
                      <input className="reg-input" name="numeroCasa" value={datos.numeroCasa} onChange={actualizarDato} placeholder="1234" />
                      {campoErr('numeroCasa')}
                    </div>
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Código postal</label>
                    <input className="reg-input" name="codigoPostal" value={datos.codigoPostal} onChange={actualizarDato} placeholder="11100" />
                  </div>
                </>
              )}

              {pasoActual === 4 && (
                <>
                  <div className="reg-step-title">Datos de contacto</div>
                  <div className="reg-field">
                    <label className="reg-label">Email</label>
                    <div className="reg-input-icon-wrap">
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                        <rect x="1" y="3" width="12" height="8" rx="1.5" /><path d="M1 5l6 4 6-4" />
                      </svg>
                      <input type="email" className="reg-input-bare" name="mail" value={datos.mail} onChange={actualizarDato} placeholder="usuario@mail.com" />
                    </div>
                    {campoErr('mail')}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Teléfono</label>
                    <div className="reg-input-icon-wrap">
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ flex: 'none' }} aria-hidden="true">
                        <path d="M2.5 1.5h3l1.5 3.5-2 1.5a9.5 9.5 0 0 0 3 3l1.5-2 3.5 1.5v3C12 12.5 1.5 11 1.5 2.5l1-1z" />
                      </svg>
                      <input type="tel" className="reg-input-bare" name="telefono" value={datos.telefono} onChange={actualizarDato} placeholder="+598 99 123 456" />
                    </div>
                    {campoErr('telefono')}
                  </div>
                </>
              )}

              {pasoActual === 5 && (
                <>
                  <div className="reg-step-title">Contraseña</div>
                  <div className="reg-field">
                    <label className="reg-label">
                      Contraseña <span className="reg-label-hint">(mínimo 6 caracteres)</span>
                    </label>
                    <div className="reg-input-icon-wrap">
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
                        <rect x="3" y="6" width="8" height="7" rx="1" /><path d="M5 6V4.5a2 2 0 0 1 4 0V6" />
                      </svg>
                      <input type="password" className="reg-input-bare" name="contrasena" value={datos.contrasena} onChange={actualizarDato} placeholder="••••••••" />
                    </div>
                    {campoErr('contrasena')}
                  </div>
                  <div className="reg-field">
                    <label className="reg-label">Confirmar contraseña</label>
                    <div className="reg-input-icon-wrap">
                      <svg viewBox="0 0 14 14" width="14" height="14" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
                        <rect x="3" y="6" width="8" height="7" rx="1" /><path d="M5 6V4.5a2 2 0 0 1 4 0V6" />
                      </svg>
                      <input type="password" className="reg-input-bare" name="confirmarContrasena" value={datos.confirmarContrasena} onChange={actualizarDato} placeholder="••••••••" />
                    </div>
                    {campoErr('confirmarContrasena')}
                  </div>
                  {errorApi && (
                    <div className="auth-error" style={{ marginTop: 8 }}>
                      <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" style={{ flex: 'none' }} aria-hidden="true">
                        <circle cx="7" cy="7" r="5.5" /><line x1="7" y1="4.5" x2="7" y2="7.5" /><circle cx="7" cy="9.5" r="0.6" fill="#EF4444" />
                      </svg>
                      {errorApi}
                    </div>
                  )}
                </>
              )}

              {/* Navegación */}
              <div className="reg-nav">
                <button type="button" className="reg-btn-back" onClick={pasoActual === 1 ? onVolverLogin : atras}>
                  {pasoActual === 1 ? '← Login' : '← Atrás'}
                </button>
                {pasoActual < 5
                  ? <button type="button" className="reg-btn-next" onClick={siguiente}>Siguiente →</button>
                  : <button type="submit" className="reg-btn-next" disabled={cargando}>{cargando ? 'Creando cuenta...' : '✓ Crear cuenta'}</button>
                }
              </div>
            </div>
          </form>

          <div className="auth-switch" style={{ marginTop: 20, fontSize: 13 }}>
            ¿Ya tenés cuenta?{' '}
            <button type="button" className="auth-switch-link" onClick={onVolverLogin}>Iniciá sesión</button>
          </div>

        </div>
      </div>

    </div>
    </>
  )
}

function StepIcon({ stepKey, done, active }) {
  const color = done ? '#22C55E' : active ? '#7C3AED' : '#B0ACBA'
  if (done) return (
    <svg viewBox="0 0 14 14" width="15" height="15" fill="none" stroke="#22C55E" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="1 7 5 11 13 3" /></svg>
  )
  if (stepKey === 'personal') return (
    <svg viewBox="0 0 14 14" width="15" height="15" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><circle cx="7" cy="5" r="2.5" /><path d="M2 12c0-2.8 2.2-5 5-5s5 2.2 5 5" /></svg>
  )
  if (stepKey === 'documento') return (
    <svg viewBox="0 0 14 14" width="15" height="15" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="2" y="1" width="10" height="12" rx="1.5" /><line x1="5" y1="5" x2="9" y2="5" /><line x1="5" y1="8" x2="9" y2="8" /></svg>
  )
  if (stepKey === 'direccion') return (
    <svg viewBox="0 0 14 14" width="15" height="15" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 13S2.5 8.5 2.5 5.5a4.5 4.5 0 0 1 9 0C11.5 8.5 7 13 7 13z" /><circle cx="7" cy="5.5" r="1.5" /></svg>
  )
  if (stepKey === 'contacto') return (
    <svg viewBox="0 0 14 14" width="15" height="15" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="1" y="3" width="12" height="8" rx="1.5" /><path d="M1 5l6 4 6-4" /></svg>
  )
  return (
    <svg viewBox="0 0 14 14" width="15" height="15" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" aria-hidden="true"><rect x="3" y="6" width="8" height="7" rx="1" /><path d="M5 6V4.5a2 2 0 0 1 4 0V6" /></svg>
  )
}

export default RegisterPage
