// ============================================================================
// SCRIPT DE VERIFICACIÓN DE KEYCLOAK
// Ejecutar: node verify-keycloak.js
// ============================================================================

require('dotenv').config({ path: '.env.local' });

const KEYCLOAK_ISSUER = process.env.KEYCLOAK_ISSUER;
const wellKnownUrl = `${KEYCLOAK_ISSUER}/.well-known/openid-configuration`;

console.log('\n🔍 Verificando configuración de Keycloak...\n');
console.log('KEYCLOAK_ISSUER:', KEYCLOAK_ISSUER);
console.log('Well-known URL:', wellKnownUrl);
console.log('Client ID:', process.env.KEYCLOAK_ID);
console.log('\n📡 Intentando conectar al servidor Keycloak...\n');

fetch(wellKnownUrl)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('✅ ¡Keycloak responde correctamente!\n');
    console.log('Endpoints disponibles:');
    console.log('  - Authorization:', data.authorization_endpoint);
    console.log('  - Token:', data.token_endpoint);
    console.log('  - UserInfo:', data.userinfo_endpoint);
    console.log('  - End Session:', data.end_session_endpoint);
    console.log('\n✅ La configuración es correcta. Puedes ejecutar la aplicación.');
  })
  .catch(error => {
    console.error('❌ Error al conectar con Keycloak:\n');
    console.error(error.message);
    console.log('\n💡 Posibles soluciones:');
    console.log('  1. Verifica que KEYCLOAK_ISSUER en .env.local sea correcto');
    console.log('  2. Asegúrate que el servidor Keycloak esté accesible');
    console.log('  3. Verifica que no haya errores de red o firewall');
    console.log('\n📝 KEYCLOAK_ISSUER actual:', KEYCLOAK_ISSUER);
    console.log('   Formato esperado: https://keycloak.example.com/auth/realms/REALM_NAME');
    console.log('   O para Keycloak 17+: https://keycloak.example.com/realms/REALM_NAME');
  });
