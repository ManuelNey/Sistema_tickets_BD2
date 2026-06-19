import SidebarIcon from './SidebarIcon'
import Ticket from '../assets/ticket.png'

function Sidebar({ activeTab, brandSubtitle, isOpen = false, label, onClose = () => {}, onLogout, onTabChange, tabs }) {
  return (
    <>
      {/* Fondo oscuro — solo activo en mobile cuando el drawer está abierto */}
      <div
        className={`sidebar-backdrop${isOpen ? ' is-visible' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`user-sidebar${isOpen ? ' is-open' : ''}`} aria-label={label}>
        <header className="sidebar-brand">
          <div className="sidebar-logo" aria-hidden="true">
            <img src={Ticket} alt="Logo TicketMatch" className="sidebar-logo-img" />
          </div>

          <div>
            <strong>TicketMatch</strong>
            <span>{brandSubtitle}</span>
          </div>

          {/* Botón cerrar — solo visible en mobile vía CSS */}
          <button className="sidebar-close-btn" type="button" onClick={onClose} aria-label="Cerrar menú">
            <SidebarIcon name="close" />
          </button>
        </header>

        <nav className="sidebar-nav" aria-label={label}>
          {tabs.map((tab) => (
            <button
              className={`sidebar-tab ${activeTab === tab.id ? 'is-active' : ''}`}
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
            >
              <SidebarIcon name={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>

        <button className="logout-button" type="button" onClick={onLogout}>
          <SidebarIcon name="logout" />
          <span>Cerrar Sesion</span>
        </button>
      </aside>
    </>
  )
}

export default Sidebar
