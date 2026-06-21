import { useEffect, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'

const emptyEventForm = {
  equipoLocalId: '',
  equipoVisitanteId: '',
  fecha: '',
  hora: '',
  estadioId: '',
}

const emptyEditEventForm = {
  estado: 'programado',
  fecha: '',
  hora: '',
  estadioId: '',
}

const eventStatusOptions = [
  { value: 'programado', label: 'Programado' },
  { value: 'en_juego', label: 'En juego' },
  { value: 'finalizado', label: 'Finalizado' },
  { value: 'cancelado', label: 'Cancelado' },
]

const eventStatusTabs = [
  { value: 'todos', label: 'Todos' },
  { value: 'programado', label: 'Programados' },
  { value: 'en_juego', label: 'En juego' },
  { value: 'cancelado', label: 'Cancelados' },
  { value: 'finalizado', label: 'Finalizados' },
]

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('ticketmatch-token')

  return {
    ...extraHeaders,
    Authorization: `Bearer ${token}`,
  }
}

async function loadEncounterDetail(encounterId) {
  try {
    const response = await fetch(`http://localhost:8080/api/encuentros/${encounterId}`, {
      headers: getAuthHeaders(),
    })

    if (!response.ok) {
      throw new Error('Encounter detail request failed')
    }

    return await response.json()
  } catch {
    return null
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
  const [countries, setCountries] = useState([])
  const [countriesLoading, setCountriesLoading] = useState(false)
  const [editEventModalOpen, setEditEventModalOpen] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [editEventForm, setEditEventForm] = useState(emptyEditEventForm)
  const [editEventError, setEditEventError] = useState('')
  const [editEventSaving, setEditEventSaving] = useState(false)
  const [stadiums, setStadiums] = useState([])
  const [stadiumsLoading, setStadiumsLoading] = useState(false)
  const [sectors, setSectors] = useState([])
  const [sectorsLoading, setSectorsLoading] = useState(false)
  const [selectedSectors, setSelectedSectors] = useState({})
  const [statusFilter, setStatusFilter] = useState('todos')
  const adminCountryId = getAdminCountryId(user)
  const minEventDate = getTodayInputValue()
  const availableTimeOptions = getAvailableTimeOptions(eventForm.fecha)
  const editAvailableTimeOptions = getAvailableTimeOptions(editEventForm.fecha)

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
      const details = await Promise.all(data.map((encuentro) => loadEncounterDetail(encuentro.id)))
      const encuentrosConDetalle = data.map((encuentro, index) =>
        mergeEncounterDetail(encuentro, details[index])
      )

      setEncuentros(encuentrosConDetalle)
    } catch {
      setEncuentrosError('No se pudieron cargar los encuentros')
    } finally {
      setEncuentrosLoading(false)
    }
  }

  useEffect(() => {
    // Diferimos la carga fuera del render sincrono para no disparar
    // setState de forma sincrona dentro del effect (react-hooks/set-state-in-effect).
    Promise.resolve().then(loadEncuentros)
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

  const loadSectorsByStadium = async (stadiumId, onError = setEventFormError) => {
    if (!stadiumId) {
      setSectors([])
      return []
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
      return data
    } catch {
      onError('No se pudieron cargar los sectores del estadio')
      return []
    } finally {
      setSectorsLoading(false)
    }
  }

  const loadCountries = async () => {
    setCountriesLoading(true)

    try {
      const response = await fetch('http://localhost:8080/api/Paises', {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Countries request failed')
      }

      const data = await response.json()
      setCountries(data)
    } catch {
      setEventFormError('No se pudieron cargar los paises')
    } finally {
      setCountriesLoading(false)
    }
  }

  const loadCurrentEventSectors = async (eventId) => {
    try {
      const response = await fetch(`http://localhost:8080/api/encuentros/${eventId}/sectores`, {
        headers: getAuthHeaders(),
      })

      if (!response.ok) {
        throw new Error('Current event sectors request failed')
      }

      return await response.json()
    } catch {
      setEditEventError('No se pudieron cargar los precios actuales del encuentro')
      return []
    }
  }

  const openCreateEvent = () => {
    setEventForm(emptyEventForm)
    setEventFormError('')
    setSelectedSectors({})
    setSectors([])
    setEventModalOpen(true)
    loadAdminStadiums()
    loadCountries()
  }

  const closeCreateEvent = () => {
    setEventModalOpen(false)
    setEventForm(emptyEventForm)
    setEventFormError('')
    setEventSaving(false)
    setCountries([])
    setCountriesLoading(false)
    setSelectedSectors({})
    setSectors([])
  }

  const updateEventField = (field, value) => {
    setEventForm((current) => {
      const next = { ...current, [field]: value }

      if (field === 'fecha' && next.hora && !getAvailableTimeOptions(value).includes(next.hora)) {
        next.hora = ''
      }

      return next
    })

    if (field === 'estadioId') {
      setSelectedSectors({})
      loadSectorsByStadium(value)
    }
  }

  const toggleSector = (sectorId) => {
    setSelectedSectors((current) => {
      if (current[sectorId]?.locked) {
        return current
      }

      return {
        ...current,
        [sectorId]: {
          selected: !current[sectorId]?.selected,
          precio: current[sectorId]?.precio ?? '',
        },
      }
    })
  }

  const updateSectorPrice = (sectorId, price) => {
    setSelectedSectors((current) => ({
      ...current,
      [sectorId]: {
        locked: current[sectorId]?.locked ?? false,
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

    if (!isFutureEventDateTime(eventForm.fecha, eventForm.hora)) {
      setEventFormError('El encuentro debe ser en una fecha y hora futura')
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

  const openEditEvent = async (encuentro) => {
    if (!canEditEncounter(encuentro, adminCountryId)) {
      return
    }

    const allowedStatusOptions = getAllowedStatusOptions(encuentro.estado)
    const eventDateParts = getDateAndTimeInputValues(encuentro.fecha)

    setSelectedEvent(encuentro)
    setEditEventForm({
      estado: allowedStatusOptions[0]?.value ?? encuentro.estado ?? 'programado',
      fecha: eventDateParts.fecha,
      hora: eventDateParts.hora,
      estadioId: String(encuentro.estadio ?? ''),
    })
    setEditEventError('')
    setSelectedSectors({})
    setSectors([])
    setEditEventModalOpen(true)
    loadAdminStadiums()

    const [stadiumSectors, currentEventSectors] = await Promise.all([
      loadSectorsByStadium(encuentro.estadio, setEditEventError),
      loadCurrentEventSectors(encuentro.id),
    ])

    setSelectedSectors(buildSelectedSectorsFromPrices(stadiumSectors, currentEventSectors))
  }

  const closeEditEvent = () => {
    setEditEventModalOpen(false)
    setSelectedEvent(null)
    setEditEventForm(emptyEditEventForm)
    setEditEventError('')
    setEditEventSaving(false)
    setSelectedSectors({})
    setSectors([])
  }

  const updateEditEventField = (field, value) => {
    setEditEventForm((current) => {
      const next = { ...current, [field]: value }

      if (field === 'fecha' && next.hora && !getAvailableTimeOptions(value).includes(next.hora)) {
        next.hora = ''
      }

      return next
    })

    if (field === 'estadioId') {
      setSelectedSectors({})
      loadSectorsByStadium(value, setEditEventError)
    }
  }

  const submitEditEvent = async (event) => {
    event.preventDefault()

    if (!selectedEvent) {
      return
    }

    setEditEventError('')
    setEditEventSaving(true)

    const selectedSectorPayload = Object.entries(selectedSectors)
      .filter(([, sector]) => sector.selected)
      .map(([sectorId, sector]) => ({
        sectorId: Number(sectorId),
        precio: Number(sector.precio),
      }))

    if (selectedSectorPayload.some((sector) => Number.isNaN(sector.precio))) {
      setEditEventError('Completa el precio de todos los sectores seleccionados')
      setEditEventSaving(false)
      return
    }

    if (canEditMainEventData(selectedEvent) && !isFutureEventDateTime(editEventForm.fecha, editEventForm.hora)) {
      setEditEventError('El encuentro debe quedar en una fecha y hora futura')
      setEditEventSaving(false)
      return
    }

    const payload = {
      estado: editEventForm.estado,
      fecha: `${editEventForm.fecha}T${editEventForm.hora}:00`,
      estadioId: Number(editEventForm.estadioId),
      sectores: selectedSectorPayload,
    }

    try {
      const response = await fetch(`http://localhost:8080/api/encuentros/${selectedEvent.id}`, {
        method: 'PUT',
        headers: getAuthHeaders({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        throw new Error('Update event failed')
      }

      await loadEncuentros()
      closeEditEvent()
    } catch {
      setEditEventError('No se pudo modificar el encuentro')
    } finally {
      setEditEventSaving(false)
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
        <>
          <div className="reservas-tabs encounter-tabs" role="tablist" aria-label="Estados de encuentros">
            {eventStatusTabs.map((tab) => (
              <button
                aria-selected={statusFilter === tab.value}
                className={`reservas-tab ${statusFilter === tab.value ? 'is-active' : ''}`}
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="stadium-grid">
            {getVisibleEncuentros(encuentros, statusFilter).length === 0 ? (
            <p className="matches-status">No hay encuentros disponibles.</p>
          ) : (
            sortEncuentrosByPermission(getVisibleEncuentros(encuentros, statusFilter), adminCountryId).map((encuentro) => (
              <EncuentroCard
                adminCountryId={adminCountryId}
                encuentro={encuentro}
                key={encuentro.id}
                onEdit={() => openEditEvent(encuentro)}
              />
            ))
          )}
          </div>
        </>
      )}

      {eventModalOpen && (
        <CreateEventModal
          error={eventFormError}
          form={eventForm}
          countries={countries}
          countriesLoading={countriesLoading}
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
          minEventDate={minEventDate}
          timeOptions={availableTimeOptions}
        />
      )}

      {editEventModalOpen && selectedEvent && (
        <EditEventModal
          encuentro={selectedEvent}
          error={editEventError}
          form={editEventForm}
          isSaving={editEventSaving}
          onChange={updateEditEventField}
          onClose={closeEditEvent}
          onSectorPriceChange={updateSectorPrice}
          onSectorToggle={toggleSector}
          onSubmit={submitEditEvent}
          sectors={sectors}
          sectorsLoading={sectorsLoading}
          selectedSectors={selectedSectors}
          stadiums={stadiums}
          stadiumsLoading={stadiumsLoading}
          minEventDate={minEventDate}
          timeOptions={editAvailableTimeOptions}
        />
      )}
    </div>
  )
}

function EncuentroCard({ adminCountryId, encuentro, onEdit }) {
  const isOwnCountry = Number(encuentro.pais) === adminCountryId
  const canEdit = canEditEncounter(encuentro, adminCountryId)
  const teamsLabel = getTeamsLabel(encuentro)
  const stadiumLabel = getStadiumLabel(encuentro)
  const countryLabel = getCountryLabel(encuentro, isOwnCountry)

  return (
    <article className="stadium-card event-card">
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
          <strong>{teamsLabel}</strong>
        </p>
        <p>
          <span>Estadio</span>
          <strong>{stadiumLabel}</strong>
        </p>
        <p>
          <span>Pais</span>
          <strong>{countryLabel}</strong>
        </p>
        <p>
          <span>Estado</span>
          <strong>
            <span className={`encounter-status-badge ${getStatusClass(encuentro.estado)}`}>
              {formatStatus(encuentro.estado)}
            </span>
          </strong>
        </p>
      </div>

      {canEdit && (
        <footer className="stadium-actions event-actions">
          <button className="details-button" type="button" onClick={onEdit}>
            <SidebarIcon name="edit" />
            <span>Modificar Encuentro</span>
          </button>
        </footer>
      )}
    </article>
  )
}

function CreateEventModal({
  countries,
  countriesLoading,
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
  minEventDate,
  timeOptions,
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
              <span>Pais Local</span>
              <select
                required
                disabled={countriesLoading}
                value={form.equipoLocalId}
                onChange={(event) => onChange('equipoLocalId', event.target.value)}
              >
                <option value="">{countriesLoading ? 'Cargando paises...' : 'Selecciona un pais'}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.nombre}
                  </option>
                ))}
              </select>
            </label>

            <label>
              <span>Pais Visitante</span>
              <select
                required
                disabled={countriesLoading}
                value={form.equipoVisitanteId}
                onChange={(event) => onChange('equipoVisitanteId', event.target.value)}
              >
                <option value="">{countriesLoading ? 'Cargando paises...' : 'Selecciona un pais'}</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.nombre}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="event-form-grid">
            <label>
              <span>Fecha</span>
              <input
                required
                min={minEventDate}
                type="date"
                value={form.fecha}
                onChange={(event) => onChange('fecha', event.target.value)}
              />
            </label>

            <label>
              <span>Hora</span>
              <select
                required
                disabled={!form.fecha}
                value={form.hora}
                onChange={(event) => onChange('hora', event.target.value)}
              >
                <option value="">
                  {!form.fecha
                    ? 'Selecciona primero una fecha'
                    : timeOptions.length === 0
                      ? 'No quedan horas disponibles hoy'
                      : 'Selecciona una hora'}
                </option>
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

function EditEventModal({
  encuentro,
  error,
  form,
  isSaving,
  minEventDate,
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
  timeOptions,
}) {
  const teamsLabel = getTeamsLabel(encuentro)
  const stadiumLabel = getStadiumLabel(encuentro)
  const allowedStatusOptions = getAllowedStatusOptions(encuentro.estado)
  const canEditMainData = canEditMainEventData(encuentro)

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal event-modal" aria-labelledby="edit-event-modal-title" role="dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <SidebarIcon name="close" />
        </button>

        <h2 id="edit-event-modal-title">Modificar Encuentro</h2>

        <form className="stadium-form" onSubmit={onSubmit}>
          <div className="event-readonly-grid">
            <label>
              <span>Encuentro</span>
              <input disabled value={`#${encuentro.id}`} />
            </label>

            {!canEditMainData && (
              <label>
                <span>Fecha</span>
                <input disabled value={formatDate(encuentro.fecha)} />
              </label>
            )}

            <label>
              <span>Equipos</span>
              <input disabled value={teamsLabel} />
            </label>

            {!canEditMainData && (
              <label>
                <span>Estadio</span>
                <input disabled value={stadiumLabel} />
              </label>
            )}
          </div>

          {canEditMainData && (
            <>
              <div className="event-form-grid">
                <label>
                  <span>Fecha</span>
                  <input
                    required
                    min={minEventDate}
                    type="date"
                    value={form.fecha}
                    onChange={(event) => onChange('fecha', event.target.value)}
                  />
                </label>

                <label>
                  <span>Hora</span>
                  <select
                    required
                    disabled={!form.fecha}
                    value={form.hora}
                    onChange={(event) => onChange('hora', event.target.value)}
                  >
                    <option value="">
                      {!form.fecha
                        ? 'Selecciona primero una fecha'
                        : timeOptions.length === 0
                          ? 'No quedan horas disponibles hoy'
                          : 'Selecciona una hora'}
                    </option>
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
            </>
          )}

          <label>
            <span>Estado</span>
            <select required value={form.estado} onChange={(event) => onChange('estado', event.target.value)}>
              {allowedStatusOptions.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </label>

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
                  const locked = Boolean(selectedSectors[sector.id]?.locked)

                  return (
                    <div className={`event-sector-row ${locked ? 'is-locked' : ''}`} key={sector.id}>
                      <label className="event-sector-check">
                        <input
                          checked={selected}
                          disabled={locked}
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

          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : 'Guardar Cambios'}
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

function getVisibleEncuentros(encuentros, statusFilter) {
  if (statusFilter === 'todos') {
    return encuentros
  }

  return encuentros.filter((encuentro) => encuentro.estado === statusFilter)
}

function canEditEncounter(encuentro, adminCountryId) {
  return Number(encuentro.pais) === adminCountryId && encuentro.estado !== 'finalizado'
}

function canEditMainEventData(encuentro) {
  return encuentro?.estado === 'programado' || encuentro?.estado === 'cancelado'
}

function getAllowedStatusOptions(currentStatus) {
  if (currentStatus === 'programado') {
    return eventStatusOptions.filter((status) =>
      ['programado', 'en_juego', 'cancelado'].includes(status.value)
    )
  }

  if (currentStatus === 'cancelado') {
    return eventStatusOptions.filter((status) => status.value === 'programado')
  }

  if (currentStatus === 'en_juego') {
    return eventStatusOptions.filter((status) => status.value === 'finalizado')
  }

  return []
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

function mergeEncounterDetail(encuentro, detalle) {
  if (!detalle) {
    return encuentro
  }

  return {
    ...encuentro,
    fecha: detalle.fecha ?? encuentro.fecha,
    estado: detalle.estado ?? encuentro.estado,
    equipoLocal: detalle.equipoLocalId ?? encuentro.equipoLocal,
    equipoVisitante: detalle.equipoVisitanteId ?? encuentro.equipoVisitante,
    estadio: detalle.estadioId ?? encuentro.estadio,
    pais: detalle.paisId ?? encuentro.pais,
    equipoLocalNombre: detalle.equipoLocalNombre,
    equipoVisitanteNombre: detalle.equipoVisitanteNombre,
    estadioNombre: detalle.estadioNombre,
    ciudadEstadio: detalle.ciudadEstadio,
    paisNombre: detalle.paisNombre,
  }
}

function getTeamsLabel(encuentro) {
  if (encuentro.equipoLocalNombre && encuentro.equipoVisitanteNombre) {
    return `${encuentro.equipoLocalNombre} vs ${encuentro.equipoVisitanteNombre}`
  }

  return `#${encuentro.equipoLocal} vs #${encuentro.equipoVisitante}`
}

function getStadiumLabel(encuentro) {
  if (encuentro.estadioNombre && encuentro.ciudadEstadio) {
    return `${encuentro.estadioNombre}, ${encuentro.ciudadEstadio}`
  }

  if (encuentro.estadioNombre) {
    return encuentro.estadioNombre
  }

  return `#${encuentro.estadio}`
}

function getCountryLabel(encuentro, isOwnCountry) {
  if (encuentro.paisNombre) {
    return isOwnCountry ? `${encuentro.paisNombre} (tu pais)` : encuentro.paisNombre
  }

  return isOwnCountry ? `Tu pais (#${encuentro.pais})` : `Pais #${encuentro.pais}`
}

function buildSelectedSectorsFromPrices(stadiumSectors, currentEventSectors) {
  const sectorsByName = new Map(
    stadiumSectors.map((sector) => [normalizeSectorName(sector.nombre), sector.id])
  )

  return currentEventSectors.reduce((selected, sectorPrice) => {
    const sectorId =
      getSectorIdFromPriceRow(sectorPrice) ?? sectorsByName.get(normalizeSectorName(sectorPrice.sector))

    if (!sectorId) {
      return selected
    }

    return {
      ...selected,
      [sectorId]: {
        locked: true,
        selected: true,
        precio: String(sectorPrice.precio ?? ''),
      },
    }
  }, {})
}

function getSectorIdFromPriceRow(sectorPrice) {
  const possibleId =
    sectorPrice.sectorId ??
    sectorPrice.idSector ??
    sectorPrice.id_sector ??
    sectorPrice.fkSector ??
    sectorPrice.fk_sector

  const parsedId = Number(possibleId)

  return Number.isInteger(parsedId) ? parsedId : null
}

function normalizeSectorName(name) {
  return String(name ?? '').trim().toLowerCase()
}

const timeOptions = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0')
  const minutes = index % 2 === 0 ? '00' : '30'

  return `${hours}:${minutes}`
})

function getTodayInputValue() {
  return formatDateInputValue(new Date())
}

function getAvailableTimeOptions(selectedDate) {
  if (!selectedDate) {
    return timeOptions
  }

  const today = getTodayInputValue()

  if (selectedDate < today) {
    return []
  }

  if (selectedDate > today) {
    return timeOptions
  }

  const now = new Date()
  const currentMinutes = now.getHours() * 60 + now.getMinutes()

  return timeOptions.filter((time) => timeToMinutes(time) > currentMinutes)
}

function isFutureEventDateTime(date, time) {
  if (!date || !time) {
    return false
  }

  return new Date(`${date}T${time}:00`) > new Date()
}

function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number)

  return hours * 60 + minutes
}

function formatDateInputValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function getDateAndTimeInputValues(date) {
  if (!date) {
    return { fecha: '', hora: '' }
  }

  const eventDate = new Date(date)

  return {
    fecha: formatDateInputValue(eventDate),
    hora: eventDate.toTimeString().slice(0, 5),
  }
}

function formatStatus(status) {
  const option = eventStatusOptions.find((currentStatus) => currentStatus.value === status)

  return option?.label ?? 'Sin estado'
}

function getStatusClass(status) {
  return `is-${String(status ?? 'unknown').replace('_', '-')}`
}

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
