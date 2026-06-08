import SidebarIcon from '../shared/SidebarIcon'

function StadiumModal({ error, form, isSaving, mode, onChange, onClose, onSubmit }) {
  const title = mode === 'create' ? 'Crear Nuevo Estadio' : 'Detalles del Estadio'
  const buttonText = mode === 'create' ? 'Crear Estadio' : 'Guardar Cambios'

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="stadium-modal" aria-labelledby="stadium-modal-title" role="dialog">
        <button className="modal-close" type="button" onClick={onClose} aria-label="Cerrar">
          <SidebarIcon name="close" />
        </button>

        <h2 id="stadium-modal-title">{title}</h2>

        <form className="stadium-form" onSubmit={onSubmit}>
          <label>
            <span>Nombre del Estadio</span>
            <input
              required
              placeholder="Ej: Santiago Bernabeu"
              value={form.nombre}
              onChange={(event) => onChange('nombre', event.target.value)}
            />
          </label>

          <label>
            <span>Ciudad</span>
            <input
              required
              placeholder="Ej: Madrid"
              value={form.ciudad}
              onChange={(event) => onChange('ciudad', event.target.value)}
            />
          </label>

          <label>
            <span>Pais</span>
            <input
              required
              inputMode="numeric"
              placeholder="Ej: 1"
              value={form.paisSedeId}
              onChange={(event) => onChange('paisSedeId', event.target.value)}
            />
          </label>

          {mode === 'edit' && (
            <label>
              <span>Capacidad Total</span>
              <input disabled placeholder="Bloqueado hasta tener endpoint de sectores" />
            </label>
          )}

          {error && <p className="modal-error">{error}</p>}

          <button className="modal-submit" type="submit" disabled={isSaving}>
            {isSaving ? 'Guardando...' : buttonText}
          </button>
        </form>
      </section>
    </div>
  )
}

export default StadiumModal
