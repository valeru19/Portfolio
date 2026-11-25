# Деплой API на VPS

## Бэкап SQLite

Скрипт `backup.sh` делает online-копию БД через `sqlite3.Connection.backup` внутри контейнера `api` и сохраняет файл в `deploy/backups/portfolio-YYYYMMDD-HHMMSS.db`. Хранятся последние 14 файлов.

```bash
cd deploy
chmod +x backup.sh
./backup.sh
```

Пример cron (ежедневно в 03:15, путь подставьте свой):

```cron
15 3 * * * /home/USER/Portfolio/deploy/backup.sh >> /home/USER/Portfolio/deploy/backups/cron.log 2>&1
```

### Восстановление

1. Остановите API: `docker compose -f deploy/docker-compose.yml stop api`
2. Скопируйте выбранный файл бэкапа в контейнерный том, например:
   `docker compose -f deploy/docker-compose.yml run --rm -v "$(pwd)/backups/portfolio-YYYYMMDD-HHMMSS.db:/restore.db:ro" api python -c "import shutil; shutil.copy('/restore.db', '/app/data/portfolio.db')"`
   Либо смонтируйте том `portfolio-data` на хост и замените `portfolio.db` вручную копией из `backups/`.
3. Запустите снова: `docker compose -f deploy/docker-compose.yml start api`
4. Проверьте: `curl -s https://API_DOMAIN/api/health` и список заявок с заголовком `X-Admin-Key`.
