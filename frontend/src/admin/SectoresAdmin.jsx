import { useEffect, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'

const emptySectorForm = {
  nombre: '',
  capacidad: '',
}

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('ticketmatch-token')

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  }
}

function SectoresAdmin({ onBack, stadium }) {
  const [sectors, setSectors] = useState([])
  const [sectorsError, setSectorsError] = useState('')
  const [sectorsLoading, setSectorsLoading] = useState(false)
  const [sectorModal, setSectorModal] = useState(null)
  const [selectedSector, setSelectedSector] = useState(null)
  const [sectorForm, setSectorForm] = useState(emptySectorForm)
  const [sectorSaving, setSectorSaving] = useState(false)
  const [sectorFormError, setSectorFormError] = useState('')
  const [sectorToDelete, setSectorToDelete] = useState(null)
  const [sectorDeleting, setSectorDeleting] = useState(false)

  const loadSectors = async () => {
    setSectorsError('')
    setSectorsLoading(true)

    try {
      const response = await fetch(`http://localhost:8080/api/sectores/${stadium.id}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Sectors request failed')
      }

      const data = await response.json()
      setSectors(data)
    } catch {
      setSectorsError('No se pudieron cargar los sectores')
    } finally {
      setSectorsLoading(false)
    }
  }

  useEffect(() => {
    loadSectors()
  }, [stadium.id])

  const openCreateSector = () => {
    setSelectedSector(null)
    setSectorForm(emptySectorForm)
    setSectorFormError('')
    setSectorModal('create')
  }

  const openEditSector = (sector) => {
    setSelectedSector(sector)
    setSectorForm({
      nombre: sector.nombre,
      capacidad: String(sector.capacidad),
    })
    setSectorFormError('')
    setSectorModal('edit')
  }

  const closeSectorModal = () => {
    setSectorModal(null)
    setSelectedSector(null)
    setSectorForm(emptySectorForm)
    setSectorFormError('')
    setSectorSaving(false)
  }

  const updateSectorField = (field, value) => {
    setSectorForm((current) => ({ ...current, [field]: value }))
  }

  const submitSectorForm = async (event) => {
    event.preventDefault()

    setSectorFormError('')
    setSectorSaving(true)

    const isEdit = sectorModal === 'edit'
    const payload = {
      nombre: sectorForm.nombre,
      capacidad: Number(sectorForm.capacidad),
    }

    if (!isEdit) {
      payload.estadio = stadium.id
    }

    try {
      const url = isEdit
        ? `http://localhost:8080/api/sectores/${selectedSector.id}`
        : 'http://localhost:8080/api/sectores/registro'

      const response = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Create sector failed')
      }

      await loadSectors()
      closeSectorModal()
    } catch {
      setSectorFormError(isEdit ? 'No se pudo modificar el sector' : 'No se pudo crear el sector')
    } finally {
      setSectorSaving(false)
    }
  }

  const closeDeleteConfirm = () => {
    setSectorToDelete(null)
    setSectorDeleting(false)
  }

  const deleteSector = async () => {
    if (!sectorToDelete) {
      return
    }

    setSectorsError('')
    setSectorDeleting(true)

    try {
      const response = await fetch(`http://localhost:8080/api/sectores/${sectorToDelete.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Delete sector failed')
      }

      await loadSectors()
      closeDeleteConfirm()
    } catch {
      setSectorsError('No se pudo eliminar el sector')
    } finally {
      setSectorDeleting(false)
    }
  }

  const totalCapacity = sectors.reduce((sum, sector) => sum + Number(sector.capacidad || 0), 0)
  const formattedCapacity = new Intl.NumberFormat('es-UY').format(totalCapacity)

  return (
    <div className="admin-view">
      <button className="back-link-button" type="button" onClick={onBack}>
        <SidebarIcon name="arrowLeft" />
        <span>Volver a estadios</span>
      </button>

      <section className="stadium-summary-card" aria-label="Resumen del estadio">
        <div className="stadium-summary-panel">
          <h1 id="dashboard-title">{stadium.nombre}</h1>
          <p>{stadium.ciudad}, Pais #{stadium.paisSedeId}</p>
          <span>Capacidad Total: {formattedCapacity} personas</span>
        </div>
      </section>

      <header className="admin-header sector-list-header">
        <div>
          <h2>Sectores del Estadio</h2>
          <p>Administra los sectores disponibles</p>
        </div>
        <button className="create-stadium-button" type="button" onClick={openCreateSector}>
          <SidebarIcon name="plus" />
          <span>Crear Sector</span>
        </button>
      </header>

      {sectorsLoading && <p className="matches-status">Cargando sectores...</p>}
      {sectorsError && <p className="matches-status is-error">{sectorsError}</p>}

      {!sectorsLoading && !sectorsError && (
        <div className="stadium-grid">
          {sectors.length === 0 ? (
            <p className="matches-status">No hay sectores disponibles.</p>
          ) : (
            sectors.map((sector) => (
              <SectorCard
                key={sector.id}
                onDelete={() => setSectorToDelete(sector)}
                onDetails={() => openEditSector(sector)}
                sector={sector}
              />
            ))
          )}
        </div>
      )}

      {sectorModal && (
        <SectorModal
          error={sectorFormError}
          form={sectorForm}
          isSaving={sectorSaving}
          mode={sectorModal}
          onChange={updateSectorField}
          onClose={closeSectorModal}
          onSubmit={submitSectorForm}
          stadium={stadium}
        />
      )}

      {sectorToDelete && (
        <DeleteSectorConfirm
          isDeleting={sectorDeleting}
          onCancel={closeDeleteConfirm}
          onConfirm={deleteSector}
          sector={sectorToDelete}
        />
      )}
    </div>
  )
}

function SectorCard({ onDelete, onDetails, sector }) {
  return (
    <article className="stadium-card">
      <header className="stadium-card-header">
        <div className="stadium-card-icon" aria-hidden="true">
          <SidebarIcon name="sections" />
        </div>
        <div>
          <h2>{sector.nombre}</h2>
          <p>Sector #{sector.id}</p>
        </div>
      </header>

      <div className="stadium-card-body">
        <p>
          <span>Capacidad</span>
          <strong>{sector.capacidad} personas</strong>
        </p>
        <p>
          <span>Estadio</span>
          <strong>#{sector.estadio}</strong>
        </p>
      </div>

      <footer className="sector-actions">
        <button className="details-button" type="button" onClick={onDetails}>
          <SidebarIcon name="edit" />
          <span>Ver Detalles</span>
        </button>
        <button className="delete-button" type="button" onClick={onDelete} aria-label="Borrar sector">
          <SidebarIcon name="trash" />
        </button>
      </footer>
    </article>
  )
}

function SectorModal({ error, form, isSaving, mode, onChange, onClose, onSubmit, stadium }) {
  const title = mode === 'create' ? 'Crear Nuevo Sector' : 'Detalles del Sector'
  const buttonText = mode === 'create' ? 'Crear Sector' : 'Guardar Cambios'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal" aria-labelledby="sector-modal-title" role="dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <SidebarIcon name="close" />
        </button>

        <h2 id="sector-modal-title">{title}</h2>

        <form className="stadium-form" onSubmit={onSubmit}>
          <label>
            <span>Nombre del Sector</span>
            <input
              required
              placeholder="Ej: Tribuna Norte"
              value={form.nombre}
              onChange={(event) => onChange('nombre', event.target.value)}
            />
          </label>

          <label>
            <span>Capacidad</span>
            <input
              required
              inputMode="numeric"
              placeholder="Ej: 1200"
              value={form.capacidad}
              onChange={(event) => onChange('capacidad', event.target.value)}
            />
          </label>

          <label>
            <span>Estadio</span>
            <input disabled value={stadium.nombre} />
          </label>

          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : buttonText}
          </button>
        </form>
      </section>
    </div>
  )
}

function DeleteSectorConfirm({ isDeleting, onCancel, onConfirm, sector }) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal delete-confirm-modal" aria-labelledby="delete-sector-title" role="dialog">
        <button className="modal-close" type="button" onClick={onCancel} aria-label="Cerrar" disabled={isDeleting}>
          <SidebarIcon name="close" />
        </button>

        <h2 id="delete-sector-title">Eliminar Sector</h2>
        <p>
          Estas seguro de eliminar el sector <strong>{sector.nombre}</strong>?
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

export default SectoresAdmin
