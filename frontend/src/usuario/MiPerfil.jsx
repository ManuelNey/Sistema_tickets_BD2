import { useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'
import './MiPerfil.css'

const API_URL = 'http://localhost:8080/api/usuario'

function MiPerfil({ user }) {
  const [perfil, setPerfil] = useState(() => user || {})
  const [editandoSeccion, setEditandoSeccion] = useState(null)

  const [telefonos, setTelefonos] = useState(() => user?.telefonos || [])
  const [nuevoTelefono, setNuevoTelefono] = useState('')

  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')
  const [mensajeExito, setMensajeExito] = useState('')

  const estaEditando = (seccion) => editandoSeccion === seccion

  const nombreCompleto =
    `${perfil?.nombre || ''} ${perfil?.apellido || ''}`.trim()

  const iniciales =
    `${perfil?.nombre?.[0] || ''}${perfil?.apellido?.[0] || ''}`

  const fechaNacimiento = perfil?.fechaNacimiento
    ? new Date(`${perfil.fechaNacimiento}T00:00:00`).toLocaleDateString(
      'es-UY',
      {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }
    )
    : 'No registrada'

  const fechaRegistro = perfil?.fechaRegistro
    ? new Date(perfil.fechaRegistro).toLocaleDateString('es-UY', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
    : 'No registrada'

  const actualizarCampo = (event) => {
    const { name, value } = event.target

    setPerfil((perfilActual) => ({
      ...perfilActual,
      [name]: value,
    }))
  }

  const abrirEdicion = (seccion) => {
    setError('')
    setMensajeExito('')
    setEditandoSeccion(seccion)
  }

  const agregarTelefono = () => {
    const telefonoLimpio = nuevoTelefono.trim()

    if (!telefonoLimpio || telefonos.includes(telefonoLimpio)) {
      return
    }

    setTelefonos((telefonosActuales) => [
      ...telefonosActuales,
      telefonoLimpio,
    ])

    setNuevoTelefono('')
  }

  const eliminarTelefono = (telefonoAEliminar) => {
    setTelefonos((telefonosActuales) =>
      telefonosActuales.filter(
        (telefono) => telefono !== telefonoAEliminar
      )
    )
  }

  const cancelarCambios = () => {
    setPerfil(user || {})
    setTelefonos(user?.telefonos || [])
    setNuevoTelefono('')
    setError('')
    setMensajeExito('')
    setEditandoSeccion(null)
  }

  const guardarCambios = async () => {
    if (!perfil?.mail) {
      setError('No se encontró el correo del usuario.')
      return
    }

    setGuardando(true)
    setError('')
    setMensajeExito('')

    try {
      const token = localStorage.getItem('ticketmatch-token')

      const response = await fetch(
        `${API_URL}/perfil/${encodeURIComponent(perfil.mail)}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            nombre: perfil.nombre || '',
            apellido: perfil.apellido || '',
            fechaNacimiento: perfil.fechaNacimiento || null,
            tipoDocumento: perfil.tipoDocumento || '',
            numeroDocumento: perfil.numeroDocumento || '',
            paisDocumento: perfil.paisDocumento || '',
            paisCasa: perfil.paisCasa || '',
            localidad: perfil.localidad || '',
            calle: perfil.calle || '',
            numeroCasa: perfil.numeroCasa || '',
            codigoPostal: perfil.codigoPostal || '',
            telefonos,
          }),
        }
      )

      if (!response.ok) {
        const responseText = await response.text()

        throw new Error(
          responseText || 'No se pudieron guardar los cambios.'
        )
      }

      setMensajeExito(
        'Cambios guardados correctamente. Se verán al volver a iniciar sesión.'
      )

      setEditandoSeccion(null)
    } catch (errorGuardado) {
      setError(
        errorGuardado.message ||
        'Ocurrió un error al guardar los cambios.'
      )
    } finally {
      setGuardando(false)
    }
  }

  return (
    <section className="perfil-page">
      <header className="perfil-header">
        <div className="perfil-avatar">
          {iniciales || 'U'}
        </div>

        <div className="perfil-user-info">
          <h1>{nombreCompleto || 'Usuario'}</h1>

          <p>
            <SidebarIcon name="mail" />
            {perfil?.mail || 'usuario@ticketmatch.com'}

            <span className="perfil-verificacion">
              {perfil?.identidadVerificada
                ? '✓ Identidad verificada'
                : '◌ Sin verificar'}
            </span>
          </p>

          <small>Miembro desde {fechaRegistro}</small>
        </div>
      </header>

      {error && (
        <div className="perfil-alert perfil-alert-error">
          {error}
        </div>
      )}

      {mensajeExito && (
        <div className="perfil-alert perfil-alert-success">
          {mensajeExito}
        </div>
      )}

      <EditableCard
        icon="user"
        title="Datos personales"
        editando={estaEditando('personal')}
        guardando={guardando}
        onEditar={() => abrirEdicion('personal')}
        onGuardar={guardarCambios}
        onCancelar={cancelarCambios}
      >
        {estaEditando('personal') ? (
          <div className="perfil-form-grid">
            <ProfileInput
              label="Nombre"
              name="nombre"
              value={perfil?.nombre || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Apellido"
              name="apellido"
              value={perfil?.apellido || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Fecha de nacimiento"
              name="fechaNacimiento"
              type="date"
              value={perfil?.fechaNacimiento || ''}
              onChange={actualizarCampo}
            />
          </div>
        ) : (
          <>
            <InfoRow label="Nombre" value={perfil?.nombre || '-'} />
            <InfoRow label="Apellido" value={perfil?.apellido || '-'} />
            <InfoRow label="Fecha de nacimiento" value={fechaNacimiento} />
          </>
        )}
      </EditableCard>

      <EditableCard
        icon="document"
        title="Documento de identidad"
        editando={estaEditando('documento')}
        guardando={guardando}
        onEditar={() => abrirEdicion('documento')}
        onGuardar={guardarCambios}
        onCancelar={cancelarCambios}
      >
        {estaEditando('documento') ? (
          <div className="perfil-form-grid">
            <ProfileSelect
              label="Tipo de documento"
              name="tipoDocumento"
              value={perfil?.tipoDocumento || 'CI'}
              onChange={actualizarCampo}
            >
              <option value="CI">Cédula de identidad</option>
              <option value="Pasaporte">Pasaporte</option>
              <option value="DNI">DNI</option>
            </ProfileSelect>

            <ProfileInput
              label="País emisor"
              name="paisDocumento"
              value={perfil?.paisDocumento || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Número de documento"
              name="numeroDocumento"
              value={perfil?.numeroDocumento || ''}
              onChange={actualizarCampo}
            />
          </div>
        ) : (
          <>
            <InfoRow label="Tipo" value={perfil?.tipoDocumento || '-'} />
            <InfoRow
              label="País emisor"
              value={perfil?.paisDocumento || '-'}
            />
            <InfoRow
              label="Número"
              value={perfil?.numeroDocumento || '-'}
            />
          </>
        )}
      </EditableCard>

      <EditableCard
        icon="map"
        title="Dirección"
        editando={estaEditando('direccion')}
        guardando={guardando}
        onEditar={() => abrirEdicion('direccion')}
        onGuardar={guardarCambios}
        onCancelar={cancelarCambios}
      >
        {estaEditando('direccion') ? (
          <div className="perfil-form-grid">
            <ProfileInput
              label="País"
              name="paisCasa"
              value={perfil?.paisCasa || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Localidad"
              name="localidad"
              value={perfil?.localidad || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Calle"
              name="calle"
              value={perfil?.calle || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Número"
              name="numeroCasa"
              value={perfil?.numeroCasa || ''}
              onChange={actualizarCampo}
            />

            <ProfileInput
              label="Código postal"
              name="codigoPostal"
              value={perfil?.codigoPostal || ''}
              onChange={actualizarCampo}
            />
          </div>
        ) : (
          <>
            <InfoRow label="País" value={perfil?.paisCasa || '-'} />
            <InfoRow label="Localidad" value={perfil?.localidad || '-'} />

            <InfoRow
              label="Dirección"
              value={
                perfil?.calle
                  ? `${perfil.calle} ${perfil.numeroCasa || ''}`.trim()
                  : '-'
              }
            />

            <InfoRow
              label="Código postal"
              value={perfil?.codigoPostal || '-'}
            />
          </>
        )}
      </EditableCard>

      <section className="perfil-card">
        <header className="perfil-card-header">
          <div className="perfil-card-title">
            <SidebarIcon name="phone" />
            <h2>Contacto</h2>
          </div>

          {estaEditando('contacto') ? (
            <CardActions
              guardando={guardando}
              onGuardar={guardarCambios}
              onCancelar={cancelarCambios}
            />
          ) : (
            <button
              type="button"
              className="editar-perfil"
              onClick={() => abrirEdicion('contacto')}
            >
              ✎ Editar
            </button>
          )}
        </header>

        <div className="perfil-card-content">
          <p className="perfil-help-text">
            El email no se puede cambiar
          </p>

          <div className="perfil-email">
            <SidebarIcon name="mail" />
            <span>{perfil?.mail || '-'}</span>
          </div>

          <div className="perfil-telefonos">
            {telefonos.length > 0 ? (
              telefonos.map((telefono, indice) => (
                <div
                  className="perfil-telefono-item"
                  key={`${telefono}-${indice}`}
                >
                  <span>{telefono}</span>

                  {estaEditando('contacto') && (
                    <button
                      type="button"
                      className="eliminar-telefono"
                      onClick={() => eliminarTelefono(telefono)}
                      disabled={guardando}
                      aria-label={`Eliminar teléfono ${telefono}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))
            ) : (
              <div className="perfil-telefono">
                No hay teléfonos registrados
              </div>
            )}
          </div>

          {estaEditando('contacto') && (
            <div className="agregar-telefono-container">
              <input
                className="telefono-input"
                type="tel"
                value={nuevoTelefono}
                disabled={guardando}
                onChange={(event) =>
                  setNuevoTelefono(event.target.value)
                }
                placeholder="+598 99 123 456"
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    agregarTelefono()
                  }
                }}
              />

              <button
                type="button"
                className="agregar-telefono"
                onClick={agregarTelefono}
                disabled={guardando}
              >
                + Agregar
              </button>
            </div>
          )}
        </div>
      </section>
    </section>
  )
}

function EditableCard({
  icon,
  title,
  editando,
  guardando,
  onEditar,
  onGuardar,
  onCancelar,
  children,
}) {
  return (
    <section className="perfil-card">
      <header className="perfil-card-header">
        <div className="perfil-card-title">
          <SidebarIcon name={icon} />
          <h2>{title}</h2>
        </div>

        {editando ? (
          <CardActions
            guardando={guardando}
            onGuardar={onGuardar}
            onCancelar={onCancelar}
          />
        ) : (
          <button
            type="button"
            className="editar-perfil"
            onClick={onEditar}
          >
            ✎ Editar
          </button>
        )}
      </header>

      <div className="perfil-card-content">
        {children}
      </div>
    </section>
  )
}

function CardActions({ guardando, onGuardar, onCancelar }) {
  return (
    <div className="perfil-actions">
      <button
        type="button"
        className="guardar-contacto"
        onClick={onGuardar}
        disabled={guardando}
      >
        {guardando ? 'Guardando...' : '✓ Guardar'}
      </button>

      <button
        type="button"
        className="cancelar-contacto"
        onClick={onCancelar}
        disabled={guardando}
      >
        ✕ Cancelar
      </button>
    </div>
  )
}

function ProfileInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
}) {
  return (
    <label className="perfil-edit-field">
      <span>{label}</span>

      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
      />
    </label>
  )
}

function ProfileSelect({
  label,
  name,
  value,
  onChange,
  children,
}) {
  return (
    <label className="perfil-edit-field">
      <span>{label}</span>

      <select
        name={name}
        value={value}
        onChange={onChange}
      >
        {children}
      </select>
    </label>
  )
}

function InfoRow({ label, value }) {
  return (
    <div className="perfil-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  )
}

export default MiPerfil