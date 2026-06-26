import { API_URL } from '../config.js'
import { useEffect, useState } from 'react'

function getAuthHeaders(extraHeaders = {}) {
  const token = localStorage.getItem('ticketmatch-token')
  return { ...extraHeaders, Authorization: `Bearer ${token}` }
}

function ComisionAdmin() {
  const [vigente, setVigente] = useState(null)
  const [historial, setHistorial] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [form, setForm] = useState({ porcentaje: '', fechaInicio: '', fechaFin: '' })
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleteError, setDeleteError] = useState('')

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [resVigente, resHistorial] = await Promise.all([
        fetch(`${API_URL}/api/comision/vigente`, { headers: getAuthHeaders() }),
        fetch(`${API_URL}/api/comision`, { headers: getAuthHeaders() }),
      ])
      if (resVigente.ok) setVigente(await resVigente.json())
      if (resHistorial.ok) setHistorial(await resHistorial.json())
    } catch {
      setError('No se pudieron cargar las comisiones')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { Promise.resolve().then(loadData) }, [])

  const openModal = () => {
    setForm({ porcentaje: '', fechaInicio: '', fechaFin: '' })
    setFormError('')
    setModalOpen(true)
  }

  const closeModal = () => {
    setModalOpen(false)
    setFormError('')
    setSaving(false)
  }

  const deleteComision = async (id) => {
    setDeleteError('')
    setDeletingId(id)
    try {
      const res = await fetch(`${API_URL}/api/comision/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      })
      if (res.status === 409) {
        const body = await res.json()
        setDeleteError(body.message ?? 'No se puede eliminar: tiene compras asociadas')
        return
      }
      if (!res.ok) throw new Error()
      await loadData()
    } catch {
      setDeleteError('No se pudo eliminar la comisión')
    } finally {
      setDeletingId(null)
    }
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setFormError('')
    setSaving(true)
    try {
      const res = await fetch(`${API_URL}/api/comision`, {
        method: 'POST',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          porcentaje: Number(form.porcentaje),
          fechaInicio: form.fechaInicio,
          fechaFin: form.fechaFin || null,
        }),
      })
      if (!res.ok) throw new Error()
      await loadData()
      closeModal()
    } catch {
      setFormError('No se pudo crear la comisión')
    } finally {
      setSaving(false)
    }
  }

  const pctActual = vigente?.porcentaje ?? 0

  return (
    <div className="ac-view">
      <header className="ac-header">
        <div>
          <h1 id="dashboard-title">Gestión de Comisiones</h1>
          <p>Comisión aplicada sobre transferencias de entradas</p>
        </div>
        <button className="ac-btn-primary" type="button" onClick={openModal}>
          <PlusIconC />
          Nueva Comisión
        </button>
      </header>

      {/* Hero con comisión vigente */}
      <div className="ac-comision-hero">
        <div>
          <div className="ac-comision-hero-label">Comisión vigente hoy</div>
          <div className="ac-comision-hero-value">{pctActual}%</div>
          <div className="ac-comision-hero-sub">
            {pctActual === 0
              ? 'Sin comisión activa — las transferencias no tienen cargo'
              : `Cada transferencia aceptada aplica ${pctActual}% de comisión`}
          </div>
        </div>
        <PercentIconC />
      </div>

      {loading && <p className="matches-status">Cargando comisiones...</p>}
      {error && <p className="matches-status is-error">{error}</p>}

      {!loading && !error && (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, fontWeight: 700, color: '#130F1E' }}>
            Historial de comisiones
          </div>
          {deleteError && (
            <p className="matches-status is-error" style={{ marginBottom: 10 }}>{deleteError}</p>
          )}
          {historial.length === 0 ? (
            <p className="matches-status">No hay comisiones registradas.</p>
          ) : (
            <div className="ac-comision-list">
              {historial.map((c) => {
                const esActiva = vigente?.idComision === c.id
                return (
                  <div key={c.id} className={`ac-comision-row ${esActiva ? 'is-active' : ''}`}>
                    <div className="ac-comision-pct">{c.porcentaje}%</div>
                    <div className="ac-comision-dates">
                      Desde {formatDate(c.fechaInicio)}
                      {c.fechaFin ? ` hasta ${formatDate(c.fechaFin)}` : ' · sin fecha de fin'}
                    </div>
                    <span className={`ac-comision-badge ${esActiva ? 'is-active' : 'is-inactive'}`}>
                      {esActiva ? 'Vigente' : 'Inactiva'}
                    </span>
                    <button
                      className="ac-btn-delete"
                      type="button"
                      disabled={deletingId === c.id}
                      onClick={() => deleteComision(c.id)}
                      aria-label={`Eliminar comisión ${c.porcentaje}%`}
                    >
                      <TrashIconC />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <section className="stadium-modal" aria-labelledby="comision-modal-title" role="dialog">
            <button className="modal-close" type="button" onClick={closeModal} aria-label="Cerrar">✕</button>
            <h2 id="comision-modal-title">Nueva Comisión</h2>
            <form className="stadium-form" onSubmit={submitForm}>
              <label>
                <span>Porcentaje (%)</span>
                <input
                  required
                  inputMode="decimal"
                  min="0"
                  max="100"
                  step="0.01"
                  placeholder="Ej: 5.00"
                  value={form.porcentaje}
                  onChange={(e) => setForm((f) => ({ ...f, porcentaje: e.target.value }))}
                />
              </label>
              <label>
                <span>Fecha de inicio</span>
                <input
                  required
                  type="date"
                  value={form.fechaInicio}
                  onChange={(e) => setForm((f) => ({ ...f, fechaInicio: e.target.value }))}
                />
              </label>
              <label>
                <span>Fecha de fin (opcional)</span>
                <input
                  type="date"
                  value={form.fechaFin}
                  onChange={(e) => setForm((f) => ({ ...f, fechaFin: e.target.value }))}
                />
              </label>
              {formError && <p className="modal-error">{formError}</p>}
              <button className="modal-submit" type="submit" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear Comisión'}
              </button>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('es-UY', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function PlusIconC() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
      <line x1="7" y1="1" x2="7" y2="13" /><line x1="1" y1="7" x2="13" y2="7" />
    </svg>
  )
}

function PercentIconC() {
  return (
    <svg viewBox="0 0 48 48" width="64" height="64" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <circle cx="16" cy="16" r="8" /><circle cx="32" cy="32" r="8" /><line x1="40" y1="8" x2="8" y2="40" />
    </svg>
  )
}

function TrashIconC() {
  return (
    <svg viewBox="0 0 14 14" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="1,3 13,3" /><path d="M5 3V2h4v1" /><path d="M2 3l1 9h8l1-9" /><line x1="5.5" y1="6" x2="5.5" y2="10" /><line x1="8.5" y1="6" x2="8.5" y2="10" />
    </svg>
  )
}

export default ComisionAdmin
