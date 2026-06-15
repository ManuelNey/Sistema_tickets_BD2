import AsyncStorage from '@react-native-async-storage/async-storage'
import { useRouter } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  Image
} from 'react-native'

const API_URL = 'http://192.168.1.23:8080'

export default function LoginScreen() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [deviceId, setDeviceId] = useState('')


  useEffect(() => {
    const loadDeviceId = async () => {
      let id = await AsyncStorage.getItem('DeviceId')

      if (!id) {
        id = Math.random().toString(36).substring(2, 8).toUpperCase()
        await AsyncStorage.setItem('DeviceId', id)
      }

      setDeviceId(id)
    }

    loadDeviceId()
  }, [])

  const handleLogin = async () => {
    try {
      setLoading(true)

      const response = await fetch(`${API_URL}/api/usuario/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          mail: email,
          contrasena: password,
        }),
      })

      if (!response.ok) {
        throw new Error('Login incorrecto')
      }

      const usuario = await response.json()

      if (usuario.rol?.toLowerCase() !== 'funcionario') {
        Alert.alert('Acceso denegado', 'Solo los funcionarios pueden acceder al escáner')
        return
      }

      await AsyncStorage.setItem('ticketmatch-token', usuario.token)

      const deviceResponse = await fetch(`${API_URL}/api/dispositivo/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${usuario.token}`,
        },
        body: JSON.stringify({
          deviceId: deviceId,
        }),
      })

      if (!deviceResponse.ok) {
        Alert.alert('Dispositivo no habilitado')
        return
      }

      router.push('/scanner')
    } catch (error) {
      Alert.alert('Error', 'Usuario o contraseña incorrectos')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <View style={styles.logoCircle}>
          <Image source={require('../assets/ticket.png')} style={styles.logo}/>
        </View>

        <Text style={styles.title}>TicketMatch</Text>
        <Text style={styles.subtitle}>Acceso para funcionarios</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Correo electrónico</Text>
          <TextInput
            placeholder="funcionario@mail.com"
            placeholderTextColor="#94a3b8"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
          />

          <Text style={styles.label}>Contraseña</Text>
          <TextInput
            placeholder="Ingresá tu contraseña"
            placeholderTextColor="#94a3b8"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />

          <Pressable
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator />
            ) : (
              <Text style={styles.buttonText}>Ingresar</Text>
            )}
          </Pressable>
        </View>

        <Text style={styles.footerText}>
          Solo usuarios con rol funcionario pueden acceder al escáner.
        </Text>

        <Text style={styles.deviceText}>Dispositivo: {deviceId}</Text>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#2563eb',
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 50, 
    height: 50, 
    alignSelf: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 28,
  },
  form: {
    gap: 10,
  },
  label: {
    color: '#e5e7eb',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    color: '#ffffff',
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footerText: {
    color: '#64748b',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 22,
  },
  deviceText: {
  color: '#38bdf8',
  fontSize: 14,
  textAlign: 'center',
  marginTop: 8,
  marginBottom: 20,
  fontWeight: '600',
},
})