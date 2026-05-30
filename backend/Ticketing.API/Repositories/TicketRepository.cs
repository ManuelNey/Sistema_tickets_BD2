using Npgsql;
using Ticketing.API.Data;
using Ticketing.API.Models;

namespace Ticketing.API.Repositories;

public class TicketRepository : ITicketRepository
{
    private readonly IPostgresConnectionFactory _connectionFactory;

    public TicketRepository(IPostgresConnectionFactory connectionFactory)
    {
        _connectionFactory = connectionFactory;
    }

    public async Task<IReadOnlyCollection<Ticket>> GetAllAsync()
    {
        var tickets = new List<Ticket>();

        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT id, title, description, status, created_at
              FROM tickets
              ORDER BY created_at DESC, id DESC", connection);

        await using var reader = await command.ExecuteReaderAsync();
        while (await reader.ReadAsync())
        {
            tickets.Add(MapTicket(reader));
        }

        return tickets;
    }

    public async Task<Ticket?> GetByIdAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"SELECT id, title, description, status, created_at
              FROM tickets
              WHERE id = @id", connection);
        command.Parameters.AddWithValue("id", id);

        await using var reader = await command.ExecuteReaderAsync();
        return await reader.ReadAsync() ? MapTicket(reader) : null;
    }

    public async Task<Ticket> CreateAsync(Ticket ticket)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"INSERT INTO tickets (title, description, status, created_at)
              VALUES (@title, @description, @status, NOW())
              RETURNING id, title, description, status, created_at", connection);
        command.Parameters.AddWithValue("title", ticket.Title);
        command.Parameters.AddWithValue("description", (object?)ticket.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("status", ticket.Status);

        await using var reader = await command.ExecuteReaderAsync();
        if (await reader.ReadAsync())
        {
            return MapTicket(reader);
        }

        throw new InvalidOperationException("No se pudo crear el ticket.");
    }

    public async Task<bool> UpdateAsync(int id, Ticket ticket)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            @"UPDATE tickets
              SET title = @title,
                  description = @description,
                  status = @status
              WHERE id = @id", connection);
        command.Parameters.AddWithValue("id", id);
        command.Parameters.AddWithValue("title", ticket.Title);
        command.Parameters.AddWithValue("description", (object?)ticket.Description ?? DBNull.Value);
        command.Parameters.AddWithValue("status", ticket.Status);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        await using var connection = _connectionFactory.CreateConnection();
        await connection.OpenAsync();

        await using var command = new NpgsqlCommand(
            "DELETE FROM tickets WHERE id = @id", connection);
        command.Parameters.AddWithValue("id", id);

        return await command.ExecuteNonQueryAsync() > 0;
    }

    private static Ticket MapTicket(NpgsqlDataReader reader)
    {
        return new Ticket
        {
            Id = reader.GetInt32(reader.GetOrdinal("id")),
            Title = reader.GetString(reader.GetOrdinal("title")),
            Description = reader.IsDBNull(reader.GetOrdinal("description"))
                ? null
                : reader.GetString(reader.GetOrdinal("description")),
            Status = reader.GetString(reader.GetOrdinal("status")),
            CreatedAt = reader.GetDateTime(reader.GetOrdinal("created_at"))
        };
    }
}