import AdminPanel from './admin/AdminPanel'
import FuncionarioPanel from './funcionario/FuncionarioPanel'
import LoginPage from './LoginPage'
import UsuarioPanel from './usuario/UsuarioPanel'
import { useAuth } from './context/useAuth'
import './App.css'

function App() {
  const { user, logout } = useAuth()

  if (!user) {
    return <LoginPage />
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