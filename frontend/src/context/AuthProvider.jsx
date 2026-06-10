import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'

function getInitialUser() {
  const token = localStorage.getItem('ticketmatch-token')
  const savedUser = localStorage.getItem('ticketmatch-user')

  if (!token || !savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem('ticketmatch-token')
    localStorage.removeItem('ticketmatch-user')
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  const login = useCallback((loginResponse) => {
    const token = loginResponse.token
    const usuario = loginResponse.usuario ?? loginResponse

    if (!token) {
      throw new Error('El backend no devolvio token')
    }

    const usuarioParaGuardar = { ...usuario }
    delete usuarioParaGuardar.token

    localStorage.setItem('ticketmatch-token', token)
    localStorage.setItem('ticketmatch-user', JSON.stringify(usuarioParaGuardar))

    setUser(usuarioParaGuardar)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('ticketmatch-token')
    localStorage.removeItem('ticketmatch-user')

    setUser(null)
  }, [])

  const value = useMemo(() => ({
    user,
    login,
    logout,
    isAuthenticated: Boolean(user),
  }), [user, login, logout])

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}