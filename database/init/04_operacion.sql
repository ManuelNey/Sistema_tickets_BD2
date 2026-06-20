-- Infraestructura operativa: dispositivos, sectores y habilitación de sectores por encuentro.
-- CORREGIDO:
--   - Habilita de encuentro 1 usaba sectores del estadio 1 (BC Place) en vez del estadio 3 (Ciudad de México).
--   - Habilita de encuentro 1 usaba admin3 (USA) en vez de admin2 (México).

INSERT INTO dispositivo (numero_dispositivo, descripcion, estado) VALUES
('I6MFE3', 'Iphone de Martin', 'habilitado'),
('QR002', 'Zebra TC21', 'habilitado'),
('QR003', 'Honeywell CT47', 'habilitado'),
('QR004', 'Honeywell ScanPal EDA52', 'habilitado'),
('QR005', 'Samsung Galaxy Tab Active4 Pro', 'habilitado'),
('QR006', 'Samsung Galaxy Tab Active5', 'habilitado'),
('QR007', 'Zebra TC58', 'habilitado'),
('QR008', 'Datalogic Memor 11', 'habilitado'),
('QR009', 'Chainway C66', 'habilitado'),
('QR010', 'Urovo DT50', 'habilitado')
ON CONFLICT (numero_dispositivo) DO NOTHING;

INSERT INTO trabaja_con (funcionario_mail, numero_dispositivo) VALUES
('func1@mail.com', 'I6MFE3'),
('func1@mail.com', 'QR005'),
('func2@mail.com', 'QR002'),
('func3@mail.com', 'QR003'),
('func4@mail.com', 'QR004'),
('func5@mail.com', 'I6MFE3'),
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

-- En este punto ya se han insertado los sectores para los 16 estadios, con IDs 1-64. 
-- Las habilitaciones de sectores por encuentro se insertan a continuación, en la tabla habilita,
-- usando esos IDs de sector y los IDs de encuentro (1-48) que se insertaron en 02_tablasMundial.sql.
ON CONFLICT (fk_estadio, nombre) DO NOTHING;
INSERT INTO habilita
(fk_encuentro, fk_sector, precio, fk_administrador_mail)
-- Armamos habilitaciones para cada encuentro, usando los sectores del estadio correspondiente al encuentro.
-- Esto nos permite arma cada fila de la tabla habilita sin escribir manualmente cada combinación encuentro-sector,
-- sino usando un SELECT que relacione encuentro, estadio y sector.

SELECT
    e.id_encuentro,
    s.id_sector,
    CASE
        WHEN s.nombre = 'VIP' THEN 300
        WHEN s.nombre = 'Platea' THEN 150
        ELSE 80 --Para los otros 2 sectores (Tribuna Norte y Tribuna Sur)
    END,
    CASE est.fk_pais_sede -- Asignamos el administrador según el país sede del estadio del encuentro:
        WHEN 1 THEN 'admin1@mail.com'
        WHEN 2 THEN 'admin2@mail.com'
        WHEN 3 THEN 'admin3@mail.com'
    END
FROM encuentro e
JOIN estadio est
    ON est.id_estadio = e.fk_estadio
JOIN sector s
    ON s.fk_estadio = est.id_estadio
ON CONFLICT (fk_encuentro, fk_sector) DO NOTHING;

-- Las entradas sembradas se movieron a 05_negocio.sql: deben insertarse DESPUES de las compras
-- por la FK entrada.fk_compra_id -> compra.id_compra (si no, falla la inicializacion).
