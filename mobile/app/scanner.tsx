import AsyncStorage from '@react-native-async-storage/async-storage'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState } from 'react'
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

export default function QrScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [endpoint, setEndpoint] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [resultMessage, setResultMessage] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null)


  const API_URL = 'http://192.168.1.23:8080'

  if (!permission) return null

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Permiso de cámara</Text>

        <Text style={styles.subtitle}>
          Necesitamos acceder a la cámara para escanear entradas.
        </Text>

        <Pressable style={styles.primaryButton} onPress={requestPermission}>
          <Text style={styles.primaryButtonText}>Dar permiso</Text>
        </Pressable>
      </View>
    )
  }

  const handleQrScanned = ({ data }: { data: string }) => {
    if (scanned) return

    setScanned(true)
    setEndpoint(data)
    setResultMessage(null)
    setIsSuccess(null)
  }

  const handleContinuar = async () => {
    try {
      setLoading(true)
      setResultMessage(null)
      setIsSuccess(null)

      const tokenLogin = await AsyncStorage.getItem('ticketmatch-token')

      if (!tokenLogin) {
        setIsSuccess(false)
        setResultMessage('No hay sesión iniciada como funcionario.')
        return
      }

      if (!endpoint) {
        setIsSuccess(false)
        setResultMessage('No hay ningún código QR escaneado.')
        return
      }

      const deviceId = await AsyncStorage.getItem('DeviceId')

      if (!deviceId) {
        setIsSuccess(false)
        setResultMessage('No hay dispositivo registrado.')
        return
      }

      // endpoint viene desde el QR:
      // /api/Entradas/ScanQr?token=...
      const separador = endpoint.includes('?') ? '&' : '?'

      const url =
        `${API_URL}${endpoint}` +
        `${separador}deviceId=${encodeURIComponent(deviceId)}`

      console.log('URL A CONSULTAR:', url)

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${tokenLogin}`,
          Accept: 'application/json',
        },
      })

      const text = await response.text()

      console.log('STATUS:', response.status)
      console.log('RESPUESTA:', text)

      let data: any = null

      try {
        data = text ? JSON.parse(text) : null
      } catch {
        console.log('La respuesta no vino como JSON.')
      }

      const mensajeBackend =
        data?.message ||
        data?.mensaje ||
        'No se pudo verificar la entrada.'

      if (!response.ok) {
        setIsSuccess(false)

        switch (response.status) {
          case 400:
            setResultMessage(mensajeBackend)
            break

          case 401:
            setResultMessage(
              'Tu sesión no es válida o no tenés permisos de funcionario.'
            )
            break

          case 403:
            setResultMessage(
              mensajeBackend ||
                'No estás autorizado a validar entradas de este sector.'
            )
            break

          case 404:
            setResultMessage('La entrada o el recurso solicitado no existe.')
            break

          case 500:
            setResultMessage(
              'Ocurrió un error interno en el servidor. Intentá nuevamente.'
            )
            break

          default:
            setResultMessage(
              `${mensajeBackend} (Código ${response.status})`
            )
            break
        }

        return
      }

      setIsSuccess(true)
      setResultMessage(
        mensajeBackend || 'Entrada verificada correctamente.'
      )
    } catch (error: any) {
      console.log('ERROR FETCH:', error)

      setIsSuccess(false)

      if (error.message?.includes('Network request failed')) {
        setResultMessage(
          'No se pudo conectar al servidor. Verificá la IP, que el backend esté levantado y que el celular esté en la misma red.'
        )
      } else {
        setResultMessage(
          error.message || 'No se pudo conectar con el servidor.'
        )
      }
    } finally {
      setLoading(false)
    }
  }

  const resetScanner = () => {
    setScanned(false)
    setEndpoint(null)
    setResultMessage(null)
    setIsSuccess(null)
    setLoading(false)
  }

  return (
    <View style={styles.container}>
      {!scanned ? (
        <>
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{
              barcodeTypes: ['qr'],
            }}
            onBarcodeScanned={handleQrScanned}
          />

          <View style={styles.overlay}>
            <View style={styles.header}>
              <Text style={styles.titleLight}>Escanear entrada</Text>

              <Text style={styles.subtitleLight}>
                Apuntá la cámara al código QR
              </Text>
            </View>

            <View style={styles.scanBox}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>

            <View style={styles.bottomInfo}>
              <Text style={styles.infoText}>
                El QR se detectará automáticamente.
              </Text>
            </View>
          </View>
        </>
      ) : (
        <View style={styles.resultContainer}>
          <View
            style={[
              styles.statusCircle,
              isSuccess === true && styles.statusSuccess,
              isSuccess === false && styles.statusError,
            ]}
          >
            <Text style={styles.statusIcon}>
              {isSuccess === true ? '✓' : isSuccess === false ? '!' : 'QR'}
            </Text>
          </View>

          <Text style={styles.resultTitle}>
            {isSuccess === true
              ? 'Entrada válida'
              : isSuccess === false
                ? 'Verificación fallida'
                : 'QR escaneado'}
          </Text>

          <Text style={styles.resultSubtitle}>
            {resultMessage ||
              'Presioná continuar para verificar la entrada.'}
          </Text>

          {endpoint && (
            <Text numberOfLines={3} style={styles.qrText}>
              {endpoint}
            </Text>
          )}

          <Pressable
            style={[
              styles.primaryButton,
              loading && styles.disabledButton,
              isSuccess === true && styles.successButton,
            ]}
            onPress={handleContinuar}
            disabled={loading || isSuccess === true}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {isSuccess === true ? 'Verificada' : 'Continuar'}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.secondaryButton} onPress={resetScanner}>
            <Text style={styles.secondaryButtonText}>
              Escanear otro QR
            </Text>
          </Pressable>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#0f172a',
  },

  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingTop: 70,
    paddingBottom: 50,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
  },

  subtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 24,
  },

  titleLight: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#ffffff',
  },

  subtitleLight: {
    marginTop: 8,
    fontSize: 16,
    color: '#e5e7eb',
    textAlign: 'center',
  },

  scanBox: {
    width: 260,
    height: 260,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderColor: '#ffffff',
  },

  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 5,
    borderLeftWidth: 5,
    borderTopLeftRadius: 16,
  },

  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 5,
    borderRightWidth: 5,
    borderTopRightRadius: 16,
  },

  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
    borderBottomLeftRadius: 16,
  },

  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
    borderBottomRightRadius: 16,
  },

  bottomInfo: {
    backgroundColor: 'rgba(15,23,42,0.75)',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 999,
  },

  infoText: {
    color: '#ffffff',
    fontSize: 14,
  },

  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    alignItems: 'center',
  },

  statusCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
  },

  statusSuccess: {
    backgroundColor: '#16a34a',
  },

  statusError: {
    backgroundColor: '#dc2626',
  },

  statusIcon: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: 'bold',
  },

  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    textAlign: 'center',
  },

  resultSubtitle: {
    fontSize: 16,
    color: '#cbd5e1',
    textAlign: 'center',
    marginBottom: 18,
  },

  qrText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },

  primaryButton: {
    width: '100%',
    backgroundColor: '#2563eb',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },

  successButton: {
    backgroundColor: '#16a34a',
  },

  disabledButton: {
    opacity: 0.7,
  },

  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  secondaryButton: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#475569',
  },

  secondaryButtonText: {
    color: '#e5e7eb',
    fontSize: 16,
    fontWeight: '600',
  },
})