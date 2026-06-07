function SidebarIcon({ name }) {
  const icons = {
    chart: (
      <>
        <path d="M5 19V9M12 19V5M19 19v-7" />
        <path d="M3 19h18" />
      </>
    ),
    stadium: (
      <>
        <path d="M5 20V8h14v12" />
        <path d="M8 20V4h8v16M8 8h8M8 12h8M8 16h8M4 20h16" />
      </>
    ),
    calendar: (
      <>
        <path d="M5 5h14v15H5z" />
        <path d="M8 3v4M16 3v4M5 10h14" />
      </>
    ),
    device: (
      <>
        <path d="M8 3h8v18H8z" />
        <path d="M12 18h.01" />
      </>
    ),
    bag: (
      <>
        <path d="M7 8.5h10l-.8 11h-8.4L7 8.5Z" />
        <path d="M9 8.5V6.8A3 3 0 0 1 12 4a3 3 0 0 1 3 2.8v1.7" />
      </>
    ),
    ticket: (
      <>
        <path d="M4 8.5a2 2 0 0 0 0 3v1a2 2 0 0 1 0 3h16a2 2 0 0 1 0-3v-1a2 2 0 0 0 0-3H4Z" />
        <path d="M9 8.5v7M15 8.5v7" />
      </>
    ),
    map: (
      <>
        <path d="m4 6 5-2 6 2 5-2v14l-5 2-6-2-5 2V6Z" />
        <path d="M9 4v14M15 6v14" />
      </>
    ),
    qr: (
      <>
        <path d="M5 5h4v4H5zM15 5h4v4h-4zM5 15h4v4H5z" />
        <path d="M14 14h2v2h-2zM18 14h1v5h-5v-1M12 5v2M12 10v2M5 12h2M10 12h2" />
      </>
    ),
    send: (
      <>
        <path d="M21 4 3 12l7 2 2 7 9-17Z" />
        <path d="m10 14 5-5" />
      </>
    ),
    inbox: (
      <>
        <path d="M5 9h14l2 5v5H3v-5l2-5Z" />
        <path d="M8 14h2.2a2 2 0 0 0 3.6 0H16" />
      </>
    ),
    logout: (
      <>
        <path d="M10 5H6v14h4" />
        <path d="M15 8l4 4-4 4M19 12H9" />
      </>
    ),
    plus: (
      <>
        <path d="M12 5v14M5 12h14" />
      </>
    ),
    edit: (
      <>
        <path d="M4 20h4l11-11-4-4L4 16v4Z" />
        <path d="m13 7 4 4" />
      </>
    ),
    trash: (
      <>
        <path d="M5 7h14M10 11v6M14 11v6M8 7l1-3h6l1 3M7 7l1 13h8l1-13" />
      </>
    ),
    sections: (
      <>
        <path d="M4 5h16v5H4zM4 14h7v5H4zM15 14h5v5h-5z" />
      </>
    ),
    close: (
      <>
        <path d="M6 6l12 12M18 6 6 18" />
      </>
    ),
  }

  return (
    <svg className="sidebar-icon" viewBox="0 0 24 24" aria-hidden="true">
      {icons[name]}
    </svg>
  )
}

export default SidebarIcon
