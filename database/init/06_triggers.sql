-- Caso A: envío
-- al crear una transferencia (siempre nace 'pendiente'),
--  la entrada en cuestion pasa de 'activa' a 'transferida'.
CREATE OR REPLACE FUNCTION fn_transferencia_creada()
RETURNS TRIGGER AS $$
DECLARE -- Variables para controlar el flujo y validar la operación.
    v_estado VARCHAR(50); -- estado actual de la entrada
    v_dueno  VARCHAR(255); -- mail del usuario dueño actual de la entrada
BEGIN
    -- Traemos y bloqueamos la entrada 
    SELECT estado, fk_usuario_mail
      INTO v_estado, v_dueno -- guardamos el estado y dueño actual para validaciones posteriores
      FROM entrada
     WHERE id_entrada = NEW.fk_entrada_id 
     FOR UPDATE;

    --Chequeos de validación
    IF NOT FOUND THEN
        RAISE EXCEPTION 'La entrada % no existe', NEW.fk_entrada_id;
    END IF;

    IF v_estado <> 'activa' THEN
        RAISE EXCEPTION 'Solo se puede transferir una entrada activa (estado actual: %)', v_estado;
    END IF;

    IF v_dueno <> NEW.fk_usuario_mail_emisor THEN
        RAISE EXCEPTION 'El emisor no es el dueno actual de la entrada';
    END IF;

    -- Actualizamos el estado de la entrada a 'transferida' 
    --  que hace referencia a que queda pendiente de aceptación/rechazo.
    UPDATE entrada
       SET estado = 'transferida'
     WHERE id_entrada = NEW.fk_entrada_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

--Definimos el trigger para que se ejecute esta función cada vez que se inserte una nueva transferencia.
CREATE TRIGGER trg_transferencia_creada
AFTER INSERT ON transferencia
FOR EACH ROW
EXECUTE FUNCTION fn_transferencia_creada();


-- Caso B: respuesta
-- cuando la transferencia pasa de 'pendiente' a 'aceptada' o 'rechazada'.
--    aceptada  -> la entrada vuelve a 'activa', cambia de dueno y suma 1 transferencia.
--    rechazada -> la entrada vuelve a 'activa' (sigue siendo del mismo usuario).
CREATE OR REPLACE FUNCTION fn_transferencia_resuelta()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.estado = 'aceptada' THEN
        UPDATE entrada
           SET estado = 'activa',
               fk_usuario_mail = NEW.fk_usuario_mail_receptor,
               cantidad_transferencias = cantidad_transferencias + 1
         WHERE id_entrada = NEW.fk_entrada_id;

    ELSIF NEW.estado = 'rechazada' THEN
        UPDATE entrada
           SET estado = 'activa'
         WHERE id_entrada = NEW.fk_entrada_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Creamos el trigger para que se ejecute esta función cada vez que se actualice el estado de una transferencia.
CREATE TRIGGER trg_transferencia_resuelta
AFTER UPDATE OF estado ON transferencia
FOR EACH ROW
-- Solo nos interesa cuando el estado cambia de 'pendiente' a 'aceptada' o 'rechazada', que es cuando se resuelve la transferencia.
WHEN (OLD.estado = 'pendiente' AND NEW.estado IN ('aceptada', 'rechazada'))
EXECUTE FUNCTION fn_transferencia_resuelta();
