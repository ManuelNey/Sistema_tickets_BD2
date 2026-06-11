import { CameraView, useCameraPermissions } from 'expo-camera'
import { useState } from 'react'
import { Alert, Button, Text, View } from 'react-native'

export default function QrScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions()
  const [scanned, setScanned] = useState(false)
  const [endpoint, setEndpoint] = useState(null)
  const [loading, setLoading] = useState(false)

  if (!permission) return null

  if (!permission.granted) {
    return (
      <View>
        <Text>Necesitamos permiso para usar la cámara</Text>
        <Button title="Dar permiso" onPress={requestPermission} />
      </View>
    )
  }

  const handleQrScanned = ({ data }) => {
    if (scanned) return

    setScanned(true)
    setEndpoint(data)
  }

  const handleContinuar = async () => {
    try {
      setLoading(true)

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Error al verificar QR')
      }

      Alert.alert('Éxito', 'Entrada verificada correctamente')
    } catch (error) {
      Alert.alert('Error', 'No se pudo verificar el QR')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={{ flex: 1 }}>
      {!scanned ? (
        <CameraView
          style={{ flex: 1 }}
          facing="back"
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
          onBarcodeScanned={handleQrScanned}
        />
      ) : (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>QR escaneado correctamente</Text>

          <Button
            title={loading ? 'Verificando...' : 'Continuar'}
            onPress={handleContinuar}
            disabled={loading}
          />

          <Button
            title="Escanear otro"
            onPress={() => {
              setScanned(false)
              setEndpoint(null)
            }}
          />
        </View>
      )}
    </View>
  )
}