import { useEffect, useState } from 'react'

function CodigosQr() {
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerEntradasQr()
  }, [])

  async function obtenerEntradasQr() {
    try {
      setLoading(true)
      setError('')

      const token = localStorage.getItem('ticketmatch-token')

      const response = await fetch('http://localhost:8080/api/Entradas/codigosQr', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('No se pudieron obtener las entradas para QR')
      }

      const data = await response.json()
      setEntradas(data)
    } catch (error) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  function formatearFecha(fecha) {
    const date = new Date(fecha)

    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const anio = date.getFullYear()

    return `${dia}/${mes}/${anio}`
  }

  function formatearHora(fecha) {
    const date = new Date(fecha)

    const horas = date.getHours().toString().padStart(2, '0')
    const minutos = date.getMinutes().toString().padStart(2, '0')

    return `${horas}:${minutos}`
  }

  function verQr(idEntrada) {
    console.log('Ver QR entrada:', idEntrada)

    // Acá después conectás con tu endpoint que ya genera el QR.
    // Por ejemplo:
    // POST http://localhost:8080/api/Entradas/{idEntrada}/qr
  }

  if (loading) {
    return (
      <div className="qr-page">
        <h1>Códigos QR</h1>
        <p>Accede a los códigos QR de tus entradas</p>
        <p className="qr-message">Cargando entradas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="qr-page">
        <h1>Códigos QR</h1>
        <p>Accede a los códigos QR de tus entradas</p>
        <p className="qr-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="qr-page">
      <h1>Códigos QR</h1>
      <p className="qr-subtitle">Accede a los códigos QR de tus entradas</p>

      {entradas.length === 0 ? (
        <p className="qr-message">No tenés entradas activas para generar QR.</p>
      ) : (
        <div className="qr-grid">
          {entradas.map((entrada) => (
            <article className="qr-card" key={entrada.idEntrada}>
              <div className="qr-icon-circle">
                <span className="qr-icon">⌗</span>
              </div>

              <h2>
                {entrada.equipoLocal} vs {entrada.equipoVisitante}
              </h2>

              <p className="qr-entry-id">ID Entrada: {entrada.idEntrada}</p>

              <p className="qr-date">
                {formatearFecha(entrada.fechaEncuentro)} - {formatearHora(entrada.fechaEncuentro)}
              </p>

              <p className="qr-sector">{entrada.sector}</p>

              <button
                type="button"
                className="qr-button"
                onClick={() => verQr(entrada.idEntrada)}
              >
                Ver QR
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}

export default CodigosQr