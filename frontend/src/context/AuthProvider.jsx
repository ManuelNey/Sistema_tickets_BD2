import { useCallback, useMemo, useState } from 'react'
import { AuthContext } from './AuthContext'

const TOKEN_KEY = 'ticketmatch-token'
const USER_KEY = 'ticketmatch-user'

function getInitialUser() {
  const token = localStorage.getItem(TOKEN_KEY)
  const savedUser = localStorage.getItem(USER_KEY)

  if (!token || !savedUser) {
    return null
  }

  try {
    return JSON.parse(savedUser)
  } catch {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    return null
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(getInitialUser)

  const login = useCallback((loginResponse) => {
    const token = loginResponse?.token || loginResponse?.Token

    const usuario =
      loginResponse?.usuario ||
      loginResponse?.Usuario ||
      loginResponse

    if (!token) {
      throw new Error('El backend no devolvió token')
    }

    const usuarioParaGuardar = {
      ...usuario,
      telefonos:
        usuario?.telefonos ||
        usuario?.Telefonos ||
        [],
    }

    delete usuarioParaGuardar.token
    delete usuarioParaGuardar.Token
    delete usuarioParaGuardar.usuario
    delete usuarioParaGuardar.Usuario

    localStorage.setItem(TOKEN_KEY, token)
    localStorage.setItem(
      USER_KEY,
      JSON.stringify(usuarioParaGuardar)
    )

    setUser(usuarioParaGuardar)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)

    setUser(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user),
    }),
    [user, login, logout]
  )

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}