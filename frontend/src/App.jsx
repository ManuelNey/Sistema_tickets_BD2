import AdminPanel from './admin/AdminPanel'
import FuncionarioPanel from './funcionario/FuncionarioPanel'
import LoginPage from './LoginPage'
import RegistroPage from './RegisterPage'
import UsuarioPanel from './usuario/UsuarioPanel'
import { useAuth } from './context/useAuth'
import './App.css'
import { useState } from 'react'

function App() {
  const { user, logout } = useAuth()

  const [pantallaPublica, setPantallaPublica] = useState('login')

  if (!user) {
    if (pantallaPublica === 'registro') {
      return (
        <RegistroPage
          onVolverLogin={() => setPantallaPublica('login')}
        />
      )
    }

    return (
      <LoginPage
        onRegister={() => setPantallaPublica('registro')}
      />
    )
  }

  if (user.rol === 'admin') {
    return <AdminPanel onLogout={logout} user={user} />
  }

  if (user.rol === 'funcionario') {
    return <FuncionarioPanel onLogout={logout} user={user} />
  }

  return <UsuarioPanel onLogout={logout} user={user} />
}

export default App