-- Infraestructura operativa: dispositivos, sectores y habilitación de sectores por encuentro.
-- CORREGIDO:
--   - Habilita de encuentro 1 usaba sectores del estadio 1 (BC Place) en vez del estadio 3 (Ciudad de México).
--   - Habilita de encuentro 1 usaba admin3 (USA) en vez de admin2 (México).

INSERT INTO dispositivo (numero_dispositivo, descripcion) VALUES
('QR001', 'Zebra TC26'),
('QR002', 'Zebra TC21'),
('QR003', 'Honeywell CT47'),
('QR004', 'Honeywell ScanPal EDA52'),
('QR005', 'Samsung Galaxy Tab Active4 Pro'),
('QR006', 'Samsung Galaxy Tab Active5'),
('QR007', 'Zebra TC58'),
('QR008', 'Datalogic Memor 11'),
('QR009', 'Chainway C66'),
('QR010', 'Urovo DT50')
ON CONFLICT (numero_dispositivo) DO NOTHING;

INSERT INTO trabaja_con (funcionario_mail, numero_dispositivo) VALUES
('func1@mail.com', 'QR001'),
('func1@mail.com', 'QR005'),
('func2@mail.com', 'QR002'),
('func3@mail.com', 'QR003'),
('func4@mail.com', 'QR004'),
('func5@mail.com', 'QR001'),
('func5@mail.com', 'QR002');

-- Sectores por estadio (4 sectores por estadio: VIP, Platea, Tribuna Norte, Tribuna Sur).
-- IDs resultantes: estadio 1 → sectores 1-4, estadio 2 → 5-8, estadio 3 → 9-12, etc.
INSERT INTO sector (nombre, capacidad_maxima, fk_estadio) VALUES
-- BC Place, Vancouver (54.000) → sectores 1-4
('VIP',           2700,  1),
('Platea',        13500, 1),
('Tribuna Norte', 18900, 1),
('Tribuna Sur',   18900, 1),
-- BMO Field, Toronto (45.000) → sectores 5-8
('VIP',           2250,  2),
('Platea',        11250, 2),
('Tribuna Norte', 15750, 2),
('Tribuna Sur',   15750, 2),
-- Estadio Ciudad de México (87.000) → sectores 9-12
('VIP',           4350,  3),
('Platea',        21750, 3),
('Tribuna Norte', 30450, 3),
('Tribuna Sur',   30450, 3),
-- Estadio Guadalajara (49.000) → sectores 13-16
('VIP',           2450,  4),
('Platea',        12250, 4),
('Tribuna Norte', 17150, 4),
('Tribuna Sur',   17150, 4),
-- Estadio Monterrey (53.000) → sectores 17-20
('VIP',           2650,  5),
('Platea',        13250, 5),
('Tribuna Norte', 18550, 5),
('Tribuna Sur',   18550, 5),
-- Mercedes-Benz Stadium, Atlanta (75.000) → sectores 21-24
('VIP',           3750,  6),
('Platea',        18750, 6),
('Tribuna Norte', 26250, 6),
('Tribuna Sur',   26250, 6),
-- Gillette Stadium, Boston (65.000) → sectores 25-28
('VIP',           3250,  7),
('Platea',        16250, 7),
('Tribuna Norte', 22750, 7),
('Tribuna Sur',   22750, 7),
-- AT&T Stadium, Dallas (92.000) → sectores 29-32
('VIP',           4600,  8),
('Platea',        23000, 8),
('Tribuna Norte', 32200, 8),
('Tribuna Sur',   32200, 8),
-- NRG Stadium, Houston (72.000) → sectores 33-36
('VIP',           3600,  9),
('Platea',        18000, 9),
('Tribuna Norte', 25200, 9),
('Tribuna Sur',   25200, 9),
-- GEHA Field at Arrowhead, Kansas City (76.000) → sectores 37-40
('VIP',           3800,  10),
('Platea',        19000, 10),
('Tribuna Norte', 26600, 10),
('Tribuna Sur',   26600, 10),
-- SoFi Stadium, Los Ángeles (70.000) → sectores 41-44
('VIP',           3500,  11),
('Platea',        17500, 11),
('Tribuna Norte', 24500, 11),
('Tribuna Sur',   24500, 11),
-- Hard Rock Stadium, Miami (65.000) → sectores 45-48
('VIP',           3250,  12),
('Platea',        16250, 12),
('Tribuna Norte', 22750, 12),
('Tribuna Sur',   22750, 12),
-- MetLife Stadium, Nueva York (82.000) → sectores 49-52
('VIP',           4100,  13),
('Platea',        20500, 13),
('Tribuna Norte', 28700, 13),
('Tribuna Sur',   28700, 13),
-- Lincoln Financial Field, Filadelfia (69.000) → sectores 53-56
('VIP',           3450,  14),
('Platea',        17250, 14),
('Tribuna Norte', 24150, 14),
('Tribuna Sur',   24150, 14),
-- Lumen Field, Seattle (69.000) → sectores 57-60
('VIP',           3450,  15),
('Platea',        17250, 15),
('Tribuna Norte', 24150, 15),
('Tribuna Sur',   24150, 15),
-- Levi's Stadium, San Francisco (68.000) → sectores 61-64
('VIP',           3400,  16),
('Platea',        17000, 16),
('Tribuna Norte', 23800, 16),
('Tribuna Sur',   23800, 16)
ON CONFLICT (fk_estadio, nombre) DO NOTHING;

-- Habilitación de sectores para los primeros 5 encuentros.
-- Encuentro 1: México vs Sudáfrica, estadio 3 (Ciudad de México, México) → admin2
-- Encuentro 2: Rep. Corea vs Rep. Checa, estadio 4 (Guadalajara, México)  → admin2
-- Encuentro 3: Canadá vs Bosnia, estadio 2 (BMO Field, Canadá)             → admin1
-- Encuentro 4: USA vs Paraguay, estadio 11 (SoFi, USA)                     → admin3
-- Encuentro 5: Catar vs Suiza, estadio 16 (Levi's, USA)                    → admin3
INSERT INTO habilita (fk_encuentro, fk_sector, fk_sector_estadio, precio, fk_administrador_mail) VALUES
-- Encuentro 1 → sectores 9-12 (estadio 3, Ciudad de México)
(1, 9,  3, 350, 'admin2@mail.com'),
(1, 10, 3, 150, 'admin2@mail.com'),
(1, 11, 3, 80,  'admin2@mail.com'),
(1, 12, 3, 80,  'admin2@mail.com'),
-- Encuentro 2 → sectores 13-16 (estadio 4, Guadalajara)
(2, 13, 4, 300, 'admin2@mail.com'),
(2, 14, 4, 150, 'admin2@mail.com'),
(2, 15, 4, 80,  'admin2@mail.com'),
(2, 16, 4, 80,  'admin2@mail.com'),
-- Encuentro 3 → sectores 5-8 (estadio 2, BMO Field)
(3, 5,  2, 300, 'admin1@mail.com'),
(3, 6,  2, 150, 'admin1@mail.com'),
(3, 7,  2, 80,  'admin1@mail.com'),
(3, 8,  2, 80,  'admin1@mail.com'),
-- Encuentro 4 → sectores 41-44 (estadio 11, SoFi)
(4, 41, 11, 300, 'admin3@mail.com'),
(4, 42, 11, 150, 'admin3@mail.com'),
(4, 43, 11, 80,  'admin3@mail.com'),
(4, 44, 11, 80,  'admin3@mail.com'),
-- Encuentro 5 → sectores 61-64 (estadio 16, Levi's)
(5, 61, 16, 300, 'admin3@mail.com'),
(5, 62, 16, 150, 'admin3@mail.com'),
(5, 63, 16, 80,  'admin3@mail.com'),
(5, 64, 16, 80,  'admin3@mail.com')
ON CONFLICT (fk_encuentro, fk_sector) DO NOTHING;

-- Entradas generadas para compras pagadas (IDs de habilita 1-20 según orden de inserción anterior).
INSERT INTO entrada (estado, cantidad_transferencias, fk_habilita_id, fk_compra_id, fk_usuario_mail) VALUES
-- Compra 1 (usuario1)
('activa', 0, 1,  1,  'usuario1@mail.com'),
('activa', 0, 2,  1,  'usuario1@mail.com'),
-- Compra 2 (usuario2)
('activa', 0, 1,  2,  'usuario2@mail.com'),
('activa', 0, 3,  2,  'usuario2@mail.com'),
('activa', 0, 4,  2,  'usuario2@mail.com'),
-- Compra 3 (usuario3)
('activa', 0, 5,  3,  'usuario3@mail.com'),
-- Compra 4 (usuario4)
('activa', 0, 6,  4,  'usuario4@mail.com'),
('activa', 0, 7,  4,  'usuario4@mail.com'),
-- Compra 5 (usuario5)
('activa', 0, 9,  5,  'usuario5@mail.com'),
('activa', 0, 10, 5,  'usuario5@mail.com'),
('activa', 0, 11, 5,  'usuario5@mail.com'),
('activa', 0, 12, 5,  'usuario5@mail.com'),
-- Compra 7 (usuario7)
('activa', 0, 13, 7,  'usuario7@mail.com'),
('activa', 0, 14, 7,  'usuario7@mail.com'),
-- Compra 8 (usuario8)
('activa', 0, 13, 8,  'usuario8@mail.com'),
('activa', 0, 15, 8,  'usuario8@mail.com'),
('activa', 0, 16, 8,  'usuario8@mail.com'),
-- Compra 10 (usuario10)
('activa', 0, 17, 10, 'usuario10@mail.com'),
('activa', 0, 18, 10, 'usuario10@mail.com'),
('activa', 0, 19, 10, 'usuario10@mail.com'),
('activa', 0, 20, 10, 'usuario10@mail.com'),
-- Compra 11 (usuario1)
('activa', 0, 2,  11, 'usuario1@mail.com'),
('activa', 0, 3,  11, 'usuario1@mail.com'),
-- Compra 12 (usuario2)
('activa', 0, 5,  12, 'usuario2@mail.com'),
('activa', 0, 6,  12, 'usuario2@mail.com'),
-- Compra 13 (usuario3)
('activa', 0, 9,  13, 'usuario3@mail.com'),
('activa', 0, 10, 13, 'usuario3@mail.com'),
('activa', 0, 11, 13, 'usuario3@mail.com'),
-- Compra 14 (usuario4)
('activa', 0, 14, 14, 'usuario4@mail.com'),
-- Compra 16 (usuario6)
('activa', 0, 17, 16, 'usuario6@mail.com'),
('activa', 0, 18, 16, 'usuario6@mail.com');
