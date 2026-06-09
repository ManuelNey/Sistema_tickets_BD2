import { useEffect, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'
import StadiumModal from './StadiumModal'

const emptyStadiumForm = {
  nombre: '',
  ciudad: '',
  paisSedeId: '',
}

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('ticketmatch-token')

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  }
}

function EstadiosAdmin({ onOpenSectors, user }) {
  const [stadiums, setStadiums] = useState([])
  const [stadiumsError, setStadiumsError] = useState('')
  const [stadiumsLoading, setStadiumsLoading] = useState(false)
  const [stadiumModal, setStadiumModal] = useState(null)
  const [selectedStadium, setSelectedStadium] = useState(null)
  const [stadiumForm, setStadiumForm] = useState(emptyStadiumForm)
  const [stadiumSaving, setStadiumSaving] = useState(false)
  const [stadiumFormError, setStadiumFormError] = useState('')
  const [stadiumToDelete, setStadiumToDelete] = useState(null)
  const [stadiumDeleting, setStadiumDeleting] = useState(false)
  const adminCountryId = getAdminCountryId(user)

  const loadStadiums = async () => {
    setStadiumsError('')
    setStadiumsLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/estadios', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Stadium request failed')
      }

      const data = await response.json()
      setStadiums(data)
    } catch {
      setStadiumsError('No se pudieron cargar los estadios')
    } finally {
      setStadiumsLoading(false)
    }
  }

  useEffect(() => {
    // Diferimos la carga fuera del render sincrono para no disparar
    // setState de forma sincrona dentro del effect (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadStadiums)
  }, [])

  const openCreateStadium = () => {
    setSelectedStadium(null)
    setStadiumForm(emptyStadiumForm)
    setStadiumFormError('')
    setStadiumModal('create')
  }

  const openEditStadium = (stadium) => {
    setSelectedStadium(stadium)
    setStadiumForm({
      nombre: stadium.nombre,
      ciudad: stadium.ciudad,
      paisSedeId: String(stadium.paisSedeId),
    })
    setStadiumFormError('')
    setStadiumModal('edit')
  }

  const closeStadiumModal = () => {
    setStadiumModal(null)
    setSelectedStadium(null)
    setStadiumForm(emptyStadiumForm)
    setStadiumFormError('')
    setStadiumSaving(false)
  }

  const updateStadiumField = (field, value) => {
    setStadiumForm((current) => ({ ...current, [field]: value }))
  }

  const saveStadium = async (event) => {
    event.preventDefault()
    setStadiumFormError('')
    setStadiumSaving(true)

    const isEdit = stadiumModal === 'edit'
    const payload = {
      nombre: stadiumForm.nombre,
      ciudad: stadiumForm.ciudad,
    }

    try {
      const url = isEdit
        ? `http://localhost:8080/api/estadios/${selectedStadium.id}`
        : 'http://localhost:8080/api/estadios/registro'

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Save stadium failed')
      }

      await loadStadiums()
      closeStadiumModal()
    } catch {
      setStadiumFormError('No se pudo guardar el estadio')
    } finally {
      setStadiumSaving(false)
    }
  }

  const openDeleteConfirm = (stadium) => {
    setStadiumsError('')
    setStadiumToDelete(stadium)
  }

  const closeDeleteConfirm = () => {
    setStadiumToDelete(null)
    setStadiumDeleting(false)
  }

  const deleteStadium = async () => {
    if (!stadiumToDelete) {
      return
    }

    setStadiumsError('')
    setStadiumDeleting(true)

    try {
      const response = await fetch(`http://localhost:8080/api/estadios/${stadiumToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Delete stadium failed')
      }

      await loadStadiums()
      closeDeleteConfirm()
    } catch {
      setStadiumsError('No se pudo eliminar el estadio')
    } finally {
      setStadiumDeleting(false)
    }
  }

  return (
    <div className="admin-view">
      <header className="admin-header">
        <div>
          <h1 id="dashboard-title">Gestion de Estadios</h1>
          <p>Administra los estadios del sistema</p>
        </div>
        <button className="create-stadium-button" type="button" onClick={openCreateStadium}>
          <SidebarIcon name="plus" />
          <span>Crear Estadio</span>
        </button>
      </header>

      {stadiumsLoading && <p className="matches-status">Cargando estadios...</p>}
      {stadiumsError && <p className="matches-status is-error">{stadiumsError}</p>}

      {!stadiumsLoading && !stadiumsError && (
        <div className="stadium-grid">
          {stadiums.length === 0 ? (
            <p className="matches-status">No hay estadios disponibles.</p>
          ) : (
            sortStadiumsByPermission(stadiums, adminCountryId).map((stadium) => (
              <StadiumCard
                adminCountryId={adminCountryId}
                key={stadium.id}
                onDelete={() => openDeleteConfirm(stadium)}
                onDetails={() => openEditStadium(stadium)}
                onOpenSectors={onOpenSectors}
                stadium={stadium}
              />
            ))
          )}
        </div>
      )}

      {stadiumModal && (
        <StadiumModal
          error={stadiumFormError}
          form={stadiumForm}
          isSaving={stadiumSaving}
          mode={stadiumModal}
          onChange={updateStadiumField}
          onClose={closeStadiumModal}
          onSubmit={saveStadium}
        />
      )}

      {stadiumToDelete && (
        <DeleteStadiumConfirm
          isDeleting={stadiumDeleting}
          onCancel={closeDeleteConfirm}
          onConfirm={deleteStadium}
          stadium={stadiumToDelete}
        />
      )}
    </div>
  )
}

function StadiumCard({ adminCountryId, onDelete, onDetails, onOpenSectors, stadium }) {
  const canManageStadium = adminCountryId !== null && Number(stadium.paisSedeId) === adminCountryId

  return (
    <article className="stadium-card">
      <header className="stadium-card-header">
        <div className="stadium-card-icon" aria-hidden="true">
          <SidebarIcon name="stadium" />
        </div>
        <div>
          <h2>{stadium.nombre}</h2>
          <p>{stadium.ciudad}, Pais #{stadium.paisSedeId}</p>
        </div>
      </header>

      <div className="stadium-card-body">
        <p>
          <span>Capacidad</span>
          <strong>Bloqueado</strong>
        </p>
        <p>
          <span>Secciones</span>
          <strong>Sin endpoint</strong>
        </p>
      </div>

      <footer className={`stadium-actions ${canManageStadium ? '' : 'is-readonly'}`}>
        {canManageStadium && (
          <button className="details-button" type="button" onClick={onDetails}>
            <SidebarIcon name="edit" />
            <span>Ver Detalles</span>
          </button>
        )}
        <button className="sections-button" type="button" onClick={() => onOpenSectors(stadium)}>
          <SidebarIcon name="sections" />
          <span>Ver Sectores</span>
        </button>
        {canManageStadium && (
          <button className="delete-button" type="button" onClick={onDelete} aria-label="Borrar estadio">
            <SidebarIcon name="trash" />
          </button>
        )}
      </footer>
    </article>
  )
}

function getAdminCountryId(user) {
  const countryId = user?.paisSede ?? user?.paisSedeId ?? user?.pais_sede
  const parsedCountryId = Number(countryId)

  return Number.isInteger(parsedCountryId) ? parsedCountryId : null
}

function sortStadiumsByPermission(stadiums, adminCountryId) {
  return [...stadiums].sort((first, second) => {
    const firstCanManage = Number(first.paisSedeId) === adminCountryId
    const secondCanManage = Number(second.paisSedeId) === adminCountryId

    if (firstCanManage === secondCanManage) {
      return first.nombre.localeCompare(second.nombre)
    }

    return firstCanManage ? -1 : 1
  })
}

function DeleteStadiumConfirm({ isDeleting, onCancel, onConfirm, stadium }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal delete-confirm-modal" aria-labelledby="delete-stadium-title" role="dialog">
        <button className="modal-close" type="button" onClick={onCancel} aria-label="Cerrar" disabled={isDeleting}>
          <SidebarIcon name="close" />
        </button>

        <h2 id="delete-stadium-title">Eliminar Estadio</h2>
        <p>
          Estas seguro de eliminar el estadio <strong>{stadium.nombre}</strong> de{' '}
          <strong>{stadium.ciudad}</strong>?
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

export default EstadiosAdmin
