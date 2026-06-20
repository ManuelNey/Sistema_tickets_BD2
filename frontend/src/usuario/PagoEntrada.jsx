import { useState } from 'react'
import Countdown from './Countdown'
import { formatPrice, getExpiracion } from './format'

// Pantalla  que tiene la Parte de Compra de la reserva. 
// Tiene el resumen del pedido y el formulario de pago.
function PagoEntrada({ pedido, onPagoExitoso, onVolver }) {
  const [numero, setNumero] = useState('')
  const [nombre, setNombre] = useState('')
  const [vencimiento, setVencimiento] = useState('')
  const [cvv, setCvv] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // El total real (con comisión) lo define el back; el cargo se deriva de ese total.
  const subtotal = pedido.precioUnitario * pedido.cantidad
  const total = pedido.montoTotal
  const cargo = total - subtotal
  const expiraMs = getExpiracion(pedido.fechaReserva)

  const handleConfirmarPago = async (event) => {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('ticketmatch-token')
      // Los datos de tarjeta son simulados.
      // No los enviamos al backend porque no tenemos una pasarela de pagos real ni queremos guardar datos sensibles en el backend.
      // Si se hace en un futuro correspondería implementar un endpoint específico para procesar el pago
      // que a su vez se integraría con la pasarela real.
      const response = await fetch(
        `http://localhost:8080/api/compra/${pedido.idCompra}/confirmar`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      )

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message ?? 'No se pudo confirmar el pago')
      }

      onPagoExitoso({
        ordenCodigo: pedido.codigoReserva,
        equipoLocal: pedido.equipoLocal,
        equipoVisitante: pedido.equipoVisitante,
        fechaPartido: pedido.fecha,
        horaPartido: pedido.hora,
        estadio: pedido.estadio,
        sector: pedido.sector,
        cantidad: pedido.cantidad,
        totalConCargo: total,
      })
    } catch (err) {
      setError(err.message || 'No se pudo confirmar el pago')
    } finally {
      setSubmitting(false)
    }
  }



  return (
    // vista de pago con el formulario y el resumen del pedido.
    <div className="pago-view">
      <header className="pago-topbar">
        <div className="compra-topbar-brand">
          <span className="compra-topbar-logo">
            <CardIcon />
          </span>
          <div>
            <strong>
              {pedido.equipoLocal} vs {pedido.equipoVisitante}
            </strong>
            <span>Completá el pago antes de que expire tu reserva</span>
          </div>
        </div>

        <Countdown expiraMs={expiraMs} />
      </header>

      <div className="pago-layout">
        <form className="pago-card" onSubmit={handleConfirmarPago}>
          <h3>
            <CardIcon />
            Datos de pago
          </h3>

          <div className="pago-field">
            <label htmlFor="numero">Numero de tarjeta</label>
            <input
              id="numero"
              inputMode="numeric"
              placeholder="0000 0000 0000 0000"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
            />
          </div>

          <div className="pago-field">
            <label htmlFor="nombre">Nombre en la tarjeta</label>
            <input
              id="nombre"
              placeholder="NOMBRE APELLIDO"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
            />
          </div>

          <div className="pago-row">
            <div className="pago-field">
              <label htmlFor="venc">Vencimiento</label>
              <input
                id="venc"
                placeholder="MM/AA"
                value={vencimiento}
                onChange={(e) => setVencimiento(e.target.value)}
              />
            </div>
            <div className="pago-field">
              <label htmlFor="cvv">CVV</label>
              <input
                id="cvv"
                inputMode="numeric"
                placeholder="000"
                value={cvv}
                onChange={(e) => setCvv(e.target.value)}
              />
            </div>
          </div>

          {error && <p className="modal-error">{error}</p>}

          <p className="pago-ssl">Pago seguro con cifrado SSL de 256 bits</p>

          <button className="btn-secondary" type="button" onClick={onVolver} style={{ marginRight: 8 }}>
            Volver
          </button>
        </form>

        <aside className="pedido-card">
          <h3>
            <TicketIcon />
            Tu pedido
          </h3>

          <p className="pedido-comp">Copa Mundial FIFA 2026</p>
          <p style={{ margin: '0.25rem 0 1rem', fontWeight: 600 }}>
            {pedido.equipoLocal} vs {pedido.equipoVisitante}
          </p>

          <dl className="pedido-rows">
            <div>
              <dt>Seccion</dt>
              <dd>{pedido.sector}</dd>
            </div>
            <div>
              <dt>Cantidad</dt>
              <dd>{pedido.cantidad}</dd>
            </div>
            <div>
              <dt>Subtotal</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div>
              <dt>Cargo por servicio</dt>
              <dd>{formatPrice(cargo)}</dd>
            </div>
          </dl>

          <div className="pedido-total">
            <span>Total</span>
            <strong>{formatPrice(total)}</strong>
          </div>

          <button className="btn-primary" type="button" onClick={handleConfirmarPago} disabled={submitting} style={{ width: '100%' }}>
            {submitting ? 'Procesando...' : 'Confirmar pago'}
          </button>
        </aside>
      </div>
    </div>
  )
}


// Icono de tarjetita para el resumen del pedido.
function CardIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18v12H3z" />
      <path d="M3 10h18" />
    </svg>
  )
}

//Icono de tarjetita para el resumen del pedido.
function TicketIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" />
    </svg>
  )
}

export default PagoEntrada
