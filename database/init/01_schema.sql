-- Esquema alineado al modelo final BD2
-- Ordenado para poder ejecutarse desde cero en PostgreSQL sin dependencias rotas.
CREATE EXTENSION IF NOT EXISTS btree_gist;

CREATE TABLE IF NOT EXISTS pais_sede (
  id_pais_sede SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS persona (
  mail VARCHAR(255) PRIMARY KEY,
  nombre VARCHAR(150) NOT NULL,
  apellido VARCHAR(150) NOT NULL,
  fecha_nacimiento DATE,
  tipo_documento VARCHAR(50) NOT NULL,
  pais_documento VARCHAR(100) NOT NULL,
  numero_documento VARCHAR(100) NOT NULL UNIQUE,
  pais_casa VARCHAR(100) NOT NULL,
  localidad VARCHAR(150) NOT NULL,
  calle VARCHAR(200) NOT NULL,
  numero_casa VARCHAR(50) NOT NULL,
  codigo_postal VARCHAR(30) NOT NULL,
  contrasena VARCHAR(255) NOT NULL,
  CONSTRAINT chk_persona_nombre CHECK (length(trim(nombre)) > 0),
  CONSTRAINT chk_persona_apellido CHECK (length(trim(apellido)) > 0),
  CONSTRAINT chk_persona_contrasena CHECK (length(trim(contrasena)) >= 6)
);

CREATE TABLE IF NOT EXISTS telefonos (
  persona_mail VARCHAR(255) NOT NULL REFERENCES persona(mail) ON DELETE CASCADE,
  telefono VARCHAR(50) NOT NULL,
  PRIMARY KEY (persona_mail, telefono)
);

CREATE TABLE IF NOT EXISTS usuario (
  persona_mail VARCHAR(255) PRIMARY KEY REFERENCES persona(mail) ON DELETE CASCADE,
  identidad_verificada BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_registro TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT chk_usuario_fecha_registro CHECK (fecha_registro <= now())
);

CREATE TABLE IF NOT EXISTS funcionario (
  persona_mail VARCHAR(255) PRIMARY KEY REFERENCES persona(mail) ON DELETE CASCADE,
  numero_legajo VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS administrador (
  persona_mail VARCHAR(255) PRIMARY KEY REFERENCES persona(mail) ON DELETE CASCADE,
  fecha_asignacion TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  fk_pais_sede INTEGER NOT NULL REFERENCES pais_sede(id_pais_sede),
  CONSTRAINT chk_administrador_fecha_asignacion CHECK (fecha_asignacion <= now())
);

CREATE TABLE IF NOT EXISTS dispositivo (
  numero_dispositivo VARCHAR(100) PRIMARY KEY,
  descripcion TEXT NOT NULL,
  estado VARCHAR(50) NOT NULL,
  CONSTRAINT chk_dispositivo_descripcion CHECK (length(trim(descripcion)) > 0),
  CONSTRAINT chk_dispositivo_estado CHECK (estado IN ('habilitado', 'deshabilitado'))
);

CREATE TABLE IF NOT EXISTS comision (
  id_comision SERIAL PRIMARY KEY,
  porcentaje NUMERIC(5,2) NOT NULL,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  CONSTRAINT chk_comision_porcentaje CHECK (porcentaje >= 0 AND porcentaje <= 100),
  CONSTRAINT chk_comision_fechas CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);

CREATE TABLE IF NOT EXISTS estadio (
  id_estadio SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  ciudad VARCHAR(200) NOT NULL,
  fk_pais_sede INTEGER NOT NULL REFERENCES pais_sede(id_pais_sede),
  CONSTRAINT uq_estadio_nombre_ciudad UNIQUE (nombre, ciudad),
  CONSTRAINT chk_estadio_nombre CHECK (length(trim(nombre)) > 0),
  CONSTRAINT chk_estadio_ciudad CHECK (length(trim(ciudad)) > 0)
);

CREATE TABLE IF NOT EXISTS equipo (
  id_equipo SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL UNIQUE,
  pais VARCHAR(100) NOT NULL,
  CONSTRAINT chk_equipo_nombre CHECK (length(trim(nombre)) > 0),
  CONSTRAINT chk_equipo_pais CHECK (length(trim(pais)) > 0)
);

CREATE TABLE IF NOT EXISTS encuentro (
  id_encuentro SERIAL PRIMARY KEY,
  fecha TIMESTAMP NOT NULL,
  fk_equipo_local INTEGER NOT NULL REFERENCES equipo(id_equipo),
  fk_equipo_visitante INTEGER NOT NULL REFERENCES equipo(id_equipo),
  fk_estadio INTEGER NOT NULL REFERENCES estadio(id_estadio) ON DELETE CASCADE,
  estado VARCHAR(50) NOT NULL,
  CONSTRAINT chk_encuentro_equipos CHECK (fk_equipo_local <> fk_equipo_visitante),
  CONSTRAINT chk_encuentro_estado CHECK (estado IN ('programado', 'en_juego', 'finalizado', 'cancelado'))
);

CREATE TABLE IF NOT EXISTS sector (
  id_sector SERIAL PRIMARY KEY,
  nombre VARCHAR(200) NOT NULL,
  capacidad_maxima INTEGER NOT NULL,
  fk_estadio INTEGER NOT NULL REFERENCES estadio(id_estadio) ON DELETE CASCADE,
  CONSTRAINT uq_sector_estadio_nombre UNIQUE (fk_estadio, nombre),
  CONSTRAINT chk_sector_nombre CHECK (length(trim(nombre)) > 0),
  CONSTRAINT chk_sector_capacidad CHECK (capacidad_maxima > 0)
);

CREATE TABLE IF NOT EXISTS habilita (
  id SERIAL PRIMARY KEY,
  fk_encuentro INTEGER NOT NULL REFERENCES encuentro(id_encuentro) ON DELETE CASCADE,
  fk_sector INTEGER NOT NULL REFERENCES sector(id_sector) ON DELETE CASCADE,
  precio NUMERIC(12,2) NOT NULL,
  fk_administrador_mail VARCHAR(255) NOT NULL REFERENCES administrador(persona_mail),
  CONSTRAINT uq_habilita_encuentro_sector UNIQUE (fk_encuentro, fk_sector),
  CONSTRAINT chk_habilita_precio CHECK (precio >= 0)
);

CREATE TABLE IF NOT EXISTS compra (
  id_compra SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hora TIME,
  estado VARCHAR(50) NOT NULL,
  monto_total NUMERIC(12,2) NOT NULL,
  fk_comision INTEGER REFERENCES comision(id_comision),
  fk_usuario_mail VARCHAR(255) NOT NULL REFERENCES usuario(persona_mail),
  CONSTRAINT chk_compra_estado CHECK (estado IN ('pendiente', 'pagada', 'cancelada')),
  CONSTRAINT chk_compra_monto CHECK (monto_total >= 0)
);

CREATE TABLE IF NOT EXISTS entrada (
  id_entrada SERIAL PRIMARY KEY,
  estado VARCHAR(50) NOT NULL,
  cantidad_transferencias INTEGER NOT NULL DEFAULT 0,
  fk_habilita_id INTEGER NOT NULL REFERENCES habilita(id) ON DELETE CASCADE,
  fk_compra_id INTEGER NOT NULL REFERENCES compra(id_compra),
  fk_usuario_mail VARCHAR(255) NOT NULL REFERENCES usuario(persona_mail),
  CONSTRAINT chk_entrada_estado CHECK (estado IN ('reservada', 'activa', 'utilizada', 'transferida')),
  CONSTRAINT chk_entrada_transferencias CHECK (cantidad_transferencias >= 0 AND cantidad_transferencias <= 3)
);

CREATE TABLE IF NOT EXISTS trabaja_con (
  funcionario_mail VARCHAR(255) NOT NULL REFERENCES funcionario(persona_mail) ON DELETE CASCADE,
  numero_dispositivo VARCHAR(100) NOT NULL REFERENCES dispositivo(numero_dispositivo) ON DELETE CASCADE,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (funcionario_mail, numero_dispositivo)
);

CREATE TABLE IF NOT EXISTS transferencia (
  id_transferencia SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  estado VARCHAR(50) NOT NULL,
  fk_usuario_mail_emisor VARCHAR(255) NOT NULL REFERENCES usuario(persona_mail),
  fk_usuario_mail_receptor VARCHAR(255) NOT NULL REFERENCES usuario(persona_mail),
  fk_entrada_id INTEGER NOT NULL REFERENCES entrada(id_entrada) ON DELETE CASCADE,
  CONSTRAINT chk_transferencia_estado CHECK (estado IN ('pendiente', 'aceptada', 'rechazada')),
  CONSTRAINT chk_transferencia_usuarios CHECK (fk_usuario_mail_emisor <> fk_usuario_mail_receptor)
);

CREATE TABLE IF NOT EXISTS validacion (
  id_validacion SERIAL PRIMARY KEY,
  fecha TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  hora TIME,
  token_utilizado VARCHAR(255) NOT NULL,
  funcionario_mail VARCHAR(255) NOT NULL REFERENCES funcionario(persona_mail),
  numero_dispositivo VARCHAR(100) NOT NULL REFERENCES dispositivo(numero_dispositivo),
  entrada_id INTEGER NOT NULL UNIQUE REFERENCES entrada(id_entrada) ON DELETE CASCADE,
  CONSTRAINT uq_validacion_token UNIQUE (token_utilizado),
  CONSTRAINT chk_validacion_token CHECK (length(trim(token_utilizado)) > 0)
);
CREATE INDEX IF NOT EXISTS idx_persona_apellido ON persona(apellido);
CREATE INDEX IF NOT EXISTS idx_usuario_registro ON usuario(fecha_registro);
CREATE INDEX IF NOT EXISTS idx_encuentro_fecha ON encuentro(fecha);
CREATE INDEX IF NOT EXISTS idx_entrada_estado ON entrada(estado);
CREATE INDEX IF NOT EXISTS idx_entrada_habilita ON entrada(fk_habilita_id);
CREATE INDEX IF NOT EXISTS idx_entrada_usuario ON entrada(fk_usuario_mail);
CREATE INDEX IF NOT EXISTS idx_habilita_encuentro ON habilita(fk_encuentro);
CREATE INDEX IF NOT EXISTS idx_habilita_sector ON habilita(fk_sector);
CREATE INDEX IF NOT EXISTS idx_compra_fecha ON compra(fecha);
CREATE INDEX IF NOT EXISTS idx_transferencia_fecha ON transferencia(fecha);
CREATE INDEX IF NOT EXISTS idx_transferencia_entrada ON transferencia(fk_entrada_id);
