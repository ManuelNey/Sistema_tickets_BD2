-- ── Roles de cada uno en la BD ────────────────────────────────────────────
-- Cada rol conecta con un usuario de PostgreSQL.

-- Usuarios de BD ───────────────────────────────────────────────────────────
CREATE USER app_usuario     WITH PASSWORD 'pwd_usuario';
CREATE USER app_funcionario WITH PASSWORD 'pwd_funcionario';
CREATE USER app_admin       WITH PASSWORD 'pwd_admin';

-- ═══════════════════════════════════════════════════════════════════════════
-- app_usuario (que puede hacer)

-- Perfil propio: GetByMailAsync necesita leer datos personales y de contacto para mostrar el perfil, y actualizar datos personales.
-- para determinar el rol; UpdateProfileAsync actualiza persona y telefonos.
GRANT SELECT ON persona, usuario, administrador, funcionario, telefonos TO app_usuario;
GRANT UPDATE ON persona TO app_usuario;
GRANT INSERT, DELETE ON telefonos TO app_usuario;

-- Para partidos, estadios y precios
GRANT SELECT ON pais_sede, estadio, equipo, encuentro, sector, habilita, comision
    TO app_usuario;

-- Para Compras ya sea reservar (INSERT), ver detalle/mis-reservas (SELECT), pagar y cancelar (UPDATE estado)
GRANT SELECT, INSERT ON compra TO app_usuario;
GRANT UPDATE (estado) ON compra TO app_usuario;
GRANT USAGE, SELECT ON SEQUENCE compra_id_compra_seq TO app_usuario;

-- Para Entradas:
--   INSERT  → ReservarAsync crea una entrada por cantidad pedida
--   DELETE  → CancelarCompraAsync borra las entradas con DELETE.
--   UPDATE  → ConfirmarCompraAsync cambia estado reservada→activa
--             El trigger fn_transferencia_creada   cambia estado activa→transferida
--             El trigger fn_transferencia_resuelta cambia estado, dueño y contador
GRANT SELECT, INSERT, DELETE ON entrada TO app_usuario;
GRANT UPDATE (estado, fk_usuario_mail, cantidad_transferencias) ON entrada TO app_usuario;
GRANT USAGE, SELECT ON SEQUENCE entrada_id_entrada_seq TO app_usuario;

-- Para Transferencias: puede crear (INSERT), ver enviadas/recibidas (SELECT), resolver aceptada/rechazada (UPDATE estado)
GRANT SELECT, INSERT ON transferencia TO app_usuario;
GRANT UPDATE (estado) ON transferencia TO app_usuario;
GRANT USAGE, SELECT ON SEQUENCE transferencia_id_transferencia_seq TO app_usuario;

-- ═══════════════════════════════════════════════════════════════════════════
-- app_funcionario (que puede hacer)

-- Para el perfil: GetByMailAsync usa las mismas tablas que para usuario
GRANT SELECT ON persona, usuario, administrador, funcionario, telefonos TO app_funcionario;

-- Verificar que el dispositivo esté habilitado y asignado al funcionario
GRANT SELECT ON dispositivo, trabaja_con TO app_funcionario;

-- Validación de entradas en puerta: leer datos del ticket y del partido
GRANT SELECT ON entrada, habilita, encuentro, estadio, equipo, sector TO app_funcionario;

-- Marcar entrada como utilizada al escanear el QR
GRANT UPDATE (estado) ON entrada TO app_funcionario;

-- Para registrar la validación en la tabla de validación.
GRANT SELECT, INSERT ON validacion TO app_funcionario;
GRANT USAGE, SELECT ON SEQUENCE validacion_id_validacion_seq TO app_funcionario;

GRANT SELECT ON TABLE trabaja_en TO app_funcionario;


-- ═══════════════════════════════════════════════════════════════════════════
-- app_admin (que puede hacer)

-- Puede realizar Gestión completa: estadios, encuentros, sectores, habilitaciones, dispositivos,
-- funcionarios, comisiones y estadísticas.
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO app_admin;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO app_admin;

-- Evitamos que el admin borre personas, para mantener integridad de la bd.
REVOKE DELETE ON persona FROM app_admin;
