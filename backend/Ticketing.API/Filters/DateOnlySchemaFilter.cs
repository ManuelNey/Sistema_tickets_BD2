using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Ticketing.API.Filters;

public class DateOnlySchemaFilter : ISchemaFilter
{
    public void Apply(OpenApiSchema schema, SchemaFilterContext context)
    {
        if (context.Type == typeof(DateOnly) || context.Type == typeof(DateOnly?))
        {
            schema.Type = "string";
            schema.Format = "date";
            schema.Example = null;
        }
    }
}
