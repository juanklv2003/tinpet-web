const fs = require('fs');
const path = require('path');

function merge(localeFile, newKeysFile) {
  const localePath = path.resolve(__dirname, '../src/i18n/locales', localeFile);
  const newKeysPath = path.resolve(__dirname, newKeysFile);

  const localeData = JSON.parse(fs.readFileSync(localePath, 'utf8'));
  const newKeysData = JSON.parse(fs.readFileSync(newKeysPath, 'utf8'));

  localeData.landing = newKeysData.landing;

  fs.writeFileSync(localePath, JSON.stringify(localeData, null, 2), 'utf8');
  console.log(`Updated ${localeFile}`);
}

merge('es.json', 'landing-es.json');
merge('en.json', 'landing-en.json');
