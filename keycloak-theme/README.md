## Para empezar a trabajar

cd keycloak-theme
npm install
npm run storybook       # → http://localhost:6006


## Para generar el .jar y usarlo con Docker

# Requiere Java + Maven instalados (consola admin)
npm run build-keycloak-theme
# → genera dist_keycloak/*.jar


Abrí PowerShell como Administrador y ejecutá este comando:



## install choco (power shell admin)
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
Esperá que termine, luego verificá:

## java + maven 
choco -v
Si responde con un número de versión, está listo. Después seguís con:

# consola admin
choco install temurin21
choco install maven


## si no reconoce variables java nvm (power shell admin)
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
