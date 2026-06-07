export function FilterIcon() {
  return (
    <svg className="filter-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 5h16l-6.5 7.3V19l-3 1v-7.7L4 5Z" />
    </svg>
  )
}

export function TrophyIcon() {
  return (
    <svg className="trophy-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M8 4h8v4a4 4 0 0 1-8 0V4Z" />
      <path d="M8 6H5a3 3 0 0 0 3 3M16 6h3a3 3 0 0 1-3 3M12 12v4M9 20h6M10 16h4" />
    </svg>
  )
}

export function InfoLine({ icon, text, highlight = false }) {
  return (
    <p className={`match-info ${highlight ? 'is-highlight' : ''}`}>
      <LineIcon name={icon} />
      <span>{text}</span>
    </p>
  )
}

function LineIcon({ name }) {
  const icons = {
    calendarLine: (
      <>
        <path d="M6 5h12v14H6z" />
        <path d="M8 3v4M16 3v4M6 9h12" />
      </>
    ),
    clock: (
      <>
        <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    pin: (
      <>
        <path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" />
        <path d="M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" />
      </>
    ),
    users: (
      <>
        <path d="M8 13a4 4 0 1 1 8 0M4 19a4 4 0 0 1 8 0M12 19a4 4 0 0 1 8 0" />
        <path d="M8 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM16 10a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      </>
    ),
  }

  return (
    <svg className="line-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}
