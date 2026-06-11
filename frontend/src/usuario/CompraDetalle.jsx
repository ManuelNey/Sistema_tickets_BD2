import { useEffect, useMemo, useState } from 'react'
import { TrophyIcon } from './matchIcons'
import { calcularTotales, formatDate, formatPrice, formatTime } from './format'

const MAX_ENTRADAS = 5

// Pantalla de compra: el usuario elige seccion + cantidad que quiera reservar, y luego confirma para avanzar con el pago.
function CompraDetalle({ match, onVolver, onReservaExitosa }) {
  const [sectores, setSectores] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [idHabilitaSel, setIdHabilitaSel] = useState(null)
  const [cantidad, setCantidad] = useState(1)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')


  useEffect(() => {
    const loadSectores = async () => {
      setError('')
      setLoading(true)

      try {
        const token = localStorage.getItem('ticketmatch-token')
        const response = await fetch(
          `http://localhost:8080/api/encuentros/${match.idEncuentro}/sectores`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        )

        if (!response.ok) {
          throw new Error('Sectores request failed')
        }

        const data = await response.json()
        setSectores(data)
      } catch {
        setError('No se pudieron cargar los sectores')
      } finally {
        setLoading(false)
      }
    }

    loadSectores()
  }, [match.idEncuentro])

  const sectorSeleccionado = useMemo(
    () => sectores.find((s) => s.idHabilita === idHabilitaSel) ?? null,
    [sectores, idHabilitaSel],
  )

  // El tope de entradas es 5, pero por las dudas miramos también que nunca mas que los cupos disponibles del sector elegido.
  const maxCantidad = sectorSeleccionado
    ? Math.min(MAX_ENTRADAS, sectorSeleccionado.disponibles)
    : MAX_ENTRADAS

  const handleSelectSector = (sector) => {
    setIdHabilitaSel(sector.idHabilita)
    setCantidad(1)
    setSubmitError('')
  }

  const { subtotal, cargo, total } = calcularTotales(sectorSeleccionado?.precio, cantidad)

  const handleReservar = async () => {
    if (!sectorSeleccionado) {
      return
    }

    setSubmitError('')
    setSubmitting(true)

    try {
      const token = localStorage.getItem('ticketmatch-token')
      const response = await fetch('http://localhost:8080/api/compra/reservar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          idHabilita: sectorSeleccionado.idHabilita,
          cantidad,
        }),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        throw new Error(body?.message ?? 'Reserva fallida')
      }

      const data = await response.json()  // 
      // En este punto la reserva ya se hizo, y el back devuelve el idCompra.
      // Aún no tenemos un GET para traer el detalle de una reserva, asi que hacemos un mock.

      //Armamos la reserva exitasa y vamos a larte del countdown, pasando toda la info que tenemos a mano (y un codigo de reserva generado a partir del idCompra).
      onReservaExitosa({
        //Los datos despues del idCompra son para mostrar en el countdown, falta el GET de la reserva.
        idCompra: data.idCompra,
        codigoReserva: `RSV-${String(data.idCompra).padStart(6, '0')}`,
        equipoLocal: match.equipoLocal,
        equipoVisitante: match.equipoVisitante,
        fecha: match.fecha,
        hora: match.hora,
        estadio: match.estadio,
        sector: sectorSeleccionado.sector,
        precioUnitario: sectorSeleccionado.precio,
        cantidad,
        // Usamos el momento actual para el countdown (cuando exista el GET, vendra del back).
        fechaReserva: new Date().toISOString(),
      })
    } catch (err) {
      setSubmitError(err.message || 'No se pudo completar la reserva. Intenta nuevamente.')
    } finally {
      setSubmitting(false)
    }
  }


  // Render principal que muestra el detalle del partido, sector y cantidad comprada.
  return (
    <div className="compra-view">
      <header className="compra-topbar">
        <div className="compra-topbar-brand">
          <span className="compra-topbar-logo">
            <TrophyIcon />
          </span>
          <div>
            <strong>Reservar Entradas</strong>
            <span>
              {match.equipoLocal} vs {match.equipoVisitante}
            </span>
          </div>
        </div>

        <button className="compra-volver" type="button" onClick={onVolver}>
          <BackIcon />
          Volver
        </button>
      </header>

      <div className="compra-layout">
        <div className="compra-main">
          <article className="compra-match-card">
            <div className="compra-match-hero">
              <p className="competition">
                <TrophyIcon />
                Copa Mundial FIFA 2026
              </p>
              <h2>
                {match.equipoLocal} vs {match.equipoVisitante}
              </h2>
            </div>

            <div className="compra-match-info">
              <InfoBlock icon={<CalendarIcon />} label="Fecha" value={formatDate(match.fecha)} />
              <InfoBlock icon={<ClockIcon />} label="Hora" value={formatTime(match.hora)} />
              <InfoBlock icon={<PinIcon />} label="Estadio" value={match.estadio} />
            </div>
          </article>

          <section className="compra-section">
            <h3>1. Selecciona la seccion del estadio</h3>

            {loading && <p className="matches-status">Cargando sectores...</p>}
            {error && <p className="matches-status is-error">{error}</p>}

            {!loading && !error && (
              <div className="sector-grid">
                {sectores.length === 0 ? (
                  <p className="matches-status">No hay sectores disponibles.</p>
                ) : (
                  sectores.map((sector) => {
                    const agotado = sector.disponibles <= 0
                    const seleccionado = sector.idHabilita === idHabilitaSel

                    return (
                      <button
                        key={sector.idHabilita}
                        type="button"
                        className={`sector-card ${seleccionado ? 'is-selected' : ''} ${
                          agotado ? 'is-sold-out' : ''
                        }`}
                        onClick={() => !agotado && handleSelectSector(sector)}
                        disabled={agotado}
                      >
                        <div className="sector-card-top">
                          <span className="sector-name">{sector.sector}</span>
                          <span className="sector-price">
                            {formatPrice(sector.precio)}
                            <small>por entrada</small>
                          </span>
                        </div>
                        <span className="sector-stock">
                          {agotado ? 'Agotado' : `${sector.disponibles} entradas disponibles`}
                        </span>
                      </button>
                    )
                  })
                )}
              </div>
            )}
          </section>

          <section className="compra-section">
            <h3>2. Selecciona la cantidad de entradas</h3>

            <div className="qty-stepper">
              <button
                type="button"
                onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                disabled={!sectorSeleccionado || cantidad <= 1}
                aria-label="Quitar una entrada"
              >
                &minus;
              </button>

              <div className="qty-value">
                <strong>{cantidad}</strong>
                <span>{cantidad === 1 ? 'entrada' : 'entradas'}</span>
              </div>

              <button
                type="button"
                onClick={() => setCantidad((c) => Math.min(maxCantidad, c + 1))}
                disabled={!sectorSeleccionado || cantidad >= maxCantidad}
                aria-label="Agregar una entrada"
              >
                +
              </button>
            </div>

            <p className="qty-hint">Maximo {MAX_ENTRADAS} entradas por compra</p>
          </section>
        </div>

        <aside className="resumen-card">
          <h3>
            <CardIcon />
            Resumen de Reserva
          </h3>

          {!sectorSeleccionado ? (
            <p className="resumen-empty">Selecciona una seccion para continuar</p>
          ) : (
            <>
              <dl className="resumen-rows">
                <div>
                  <dt>Seccion</dt>
                  <dd>{sectorSeleccionado.sector}</dd>
                </div>
                <div>
                  <dt>Precio unitario</dt>
                  <dd>{formatPrice(sectorSeleccionado.precio)}</dd>
                </div>
                <div>
                  <dt>Cantidad</dt>
                  <dd>{cantidad}</dd>
                </div>
                <div>
                  <dt>Subtotal</dt>
                  <dd>{formatPrice(subtotal)}</dd>
                </div>
                <div>
                  <dt>Cargo por servicio (10%)</dt>
                  <dd>{formatPrice(cargo)}</dd>
                </div>
              </dl>

              <div className="resumen-total">
                <span>Total a reservar</span>
                <strong>{formatPrice(total)}</strong>
              </div>

              {submitError && <p className="modal-error">{submitError}</p>}

              <button
                className="resumen-confirmar"
                type="button"
                onClick={handleReservar}
                disabled={submitting}
              >
                {submitting ? 'Reservando...' : 'Reservar entradas'}
              </button>

              <p className="resumen-ssl">Pago seguro con cifrado SSL</p>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function InfoBlock({ icon, label, value }) {
  return (
    <p className="compra-info-block">
      <span className="compra-info-icon">{icon}</span>
      <span className="compra-info-text">
        <span className="compra-info-label">{label}</span>
        <strong>{value}</strong>
      </span>
    </p>
  )
}

function BackIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" />
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

function ClockIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
      <path d="M12 7v5l3 2" />
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

function CardIcon() {
  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 6h18v12H3z" />
      <path d="M3 10h18" />
    </svg>
  )
}

export default CompraDetalle
