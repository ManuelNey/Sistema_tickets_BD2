import SidebarIcon from './SidebarIcon'
import Ticket from '../assets/ticket.png'

function Sidebar({ activeTab, brandSubtitle, label, onLogout, onTabChange, tabs }) {
  return (
    <aside className="user-sidebar" aria-label={label}>
      <header className="sidebar-brand">
        <div className="sidebar-logo" aria-hidden="true">
          <img src={Ticket} alt="Logo TicketMatch" className="sidebar-logo-img" />
        </div>

        <div>
          <strong>TicketMatch</strong>
          <span>{brandSubtitle}</span>
        </div>
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
  )
}

export default Sidebar