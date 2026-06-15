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

// Calcula subtotal / cargo / total a partir del precio unitario, la cantidad y la
// tasa de comisión vigente (fracción, ej: 0.075 = 7,5%). La tasa la define el back.
export function calcularTotales(precioUnitario, cantidad, comisionRate = 0) {
  const subtotal = (precioUnitario || 0) * (cantidad || 0)
  const cargo = subtotal * (comisionRate || 0)
  return { subtotal, cargo, total: subtotal + cargo }
}

// Trae la comisión vigente del back y la devuelve como fracción (ej: 7.50 -> 0.075).
// Si falla, devuelve 0 para no romper la pantalla (se muestra sin cargo).
export async function fetchComisionVigente() {
  try {
    const token = localStorage.getItem('ticketmatch-token')
    const res = await fetch('http://localhost:8080/api/comision/vigente', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) return 0
    const data = await res.json()
    return (data.porcentaje ?? 0) / 100
  } catch {
    return 0
  }
}

// La reserva expira 30 minutos despues de creada. Devuelve el timestamp (ms) de expiracion.
export function getExpiracion(fechaReserva) {
  return new Date(fechaReserva).getTime() + 30 * 60 * 1000
}
