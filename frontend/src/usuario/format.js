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
