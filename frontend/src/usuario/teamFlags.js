// Mapeo de cada país (columna equipo.pais, tal como llega del back) a su codigo ISO 3166-1
// alpha-2, para mostrar la banderita via flagcdn. Inglaterra/Escocia usan los subcodigos gb-*.
// Cubre los 48 equipos cargados en 02_tablasMundial.sql.
const CODIGOS_PAIS = {
  'México': 'mx',
  'Sudáfrica': 'za',
  'Corea del Sur': 'kr',
  'República Checa': 'cz',
  'Canadá': 'ca',
  'Bosnia y Herzegovina': 'ba',
  'Catar': 'qa',
  'Suiza': 'ch',
  'Brasil': 'br',
  'Marruecos': 'ma',
  'Haití': 'ht',
  'Escocia': 'gb-sct',
  'Estados Unidos': 'us',
  'Paraguay': 'py',
  'Australia': 'au',
  'Turquía': 'tr',
  'Alemania': 'de',
  'Curazao': 'cw',
  'Costa de Marfil': 'ci',
  'Ecuador': 'ec',
  'Países Bajos': 'nl',
  'Japón': 'jp',
  'Suecia': 'se',
  'Túnez': 'tn',
  'Bélgica': 'be',
  'Egipto': 'eg',
  'Irán': 'ir',
  'Nueva Zelanda': 'nz',
  'España': 'es',
  'Cabo Verde': 'cv',
  'Arabia Saudí': 'sa',
  'Uruguay': 'uy',
  'Francia': 'fr',
  'Senegal': 'sn',
  'Irak': 'iq',
  'Noruega': 'no',
  'Argentina': 'ar',
  'Argelia': 'dz',
  'Austria': 'at',
  'Jordania': 'jo',
  'Portugal': 'pt',
  'República Democrática del Congo': 'cd',
  'Uzbekistán': 'uz',
  'Colombia': 'co',
  'Inglaterra': 'gb-eng',
  'Croacia': 'hr',
  'Ghana': 'gh',
  'Panamá': 'pa',
}

// Devuelve la URL de la bandera del equipo, o null si no esta mapeado (el front cae a las iniciales).
export function flagUrl(nombreEquipo) {
  const codigo = CODIGOS_PAIS[nombreEquipo]
  return codigo ? `https://flagcdn.com/w160/${codigo}.png` : null
}
