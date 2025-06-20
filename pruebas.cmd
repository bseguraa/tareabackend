@echo off
REM Espera 2 segundos para asegurarse de que el servidor este corriendo
echo Espera a que el servidor inicie...
timeout /t 2 >nul

echo Creando usuario...
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d "{\"email\":\"test@correo.com\",\"password\":\"1234\"}"
echo.

echo Prueba: Login y lo guarda en una variable de entorno
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d "{\"email\":\"test@correo.com\",\"password\":\"1234\"}" > response.json
set /p TOKEN=<response.json
set TOKEN
echo TOKEN
echo.

echo Creando auto...
curl -X POST http://localhost:3000/cars/create -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"brand\":\"Volkwagen\",\"model\":\"Tiguan\",\"description\":\"Descripcion de prueba\"}"
echo.

echo Listando autos...
curl http://localhost:3000/cars/my-cars -H "Authorization: Bearer %TOKEN%"
echo.

echo Listando todos los autos...
curl http://localhost:3000/cars/all-cars -H "Authorization: Bearer %TOKEN%"
echo.

echo Actualizando auto con id=1...
curl -X PUT "http://localhost:3000/cars/by-id/1" -H "Authorization: Bearer %TOKEN%" -H "Content-Type: application/json" -d "{\"brand\":\"Volkwagen\",\"model\":\"Tiguan\",\"description\":\"Descripcion de prueba actualizada\"}"
echo.

echo Eliminando auto con id=1...
curl -X DELETE "http://localhost:3000/cars/by-id/1" -H "Authorization: Bearer %TOKEN%"
echo.

echo Pruebas finalizadas.
pause