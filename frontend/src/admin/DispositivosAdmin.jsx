import { API_URL } from '../config.js'
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
      const response = await fetch(`${API_URL}/api/Dispositivo`, {
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
    const nextValue = field === 'numero'
      ? value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6).toUpperCase()
      : value

    setDeviceForm((current) => ({ ...current, [field]: nextValue }))
  }

  const submitDevice = async (event) => {
    event.preventDefault()
    setDeviceFormError('')

    if (!/^[a-zA-Z0-9]{6}$/.test(deviceForm.numero)) {
      setDeviceFormError('El numero debe tener exactamente 6 caracteres alfanumericos')
      return
    }

    setDeviceSaving(true)

    const payload = {
      numeroDispositivo: deviceForm.numero,
      descripcion: deviceForm.descripcion,
    }

    try {
      const response = await fetch(`${API_URL}/api/Dispositivo/registro`, {
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
      const response = await fetch(`${API_URL}/api/Funcionarios/admin`, {
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
        `${API_URL}/api/Dispositivo/${encodeURIComponent(selectedDevice.numeroDispositivo)}`,
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
        `${API_URL}/api/Dispositivo/${encodeURIComponent(device.numeroDispositivo)}`,
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
        `${API_URL}/api/Dispositivo/${encodeURIComponent(deviceToDelete.numeroDispositivo)}`,
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
    <div className="ac-view">
      <header className="ac-header">
        <div>
          <h1 id="dashboard-title">Gestión de Dispositivos</h1>
          <p>{devices.length} dispositivos registrados en el sistema</p>
        </div>
        <button className="ac-btn-primary" type="button" onClick={openCreateDevice}>
          <PlusIconD />
          Nuevo Dispositivo
        </button>
      </header>

      {devicesLoading && <p className="matches-status">Cargando dispositivos...</p>}
      {devicesError && <p className="matches-status is-error">{devicesError}</p>}

      {!devicesLoading && !devicesError && (
        <div className="ac-grid">
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

  return (
    <article className="ac-card">
      <div className="ac-card-head">
        <div className="ac-device-meta">
          <span className={`ac-device-status-dot ${isEnabled ? 'is-on' : 'is-off'}`} />
          <span className={`ac-device-status-label ${isEnabled ? 'is-on' : 'is-off'}`}>
            {isEnabled ? 'Habilitado' : 'Deshabilitado'}
          </span>
        </div>
        <div className="ac-device-head-body">
          <DeviceIconD />
          <div>
            <div className="ac-device-name">{device.descripcion || 'Sin descripción'}</div>
            <div className="ac-device-id"># {device.numeroDispositivo}</div>
          </div>
        </div>
      </div>

      <div className="ac-card-body">
        <div className="ac-stats-grid">
          <div className="ac-stat-box">
            <span className="ac-stat-label">Funcionarios</span>
            <span className="ac-stat-value is-dark">{device.funcionarios.length}</span>
          </div>
          <div className="ac-stat-box">
            <span className="ac-stat-label">Estado</span>
            <span className={`ac-device-pill ${isEnabled ? 'is-on' : 'is-off'}`}>
              {isEnabled ? 'Activo' : 'Inactivo'}
            </span>
          </div>
        </div>

        {device.funcionarios.length > 0 && (
          <div className="ac-device-workers">
            {device.funcionarios.map((mail) => (
              <span key={mail} className="ac-worker-chip">{mail}</span>
            ))}
          </div>
        )}

        <div className="ac-divider" />

        <div className="ac-actions">
          <button
            className={`ac-btn-outline ${isEnabled ? 'is-warn' : 'is-ok'}`}
            type="button"
            onClick={onToggleStatus}
          >
            <PowerIconD on={isEnabled} />
            {isEnabled ? 'Desactivar' : 'Activar'}
          </button>
          <button className="ac-btn-outline" type="button" onClick={onEdit}>
            <EditIconD />
            Modificar
          </button>
          <button className="ac-btn-icon" type="button" aria-label="Borrar" onClick={onDelete}>
            <TrashIconD />
          </button>
        </div>
      </div>
    </article>
  )
}

function PlusIconD() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}
function DeviceIconD() {
  return (
    <svg viewBox="0 0 18 18" width="22" height="22" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="2" y="4" width="14" height="10" rx="2" /><line x1="9" y1="14" x2="9" y2="17" /><line x1="6" y1="17" x2="12" y2="17" />
    </svg>
  )
}
function PowerIconD() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M6 1v4M3.5 2.8A5 5 0 1 0 6 1" />
    </svg>
  )
}
function EditIconD() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 1.5a1.4 1.4 0 0 1 2 2L3 11l-3 1 1-3L8.5 1.5z" />
    </svg>
  )
}
function TrashIconD() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 3 11 3" /><path d="M4.5 3V2h3v1M2 3l.7 7.5A1 1 0 0 0 3.7 11h4.6a1 1 0 0 0 1-.9L10 3" />
    </svg>
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
  const [selectKey, setSelectKey] = useState(0)

  const funcionariosDisponibles = funcionarios.filter(
    (funcionario) => !form.funcionarios.includes(funcionario.mail)
  )

  function handleAddFuncionario(mail) {
    if (!mail) return
    setSelectKey((k) => k + 1)
    onAddFuncionario(mail)
  }

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
              key={selectKey}
              disabled={funcionariosLoading}
              onChange={(event) => handleAddFuncionario(event.target.value)}
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
            <input
              required
              inputMode="text"
              maxLength={6}
              pattern="[A-Za-z0-9]{6}"
              placeholder="AB1203"
              value={form.numero}
              onChange={(event) => onChange('numero', event.target.value)}
            />
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
