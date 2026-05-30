-- Seed compatible con schema.sql actual (minimal)

INSERT INTO pais_sede (nombre) VALUES ('Uruguay') ON CONFLICT DO NOTHING;

INSERT INTO persona (mail, nombre, apellido, fecha_nacimiento, tipo_documento, pais_documento, numero_documento, pais_casa, localidad, calle, numero_casa, codigo_postal, contrasena)
VALUES ('dev.user@example.com', 'Dev', 'User', '1990-01-01', 'DNI', 'Uruguay', '00000000', 'Uruguay', 'Montevideo', 'Calle Falsa', '0', '00000', 'devpass') ON CONFLICT DO NOTHING;

INSERT INTO usuario (persona_mail, identidad_verificada) VALUES ('dev.user@example.com', true) ON CONFLICT DO NOTHING;

INSERT INTO equipo (nombre, pais) VALUES ('Equipo Local', 'Uruguay') ON CONFLICT DO NOTHING;
INSERT INTO equipo (nombre, pais) VALUES ('Equipo Visitante', 'Argentina') ON CONFLICT DO NOTHING;

INSERT INTO estadio (nombre, ciudad, fk_pais_sede) VALUES ('Estadio Unico', 'Montevideo', 1) ON CONFLICT DO NOTHING;

INSERT INTO sector (nombre, capacidad_maxima, fk_estadio) VALUES ('Sector Unico', 5000, 1) ON CONFLICT DO NOTHING;

INSERT INTO encuentro (fecha, fk_equipo_local, fk_equipo_visitante, fk_estadio, estado)
VALUES (now() + interval '7 days', 1, 2, 1, 'programado') ON CONFLICT DO NOTHING;

INSERT INTO habilita (fk_encuentro, fk_sector, fk_sector_estadio, precio, fk_administrador_mail)
VALUES (1, 1, 1, 1000.00, 'dev.user@example.com') ON CONFLICT DO NOTHING;

INSERT INTO comision (porcentaje, fecha_inicio) VALUES (5.00, now() - interval '30 days') ON CONFLICT DO NOTHING;

INSERT INTO compra (fecha, hora, estado, monto_total, fk_comision, fk_usuario_mail)
VALUES (now(), now()::time, 'confirmada', 1050.00, 1, 'dev.user@example.com') ON CONFLICT DO NOTHING;

INSERT INTO entrada (estado, cantidad_transferencias, fk_habilita_id, fk_compra_id, fk_usuario_mail)
VALUES ('activa', 0, 1, 1, 'dev.user@example.com') ON CONFLICT DO NOTHING;
