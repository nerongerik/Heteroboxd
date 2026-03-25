FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY ["Heteroboxd.Shared/Heteroboxd.Shared.csproj", "Heteroboxd.Shared/"]
COPY ["Heteroboxd.API/Heteroboxd.API.csproj", "Heteroboxd.API/"]
RUN dotnet restore "Heteroboxd.API/Heteroboxd.API.csproj"

COPY ["Heteroboxd.Shared/", "Heteroboxd.Shared/"]
COPY ["Heteroboxd.API/", "Heteroboxd.API/"]
RUN dotnet publish "Heteroboxd.API/Heteroboxd.API.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Heteroboxd.API.dll"]