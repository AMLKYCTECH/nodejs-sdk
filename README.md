# AMLKYC Node.js SDK

Лёгкий Node.js SDK для работы с API https://amlkyc.tech

Основан на спецификации из docs/api.yaml. Поддерживает основные методы: работа с крипто‑адресами, быстрые проверки, расследования и баланс пользователя.

## Установка

Проект пока не опубликован в npm. Используйте как локальный пакет или скопируйте исходники (`src/`).

Требования: Node.js v16+

## Быстрый старт

```js
const { AmlKycClient } = require('@amlkyc/sdk');

// API ключ можно передать через опции или переменную окружения AMLKYC_API_KEY
const client = new AmlKycClient({
  apiKey: process.env.AMLKYC_API_KEY, // либо передайте строкой
  // baseUrl: 'https://amlkyc.tech', // по умолчанию
});

(async () => {
  const fiat = await client.getAllowedFiat();
  console.log('Allowed fiat:', fiat);

  const balance = await client.getBalance();
  console.log('Balance:', balance);

  const search = await client.searchCrypto('TUebrU7t87ZBonfseZLah2RQ56L2ECaXPj');
  console.log('Search:', search);
})();
```

По умолчанию аутентификация выполняется через заголовок `Authorization: Bearer <API_KEY>`. При необходимости можно переопределить имя заголовка/схему:

```js
const client = new AmlKycClient({
  apiKey: process.env.AMLKYC_API_KEY,
  authHeader: 'X-API-Key',
  authScheme: '', // пустая схема => отправится только значение ключа
});
```

Также можно управлять стилем авторизации через переменные окружения, не меняя код:

- AMLKYC_AUTH_HEADER — имя заголовка (по умолчанию Authorization)
- AMLKYC_AUTH_SCHEME — схема перед значением (по умолчанию Bearer, пустая строка — без схемы)

Примеры запуска:

```bash
# Bearer (по умолчанию):
AMLKYC_API_KEY="<your_key>" node examples/check-balance.js

# Через X-API-Key без схемы:
AMLKYC_API_KEY="<your_key>" \
AMLKYC_AUTH_HEADER="X-API-Key" \
AMLKYC_AUTH_SCHEME="" \
node examples/check-balance.js
```

Примечание об авторизации и автоматическом fallback:
- По умолчанию SDK использует заголовок Authorization: Bearer <API_KEY>.
- Если вы явно задаёте другой стиль (например, X-API-Key без схемы) и сервер отвечает 401 Unauthenticated, SDK автоматически выполнит один повтор запроса с заголовком Authorization: Bearer <API_KEY>. Это помогает избежать сбоев при неверной конфигурации заголовка.
- Если первичный запрос успешен, fallback не выполняется.

## Поддерживаемые методы

- Crypto
  - getCryptoAddress({ address, currency, network }) — GET /api/crypto/address
  - addCryptoAddress({ address, currency, network }) — PUT /api/crypto/address
  - searchCrypto(address) — GET /api/crypto/search
- Investigations
  - listInvestigations() — GET /api/investigations
  - createInvestigation({ target, currency }) — PUT /api/investigations
  - getInvestigation(id) — GET /api/investigations/{id}
  - getInvestigationGraph(id, item?) — GET /api/investigations/{id}/graph
  - deepInvestigation(id, address) — POST /api/investigations/{id}/deep
  - runInvestigation(id) — GET /api/investigations/{id}/run
- Fast check
  - listFastChecks() — GET /api/fast-check
  - addFastCheck({ address, currency, network }) — PUT /api/fast-check
  - getFastCheck(id) — GET /api/fast-check/{id}
  - runFastCheck(id) — GET /api/fast-check/{id}/run
- User / Balance
  - getBalance() — GET /api/user/balance
  - createTopup({ amount, currency }) — PUT /api/user/balance
  - getAllowedFiat() — GET /api/user/balance/allowed_fiat

## Тесты

Интеграционные тесты выполняют реальные запросы. Для запуска задайте переменную окружения AMLKYC_API_KEY (и при необходимости стиль заголовка):

```bash
npm install
# По умолчанию Authorization: Bearer <API_KEY>
AMLKYC_API_KEY="7500|V7Yz2LcScGI2HtfbGNc08e2huNI6XOv6ppR7tc7L" npm test

# Если сервер ожидает X-API-Key без схемы:
AMLKYC_API_KEY="7500|V7Yz2LcScGI2HtfbGNc08e2huNI6XOv6ppR7tc7L" \
AMLKYC_AUTH_HEADER="X-API-Key" \
AMLKYC_AUTH_SCHEME="" \
npm test
```

Если ключ не задан, интеграционные тесты будут пропущены.

## Пример

```bash
# см. также раздел про переменные AMLKYC_AUTH_*
node examples/check-balance.js
```

Файл `examples/check-balance.js` использует переменные окружения AMLKYC_API_KEY и (опционально) AMLKYC_AUTH_HEADER/AMLKYC_AUTH_SCHEME.

## Трассировка/логирование

SDK отправляет заголовок User-Agent вида `amlkyc-sdk-nodejs/<version>`, что позволяет легко находить обращения SDK в серверных логах.
