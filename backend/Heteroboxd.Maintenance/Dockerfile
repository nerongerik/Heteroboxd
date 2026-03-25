FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Heteroboxd.Shared/Heteroboxd.Shared.csproj", "Heteroboxd.Shared/"]
COPY ["Heteroboxd.Maintenance/Heteroboxd.Maintenance.csproj", "Heteroboxd.Maintenance/"]
RUN dotnet restore "Heteroboxd.Maintenance/Heteroboxd.Maintenance.csproj"

COPY ["Heteroboxd.Shared/", "Heteroboxd.Shared/"]
COPY ["Heteroboxd.Maintenance/", "Heteroboxd.Maintenance/"]
RUN dotnet publish "Heteroboxd.Maintenance/Heteroboxd.Maintenance.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Heteroboxd.Maintenance.dll"]