INSERT INTO trabaja_en (funcionario_mail, fk_habilita_id) VALUES
('func1@mail.com', 1),
('func1@mail.com', 2),
('func2@mail.com', 3)
ON CONFLICT DO NOTHING;