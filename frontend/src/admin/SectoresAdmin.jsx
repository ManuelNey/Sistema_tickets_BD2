import { useCallback, useEffect, useState } from 'react'
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

function SectoresAdmin({ onBack, stadium, user }) {
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

  const loadSectors = useCallback(async () => {
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
  }, [stadium.id])

  useEffect(() => {
    // Diferimos la carga fuera del render sincrono para no disparar
    // setState de forma sincrona dentro del effect (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadSectors)
  }, [loadSectors])

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
  const canManageSectors = Number(stadium.paisSedeId) === getAdminCountryId(user)
  const countryName = getStadiumCountryName(stadium)

  const countryFlag = getSectorCountryFlag(stadium.paisSedeId)

  return (
    <div className="ac-view">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <button className="ac-btn-back" type="button" onClick={onBack}>
          <BackIconS />
          Volver a estadios
        </button>
        {canManageSectors && (
          <button className="ac-btn-primary" type="button" onClick={openCreateSector}>
            <PlusIconS />
            Crear Sector
          </button>
        )}
      </div>

      {/* Stadium hero */}
      <div className="ac-hero" aria-label="Resumen del estadio">
        <div className="ac-hero-inner">
          <div className="ac-hero-content">
            <div className="ac-hero-top">
              <span className="ac-hero-flag">{countryFlag}</span>
              <span className="ac-badge-fifa">
                <span className="ac-badge-dot" />
                FIFA 2026
              </span>
            </div>
            <h1 id="dashboard-title" className="ac-hero-name">{stadium.nombre}</h1>
            <p className="ac-hero-location">{stadium.ciudad}, {countryName}</p>
            <div className="ac-hero-stats">
              <div className="ac-hero-stat">
                <StadiumIconS />
                Capacidad total: <strong>{formattedCapacity} personas</strong>
              </div>
              <div className="ac-hero-stat">
                <SectorsIconS />
                <strong>{sectors.length}</strong> sectores
              </div>
            </div>
          </div>
        </div>
      </div>

      <header className="ac-header">
        <div>
          <h2 style={{ fontSize: 15, fontWeight: 800, color: '#130F1E', letterSpacing: -0.3, margin: 0 }}>
            Sectores del Estadio
          </h2>
          <p style={{ fontSize: 12, color: '#9490A0', marginTop: 3 }}>
            {canManageSectors ? 'Administrá los sectores disponibles' : 'Consulta los sectores disponibles'}
          </p>
        </div>
      </header>

      {sectorsLoading && <p className="matches-status">Cargando sectores...</p>}
      {sectorsError && <p className="matches-status is-error">{sectorsError}</p>}

      {!sectorsLoading && !sectorsError && (
        <div className="ac-grid">
          {sectors.length === 0 ? (
            <p className="matches-status">No hay sectores disponibles.</p>
          ) : (
            sectors.map((sector) => (
              <SectorCard
                canManage={canManageSectors}
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

function SectorCard({ canManage, onDelete, onDetails, sector }) {
  return (
    <article className="ac-card">
      <div className="ac-sector-head">
        <div className="ac-sector-head-info">
          <span className="ac-sector-name">{sector.nombre}</span>
          <span className="ac-sector-num">Sector #{sector.id}</span>
        </div>
        <div className="ac-sector-icon" aria-hidden="true">
          <GridIconS />
        </div>
      </div>

      <div className="ac-card-body">
        <div className="ac-sector-capacity">
          <span className="ac-stat-label">Capacidad</span>
          <span className="ac-sector-cap-value">
            {new Intl.NumberFormat('es-UY').format(sector.capacidad)}
          </span>
          <span className="ac-sector-cap-label">personas</span>
        </div>

        <div className="ac-divider" />

        <div className="ac-actions">
          {canManage && (
            <>
              <button className="ac-btn-outline" type="button" onClick={onDetails}>
                <EditIconS />
                Ver Detalles
              </button>
              <button className="ac-btn-icon" type="button" onClick={onDelete} aria-label="Borrar sector">
                <TrashIconS />
              </button>
            </>
          )}
        </div>
      </div>
    </article>
  )
}

function getSectorCountryFlag(paisSedeId) {
  const flags = { 1: '🇨🇦', 2: '🇲🇽', 3: '🇺🇸' }
  return flags[Number(paisSedeId)] ?? '🌐'
}

function BackIconS() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 2L4 7l5 5" />
    </svg>
  )
}
function PlusIconS() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}
function StadiumIconS() {
  return (
    <svg style={{ color: '#A78BFA', flexShrink: 0 }} viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <ellipse cx="7" cy="7" rx="5.5" ry="3.5" /><path d="M1.5 7v3.5c0 1.9 2.5 3.5 5.5 3.5s5.5-1.6 5.5-3.5V7" />
    </svg>
  )
}
function SectorsIconS() {
  return (
    <svg style={{ color: '#A78BFA', flexShrink: 0 }} viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="1" width="5" height="5" rx="1" /><rect x="8" y="1" width="5" height="5" rx="1" />
      <rect x="1" y="8" width="5" height="5" rx="1" /><rect x="8" y="8" width="5" height="5" rx="1" />
    </svg>
  )
}
function GridIconS() {
  return (
    <svg viewBox="0 0 12 12" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="1" width="4" height="4" rx="0.8" /><rect x="7" y="1" width="4" height="4" rx="0.8" />
      <rect x="1" y="7" width="4" height="4" rx="0.8" /><rect x="7" y="7" width="4" height="4" rx="0.8" />
    </svg>
  )
}
function EditIconS() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 1.5a1.4 1.4 0 0 1 2 2L3 11l-3 1 1-3L8.5 1.5z" />
    </svg>
  )
}
function TrashIconS() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 3 11 3" /><path d="M4.5 3V2h3v1M2 3l.7 7.5A1 1 0 0 0 3.7 11h4.6a1 1 0 0 0 1-.9L10 3" />
    </svg>
  )
}

function getAdminCountryId(user) {
  const countryId = user?.paisSede ?? user?.paisSedeId ?? user?.pais_sede
  const parsedCountryId = Number(countryId)

  return Number.isInteger(parsedCountryId) ? parsedCountryId : null
}

function getStadiumCountryName(stadium) {
  return stadium.paisNombre ?? stadium.nombrePais ?? `Pais #${stadium.paisSedeId}`
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
