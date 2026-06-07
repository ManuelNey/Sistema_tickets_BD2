import { useState } from 'react'
import AdminPanel from './admin/AdminPanel'
import FuncionarioPanel from './funcionario/FuncionarioPanel'
import LoginPage from './LoginPage'
import UsuarioPanel from './usuario/UsuarioPanel'
import './App.css'

function App() {
  const [user, setUser] = useState(null)

  const handleLogin = (usuario) => {
    setUser(usuario)
  }

  const handleLogout = () => {
    localStorage.removeItem('ticketmatch-token')
    setUser(null)
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />
  }

  if (user.rol === 'admin') {
    return <AdminPanel onLogout={handleLogout} user={user} />
  }

  if (user.rol === 'funcionario') {
    return <FuncionarioPanel onLogout={handleLogout} user={user} />
  }

  return <UsuarioPanel onLogout={handleLogout} user={user} />
}

export default App
