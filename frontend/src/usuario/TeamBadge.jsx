import { useState } from 'react'
import { flagUrl } from './teamFlags'

// Avatar del equipo: muestra la banderita del país. Si el país no está mapeado o la
// imagen falla al cargar, cae a las iniciales del nombre.
function TeamBadge({ name }) {
  const [imgError, setImgError] = useState(false)
  const src = flagUrl(name)

  return (
    <div className="team">
      {src && !imgError ? (
        <img
          className="team-avatar team-flag"
          src={src}
          alt={`Bandera de ${name}`}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="team-avatar">{getInitials(name)}</div>
      )}
      <span>{name}</span>
    </div>
  )
}

function getInitials(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

export default TeamBadge
