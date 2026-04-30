FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Heteroboxd.Shared/Heteroboxd.Shared.csproj", "Heteroboxd.Shared/"]
COPY ["Heteroboxd.Import/Heteroboxd.Import.csproj", "Heteroboxd.Import/"]
RUN dotnet restore "Heteroboxd.Import/Heteroboxd.Import.csproj"

COPY ["Heteroboxd.Shared/", "Heteroboxd.Shared/"]
COPY ["Heteroboxd.Import/", "Heteroboxd.Import/"]
RUN dotnet publish "Heteroboxd.Import/Heteroboxd.Import.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Heteroboxd.Import.dll"]