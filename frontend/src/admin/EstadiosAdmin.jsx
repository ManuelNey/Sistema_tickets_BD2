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

function EstadiosAdmin() {
  const [stadiums, setStadiums] = useState([])
  const [stadiumsError, setStadiumsError] = useState('')
  const [stadiumsLoading, setStadiumsLoading] = useState(false)
  const [stadiumModal, setStadiumModal] = useState(null)
  const [selectedStadium, setSelectedStadium] = useState(null)
  const [stadiumForm, setStadiumForm] = useState(emptyStadiumForm)
  const [stadiumSaving, setStadiumSaving] = useState(false)
  const [stadiumFormError, setStadiumFormError] = useState('')

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
    loadStadiums()
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

    const payload = {
      nombre: stadiumForm.nombre,
      ciudad: stadiumForm.ciudad,
      paisSedeId: Number(stadiumForm.paisSedeId),
    }

    try {
      const isEdit = stadiumModal === 'edit'
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
            stadiums.map((stadium) => (
              <StadiumCard
                key={stadium.id}
                onDetails={() => openEditStadium(stadium)}
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
    </div>
  )
}

function StadiumCard({ onDetails, stadium }) {
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

      <footer className="stadium-actions">
        <button className="details-button" type="button" onClick={onDetails}>
          <SidebarIcon name="edit" />
          <span>Ver Detalles</span>
        </button>
        <button className="sections-button" type="button">
          <SidebarIcon name="sections" />
          <span>Ver Secciones</span>
        </button>
        <button className="delete-button" type="button" aria-label="Borrar estadio">
          <SidebarIcon name="trash" />
        </button>
      </footer>
    </article>
  )
}

export default EstadiosAdmin
