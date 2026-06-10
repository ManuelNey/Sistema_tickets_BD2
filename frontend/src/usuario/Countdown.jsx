import { useEffect, useState } from 'react'

// Muestra el tiempo restante hasta que expire la reserva.
// Cuando llega a 0 dispara onExpire una sola vez.
function Countdown({ expiraMs, onExpire }) {
  const [restanteMs, setRestanteMs] = useState(() => Math.max(0, expiraMs - Date.now()))

  useEffect(() => {
    const id = setInterval(() => {
      const ms = Math.max(0, expiraMs - Date.now())
      setRestanteMs(ms)
      if (ms <= 0) {
        clearInterval(id)
        onExpire?.()
      }
    }, 1000)
    return () => clearInterval(id)
  }, [expiraMs, onExpire])

  const totalSeg = Math.floor(restanteMs / 1000)
  const mm = String(Math.floor(totalSeg / 60)).padStart(2, '0')
  const ss = String(totalSeg % 60).padStart(2, '0')

  return (
    <span className={`countdown-pill ${restanteMs <= 0 ? 'is-expired' : ''}`}>
      <ClockIcon />
      {restanteMs <= 0 ? 'Reserva expirada' : `Tiempo restante: ${mm}:${ss}`}
    </span>
  )
}

// Icono de reloj para el countdown.
function ClockIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}

export default Countdown
