-- Personas: usuarios, funcionarios y administradores.
-- CORREGIDO: emails de usuario1 y usuario2 alineados con los de la tabla usuario.

INSERT INTO persona
(mail, nombre, apellido, fecha_nacimiento, tipo_documento, pais_documento, numero_documento, pais_casa, localidad, calle, numero_casa, codigo_postal, contrasena)
VALUES
('usuario1@mail.com',  'Diego',    'De Oliveria Maderia', '2005-10-09', 'CI', 'Uruguay', '10000001', 'Uruguay', 'Montevideo', '18 de Julio',    '1001', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario2@mail.com',  'Facundo',  'Priz',                '2005-12-17', 'CI', 'Uruguay', '10000002', 'Uruguay', 'Montevideo', '8 de octubre',   '1002', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario3@mail.com',  'Luis',     'Rodríguez',           '1988-09-20', 'CI', 'Uruguay', '10000003', 'Uruguay', 'Canelones',  'Artigas',         '1003', '90000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario4@mail.com',  'María',    'Fernández',           '1995-02-15', 'CI', 'Uruguay', '10000004', 'Uruguay', 'Montevideo', 'Rivera',          '1004', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario5@mail.com',  'Carlos',   'López',               '1991-11-03', 'CI', 'Uruguay', '10000005', 'Uruguay', 'Maldonado',  'Sarandí',         '1005', '20000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario6@mail.com',  'Laura',    'Martínez',            '1993-04-21', 'CI', 'Uruguay', '10000006', 'Uruguay', 'Montevideo', 'Bulevar Artigas', '1006', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario7@mail.com',  'Diego',    'Silva',               '1987-06-18', 'CI', 'Uruguay', '10000007', 'Uruguay', 'Salto',      'Uruguay',         '1007', '50000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario8@mail.com',  'Sofía',    'Torres',              '1996-01-25', 'CI', 'Uruguay', '10000008', 'Uruguay', 'Montevideo', 'Ejido',           '1008', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario9@mail.com',  'Martín',   'Suárez',              '1994-03-30', 'CI', 'Uruguay', '10000009', 'Uruguay', 'Paysandú',   'Florida',         '1009', '60000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('usuario10@mail.com', 'Valentina','Castro',              '1997-12-05', 'CI', 'Uruguay', '10000010', 'Uruguay', 'Montevideo', 'Jackson',         '1010', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg==')
ON CONFLICT (mail) DO NOTHING;

INSERT INTO persona
(mail, nombre, apellido, fecha_nacimiento, tipo_documento, pais_documento, numero_documento, pais_casa, localidad, calle, numero_casa, codigo_postal, contrasena)
VALUES
('func1@mail.com', 'Pedro',   'Ramírez', '1985-01-01', 'CI', 'Uruguay', '20000001', 'Uruguay', 'Montevideo', 'Arenal Grande', '2001', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('func2@mail.com', 'Jorge',   'Vega',    '1986-02-02', 'CI', 'Uruguay', '20000002', 'Uruguay', 'Montevideo', 'Mercedes',      '2002', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('func3@mail.com', 'Ricardo', 'Sosa',    '1984-03-03', 'CI', 'Uruguay', '20000003', 'Uruguay', 'Montevideo', 'Paysandú',      '2003', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('func4@mail.com', 'Gabriel', 'Morales', '1987-04-04', 'CI', 'Uruguay', '20000004', 'Uruguay', 'Montevideo', 'Maldonado',     '2004', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('func5@mail.com', 'Andrés',  'Pintos',  '1988-05-05', 'CI', 'Uruguay', '20000005', 'Uruguay', 'Montevideo', 'Canelones',     '2005', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg==')
ON CONFLICT (mail) DO NOTHING;

INSERT INTO persona
(mail, nombre, apellido, fecha_nacimiento, tipo_documento, pais_documento, numero_documento, pais_casa, localidad, calle, numero_casa, codigo_postal, contrasena)
VALUES
('admin1@mail.com', 'Fernando',  'Ruiz',   '1980-01-01', 'CI', 'Uruguay', '30000001', 'Uruguay', 'Montevideo', 'Durazno',   '3001', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('admin2@mail.com', 'Patricia',  'Acosta', '1981-02-02', 'CI', 'Uruguay', '30000002', 'Uruguay', 'Montevideo', 'Paraguay',  '3002', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg=='),
('admin3@mail.com', 'Alejandro', 'Méndez', '1982-03-03', 'CI', 'Uruguay', '30000003', 'Uruguay', 'Montevideo', 'San José',  '3003', '11000', 'AQAAAAIAAYagAAAAEJRxhzBMy+w2AragvEpFTUisk88yo/Asa5JLcOkov7OhoiQKRIN8E8DyLujFLoMyUg==')
ON CONFLICT (mail) DO NOTHING;

INSERT INTO usuario (persona_mail, identidad_verificada) VALUES
('usuario1@mail.com',  true),
('usuario2@mail.com',  true),
('usuario3@mail.com',  true),
('usuario4@mail.com',  true),
('usuario5@mail.com',  false),
('usuario6@mail.com',  true),
('usuario7@mail.com',  false),
('usuario8@mail.com',  true),
('usuario9@mail.com',  true),
('usuario10@mail.com', false)
ON CONFLICT (persona_mail) DO NOTHING;

INSERT INTO funcionario (persona_mail, numero_legajo) VALUES
('func1@mail.com', 'LEG001'),
('func2@mail.com', 'LEG002'),
('func3@mail.com', 'LEG003'),
('func4@mail.com', 'LEG004'),
('func5@mail.com', 'LEG005')
ON CONFLICT (persona_mail) DO NOTHING;

-- admin1 → Canadá (pais_sede=1), admin2 → México (pais_sede=2), admin3 → USA (pais_sede=3)
INSERT INTO administrador (persona_mail, fk_pais_sede) VALUES
('admin1@mail.com', 1),
('admin2@mail.com', 2),
('admin3@mail.com', 3)
ON CONFLICT (persona_mail) DO NOTHING;

INSERT INTO telefonos (persona_mail, telefono) VALUES
('usuario1@mail.com',  '099000001'),
('usuario1@mail.com',  '099777777'),
('usuario2@mail.com',  '099000002'),
('usuario3@mail.com',  '099000003'),
('usuario4@mail.com',  '099000004'),
('usuario5@mail.com',  '099000005'),
('usuario6@mail.com',  '099000006'),
('usuario7@mail.com',  '099000007'),
('usuario8@mail.com',  '099000008'),
('usuario9@mail.com',  '099000009'),
('usuario10@mail.com', '099000010'),
('func1@mail.com',     '098000001'),
('func2@mail.com',     '098000002'),
('func3@mail.com',     '098000003'),
('func4@mail.com',     '098000004'),
('func5@mail.com',     '098000005'),
('admin1@mail.com',    '097000001'),
('admin2@mail.com',    '097000002'),
('admin3@mail.com',    '097000003')
ON CONFLICT (persona_mail, telefono) DO NOTHING;


