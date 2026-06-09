import { useEffect, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'

const emptyEventForm = {
  equipoLocalId: '',
  equipoVisitanteId: '',
  fecha: '',
  hora: '',
  estadioId: '',
}

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('ticketmatch-token')

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  }
}

function EncuentrosAdmin({ user }) {
  const [encuentros, setEncuentros] = useState([])
  const [encuentrosError, setEncuentrosError] = useState('')
  const [encuentrosLoading, setEncuentrosLoading] = useState(false)
  const [eventModalOpen, setEventModalOpen] = useState(false)
  const [eventForm, setEventForm] = useState(emptyEventForm)
  const [eventFormError, setEventFormError] = useState('')
  const [eventSaving, setEventSaving] = useState(false)
  const [stadiums, setStadiums] = useState([])
  const [stadiumsLoading, setStadiumsLoading] = useState(false)
  const [sectors, setSectors] = useState([])
  const [sectorsLoading, setSectorsLoading] = useState(false)
  const [selectedSectors, setSelectedSectors] = useState({})
  const adminCountryId = getAdminCountryId(user)

  const loadEncuentros = async () => {
    setEncuentrosError('')
    setEncuentrosLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/encuentros', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Encuentros request failed')
      }

      const data = await response.json()
      setEncuentros(data)
    } catch {
      setEncuentrosError('No se pudieron cargar los encuentros')
    } finally {
      setEncuentrosLoading(false)
    }
  }

  useEffect(() => {
    loadEncuentros()
  }, [])

  const loadAdminStadiums = async () => {
    setStadiumsLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/estadios/admin', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Admin stadiums request failed')
      }

      const data = await response.json()
      setStadiums(data)
    } catch {
      setEventFormError('No se pudieron cargar los estadios')
    } finally {
      setStadiumsLoading(false)
    }
  }

  const loadSectorsByStadium = async (stadiumId) => {
    if (!stadiumId) {
      setSectors([])
      return
    }

    setSectorsLoading(true)

    try {
      const response = await fetch(`http://localhost:8080/api/sectores/${stadiumId}`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Sectors request failed')
      }

      const data = await response.json()
      setSectors(data)
    } catch {
      setEventFormError('No se pudieron cargar los sectores del estadio')
    } finally {
      setSectorsLoading(false)
    }
  }

  const openCreateEvent = () => {
    setEventForm(emptyEventForm)
    setEventFormError('')
    setSelectedSectors({})
    setSectors([])
    setEventModalOpen(true)
    loadAdminStadiums()
  }

  const closeCreateEvent = () => {
    setEventModalOpen(false)
    setEventForm(emptyEventForm)
    setEventFormError('')
    setEventSaving(false)
    setSelectedSectors({})
    setSectors([])
  }

  const updateEventField = (field, value) => {
    setEventForm((current) => ({ ...current, [field]: value }))

    if (field === 'estadioId') {
      setSelectedSectors({})
      loadSectorsByStadium(value)
    }
  }

  const toggleSector = (sectorId) => {
    setSelectedSectors((current) => ({
      ...current,
      [sectorId]: {
        selected: !current[sectorId]?.selected,
        precio: current[sectorId]?.precio ?? '',
      },
    }))
  }

  const updateSectorPrice = (sectorId, price) => {
    setSelectedSectors((current) => ({
      ...current,
      [sectorId]: {
        selected: true,
        precio: price,
      },
    }))
  }

  const submitEvent = async (event) => {
    event.preventDefault()
    setEventFormError('')
    setEventSaving(true)

    const selectedSectorPayload = Object.entries(selectedSectors)
      .filter(([, sector]) => sector.selected)
      .map(([sectorId, sector]) => ({
        sectorId: Number(sectorId),
        precio: Number(sector.precio),
      }))

    if (selectedSectorPayload.length === 0) {
      setEventFormError('Selecciona al menos un sector')
      setEventSaving(false)
      return
    }

    if (selectedSectorPayload.some((sector) => Number.isNaN(sector.precio))) {
      setEventFormError('Completa el precio de todos los sectores seleccionados')
      setEventSaving(false)
      return
    }

    const payload = {
      equipoLocalId: Number(eventForm.equipoLocalId),
      equipoVisitanteId: Number(eventForm.equipoVisitanteId),
      fecha: `${eventForm.fecha}T${eventForm.hora}:00`,
      estadioId: Number(eventForm.estadioId),
      sectores: selectedSectorPayload,
    }

    try {
      const response = await fetch('http://localhost:8080/api/encuentros/registro', {
        method: 'POST',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Create event failed')
      }

      await loadEncuentros()
      closeCreateEvent()
    } catch {
      setEventFormError('No se pudo crear el encuentro')
    } finally {
      setEventSaving(false)
    }
  }

  return (
    <div className="admin-view">
      <header className="admin-header">
        <div>
          <h1 id="dashboard-title">Gestion de Encuentros</h1>
          <p>Administra los encuentros del sistema</p>
        </div>
        <button className="create-stadium-button" type="button" onClick={openCreateEvent}>
          <SidebarIcon name="plus" />
          <span>Crear Encuentro</span>
        </button>
      </header>

      {encuentrosLoading && <p className="matches-status">Cargando encuentros...</p>}
      {encuentrosError && <p className="matches-status is-error">{encuentrosError}</p>}

      {!encuentrosLoading && !encuentrosError && (
        <div className="stadium-grid">
          {encuentros.length === 0 ? (
            <p className="matches-status">No hay encuentros disponibles.</p>
          ) : (
            sortEncuentrosByPermission(encuentros, adminCountryId).map((encuentro) => (
              <EncuentroCard
                adminCountryId={adminCountryId}
                encuentro={encuentro}
                key={encuentro.id}
              />
            ))
          )}
        </div>
      )}

      {eventModalOpen && (
        <CreateEventModal
          error={eventFormError}
          form={eventForm}
          isSaving={eventSaving}
          onChange={updateEventField}
          onClose={closeCreateEvent}
          onSectorPriceChange={updateSectorPrice}
          onSectorToggle={toggleSector}
          onSubmit={submitEvent}
          sectors={sectors}
          sectorsLoading={sectorsLoading}
          selectedSectors={selectedSectors}
          stadiums={stadiums}
          stadiumsLoading={stadiumsLoading}
        />
      )}
    </div>
  )
}

function EncuentroCard({ adminCountryId, encuentro }) {
  const isOwnCountry = Number(encuentro.pais) === adminCountryId

  return (
    <article className="stadium-card">
      <header className="stadium-card-header">
        <div className="stadium-card-icon" aria-hidden="true">
          <SidebarIcon name="calendar" />
        </div>
        <div>
          <h2>Encuentro #{encuentro.id}</h2>
          <p>{formatDate(encuentro.fecha)}</p>
        </div>
      </header>

      <div className="stadium-card-body">
        <p>
          <span>Equipos</span>
          <strong>#{encuentro.equipoLocal} vs #{encuentro.equipoVisitante}</strong>
        </p>
        <p>
          <span>Estadio</span>
          <strong>#{encuentro.estadio}</strong>
        </p>
        <p>
          <span>Pais</span>
          <strong>{isOwnCountry ? `Tu pais (#${encuentro.pais})` : `Pais #${encuentro.pais}`}</strong>
        </p>
      </div>
    </article>
  )
}

function CreateEventModal({
  error,
  form,
  isSaving,
  onChange,
  onClose,
  onSectorPriceChange,
  onSectorToggle,
  onSubmit,
  sectors,
  sectorsLoading,
  selectedSectors,
  stadiums,
  stadiumsLoading,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal event-modal" aria-labelledby="event-modal-title" role="dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <SidebarIcon name="close" />
        </button>

        <h2 id="event-modal-title">Crear Nuevo Encuentro</h2>

        <form className="stadium-form" onSubmit={onSubmit}>
          <div className="event-form-grid">
            <label>
              <span>Equipo Local</span>
              <input
                required
                inputMode="numeric"
                placeholder="Ej: 1"
                value={form.equipoLocalId}
                onChange={(event) => onChange('equipoLocalId', event.target.value)}
              />
            </label>

            <label>
              <span>Equipo Visitante</span>
              <input
                required
                inputMode="numeric"
                placeholder="Ej: 2"
                value={form.equipoVisitanteId}
                onChange={(event) => onChange('equipoVisitanteId', event.target.value)}
              />
            </label>
          </div>

          <div className="event-form-grid">
            <label>
              <span>Fecha</span>
              <input
                required
                type="date"
                value={form.fecha}
                onChange={(event) => onChange('fecha', event.target.value)}
              />
            </label>

            <label>
              <span>Hora</span>
              <select required value={form.hora} onChange={(event) => onChange('hora', event.target.value)}>
                <option value="">Selecciona una hora</option>
                {timeOptions.map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label>
            <span>Estadio</span>
            <select
              required
              disabled={stadiumsLoading}
              value={form.estadioId}
              onChange={(event) => onChange('estadioId', event.target.value)}
            >
              <option value="">{stadiumsLoading ? 'Cargando estadios...' : 'Selecciona un estadio'}</option>
              {stadiums.map((stadium) => (
                <option key={stadium.id} value={stadium.id}>
                  {stadium.nombre} - {stadium.ciudad}
                </option>
              ))}
            </select>
          </label>

          {form.estadioId && (
            <fieldset className="event-sectors-fieldset">
              <legend>Sectores y precios</legend>

              {sectorsLoading ? (
                <p className="event-helper">Cargando sectores...</p>
              ) : sectors.length === 0 ? (
                <p className="event-helper">No hay sectores disponibles para este estadio.</p>
              ) : (
                <div className="event-sector-list">
                  {sectors.map((sector) => {
                    const selected = Boolean(selectedSectors[sector.id]?.selected)

                    return (
                      <div className="event-sector-row" key={sector.id}>
                        <label className="event-sector-check">
                          <input
                            checked={selected}
                            type="checkbox"
                            onChange={() => onSectorToggle(sector.id)}
                          />
                          <span>{sector.nombre}</span>
                          <small>{sector.capacidad} lugares</small>
                        </label>

                        {selected && (
                          <input
                            required
                            inputMode="decimal"
                            placeholder="Precio"
                            value={selectedSectors[sector.id]?.precio ?? ''}
                            onChange={(event) => onSectorPriceChange(sector.id, event.target.value)}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </fieldset>
          )}

          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Crear Encuentro'}
          </button>
        </form>
      </section>
    </div>
  )
}

function getAdminCountryId(user) {
  const countryId = user?.paisSede ?? user?.paisSedeId ?? user?.pais_sede
  const parsedCountryId = Number(countryId)

  return Number.isInteger(parsedCountryId) ? parsedCountryId : null
}

function sortEncuentrosByPermission(encuentros, adminCountryId) {
  return [...encuentros].sort((first, second) => {
    const firstOwnCountry = Number(first.pais) === adminCountryId
    const secondOwnCountry = Number(second.pais) === adminCountryId

    if (firstOwnCountry === secondOwnCountry) {
      return new Date(first.fecha) - new Date(second.fecha)
    }

    return firstOwnCountry ? -1 : 1
  })
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0')
  const minutes = index % 2 === 0 ? '00' : '30'

  return `${hours}:${minutes}`
})

function formatDate(date) {
  if (!date) {
    return 'Fecha a confirmar'
  }

  return new Intl.DateTimeFormat('es-UY', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

export default EncuentrosAdmin
