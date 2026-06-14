import { useEffect, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'

const emptyDeviceForm = {
  numero: '',
  descripcion: '',
}

const emptyEditDeviceForm = {
  descripcion: '',
  estado: 'habilitado',
  funcionarios: [],
  funcionarioSeleccionado: '',
}

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('ticketmatch-token')

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  }
}

function DispositivosAdmin() {
  const [devices, setDevices] = useState([])
  const [devicesError, setDevicesError] = useState('')
  const [devicesLoading, setDevicesLoading] = useState(false)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [deviceForm, setDeviceForm] = useState(emptyDeviceForm)
  const [deviceFormError, setDeviceFormError] = useState('')
  const [deviceSaving, setDeviceSaving] = useState(false)
  const [editDeviceModalOpen, setEditDeviceModalOpen] = useState(false)
  const [selectedDevice, setSelectedDevice] = useState(null)
  const [editDeviceForm, setEditDeviceForm] = useState(emptyEditDeviceForm)
  const [editDeviceError, setEditDeviceError] = useState('')
  const [editDeviceSaving, setEditDeviceSaving] = useState(false)
  const [funcionarios, setFuncionarios] = useState([])
  const [funcionariosLoading, setFuncionariosLoading] = useState(false)
  const [deviceToDelete, setDeviceToDelete] = useState(null)
  const [deviceDeleteSaving, setDeviceDeleteSaving] = useState(false)

  const loadDevices = async () => {
    setDevicesError('')
    setDevicesLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/Dispositivo', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Devices request failed')
      }

      const data = await response.json()
      setDevices(groupDevicesByNumber(data))
    } catch {
      setDevicesError('No se pudieron cargar los dispositivos')
    } finally {
      setDevicesLoading(false)
    }
  }

  useEffect(() => {
    Promise.resolve().then(loadDevices)
  }, [])

  const openCreateDevice = () => {
    setDeviceForm(emptyDeviceForm)
    setDeviceFormError('')
    setDeviceModalOpen(true)
  }

  const closeCreateDevice = () => {
    setDeviceModalOpen(false)
    setDeviceForm(emptyDeviceForm)
    setDeviceFormError('')
    setDeviceSaving(false)
  }

  const updateDeviceField = (field, value) => {
    const nextValue = field === 'numero' ? value.replace(/\D/g, '').slice(0, 4) : value
    setDeviceForm((current) => ({ ...current, [field]: nextValue }))
  }

  const submitDevice = async (event) => {
    event.preventDefault()
    setDeviceFormError('')

    if (!/^\d{4}$/.test(deviceForm.numero)) {
      setDeviceFormError('El numero debe tener exactamente 4 digitos')
      return
    }

    setDeviceSaving(true)

    const payload = {
      numeroDispositivo: `QR${deviceForm.numero}`,
      descripcion: deviceForm.descripcion,
    }

    try {
      const response = await fetch('http://localhost:8080/api/Dispositivo/registro', {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Create device failed')
      }

      await loadDevices()
      closeCreateDevice()
    } catch {
      setDeviceFormError('No se pudo crear el dispositivo')
    } finally {
      setDeviceSaving(false)
    }
  }

  const loadFuncionarios = async () => {
    setFuncionariosLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/Funcionarios/admin', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Funcionarios request failed')
      }

      const data = await response.json()
      setFuncionarios(data)
    } catch {
      setEditDeviceError('No se pudieron cargar los funcionarios')
      setFuncionarios([])
    } finally {
      setFuncionariosLoading(false)
    }
  }

  const openEditDevice = (device) => {
    setSelectedDevice(device)
    setEditDeviceForm({
      descripcion: device.descripcion,
      estado: normalizeDeviceStatus(device.estado),
      funcionarios: [...device.funcionarios],
      funcionarioSeleccionado: '',
    })
    setEditDeviceError('')
    setEditDeviceModalOpen(true)
    loadFuncionarios()
  }

  const closeEditDevice = () => {
    setEditDeviceModalOpen(false)
    setSelectedDevice(null)
    setEditDeviceForm(emptyEditDeviceForm)
    setEditDeviceError('')
    setEditDeviceSaving(false)
    setFuncionarios([])
    setFuncionariosLoading(false)
  }

  const updateEditDeviceField = (field, value) => {
    setEditDeviceForm((current) => ({ ...current, [field]: value }))
  }

  const addFuncionarioToDevice = (mail) => {
    if (!mail) {
      return
    }

    setEditDeviceForm((current) => {
      if (current.funcionarios.includes(mail)) {
        return { ...current, funcionarioSeleccionado: '' }
      }

      return {
        ...current,
        funcionarioSeleccionado: '',
        funcionarios: [...current.funcionarios, mail],
      }
    })
  }

  const removeFuncionarioFromDevice = (mail) => {
    setEditDeviceForm((current) => ({
      ...current,
      funcionarios: current.funcionarios.filter((funcionarioMail) => funcionarioMail !== mail),
    }))
  }

  const submitEditDevice = async (event) => {
    event.preventDefault()

    if (!selectedDevice) {
      return
    }

    setEditDeviceError('')
    setEditDeviceSaving(true)

    const payload = {
      descripcion: editDeviceForm.descripcion,
      estado: editDeviceForm.estado,
      funcionarios: editDeviceForm.funcionarios,
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/Dispositivo/${encodeURIComponent(selectedDevice.numeroDispositivo)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Update device failed')
      }

      await loadDevices()
      closeEditDevice()
    } catch {
      setEditDeviceError('No se pudo modificar el dispositivo')
    } finally {
      setEditDeviceSaving(false)
    }
  }

  const toggleDeviceStatus = async (device) => {
    setDevicesError('')

    const payload = {
      descripcion: device.descripcion,
      estado: isDeviceEnabled(device.estado) ? 'deshabilitado' : 'habilitado',
      funcionarios: device.funcionarios,
    }

    try {
      const response = await fetch(
        `http://localhost:8080/api/Dispositivo/${encodeURIComponent(device.numeroDispositivo)}`,
        {
          method: 'PUT',
          headers: getAuthHeaders({
            'Content-Type': 'application/json',
          }),
          body: JSON.stringify(payload),
        }
      )

      if (!response.ok) {
        throw new Error('Toggle device status failed')
      }

      await loadDevices()
    } catch {
      setDevicesError('No se pudo cambiar el estado del dispositivo')
    }
  }

  const openDeleteDevice = (device) => {
    setDevicesError('')
    setDeviceToDelete(device)
  }

  const closeDeleteDevice = () => {
    setDeviceToDelete(null)
    setDeviceDeleteSaving(false)
  }

  const confirmDeleteDevice = async () => {
    if (!deviceToDelete) {
      return
    }

    setDevicesError('')
    setDeviceDeleteSaving(true)

    try {
      const response = await fetch(
        `http://localhost:8080/api/Dispositivo/${encodeURIComponent(deviceToDelete.numeroDispositivo)}`,
        {
          method: 'DELETE',
          headers: getAuthHeaders(),
        }
      )

      if (!response.ok) {
        throw new Error('Delete device failed')
      }

      await loadDevices()
      closeDeleteDevice()
    } catch {
      setDevicesError('No se pudo eliminar el dispositivo')
    } finally {
      setDeviceDeleteSaving(false)
    }
  }

  return (
    <div className="admin-view">
      <header className="admin-header">
        <div>
          <h1 id="dashboard-title">Gestion de Dispositivos</h1>
          <p>Administra los dispositivos y sus funcionarios asignados</p>
        </div>
        <button className="create-stadium-button" type="button" onClick={openCreateDevice}>
          <SidebarIcon name="plus" />
          <span>Nuevo Dispositivo</span>
        </button>
      </header>

      {devicesLoading && <p className="matches-status">Cargando dispositivos...</p>}
      {devicesError && <p className="matches-status is-error">{devicesError}</p>}

      {!devicesLoading && !devicesError && (
        <div className="device-grid">
          {devices.length === 0 ? (
            <p className="matches-status">No hay dispositivos disponibles.</p>
          ) : (
            devices.map((device) => (
              <DeviceCard
                device={device}
                key={device.numeroDispositivo}
                onDelete={() => openDeleteDevice(device)}
                onEdit={() => openEditDevice(device)}
                onToggleStatus={() => toggleDeviceStatus(device)}
              />
            ))
          )}
        </div>
      )}

      {deviceModalOpen && (
        <DeviceModal
          error={deviceFormError}
          form={deviceForm}
          isSaving={deviceSaving}
          onChange={updateDeviceField}
          onClose={closeCreateDevice}
          onSubmit={submitDevice}
        />
      )}

      {editDeviceModalOpen && selectedDevice && (
        <EditDeviceModal
          device={selectedDevice}
          error={editDeviceError}
          form={editDeviceForm}
          funcionarios={funcionarios}
          funcionariosLoading={funcionariosLoading}
          isSaving={editDeviceSaving}
          onAddFuncionario={addFuncionarioToDevice}
          onChange={updateEditDeviceField}
          onClose={closeEditDevice}
          onRemoveFuncionario={removeFuncionarioFromDevice}
          onSubmit={submitEditDevice}
        />
      )}

      {deviceToDelete && (
        <DeleteDeviceModal
          device={deviceToDelete}
          isDeleting={deviceDeleteSaving}
          onCancel={closeDeleteDevice}
          onConfirm={confirmDeleteDevice}
        />
      )}
    </div>
  )
}

function DeviceCard({ device, onDelete, onEdit, onToggleStatus }) {
  const isEnabled = isDeviceEnabled(device.estado)
  const funcionarios = device.funcionarios.length > 0 ? device.funcionarios : ['Sin funcionarios asignados']

  return (
    <article className={`device-card ${isEnabled ? 'is-enabled' : 'is-disabled'}`}>
      <header className="device-card-header">
        <div className={`device-icon ${isEnabled ? 'is-enabled' : 'is-disabled'}`} aria-hidden="true">
          <SidebarIcon name="device" />
        </div>
        <div>
          <h2>{device.descripcion || 'Dispositivo sin descripcion'}</h2>
          <p>{device.numeroDispositivo}</p>
        </div>
        <span className={`device-power ${isEnabled ? 'is-enabled' : 'is-disabled'}`}>
          <SidebarIcon name={isEnabled ? 'power' : 'powerOff'} />
        </span>
      </header>

      <div className="device-card-body">
        <p>
          <span>Numero</span>
          <strong>{device.numeroDispositivo}</strong>
        </p>

        <div className="device-workers">
          <span>Funcionarios asignados ({device.funcionarios.length})</span>
          <div>
            {funcionarios.map((funcionario) => (
              <small key={funcionario}>{funcionario}</small>
            ))}
          </div>
        </div>

        <span className={`device-status ${isEnabled ? 'is-enabled' : 'is-disabled'}`}>
          {isEnabled ? 'Activo' : 'Inactivo'}
        </span>
      </div>

      <footer className="device-actions">
        <button
          className={`device-toggle-button ${isEnabled ? 'is-disable-action' : 'is-enable-action'}`}
          type="button"
          onClick={onToggleStatus}
        >
          <SidebarIcon name={isEnabled ? 'powerOff' : 'power'} />
          <span>{isEnabled ? 'Desactivar' : 'Activar'}</span>
        </button>
        <div className="device-secondary-actions">
          <button className="details-button" type="button" onClick={onEdit}>
            <SidebarIcon name="edit" />
            <span>Modificar</span>
          </button>
          <button className="delete-button" type="button" aria-label="Borrar dispositivo" onClick={onDelete}>
            <SidebarIcon name="trash" />
          </button>
        </div>
      </footer>
    </article>
  )
}

function DeleteDeviceModal({ device, isDeleting, onCancel, onConfirm }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal delete-confirm-modal" role="dialog" aria-labelledby="delete-device-title">
        <h2 id="delete-device-title">Eliminar Dispositivo</h2>
        <p>
          Estas seguro de eliminar <strong>{device.numeroDispositivo}</strong>
          {device.descripcion ? ` (${device.descripcion})` : ''}?
        </p>
        <div className="delete-confirm-actions">
          <button className="cancel-delete-button" type="button" onClick={onCancel} disabled={isDeleting}>
            Cancelar
          </button>
          <button className="confirm-delete-button" type="button" onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </button>
        </div>
      </section>
    </div>
  )
}

function EditDeviceModal({
  device,
  error,
  form,
  funcionarios,
  funcionariosLoading,
  isSaving,
  onAddFuncionario,
  onChange,
  onClose,
  onRemoveFuncionario,
  onSubmit,
}) {
  const funcionariosDisponibles = funcionarios.filter(
    (funcionario) => !form.funcionarios.includes(funcionario.mail)
  )

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal" aria-labelledby="edit-device-modal-title" role="dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <SidebarIcon name="close" />
        </button>

        <h2 id="edit-device-modal-title">Modificar Dispositivo</h2>

        <form className="stadium-form" onSubmit={onSubmit}>
          <label>
            <span>Numero del Dispositivo</span>
            <input disabled value={device.numeroDispositivo} />
          </label>

          <label>
            <span>Descripcion</span>
            <input
              required
              placeholder="Ej: Escaner Entrada Principal"
              value={form.descripcion}
              onChange={(event) => onChange('descripcion', event.target.value)}
            />
          </label>

          <label>
            <span>Agregar Funcionario</span>
            <select
              disabled={funcionariosLoading}
              value={form.funcionarioSeleccionado}
              onChange={(event) => onAddFuncionario(event.target.value)}
            >
              <option value="">
                {funcionariosLoading ? 'Cargando funcionarios...' : 'Selecciona un funcionario'}
              </option>
              {funcionariosDisponibles.map((funcionario) => (
                <option key={funcionario.mail} value={funcionario.mail}>
                  {getFuncionarioLabel(funcionario)}
                </option>
              ))}
            </select>
          </label>

          <div className="device-assignee-list">
            <span>Funcionarios del dispositivo</span>
            {form.funcionarios.length === 0 ? (
              <p>No hay funcionarios asignados.</p>
            ) : (
              form.funcionarios.map((mail) => (
                <div className="device-assignee-row" key={mail}>
                  <strong>{getFuncionarioLabelByMail(mail, funcionarios)}</strong>
                  <button
                    type="button"
                    className="device-assignee-remove"
                    onClick={() => onRemoveFuncionario(mail)}
                    aria-label={`Quitar ${mail}`}
                  >
                    <SidebarIcon name="trash" />
                  </button>
                </div>
              ))
            )}
          </div>

          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </form>
      </section>
    </div>
  )
}

function DeviceModal({ error, form, isSaving, onChange, onClose, onSubmit }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal" aria-labelledby="device-modal-title" role="dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <SidebarIcon name="close" />
        </button>

        <h2 id="device-modal-title">Crear Nuevo Dispositivo</h2>

        <form className="stadium-form" onSubmit={onSubmit}>
          <label>
            <span>Numero del Dispositivo</span>
            <div className="device-number-field">
              <strong>QR</strong>
              <input
                required
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                placeholder="0001"
                value={form.numero}
                onChange={(event) => onChange('numero', event.target.value)}
              />
            </div>
          </label>

          <label>
            <span>Descripcion</span>
            <input
              required
              placeholder="Ej: Escaner Entrada Principal"
              value={form.descripcion}
              onChange={(event) => onChange('descripcion', event.target.value)}
            />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Crear Dispositivo'}
          </button>
        </form>
      </section>
    </div>
  )
}

function groupDevicesByNumber(rows) {
  const devicesByNumber = new Map()

  rows.forEach((row) => {
    const number = row.numeroDispositivo ?? row.numero_dispositivo ?? ''

    if (!number) {
      return
    }

    const currentDevice = devicesByNumber.get(number) ?? {
      numeroDispositivo: number,
      descripcion: row.descripcion ?? '',
      estado: row.estado ?? '',
      funcionarios: [],
    }

    getDeviceWorkers(row).forEach((funcionario) => {
      if (funcionario && !currentDevice.funcionarios.includes(funcionario)) {
        currentDevice.funcionarios.push(funcionario)
      }
    })

    devicesByNumber.set(number, currentDevice)
  })

  return [...devicesByNumber.values()]
}

function getDeviceWorkers(row) {
  if (Array.isArray(row.funcionarios)) {
    return row.funcionarios
  }

  if (Array.isArray(row.funcionariosAsignados)) {
    return row.funcionariosAsignados
  }

  return [row.funcionario ?? row.funcionarioMail ?? row.funcionario_mail].filter(Boolean)
}

function isDeviceEnabled(status) {
  return String(status ?? '').toLowerCase() === 'habilitado'
}

function normalizeDeviceStatus(status) {
  return isDeviceEnabled(status) ? 'habilitado' : 'deshabilitado'
}

function getFuncionarioLabel(funcionario) {
  const nombreCompleto = `${funcionario.nombre ?? ''} ${funcionario.apellido ?? ''}`.trim()

  return nombreCompleto ? `${nombreCompleto} - ${funcionario.mail}` : funcionario.mail
}

function getFuncionarioLabelByMail(mail, funcionarios) {
  const funcionario = funcionarios.find((currentFuncionario) => currentFuncionario.mail === mail)

  return funcionario ? getFuncionarioLabel(funcionario) : mail
}

export default DispositivosAdmin
