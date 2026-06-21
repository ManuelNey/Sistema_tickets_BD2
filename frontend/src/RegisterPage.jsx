import { useState } from 'react'
import './RegisterPage.css'
import BallLogo from './assets/pelota.png'

const pasos = [
  { id: 1, nombre: 'Personal', icono: '◌' },
  { id: 2, nombre: 'Documento', icono: '▤' },
  { id: 3, nombre: 'Dirección', icono: '⌖' },
  { id: 4, nombre: 'Contacto', icono: '⌕' },
  { id: 5, nombre: 'Seguridad', icono: '♧' },
]

const datosIniciales = {
  nombre: '',
  apellido: '',
  fechaNacimiento: '',

  tipoDocumento: 'CI',
  numeroDocumento: '',
  paisDocumento: 'Uruguay',

  paisCasa: 'Uruguay',
  localidad: '',
  calle: '',
  numeroCasa: '',
  codigoPostal: '',

  mail: '',
  telefono: '',

  contrasena: '',
  confirmarContrasena: '',
}

function RegisterPage({ onVolverLogin }) {
  const [pasoActual, setPasoActual] = useState(1)
  const [datos, setDatos] = useState(datosIniciales)
  const [errores, setErrores] = useState({})
  const [errorApi, setErrorApi] = useState('')
  const [cargando, setCargando] = useState(false)

  const actualizarDato = (e) => {
    const { name, value } = e.target

    setDatos((datosActuales) => ({
      ...datosActuales,
      [name]: value,
    }))

    setErrores((erroresActuales) => ({
      ...erroresActuales,
      [name]: '',
    }))
  }

  const validarPaso = () => {
    const nuevosErrores = {}

    if (pasoActual === 1) {
      if (!datos.nombre.trim()) nuevosErrores.nombre = 'Requerido'
      if (!datos.apellido.trim()) nuevosErrores.apellido = 'Requerido'
      if (!datos.fechaNacimiento) nuevosErrores.fechaNacimiento = 'Requerido'
    }

    if (pasoActual === 2) {
      if (!datos.tipoDocumento) nuevosErrores.tipoDocumento = 'Requerido'
      if (!datos.numeroDocumento.trim()) {
        nuevosErrores.numeroDocumento = 'Requerido'
      }
      if (!datos.paisDocumento) nuevosErrores.paisDocumento = 'Requerido'
    }

    if (pasoActual === 3) {
      if (!datos.paisCasa) nuevosErrores.paisCasa = 'Requerido'
      if (!datos.localidad.trim()) nuevosErrores.localidad = 'Requerido'
      if (!datos.calle.trim()) nuevosErrores.calle = 'Requerido'
      if (!datos.numeroCasa.trim()) nuevosErrores.numeroCasa = 'Requerido'
    }

    if (pasoActual === 4) {
      if (!datos.mail.trim()) {
        nuevosErrores.mail = 'Requerido'
      } else if (!/\S+@\S+\.\S+/.test(datos.mail)) {
        nuevosErrores.mail = 'Ingresá un email válido'
      }

      if (!datos.telefono.trim()) {
        nuevosErrores.telefono = 'Requerido'
      }
    }

    if (pasoActual === 5) {
      if (!datos.contrasena) {
        nuevosErrores.contrasena = 'Requerido'
      } else if (datos.contrasena.length < 6) {
        nuevosErrores.contrasena = 'Mínimo 6 caracteres'
      }

      if (!datos.confirmarContrasena) {
        nuevosErrores.confirmarContrasena = 'Requerido'
      } else if (datos.contrasena !== datos.confirmarContrasena) {
        nuevosErrores.confirmarContrasena = 'Las contraseñas no coinciden'
      }
    }

    setErrores(nuevosErrores)

    return Object.keys(nuevosErrores).length === 0
  }

  const siguiente = () => {
    if (!validarPaso()) return

    setPasoActual((paso) => Math.min(paso + 1, 5))
  }

  const atras = () => {
    setErrorApi('')
    setErrores({})
    setPasoActual((paso) => Math.max(paso - 1, 1))
  }

  const registrarUsuario = async (e) => {
    e.preventDefault()

    if (!validarPaso()) return

    setCargando(true)
    setErrorApi('')

    const payload = {
      mail: datos.mail,
      nombre: datos.nombre,
      apellido: datos.apellido,
      tipoDocumento: datos.tipoDocumento,
      numeroDocumento: datos.numeroDocumento,
      paisDocumento: datos.paisDocumento,
      paisCasa: datos.paisCasa,
      localidad: datos.localidad,
      calle: datos.calle,
      numeroCasa: datos.numeroCasa,
      codigoPostal: datos.codigoPostal,
      telefono: datos.telefono,
      contrasena: datos.contrasena,
      fechaNacimiento: datos.fechaNacimiento || null,
    }

    try {
      const response = await fetch(
        'http://localhost:8080/api/Usuario/registro',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      )

      let respuesta = null

      try {
        respuesta = await response.json()
      } catch {
        respuesta = null
      }

      if (!response.ok) {
        throw new Error(
          respuesta?.message ||
            respuesta?.title ||
            'No se pudo crear la cuenta.'
        )
      }

      window.alert('Usuario registrado correctamente. Ahora podes iniciar sesion.')

      setDatos(datosIniciales)
      setErrores({})
      setPasoActual(1)
      onVolverLogin()
    } catch (error) {
      setErrorApi(
        error.message || 'Ocurrió un error al crear la cuenta.'
      )
    } finally {
      setCargando(false)
    }
  }

  const mostrarError = (campo) => {
    if (!errores[campo]) return null

    return (
      <small className="mensaje-error">
        {errores[campo]}
      </small>
    )
  }

  return (
    <main className="registro-page">
      <section className="registro-contenedor">
        <header className="registro-logo">
          <div className="logo-cuadro">
            <img
              src={BallLogo}
              alt="TicketMatch"
              className="ball-logo"
            />
          </div>

          <h1>TicketMatch</h1>
        </header>

        <form className="registro-card" onSubmit={registrarUsuario}>
          <nav className="pasos-registro">
            {pasos.map((paso) => {
              const activo = paso.id === pasoActual
              const completado = paso.id < pasoActual

              return (
                <button
                  type="button"
                  key={paso.id}
                  className={`paso ${
                    activo ? 'paso-activo' : ''
                  } ${completado ? 'paso-completado' : ''}`}
                  onClick={() => {
                    if (paso.id < pasoActual) {
                      setPasoActual(paso.id)
                      setErrores({})
                      setErrorApi('')
                    }
                  }}
                >
                  <span className="paso-icono">
                    {completado ? '✓' : paso.icono}
                  </span>

                  <span>{paso.nombre}</span>
                </button>
              )
            })}
          </nav>

          <div className="registro-body">
            {pasoActual === 1 && (
              <>
                <h2>Datos personales</h2>

                <div className="fila-doble">
                  <div className="campo">
                    <label>Nombre</label>
                    <input
                      name="nombre"
                      value={datos.nombre}
                      onChange={actualizarDato}
                      placeholder="Carlos"
                    />
                    {mostrarError('nombre')}
                  </div>

                  <div className="campo">
                    <label>Apellido</label>
                    <input
                      name="apellido"
                      value={datos.apellido}
                      onChange={actualizarDato}
                      placeholder="García"
                    />
                    {mostrarError('apellido')}
                  </div>
                </div>

                <div className="campo">
                  <label>Fecha de nacimiento</label>
                  <input
                    type="date"
                    name="fechaNacimiento"
                    value={datos.fechaNacimiento}
                    onChange={actualizarDato}
                  />
                  {mostrarError('fechaNacimiento')}
                </div>
              </>
            )}

            {pasoActual === 2 && (
              <>
                <h2>Documento de identidad</h2>

                <div className="campo">
                  <label>Tipo de documento</label>
                  <select
                    name="tipoDocumento"
                    value={datos.tipoDocumento}
                    onChange={actualizarDato}
                  >
                    <option value="CI">Cédula de identidad</option>
                    <option value="Pasaporte">Pasaporte</option>
                    <option value="DNI">DNI</option>
                  </select>
                  {mostrarError('tipoDocumento')}
                </div>

                <div className="campo">
                  <label>País emisor del documento</label>
                  <select
                    name="paisDocumento"
                    value={datos.paisDocumento}
                    onChange={actualizarDato}
                  >
                    <option value="Uruguay">Uruguay</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Chile">Chile</option>
                    <option value="Paraguay">Paraguay</option>
                  </select>
                  {mostrarError('paisDocumento')}
                </div>

                <div className="campo">
                  <label>Número de documento</label>
                  <input
                    name="numeroDocumento"
                    value={datos.numeroDocumento}
                    onChange={actualizarDato}
                    placeholder="12345678"
                  />
                  {mostrarError('numeroDocumento')}
                </div>
              </>
            )}

            {pasoActual === 3 && (
              <>
                <h2>Dirección</h2>

                <div className="campo">
                  <label>País de residencia</label>
                  <select
                    name="paisCasa"
                    value={datos.paisCasa}
                    onChange={actualizarDato}
                  >
                    <option value="Uruguay">Uruguay</option>
                    <option value="Argentina">Argentina</option>
                    <option value="Brasil">Brasil</option>
                    <option value="Chile">Chile</option>
                    <option value="Paraguay">Paraguay</option>
                  </select>
                  {mostrarError('paisCasa')}
                </div>

                <div className="campo">
                  <label>Localidad / Ciudad</label>
                  <input
                    name="localidad"
                    value={datos.localidad}
                    onChange={actualizarDato}
                    placeholder="Montevideo"
                  />
                  {mostrarError('localidad')}
                </div>

                <div className="fila-calle">
                  <div className="campo">
                    <label>Calle</label>
                    <input
                      name="calle"
                      value={datos.calle}
                      onChange={actualizarDato}
                      placeholder="Av. 18 de Julio"
                    />
                    {mostrarError('calle')}
                  </div>

                  <div className="campo">
                    <label>Número</label>
                    <input
                      name="numeroCasa"
                      value={datos.numeroCasa}
                      onChange={actualizarDato}
                      placeholder="1234"
                    />
                    {mostrarError('numeroCasa')}
                  </div>
                </div>

                <div className="campo">
                  <label>Código postal</label>
                  <input
                    name="codigoPostal"
                    value={datos.codigoPostal}
                    onChange={actualizarDato}
                    placeholder="11000"
                  />
                </div>
              </>
            )}

            {pasoActual === 4 && (
              <>
                <h2>Datos de contacto</h2>

                <div className="campo">
                  <label>Email</label>
                  <div className="input-icono">
                    <span>✉</span>
                    <input
                      type="email"
                      name="mail"
                      value={datos.mail}
                      onChange={actualizarDato}
                      placeholder="tu@email.com"
                    />
                  </div>
                  {mostrarError('mail')}
                </div>

                <div className="campo">
                  <label>Teléfono</label>
                  <div className="input-icono">
                    <span>☎</span>
                    <input
                      type="tel"
                      name="telefono"
                      value={datos.telefono}
                      onChange={actualizarDato}
                      placeholder="+598 99 123 456"
                    />
                  </div>
                  {mostrarError('telefono')}
                </div>
              </>
            )}

            {pasoActual === 5 && (
              <>
                <h2>Contraseña</h2>

                <div className="campo">
                  <label>Contraseña (mínimo 6 caracteres)</label>
                  <div className="input-icono">
                    <span>🔒</span>
                    <input
                      type="password"
                      name="contrasena"
                      value={datos.contrasena}
                      onChange={actualizarDato}
                      placeholder="••••••••"
                    />
                  </div>
                  {mostrarError('contrasena')}
                </div>

                <div className="campo">
                  <label>Confirmar contraseña</label>
                  <div className="input-icono">
                    <span>🔒</span>
                    <input
                      type="password"
                      name="confirmarContrasena"
                      value={datos.confirmarContrasena}
                      onChange={actualizarDato}
                      placeholder="••••••••"
                    />
                  </div>
                  {mostrarError('confirmarContrasena')}
                </div>

                {errorApi && (
                  <div className="error-api">
                    {errorApi}
                  </div>
                )}
              </>
            )}

            <div className="acciones-registro">
              {pasoActual === 1 ? (
                <button
                  type="button"
                  className="btn-atras"
                  onClick={onVolverLogin}
                >
                  ← Login
                </button>
              ) : (
                <button
                  type="button"
                  className="btn-atras"
                  onClick={atras}
                >
                  ← Atrás
                </button>
              )}

              {pasoActual < 5 ? (
                <button
                  type="button"
                  className="btn-principal"
                  onClick={siguiente}
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  type="submit"
                  className="btn-principal"
                  disabled={cargando}
                >
                  {cargando
                    ? 'Creando cuenta...'
                    : '✓ Crear cuenta'}
                </button>
              )}
            </div>
          </div>
        </form>

        <p className="texto-login">
          ¿Ya tenés cuenta?{' '}
          <button type="button" onClick={onVolverLogin}>
            Iniciá sesión
          </button>
        </p>
      </section>
    </main>
  )
}

export default RegisterPage
