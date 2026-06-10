import { formatDate, formatPrice, formatTime } from './format'


// Es la pantalla final cuando la compra se registra correstamente.
function CompraExitosa({ resumen, onVolver }) {
  const cantidad = resumen.cantidad ?? resumen.idsEntradas?.length ?? 1

  return (
    <div className="exito-view">
      <article className="exito-card">
        <div className="exito-check">
          <CheckIcon />
        </div>

        <h1>Compra exitosa!</h1>
        <p className="exito-sub">Tu pedido ha sido procesado correctamente</p>

        <div className="exito-detalle">
          <div className="exito-orden">
            <span>Numero de orden</span>
            <strong>{resumen.ordenCodigo}</strong>
          </div>

          <DetalleLinea
            icon={<TicketIcon />}
            label="Partido"
            value={`${resumen.equipoLocal} vs ${resumen.equipoVisitante}`}
          />
          <DetalleLinea
            icon={<CalendarIcon />}
            label="Fecha y hora"
            value={`${formatDate(resumen.fechaPartido)} - ${formatTime(resumen.horaPartido)}`}
          />
          <DetalleLinea
            icon={<PinIcon />}
            label="Ubicacion"
            value={resumen.ciudadEstadio ? `${resumen.estadio}, ${resumen.ciudadEstadio}` : resumen.estadio}
          />

          <div className="exito-rows">
            <div>
              <span>Seccion</span>
              <strong>{resumen.sector}</strong>
            </div>
            <div>
              <span>Cantidad</span>
              <strong>
                {cantidad} {cantidad === 1 ? 'entrada' : 'entradas'}
              </strong>
            </div>
          </div>

          <div className="exito-total">
            <span>Total pagado</span>
            <strong>{formatPrice(resumen.totalConCargo ?? resumen.montoTotal)}</strong>
          </div>
        </div>

        <p className="exito-nota">
          Se ha enviado un correo electronico de confirmacion con tus entradas en formato QR.
          Presenta el codigo QR en la entrada del estadio.
        </p>

        <div className="exito-actions">
          <button className="exito-download" type="button" disabled>
            <DownloadIcon />
            Descargar Entradas
          </button>
          <button className="exito-home" type="button" onClick={onVolver}>
            <HomeIcon />
            Volver al Inicio
          </button>
        </div>
      </article>
    </div>
  )
}

function DetalleLinea({ icon, label, value }) {
  return (
    <p className="exito-linea">
      <span className="exito-linea-icon">{icon}</span>
      <span className="exito-linea-text">
        <span>{label}</span>
        <strong>{value}</strong>
      </span>
    </p>
  )
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
  )
}

function TicketIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
    </svg>
  )
}

function CalendarIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 5h12v14H6z" />
      <path d="M8 3v4M16 3v4M6 9h12" />
    </svg>
  )
}

function PinIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
      <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
    </svg>
  )
}

function DownloadIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 4v10M8 11l4 4 4-4M5 19h14" />
    </svg>
  )
}

function HomeIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 11l8-6 8 6M6 10v9h12v-9" />
    </svg>
  )
}

export default CompraExitosa
