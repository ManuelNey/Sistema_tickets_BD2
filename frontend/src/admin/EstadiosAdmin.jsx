import { API_URL } from '../config.js'
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

async function loadStadiumSectorStats(stadiumId) {
  try {
    const response = await fetch(`${API_URL}/api/sectores/${stadiumId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Sector stats request failed')
    }

    const sectors = await response.json()
    const capacity = sectors.reduce((sum, sector) => sum + Number(sector.capacidad || 0), 0)

    return [
      stadiumId,
      {
        capacity,
        sectorsCount: sectors.length,
      },
    ]
  } catch {
    return [
      stadiumId,
      {
        capacity: null,
        sectorsCount: null,
      },
    ]
  }
}

function EstadiosAdmin({ onOpenSectors, user }) {
  const [stadiums, setStadiums] = useState([])
  const [stadiumStats, setStadiumStats] = useState({})
  const [stadiumsError, setStadiumsError] = useState('')
  const [stadiumsLoading, setStadiumsLoading] = useState(false)
  const [stadiumModal, setStadiumModal] = useState(null)
  const [selectedStadium, setSelectedStadium] = useState(null)
  const [stadiumForm, setStadiumForm] = useState(emptyStadiumForm)
  const [stadiumSaving, setStadiumSaving] = useState(false)
  const [stadiumFormError, setStadiumFormError] = useState('')
  const [stadiumToDelete, setStadiumToDelete] = useState(null)
  const [stadiumDeleting, setStadiumDeleting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const adminCountryId = getAdminCountryId(user)

  const loadStadiums = async () => {
    setStadiumsError('')
    setStadiumsLoading(true)
    setStadiumStats({})

    try {
      const response = await fetch(`${API_URL}/api/estadios`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Stadium request failed')
      }

      const data = await response.json()
      setStadiums(data)
      const statsEntries = await Promise.all(data.map((stadium) => loadStadiumSectorStats(stadium.id)))
      setStadiumStats(Object.fromEntries(statsEntries))
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
        ? `${API_URL}/api/estadios/${selectedStadium.id}`
        : `${API_URL}/api/estadios/registro`

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
      const response = await fetch(`${API_URL}/api/estadios/${stadiumToDelete.id}`, {
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

  const visibleStadiums = sortStadiumsByPermission(stadiums, adminCountryId).filter((s) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    return s.nombre?.toLowerCase().includes(q) || s.ciudad?.toLowerCase().includes(q)
  })

  return (
    <div className="ac-view">
      <header className="ac-header">
        <div>
          <h1 id="dashboard-title">Gestión de Estadios</h1>
          <p>{stadiums.length} estadios registrados en el sistema</p>
        </div>
        <button className="ac-btn-primary" type="button" onClick={openCreateStadium}>
          <PlusIcon />
          Crear Estadio
        </button>
      </header>

      <div className="ac-filterbar">
        <label className="ac-search">
          <SearchIcon />
          <input
            placeholder="Buscar estadio o ciudad..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
      </div>

      {stadiumsLoading && <p className="matches-status">Cargando estadios...</p>}
      {stadiumsError && <p className="matches-status is-error">{stadiumsError}</p>}

      {!stadiumsLoading && !stadiumsError && (
        <div className="ac-grid">
          {visibleStadiums.length === 0 ? (
            <p className="matches-status">{stadiums.length === 0 ? 'No hay estadios disponibles.' : 'Sin resultados para esa búsqueda.'}</p>
          ) : (
            visibleStadiums.map((stadium) => (
              <StadiumCard
                adminCountryId={adminCountryId}
                key={stadium.id}
                onDelete={() => openDeleteConfirm(stadium)}
                onDetails={() => openEditStadium(stadium)}
                onOpenSectors={onOpenSectors}
                stadium={stadium}
                stats={stadiumStats[stadium.id]}
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

function StadiumCard({ adminCountryId, onDelete, onDetails, onOpenSectors, stadium, stats }) {
  const canManageStadium = adminCountryId !== null && Number(stadium.paisSedeId) === adminCountryId
  const capacity = stats?.capacity ?? null
  const sectorsCount = stats?.sectorsCount ?? null
  const countryName = getStadiumCountryName(stadium)
  const countryFlag = getCountryFlag(stadium.paisSedeId)

  return (
    <article className="ac-card">
      <div className="ac-card-head">
        <div className="ac-stadium-meta">
          <span className="ac-stadium-location">
            {countryFlag ? <img className="ac-flag-img" src={countryFlag} alt="" /> : null}
            {stadium.ciudad}, {countryName}
          </span>
          <span className="ac-badge-fifa">
            <span className="ac-badge-dot" />
            FIFA 2026
          </span>
        </div>
        <div className="ac-stadium-name">
          {stadium.nombre}
        </div>
      </div>

      <div className="ac-card-body">
        <div className="ac-stats-grid">
          <div className="ac-stat-box">
            <span className="ac-stat-label">Capacidad</span>
            <span className="ac-stat-value">
              {capacity === null ? '—' : formatNumber(capacity)}
            </span>
          </div>
          <div className="ac-stat-box">
            <span className="ac-stat-label">Sectores</span>
            <span className="ac-stat-value is-dark">
              {sectorsCount === null ? '—' : sectorsCount}
            </span>
          </div>
        </div>

        <div className="ac-divider" />

        <div className="ac-actions">
          {canManageStadium && (
            <button className="ac-btn-outline" type="button" onClick={onDetails}>
              <EditIconSm />
              Detalles
            </button>
          )}
          <button className="ac-btn-outline" type="button" onClick={() => onOpenSectors(stadium)}>
            <SectorsIconSm />
            Sectores
          </button>
          {canManageStadium && (
            <button className="ac-btn-icon" type="button" onClick={onDelete} aria-label="Borrar estadio">
              <TrashIconSm />
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function getCountryFlag(paisSedeId) {
  const flags = { 1: 'ca', 2: 'mx', 3: 'us' }
  const code = flags[Number(paisSedeId)]
  return code ? `https://flagcdn.com/w160/${code}.png` : null
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5l3 3" />
    </svg>
  )
}

function EditIconSm() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 1.5a1.4 1.4 0 0 1 2 2L3 11l-3 1 1-3L8.5 1.5z" />
    </svg>
  )
}

function SectorsIconSm() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="1" width="4.5" height="4.5" rx="1" /><rect x="6.5" y="1" width="4.5" height="4.5" rx="1" />
      <rect x="1" y="6.5" width="4.5" height="4.5" rx="1" /><rect x="6.5" y="6.5" width="4.5" height="4.5" rx="1" />
    </svg>
  )
}

function TrashIconSm() {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" fill="none" stroke="#EF4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1 3 11 3" /><path d="M4.5 3V2h3v1M2 3l.7 7.5A1 1 0 0 0 3.7 11h4.6a1 1 0 0 0 1-.9L10 3" />
      <line x1="5" y1="5.5" x2="5" y2="8.5" /><line x1="7" y1="5.5" x2="7" y2="8.5" />
    </svg>
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

function getStadiumCountryName(stadium) {
  return stadium.paisNombre ?? stadium.nombrePais ?? `Pais #${stadium.paisSedeId}`
}

function formatNumber(value) {
  return new Intl.NumberFormat('es-UY').format(value)
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
