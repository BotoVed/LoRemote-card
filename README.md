# LoRemote Card

Lovelace custom card для мониторинга [LoRemote](https://github.com/BotoVed/LoRemote) — управления Home Assistant через LoRa/Meshtastic без интернета.

## Что показывает

- Статус шлюза T114 (онлайн/офлайн)
- Node ID, количество устройств, аптайм 24ч
- График доступности за 24 часа
- История подключений с причинами разрывов
- Лог пакетов с фильтрами (все/входящие/исходящие/недоставленные)
- Детальный просмотр каждого пакета (JSON + hex + RSSI/SNR)
- Последние сессии пользователей

## Установка через HACS

1. HACS → три точки → Custom repositories
2. URL: `https://github.com/BotoVed/LoRemote-card`
3. Category: **Frontend**
4. Add → Download
5. Перезагрузить браузер

## Добавление на дашборд

Dashboard → Edit → Add Card → поиск "loremote" → LoRemote Card

## Требования

Интеграция [LoRemote](https://github.com/BotoVed/LoRemote) должна быть установлена и настроена.
