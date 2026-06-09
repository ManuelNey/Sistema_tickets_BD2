import { useEffect, useState } from 'react'
import "./CodigoQr.css"
import QRCode from 'react-qr-code'

function CodigosQr() {
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [modalAbierto, setModalAbierto] = useState(false)
  const [entradaSeleccionada, setEntradaSeleccionada] = useState(null)
  const [qrContenido, setQrContenido] = useState('')
  const [qrLoading, setQrLoading] = useState(false)
  const [qrError, setQrError] = useState('')

  useEffect(() => {
    obtenerEntradasQr()
  }, [])

  useEffect(() => {
    if (!modalAbierto || !entradaSeleccionada) return

    generarQr(entradaSeleccionada.idEntrada)

    const intervalo = setInterval(() => {
      generarQr(entradaSeleccionada.idEntrada)
    }, 25000)

    return () => clearInterval(intervalo)
  }, [modalAbierto, entradaSeleccionada])

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

  async function generarQr(idEntrada) {
    try {
      setQrLoading(true)
      setQrError('')

      const token = localStorage.getItem('ticketmatch-token')

      const response = await fetch(`http://localhost:8080/api/Entradas/${idEntrada}/qr`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || 'No se pudo generar el QR')
      }

      setQrContenido(data.qrContenido)
    } catch (error) {
      setQrError(error.message)
    } finally {
      setQrLoading(false)
    }
  }

  function abrirModalQr(entrada) {
    setEntradaSeleccionada(entrada)
    setQrContenido('')
    setQrError('')
    setModalAbierto(true)
  }

  function cerrarModalQr() {
    setModalAbierto(false)
    setEntradaSeleccionada(null)
    setQrContenido('')
    setQrError('')
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

  if (loading) {
    return (
      <div className="qr-page">
        <h1>Códigos QR</h1>
        <p className="qr-subtitle">Accede a los códigos QR de tus entradas</p>
        <p className="qr-message">Cargando entradas...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="qr-page">
        <h1>Códigos QR</h1>
        <p className="qr-subtitle">Accede a los códigos QR de tus entradas</p>
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
                <img src="src\assets\qr.png" className='qr-icon' alt="Imagen de un QR" />
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
                onClick={() => abrirModalQr(entrada)}
              >
                Ver QR
              </button>
            </article>
          ))}
        </div>
      )}

      {modalAbierto && entradaSeleccionada && (
        <div className="qr-modal-backdrop" onClick={cerrarModalQr}>
          <div className="qr-modal" onClick={(event) => event.stopPropagation()}>
            <button type="button" className="qr-modal-close" onClick={cerrarModalQr}>
              ×
            </button>

            <p className="qr-modal-ticket">Entrada #{entradaSeleccionada.idEntrada}</p>

            <div className="qr-modal-code-box">
              {qrLoading && !qrContenido ? (
                <p className="qr-message">Generando QR...</p>
              ) : qrError ? (
                <p className="qr-error">{qrError}</p>
              ) : qrContenido ? (
                <QRCode value={qrContenido} size={390} />
              ) : null}
            </div>

            <div className="qr-modal-info">
              <div>
                <span>Partido:</span>
                <strong>
                  {entradaSeleccionada.equipoLocal} vs {entradaSeleccionada.equipoVisitante}
                </strong>
              </div>

              <div>
                <span>Fecha:</span>
                <strong>
                  {formatearFecha(entradaSeleccionada.fechaEncuentro)} - {formatearHora(entradaSeleccionada.fechaEncuentro)}
                </strong>
              </div>

              <div>
                <span>Sección:</span>
                <strong>{entradaSeleccionada.sector}</strong>
              </div>

              <div>
                <span>Estado:</span>
                <strong>{entradaSeleccionada.estado}</strong>
              </div>
            </div>

            <p className="qr-modal-refresh">
              El QR se actualiza automáticamente cada 30 segundos.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default CodigosQr