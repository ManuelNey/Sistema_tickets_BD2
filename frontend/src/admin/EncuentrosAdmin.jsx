import { useEffect, useState } from 'react'
import SidebarIcon from '../shared/SidebarIcon'
import { flagUrl } from '../usuario/teamFlags'

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

async function getResponseErrorMessage(response, fallbackMessage) {
  let detail

  try {
    const contentType = response.headers.get('content-type') ?? ''

    if (contentType.includes('application/json')) {
      const data = await response.json()
      detail = data?.message ?? data?.title ?? data?.detail ?? data?.error ?? ''
    } else {
      detail = await response.text()
    }
  } catch {
    detail = ''
  }

  detail = String(detail).trim()

  if (detail) {
    return detail
  }

  if (response.status === 401 || response.status === 403) {
    return 'No tenes permiso para crear este encuentro o el estadio no pertenece a tu pais sede.'
  }

  if (response.status === 400 || response.status === 409) {
    return 'No se pudo crear el encuentro porque hay datos invalidos o existe un conflicto de horario.'
  }

  return `${fallbackMessage} (error ${response.status})`
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
  const [searchQuery, setSearchQuery] = useState('')
  const [funcionariosEncuentro, setFuncionariosEncuentro] = useState(null)
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

      if (field === 'equipoLocalId' && value === next.equipoVisitanteId) {
        next.equipoVisitanteId = ''
      }

      if (field === 'equipoVisitanteId' && value === next.equipoLocalId) {
        next.equipoLocalId = ''
      }

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
        const message = await getResponseErrorMessage(response, 'No se pudo crear el encuentro')
        throw new Error(message)
      }

      await loadEncuentros()
      closeCreateEvent()
    } catch (error) {
      setEventFormError(error.message || 'No se pudo crear el encuentro')
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

  const filteredEncuentros = sortEncuentrosByPermission(
    getVisibleEncuentros(encuentros, statusFilter),
    adminCountryId
  ).filter((e) => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return true
    const label = getTeamsLabel(e).toLowerCase()
    const estadio = getStadiumLabel(e).toLowerCase()
    return label.includes(q) || estadio.includes(q)
  })

  return (
    <div className="ac-view">
      <header className="ac-header">
        <div>
          <h1 id="dashboard-title">Gestión de Encuentros</h1>
          <p>Administrá partidos, precios y funcionarios asignados</p>
        </div>
        <button className="ac-btn-primary" type="button" onClick={openCreateEvent}>
          <PlusIconE />
          Crear Encuentro
        </button>
      </header>

      {encuentrosLoading && <p className="matches-status">Cargando encuentros...</p>}
      {encuentrosError && <p className="matches-status is-error">{encuentrosError}</p>}

      {!encuentrosLoading && !encuentrosError && (
        <>
          <div className="ac-filterbar">
            <label className="ac-search">
              <SearchIconE />
              <input
                placeholder="Buscar partido o equipo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
          </div>

          <div className="ac-tabs" role="tablist" aria-label="Estados de encuentros">
            {eventStatusTabs.map((tab) => (
              <button
                aria-selected={statusFilter === tab.value}
                className={`ac-tab ${statusFilter === tab.value ? 'is-active' : ''}`}
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                role="tab"
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="ac-grid">
            {filteredEncuentros.length === 0 ? (
              <p className="matches-status">No hay encuentros disponibles.</p>
            ) : (
              filteredEncuentros.map((encuentro) => (
                <EncuentroCard
                  adminCountryId={adminCountryId}
                  encuentro={encuentro}
                  key={encuentro.id}
                  onEdit={() => openEditEvent(encuentro)}
                  onFuncionarios={() => setFuncionariosEncuentro(encuentro)}
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

      {funcionariosEncuentro && (
        <FuncionariosModal
          encuentro={funcionariosEncuentro}
          onClose={() => setFuncionariosEncuentro(null)}
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

function EncuentroCard({ adminCountryId, encuentro, onEdit, onFuncionarios }) {
  const canEdit = canEditEncounter(encuentro, adminCountryId)
  const localName  = encuentro.equipoLocalNombre    ?? `Equipo #${encuentro.equipoLocal}`
  const visitName  = encuentro.equipoVisitanteNombre ?? `Equipo #${encuentro.equipoVisitante}`
  const fechaDt    = encuentro.fecha ? new Date(encuentro.fecha) : null
  const fechaStr   = fechaDt ? fechaDt.toLocaleDateString('es-UY', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'
  const horaStr    = fechaDt ? fechaDt.toLocaleTimeString('es-UY', { hour: '2-digit', minute: '2-digit' }) : '—'
  const estadioLabel = getStadiumLabel(encuentro)
  const sectoresCount = encuentro.sectoresHabilitados ?? encuentro.sectores ?? null

  return (
    <article className="ac-card">
      <div className="ac-card-head">
        <div className="ac-match-meta">
          <div className="ac-competition-badge">
            <span className="ac-badge-dot" />
            Copa Mundial FIFA 2026
          </div>
          <span className={`ac-status-badge is-${encuentro.estado ?? 'programado'}`}>
            {formatStatus(encuentro.estado)}
          </span>
        </div>

        <div className="ac-vs-grid">
          <div className="ac-team">
            <TeamFlag name={localName} />
            <span className="ac-team-name">{localName}</span>
          </div>
          <div className="ac-vs-circle">VS</div>
          <div className="ac-team">
            <TeamFlag name={visitName} />
            <span className="ac-team-name">{visitName}</span>
          </div>
        </div>
      </div>

      <div className="ac-card-body">
        <div className="ac-match-info">
          <div>
            <span className="ac-info-label">Fecha</span>
            <div className="ac-info-row">
              <CalIconE />
              <span className="ac-info-value">{fechaStr}</span>
            </div>
          </div>
          <div>
            <span className="ac-info-label">Hora</span>
            <div className="ac-info-row">
              <ClockIconE />
              <span className="ac-info-value">{horaStr}</span>
            </div>
          </div>
          <div className="full-width">
            <span className="ac-info-label">Estadio</span>
            <div className="ac-info-row">
              <PinIconE />
              <span className="ac-info-value">{estadioLabel}</span>
            </div>
          </div>
        </div>

        {sectoresCount !== null && (
          <div className="ac-sectors-pill">
            <SectorsIconE />
            {sectoresCount} sectores habilitados
          </div>
        )}

        <div className="ac-divider" />

        <div className="ac-actions">
          <button className="ac-btn-outline" type="button" onClick={onFuncionarios}>
            <FuncIconE />
            Funcionarios
          </button>
          {canEdit && (
            <button className="ac-btn-outline" type="button" onClick={onEdit}>
              <EditIconE />
              Modificar
            </button>
          )}
        </div>
      </div>
    </article>
  )
}

function TeamFlag({ name }) {
  const [imgError, setImgError] = useState(false)
  const src = flagUrl(name)

  if (!name) return null

  if (src && !imgError) {
    return (
      <img
        className="ac-team-flag-img"
        src={src}
        alt={`Bandera de ${name}`}
        loading="lazy"
        onError={() => setImgError(true)}
      />
    )
  }

  return <span className="ac-team-flag-fb">{name.slice(0, 2).toUpperCase()}</span>
}

function PlusIconE() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}
function SearchIconE() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="#B0ACBA" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5l3 3" />
    </svg>
  )
}
function CalIconE() {
  return (
    <svg className="ac-info-icon" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="1" y="1.5" width="10" height="9" rx="1.5" /><line x1="1" y1="4.5" x2="11" y2="4.5" />
      <line x1="3.5" y1="0.5" x2="3.5" y2="3" /><line x1="8.5" y1="0.5" x2="8.5" y2="3" />
    </svg>
  )
}
function ClockIconE() {
  return (
    <svg className="ac-info-icon" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="6" r="4.5" /><polyline points="6 3.5 6 6 7.5 7.5" />
    </svg>
  )
}
function PinIconE() {
  return (
    <svg className="ac-info-icon" viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <path d="M6 11S2 7.5 2 5a4 4 0 0 1 8 0c0 2.5-4 6-4 6z" /><circle cx="6" cy="5" r="1.5" />
    </svg>
  )
}
function SectorsIconE() {
  return (
    <svg viewBox="0 0 10 10" width="8" height="8" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden="true">
      <rect x="0.5" y="0.5" width="3.5" height="3.5" rx="0.5" /><rect x="6" y="0.5" width="3.5" height="3.5" rx="0.5" />
      <rect x="0.5" y="6" width="3.5" height="3.5" rx="0.5" /><rect x="6" y="6" width="3.5" height="3.5" rx="0.5" />
    </svg>
  )
}
function EditIconE() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 1.5a1.4 1.4 0 0 1 2 2L3 11l-3 1 1-3L8.5 1.5z" />
    </svg>
  )
}
function FuncIconE() {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="6" cy="4" r="2.5" /><path d="M1 11c0-2.8 2.2-5 5-5s5 2.2 5 5" />
    </svg>
  )
}

function FuncionariosModal({ encuentro, onClose }) {
  const [asignaciones, setAsignaciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [todos, setTodos] = useState([])
  const [saving, setSaving] = useState(false)

  const localName = encuentro.equipoLocalNombre ?? `Equipo #${encuentro.equipoLocal}`
  const visitName = encuentro.equipoVisitanteNombre ?? `Equipo #${encuentro.equipoVisitante}`

  // Carga asignaciones y lista de todos los funcionarios
  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        const [resAsig, resTodos] = await Promise.all([
          fetch(`http://localhost:8080/api/trabajaen/encuentro/${encuentro.id}`, { headers: getAuthHeaders() }),
          fetch('http://localhost:8080/api/funcionarios/admin', { headers: getAuthHeaders() }),
        ])
        if (!resAsig.ok || !resTodos.ok) throw new Error()
        setAsignaciones(await resAsig.json())
        setTodos(await resTodos.json())
      } catch {
        setError('No se pudieron cargar los datos')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [encuentro.id])

  // Agrupación en JS: filas planas → { habilitaId → { sectorNombre, funcionarios[] } }
  const sectores = Object.values(
    asignaciones.reduce((acc, row) => {
      if (!acc[row.habilitaId]) {
        acc[row.habilitaId] = { habilitaId: row.habilitaId, sectorNombre: row.sectorNombre, funcionarios: [] }
      }

      if (row.funcionarioMail) {
        acc[row.habilitaId].funcionarios.push({
          mail: row.funcionarioMail,
          nombre: row.nombreFuncionario,
          apellido: row.apellidoFuncionario,
        })
      }

      return acc
    }, {})
  )

  const asignar = async (habilitaId, mail) => {
    setSaving(true)
    try {
      const res = await fetch('http://localhost:8080/api/trabajaen', {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ funcionarioMail: mail, habilitaId }),
      })
      if (!res.ok) throw new Error()
      const updated = await fetch(`http://localhost:8080/api/trabajaen/encuentro/${encuentro.id}`, { headers: getAuthHeaders() })
      setAsignaciones(await updated.json())
    } catch {
      setError('No se pudo asignar el funcionario')
    } finally {
      setSaving(false)
    }
  }

  const desasignar = async (habilitaId, mail) => {
    setSaving(true)
    try {
      const res = await fetch(`http://localhost:8080/api/trabajaen?funcionarioMail=${encodeURIComponent(mail)}&habilitaId=${habilitaId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (!res.ok) throw new Error()
      setAsignaciones((prev) => prev.filter((r) => !(r.habilitaId === habilitaId && r.funcionarioMail === mail)))
    } catch {
      setError('No se pudo quitar el funcionario')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="func-modal" aria-labelledby="func-modal-title" role="dialog">
        <div className="func-modal-head">
          <div>
            <span className="func-modal-match">
              <TeamFlag name={localName} /> {localName} vs <TeamFlag name={visitName} /> {visitName}
            </span>
            <h2 id="func-modal-title">Funcionarios por sector</h2>
          </div>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {loading && <p className="matches-status">Cargando...</p>}
        {error && <p className="matches-status is-error">{error}</p>}

        {!loading && !error && (
          <div className="func-modal-body">
            {sectores.length === 0 && (
              <p className="matches-status">Este encuentro no tiene sectores habilitados.</p>
            )}

            {sectores.map((sector) => {
              const asignados = new Set(sector.funcionarios.map((f) => f.mail))
              const disponibles = todos.filter((f) => !asignados.has(f.mail))

              return (
                <div className="func-sector" key={sector.habilitaId}>
                  <div className="func-sector-title">{sector.sectorNombre}</div>

                  {sector.funcionarios.length === 0 ? (
                    <p className="func-empty">Sin funcionarios asignados</p>
                  ) : (
                    <ul className="func-list">
                      {sector.funcionarios.map((f) => (
                        <li key={f.mail} className="func-row">
                          <span>{f.nombre} {f.apellido}</span>
                          <span className="func-mail">{f.mail}</span>
                          <button
                            className="func-btn-remove"
                            type="button"
                            disabled={saving}
                            onClick={() => desasignar(sector.habilitaId, f.mail)}
                          >
                            Quitar
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {disponibles.length > 0 && (
                    <div className="func-add-row">
                      <select
                        className="func-select"
                        defaultValue=""
                        disabled={saving}
                        onChange={(e) => { if (e.target.value) asignar(sector.habilitaId, e.target.value) }}
                      >
                        <option value="" disabled>Agregar funcionario...</option>
                        {disponibles.map((f) => (
                          <option key={f.mail} value={f.mail}>{f.nombre} {f.apellido}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
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
  const localOptions = countries.filter(
    (country) => String(country.id) !== String(form.equipoVisitanteId)
  )
  const visitorOptions = countries.filter(
    (country) => String(country.id) !== String(form.equipoLocalId)
  )

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
                {localOptions.map((country) => (
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
                {visitorOptions.map((country) => (
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
