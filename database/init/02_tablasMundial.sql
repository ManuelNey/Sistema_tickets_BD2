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
('2026-06-11 16:00:00', 1,  2,  3,  'programado'),
('2026-06-11 21:00:00', 3,  4,  4,  'programado'),

-- Jornada 2
('2026-06-12 16:00:00', 5,  6,  2,  'programado'),
('2026-06-12 22:00:00', 13, 14, 11, 'programado'),

-- Jornada 3        
('2026-06-13 16:00:00', 7,  8,  16, 'programado'),
('2026-06-13 19:00:00', 9,  10, 13, 'programado'),
('2026-06-13 22:00:00', 11, 12, 7,  'programado'),
('2026-06-14 01:00:00', 15, 16, 1,  'programado'),

-- Jornada 4
('2026-06-14 14:00:00', 17, 18, 9,  'programado'),
('2026-06-14 17:00:00', 21, 22, 8,  'programado'),
('2026-06-14 20:00:00', 19, 20, 14, 'programado'),
('2026-06-14 23:00:00', 23, 24, 5,  'programado'),

-- Jornada 5
('2026-06-15 14:00:00', 29, 30, 6,  'programado'),
('2026-06-15 17:00:00', 25, 26, 15, 'programado'),
('2026-06-15 20:00:00', 31, 32, 12, 'programado'),
('2026-06-15 22:00:00', 27, 28, 11, 'programado'),

-- Jornada 6
('2026-06-16 16:00:00', 33, 34, 13, 'programado'),
('2026-06-16 19:00:00', 35, 36, 7,  'programado'),
('2026-06-16 22:00:00', 37, 38, 10, 'programado'),
('2026-06-17 01:00:00', 39, 40, 16, 'programado'),

-- Jornada 7
('2026-06-17 14:00:00', 41, 42, 9,  'programado'),
('2026-06-17 17:00:00', 45, 46, 8,  'programado'),
('2026-06-17 20:00:00', 47, 48, 2,  'programado'),
('2026-06-17 23:00:00', 43, 44, 3,  'programado'),

-- Jornada 8
('2026-06-18 13:00:00', 4,  2,  6,  'programado'),
('2026-06-18 16:00:00', 8,  6,  11, 'programado'),
('2026-06-18 19:00:00', 5,  7,  1,  'programado'),
('2026-06-18 22:00:00', 1,  3,  4,  'programado'),

-- Jornada 9
('2026-06-19 16:00:00', 13, 15, 15, 'programado'),
('2026-06-19 19:00:00', 12, 10, 7,  'programado'),
('2026-06-19 22:00:00', 9,  11, 14, 'programado'),
('2026-06-20 01:00:00', 16, 14, 16, 'programado'),

-- Jornada 10
('2026-06-20 14:00:00', 21, 23, 9,  'programado'),
('2026-06-20 17:00:00', 17, 19, 2,  'programado'),
('2026-06-20 23:00:00', 20, 18, 10, 'programado'),
('2026-06-21 01:00:00', 24, 22, 5,  'programado'),
-- Jornada 11
('2026-06-21 13:00:00', 29, 31, 6,  'programado'),
('2026-06-21 16:00:00', 25, 27, 11, 'programado'),
('2026-06-21 19:00:00', 32, 30, 12, 'programado'),
('2026-06-21 22:00:00', 28, 26, 1,  'programado'),

-- Jornada 12
('2026-06-22 14:00:00', 37, 39, 8,  'programado'),
('2026-06-22 18:00:00', 33, 35, 14, 'programado'),
('2026-06-22 21:00:00', 36, 34, 13, 'programado'),
('2026-06-23 00:00:00', 40, 38, 16, 'programado'),

-- Jornada 13
('2026-06-23 14:00:00', 41, 43, 9,  'programado'),
('2026-06-23 17:00:00', 45, 47, 7,  'programado'),
('2026-06-23 20:00:00', 48, 46, 2,  'programado'),
('2026-06-23 23:00:00', 44, 42, 4,  'programado'),

-- Jornada 14
('2026-06-24 16:00:00', 8,  5,  1,  'programado'),
('2026-06-24 16:00:00', 6,  7,  15, 'programado'),
('2026-06-24 19:00:00', 12, 9,  12, 'programado'),
('2026-06-24 19:00:00', 10, 11, 6,  'programado'),
('2026-06-24 22:00:00', 4,  1,  3,  'programado'),
('2026-06-24 22:00:00', 2,  3,  5,  'programado'),

-- Jornada 15
('2026-06-25 17:00:00', 18, 19, 14, 'programado'),
('2026-06-25 17:00:00', 20, 17, 13, 'programado'),
('2026-06-25 20:00:00', 22, 23, 8,  'programado'),
('2026-06-25 20:00:00', 24, 21, 10, 'programado'),
('2026-06-25 23:00:00', 16, 13, 11, 'programado'),
('2026-06-25 23:00:00', 14, 15, 16, 'programado'),

-- Jornada 16
('2026-06-26 16:00:00', 36, 33, 7,  'programado'),
('2026-06-26 16:00:00', 34, 35, 2,  'programado'),
('2026-06-26 21:00:00', 30, 31, 9,  'programado'),
('2026-06-26 21:00:00', 32, 29, 4,  'programado'),
('2026-06-27 00:00:00', 26, 27, 15, 'programado'),
('2026-06-27 00:00:00', 28, 25, 1,  'programado'),

-- Jornada 17
('2026-06-27 18:00:00', 48, 45, 13, 'programado'),
('2026-06-27 18:00:00', 46, 47, 14, 'programado'),
('2026-06-27 20:30:00', 44, 41, 12, 'programado'),
('2026-06-27 20:30:00', 42, 43, 6,  'programado'),
('2026-06-27 23:00:00', 38, 39, 10, 'programado'),
('2026-06-27 23:00:00', 40, 37, 8,  'programado');

-- Sincronizar sequences después de insertar IDs explícitos.
-- Sin esto, el próximo INSERT sin ID conflictuaría con los ya existentes.
SELECT setval(pg_get_serial_sequence('pais_sede', 'id_pais_sede'), MAX(id_pais_sede)) FROM pais_sede;
SELECT setval(pg_get_serial_sequence('estadio',   'id_estadio'),   MAX(id_estadio))   FROM estadio;
SELECT setval(pg_get_serial_sequence('equipo',     'id_equipo'),    MAX(id_equipo))    FROM equipo;
