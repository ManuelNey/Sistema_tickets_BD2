-- Datos de negocio: comisiones, compras, transferencias.
-- CORREGIDO:
--   - Emails de compradores actualizados a los de 03_usuarios.sql.
--   - UPDATEs al final para reflejar transferencias aceptadas en fk_usuario_mail y cantidad_transferencias.

INSERT INTO comision (porcentaje, fecha_inicio, fecha_fin) VALUES
(5.00,  '2025-01-01', '2025-12-31'),
(7.50,  '2026-01-01', '2026-06-30'),
(10.00, '2026-07-01', '2026-12-31');

-- Compras en marzo 2026 → fk_comision=2 (7.50%, vigente 2026-01-01 / 2026-06-30).
-- Compras 6, 9, 15, 18 en estado 'pendiente' → sin entradas generadas.
INSERT INTO compra (fecha, estado, monto_total, fk_comision, fk_usuario_mail) VALUES
('2026-03-01 10:15:00', 'pagada',   500.00,  2, 'usuario1@mail.com'),
('2026-03-02 14:30:00', 'pagada',   1200.00, 2, 'usuario2@mail.com'),
('2026-03-03 18:45:00', 'pagada',   800.00,  2, 'usuario3@mail.com'),
('2026-03-04 09:20:00', 'pagada',   950.00,  2, 'usuario4@mail.com'),
('2026-03-05 16:10:00', 'pagada',   1500.00, 2, 'usuario5@mail.com'),
('2026-03-06 11:05:00', 'pendiente',650.00,  2, 'usuario6@mail.com'),
('2026-03-07 13:40:00', 'pagada',   2100.00, 2, 'usuario7@mail.com'),
('2026-03-08 17:25:00', 'pagada',   1800.00, 2, 'usuario8@mail.com'),
('2026-03-09 19:15:00', 'pendiente',700.00,  2, 'usuario9@mail.com'),
('2026-03-10 15:50:00', 'pagada',   2400.00, 2, 'usuario10@mail.com'),
('2026-03-11 10:00:00', 'pagada',   1100.00, 2, 'usuario1@mail.com'),
('2026-03-12 12:30:00', 'pagada',   850.00,  2, 'usuario2@mail.com'),
('2026-03-13 14:45:00', 'pagada',   3200.00, 2, 'usuario3@mail.com'),
('2026-03-14 18:10:00', 'pagada',   1450.00, 2, 'usuario4@mail.com'),
('2026-03-15 20:20:00', 'pendiente',900.00,  2, 'usuario5@mail.com'),
('2026-03-16 09:35:00', 'pagada',   1750.00, 2, 'usuario6@mail.com'),
('2026-03-17 11:50:00', 'pagada',   2600.00, 2, 'usuario7@mail.com'),
('2026-03-18 16:15:00', 'pendiente',1000.00, 2, 'usuario8@mail.com'),
('2026-03-19 18:40:00', 'pagada',   2800.00, 2, 'usuario9@mail.com'),
('2026-03-20 21:00:00', 'pagada',   3500.00, 2, 'usuario10@mail.com');

-- Entradas generadas para compras pagadas (IDs de habilita 1-20 segun orden de insercion en 04_operacion.sql).
-- Van aca, DESPUES de las compras, por la FK entrada.fk_compra_id -> compra.id_compra.
INSERT INTO entrada (estado, cantidad_transferencias, fk_habilita_id, fk_compra_id, fk_usuario_mail) VALUES
-- Cada compra usa una sola habilita (un unico sector), respetando el encuentro original.
-- Se mantiene la cantidad y el orden de entradas para no alterar los id_entrada (1-31).
-- Compra 1 (usuario1) → habilita 1
('activa', 0, 1,  1,  'usuario1@mail.com'),
('activa', 0, 1,  1,  'usuario1@mail.com'),
-- Compra 2 (usuario2) → habilita 1
('activa', 0, 1,  2,  'usuario2@mail.com'),
('activa', 0, 1,  2,  'usuario2@mail.com'),
('activa', 0, 1,  2,  'usuario2@mail.com'),
-- Compra 3 (usuario3) → habilita 5
('activa', 0, 5,  3,  'usuario3@mail.com'),
-- Compra 4 (usuario4) → habilita 6
('activa', 0, 6,  4,  'usuario4@mail.com'),
('activa', 0, 6,  4,  'usuario4@mail.com'),
-- Compra 5 (usuario5) → habilita 9
('activa', 0, 9,  5,  'usuario5@mail.com'),
('activa', 0, 9,  5,  'usuario5@mail.com'),
('activa', 0, 9,  5,  'usuario5@mail.com'),
('activa', 0, 9,  5,  'usuario5@mail.com'),
-- Compra 7 (usuario7) → habilita 13
('activa', 0, 13, 7,  'usuario7@mail.com'),
('activa', 0, 13, 7,  'usuario7@mail.com'),
-- Compra 8 (usuario8) → habilita 13
('activa', 0, 13, 8,  'usuario8@mail.com'),
('activa', 0, 13, 8,  'usuario8@mail.com'),
('activa', 0, 13, 8,  'usuario8@mail.com'),
-- Compra 10 (usuario10) → habilita 17
('activa', 0, 17, 10, 'usuario10@mail.com'),
('activa', 0, 17, 10, 'usuario10@mail.com'),
('activa', 0, 17, 10, 'usuario10@mail.com'),
('activa', 0, 17, 10, 'usuario10@mail.com'),
-- Compra 11 (usuario1) → habilita 2
('activa', 0, 2,  11, 'usuario1@mail.com'),
('activa', 0, 2,  11, 'usuario1@mail.com'),
-- Compra 12 (usuario2) → habilita 5
('activa', 0, 5,  12, 'usuario2@mail.com'),
('activa', 0, 5,  12, 'usuario2@mail.com'),
-- Compra 13 (usuario3) → habilita 9
('activa', 0, 9,  13, 'usuario3@mail.com'),
('activa', 0, 9,  13, 'usuario3@mail.com'),
('activa', 0, 9,  13, 'usuario3@mail.com'),
-- Compra 14 (usuario4) → habilita 14
('activa', 0, 14, 14, 'usuario4@mail.com'),
-- Compra 16 (usuario6) → habilita 17
('activa', 0, 17, 16, 'usuario6@mail.com'),
('activa', 0, 17, 16, 'usuario6@mail.com');

INSERT INTO transferencia (fecha, estado, fk_usuario_mail_emisor, fk_usuario_mail_receptor, fk_entrada_id) VALUES
('2026-04-01 10:15:00', 'aceptada',  'usuario1@mail.com',  'usuario2@mail.com',  1),
('2026-04-03 14:30:00', 'rechazada', 'usuario2@mail.com',  'usuario3@mail.com',  3),
('2026-04-05 18:45:00', 'aceptada',  'usuario4@mail.com',  'usuario5@mail.com',  7),
('2026-04-08 11:20:00', 'pendiente', 'usuario7@mail.com',  'usuario8@mail.com',  13),
('2026-04-10 09:10:00', 'aceptada',  'usuario10@mail.com', 'usuario9@mail.com',  18),
('2026-04-12 16:40:00', 'rechazada', 'usuario1@mail.com',  'usuario6@mail.com',  22),
('2026-04-15 13:25:00', 'pendiente', 'usuario3@mail.com',  'usuario4@mail.com',  26),
('2026-04-18 19:00:00', 'aceptada',  'usuario6@mail.com',  'usuario10@mail.com', 30);

-- Sincronizar poseedor actual y contador de transferencias para las transferencias aceptadas.
UPDATE entrada SET fk_usuario_mail = 'usuario2@mail.com',  cantidad_transferencias = 1 WHERE id_entrada = 1;
UPDATE entrada SET fk_usuario_mail = 'usuario5@mail.com',  cantidad_transferencias = 1 WHERE id_entrada = 7;
UPDATE entrada SET fk_usuario_mail = 'usuario9@mail.com',  cantidad_transferencias = 1 WHERE id_entrada = 18;
UPDATE entrada SET fk_usuario_mail = 'usuario10@mail.com', cantidad_transferencias = 1 WHERE id_entrada = 30;

-- No se insertan validaciones: requieren tokens generados por la lógica de negocio.
