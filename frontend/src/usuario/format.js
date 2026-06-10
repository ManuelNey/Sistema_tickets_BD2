// Helpers de formato compartidos entre las pantallas de compra.

export function formatDate(date) {
  if (!date) {
    return 'Fecha a confirmar'
  }

  return new Intl.DateTimeFormat('es-UY', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}

export function formatTime(time) {
  if (!time) {
    return 'Hora a confirmar'
  }

  return time.slice(0, 5)
}

export function formatPrice(price) {
  if (price === undefined || price === null) {
    return '$0'
  }

  return `$${Math.round(price)}`
}

// Cargo por servicio (10%): es solo visual del front, el back NO lo guarda.
export const CARGO_SERVICIO = 0.1

// Calcula subtotal / cargo / total a partir del precio unitario y la cantidad.
export function calcularTotales(precioUnitario, cantidad) {
  const subtotal = (precioUnitario || 0) * (cantidad || 0)
  const cargo = subtotal * CARGO_SERVICIO
  return { subtotal, cargo, total: subtotal + cargo }
}

// La reserva expira 30 minutos despues de creada. Devuelve el timestamp (ms) de expiracion.
export function getExpiracion(fechaReserva) {
  return new Date(fechaReserva).getTime() + 30 * 60 * 1000
}
