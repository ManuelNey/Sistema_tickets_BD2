FROM mcr.microsoft.com/dotnet/sdk:8.0

WORKDIR /app

COPY . .

RUN dotnet restore ./Ticketing.API/Ticketing.API.csproj

EXPOSE 8080

CMD ["dotnet", "watch", "--project", "./Ticketing.API/Ticketing.API.csproj", "run", "--urls", "http://0.0.0.0:8080"]