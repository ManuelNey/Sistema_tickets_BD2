# Prevención de SQL Injection mediante parametrización

## Introducción

`UsuarioRepository` utiliza parametrización de queries SQL para prevenir ataques de SQL injection. Es el control primario recomendado por OWASP y el más efectivo en la práctica.

## Cómo funciona

En lugar de armar la query como un string, el código separa la estructura SQL de los datos:

```csharp
cmd.CommandText = "SELECT * FROM persona WHERE mail = @mail";
cmd.Parameters.AddWithValue("@mail", mail);
```

El placeholder `@mail` no es una concatenación — es una referencia que PostgreSQL reemplaza internamente luego de compilar la query. Los datos nunca se interpretan como código.

## Por qué previene la inyección

Sin parametrización, un atacante puede manipular la query pasando un valor como `' OR '1'='1`:

```csharp
// Vulnerable
string query = $"SELECT * FROM persona WHERE mail = '{mail}'";
// Query resultante: SELECT * FROM persona WHERE mail = '' OR '1'='1'
// Devuelve todos los registros
```

Con parametrización, ese mismo valor se trata como un string literal:

```csharp
// Seguro
cmd.CommandText = "SELECT * FROM persona WHERE mail = @mail";
cmd.Parameters.AddWithValue("@mail", "' OR '1'='1");
// PostgreSQL busca un mail con ese valor exacto, no lo interpreta como SQL
// No encuentra nada, la inyección no tiene efecto
```

El proceso interno es:

1. PostgreSQL analiza y compila la estructura SQL antes de recibir los datos
2. Los valores se adjuntan después, como datos puros
3. Npgsql escapa automáticamente caracteres especiales (`'`, `"`, `\`)
4. No existe forma de que un valor inyecte código en una query ya compilada

## Aplicación en el código

Todas las queries de `UsuarioRepository` están parametrizadas:

```csharp
// CreateAsync — 12 parámetros
INSERT INTO persona (...) VALUES (@mail, @nombre, @apellido, ...)

// AuthenticateAsync
SELECT ... FROM persona p JOIN usuario u ... WHERE p.mail = @mail

// GetByMailAsync
SELECT ... FROM persona p JOIN usuario u ... WHERE p.mail = @mail

// ExistsAsync
SELECT 1 FROM persona WHERE mail = @mail LIMIT 1
```

## Comparación con alternativas inseguras

| Técnica | Ejemplo | Riesgo |
|---|---|---|
| Concatenación | `"... mail = '" + mail + "'"` | SQL injection directo |
| String.Format | `"... mail = '{0}'"` | SQL injection con caracteres especiales |
| Interpolación | `$"... mail = '{mail}'"` | SQL injection en tiempo de ejecución |
| Parametrización | `"... mail = @mail"` + `AddWithValue` | Sin riesgo |

## Referencia

OWASP Top 10 2021 — A03: Injection

> "Prepared statements ensure that an attacker is not able to change the intent of a SQL statement."

Npgsql 8.0.4 implementa prepared statements automáticamente al usar `Parameters.AddWithValue`, separando el análisis sintáctico de la vinculación de datos.
