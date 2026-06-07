-- Datos del Mundial 2026: países sede, estadios, equipos y encuentros.

INSERT INTO pais_sede (id_pais_sede, nombre) VALUES
(1, 'Canadá'),
(2, 'México'),
(3, 'Estados Unidos')
ON CONFLICT (id_pais_sede) DO NOTHING;

INSERT INTO estadio (id_estadio, nombre, ciudad, fk_pais_sede) VALUES
(1,  'BC Place',                          'Vancouver',              1),
(2,  'BMO Field',                         'Toronto',                1),
(3,  'Estadio Ciudad de México',          'Ciudad de México',       2),
(4,  'Estadio Guadalajara',               'Guadalajara',            2),
(5,  'Estadio Monterrey',                 'Monterrey',              2),
(6,  'Mercedes-Benz Stadium',             'Atlanta',                3),
(7,  'Gillette Stadium',                  'Boston',                 3),
(8,  'AT&T Stadium',                      'Dallas',                 3),
(9,  'NRG Stadium',                       'Houston',                3),
(10, 'GEHA Field at Arrowhead Stadium',   'Kansas City',            3),
(11, 'SoFi Stadium',                      'Los Ángeles',            3),
(12, 'Hard Rock Stadium',                 'Miami',                  3),
(13, 'MetLife Stadium',                   'Nueva York Nueva Jersey',3),
(14, 'Lincoln Financial Field',           'Filadelfia',             3),
(15, 'Lumen Field',                       'Seattle',                3),
(16, 'Levi''s Stadium',                   'Bahía de San Francisco', 3)
ON CONFLICT (id_estadio) DO NOTHING;

INSERT INTO equipo (id_equipo, nombre, pais) VALUES
(1,  'México',              'México'),
(2,  'Sudáfrica',           'Sudáfrica'),
(3,  'República de Corea',  'Corea del Sur'),
(4,  'República Checa',     'República Checa'),
(5,  'Canadá',              'Canadá'),
(6,  'Bosnia y Herzegovina','Bosnia y Herzegovina'),
(7,  'Catar',               'Catar'),
(8,  'Suiza',               'Suiza'),
(9,  'Brasil',              'Brasil'),
(10, 'Marruecos',           'Marruecos'),
(11, 'Haití',               'Haití'),
(12, 'Escocia',             'Escocia'),
(13, 'Estados Unidos',      'Estados Unidos'),
(14, 'Paraguay',            'Paraguay'),
(15, 'Australia',           'Australia'),
(16, 'Turquía',             'Turquía'),
(17, 'Alemania',            'Alemania'),
(18, 'Curazao',             'Curazao'),
(19, 'Costa de Marfil',     'Costa de Marfil'),
(20, 'Ecuador',             'Ecuador'),
(21, 'Países Bajos',        'Países Bajos'),
(22, 'Japón',               'Japón'),
(23, 'Suecia',              'Suecia'),
(24, 'Túnez',               'Túnez'),
(25, 'Bélgica',             'Bélgica'),
(26, 'Egipto',              'Egipto'),
(27, 'Irán',                'Irán'),
(28, 'Nueva Zelanda',       'Nueva Zelanda'),
(29, 'España',              'España'),
(30, 'Cabo Verde',          'Cabo Verde'),
(31, 'Arabia Saudí',        'Arabia Saudí'),
(32, 'Uruguay',             'Uruguay'),
(33, 'Francia',             'Francia'),
(34, 'Senegal',             'Senegal'),
(35, 'Irak',                'Irak'),
(36, 'Noruega',             'Noruega'),
(37, 'Argentina',           'Argentina'),
(38, 'Argelia',             'Argelia'),
(39, 'Austria',             'Austria'),
(40, 'Jordania',            'Jordania'),
(41, 'Portugal',            'Portugal'),
(42, 'RD Congo',            'República Democrática del Congo'),
(43, 'Uzbekistán',          'Uzbekistán'),
(44, 'Colombia',            'Colombia'),
(45, 'Inglaterra',          'Inglaterra'),
(46, 'Croacia',             'Croacia'),
(47, 'Ghana',               'Ghana'),
(48, 'Panamá',              'Panamá')
ON CONFLICT (id_equipo) DO NOTHING;

INSERT INTO encuentro (fecha, fk_equipo_local, fk_equipo_visitante, fk_estadio, estado) VALUES
-- Jornada 1
('2026-06-11 15:00:00-04', 1,  2,  3,  'programado'),
('2026-06-11 22:00:00-04', 3,  4,  4,  'programado'),
-- Jornada 2
('2026-06-12 15:00:00-04', 5,  6,  2,  'programado'),
('2026-06-12 21:00:00-04', 13, 14, 11, 'programado'),
-- Jornada 3
('2026-06-13 15:00:00-04', 7,  8,  16, 'programado'),
('2026-06-13 18:00:00-04', 9,  10, 13, 'programado'),
('2026-06-13 21:00:00-04', 11, 12, 7,  'programado'),
('2026-06-13 00:00:00-04', 15, 16, 1,  'programado'),
-- Jornada 4
('2026-06-14 13:00:00-04', 17, 18, 9,  'programado'),
('2026-06-14 16:00:00-04', 21, 22, 8,  'programado'),
('2026-06-14 19:00:00-04', 19, 20, 14, 'programado'),
('2026-06-14 22:00:00-04', 23, 24, 5,  'programado'),
-- Jornada 5
('2026-06-15 12:00:00-04', 29, 30, 6,  'programado'),
('2026-06-15 15:00:00-04', 25, 26, 15, 'programado'),
('2026-06-15 18:00:00-04', 31, 32, 12, 'programado'),
('2026-06-15 21:00:00-04', 27, 28, 11, 'programado'),
-- Jornada 6
('2026-06-16 15:00:00-04', 33, 34, 13, 'programado'),
('2026-06-16 18:00:00-04', 35, 36, 7,  'programado'),
('2026-06-16 21:00:00-04', 37, 38, 10, 'programado'),
('2026-06-16 00:00:00-04', 39, 40, 16, 'programado'),
-- Jornada 7
('2026-06-17 13:00:00-04', 41, 42, 9,  'programado'),
('2026-06-17 16:00:00-04', 45, 46, 8,  'programado'),
('2026-06-17 19:00:00-04', 47, 48, 2,  'programado'),
('2026-06-17 22:00:00-04', 43, 44, 3,  'programado'),
-- Jornada 8
('2026-06-18 12:00:00-04', 4,  2,  6,  'programado'),
('2026-06-18 15:00:00-04', 8,  6,  11, 'programado'),
('2026-06-18 18:00:00-04', 5,  7,  1,  'programado'),
('2026-06-18 21:00:00-04', 1,  3,  4,  'programado'),
-- Jornada 9
('2026-06-19 15:00:00-04', 13, 15, 15, 'programado'),
('2026-06-19 18:00:00-04', 12, 10, 7,  'programado'),
('2026-06-19 21:00:00-04', 9,  11, 14, 'programado'),
('2026-06-19 00:00:00-04', 16, 14, 16, 'programado'),
-- Jornada 10
('2026-06-20 13:00:00-04', 21, 23, 9,  'programado'),
('2026-06-20 16:00:00-04', 17, 19, 2,  'programado'),
('2026-06-20 22:00:00-04', 20, 18, 10, 'programado'),
('2026-06-20 00:00:00-04', 24, 22, 5,  'programado'),
-- Jornada 11
('2026-06-21 12:00:00-04', 29, 31, 6,  'programado'),
('2026-06-21 15:00:00-04', 25, 27, 11, 'programado'),
('2026-06-21 18:00:00-04', 32, 30, 12, 'programado'),
('2026-06-21 21:00:00-04', 28, 26, 1,  'programado'),
-- Jornada 12
('2026-06-22 13:00:00-04', 37, 39, 8,  'programado'),
('2026-06-22 17:00:00-04', 33, 35, 14, 'programado'),
('2026-06-22 20:00:00-04', 36, 34, 13, 'programado'),
('2026-06-22 23:00:00-04', 40, 38, 16, 'programado'),
-- Jornada 13
('2026-06-23 13:00:00-04', 41, 43, 9,  'programado'),
('2026-06-23 16:00:00-04', 45, 47, 7,  'programado'),
('2026-06-23 19:00:00-04', 48, 46, 2,  'programado'),
('2026-06-23 22:00:00-04', 44, 42, 4,  'programado'),
-- Jornada 14 (partidos simultáneos)
('2026-06-24 15:00:00-04', 8,  5,  1,  'programado'),
('2026-06-24 15:00:00-04', 6,  7,  15, 'programado'),
('2026-06-24 18:00:00-04', 12, 9,  12, 'programado'),
('2026-06-24 18:00:00-04', 10, 11, 6,  'programado'),
('2026-06-24 21:00:00-04', 4,  1,  3,  'programado'),
('2026-06-24 21:00:00-04', 2,  3,  5,  'programado'),
-- Jornada 15 (partidos simultáneos)
('2026-06-25 16:00:00-04', 18, 19, 14, 'programado'),
('2026-06-25 16:00:00-04', 20, 17, 13, 'programado'),
('2026-06-25 19:00:00-04', 22, 23, 8,  'programado'),
('2026-06-25 19:00:00-04', 24, 21, 10, 'programado'),
('2026-06-25 22:00:00-04', 16, 13, 11, 'programado'),
('2026-06-25 22:00:00-04', 14, 15, 16, 'programado'),
-- Jornada 16 (partidos simultáneos)
('2026-06-26 15:00:00-04', 36, 33, 7,  'programado'),
('2026-06-26 15:00:00-04', 34, 35, 2,  'programado'),
('2026-06-26 20:00:00-04', 30, 31, 9,  'programado'),
('2026-06-26 20:00:00-04', 32, 29, 4,  'programado'),
('2026-06-26 23:00:00-04', 26, 27, 15, 'programado'),
('2026-06-26 23:00:00-04', 28, 25, 1,  'programado'),
-- Jornada 17 (partidos simultáneos)
('2026-06-27 17:00:00-04', 48, 45, 13, 'programado'),
('2026-06-27 17:00:00-04', 46, 47, 14, 'programado'),
('2026-06-27 19:30:00-04', 44, 41, 12, 'programado'),
('2026-06-27 19:30:00-04', 42, 43, 6,  'programado'),
('2026-06-27 22:00:00-04', 38, 39, 10, 'programado'),
('2026-06-27 22:00:00-04', 40, 37, 8,  'programado');
