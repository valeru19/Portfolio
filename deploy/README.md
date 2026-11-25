# Деплой API на VPS

Краткий гайд: FastAPI + SQLite за Caddy с автоматическим HTTPS. Фронт остаётся на GitHub Pages; этот стек поднимает только API.

## Что нужно

- VPS с Ubuntu (или совместимый Linux)
- Домен или поддомен (например `api.ваш-домен.tld`)
- A-запись домена/поддомена на публичный IP VPS (IPv6 — AAAA, по желанию)
- Открытые порты **22**, **80**, **443**

Без домена Let’s Encrypt / автоматический HTTPS Caddy не заработает штатно — см. раздел «Если домена нет».

## Подготовка сервера

### Docker

Официальная установка Docker Engine + Compose plugin на Ubuntu:

```bash
# пример: документация Docker для вашей версии Ubuntu
sudo apt-get update
sudo apt-get install -y ca-certificates curl
# далее по docs.docker.com/engine/install/ubuntu/ — Docker Engine и docker-compose-plugin
sudo usermod -aG docker "$USER"
# перелогиньтесь, чтобы группа docker применилась
docker version
docker compose version
```

### Обычный пользователь

Не работайте постоянно под `root`. Создайте пользователя с sudo и добавьте его в группу `docker` (см. выше).

### Firewall

Пример с `ufw`:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

Оставьте доступ по SSH (порт 22) до проверки входа новым пользователем.

## Установка приложения

```bash
git clone https://github.com/valeru19/Portfolio.git
cd Portfolio
```

### backend/.env

```bash
cp backend/.env.example backend/.env
# Отредактируйте backend/.env:
#   ADMIN_KEY  — длинный случайный секрет (openssl rand -hex 32)
#   CORS_ORIGINS=https://valeru19.github.io
#   TRUST_PROXY=true
#   DATABASE_URL=sqlite:///./data/portfolio.db
```

`TRUST_PROXY=true` нужен только за Caddy: API не публикуется на хост, клиенты ходят через reverse proxy.

### deploy/.env

```bash
cp deploy/.env.example deploy/.env
# Укажите реальный хост API, например:
#   API_DOMAIN=api.ваш-домен.tld
```

### Запуск

```bash
cd deploy
docker compose --env-file .env up -d --build
docker compose ps
```

Сервис `api` слушает только внутреннюю сеть Compose; наружу смотрят порты 80/443 у Caddy.

## Проверка

Подставьте свой `API_DOMAIN` и `ADMIN_KEY` (не коммитьте их).

### Health

bash:

```bash
curl -s "https://API_DOMAIN/api/health"
```

PowerShell:

```powershell
curl.exe -s "https://API_DOMAIN/api/health"
```

Ожидается JSON вроде `{"status":"ok"}`.

### Тестовая заявка

bash:

```bash
curl -s -X POST "https://API_DOMAIN/api/applications" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","contact":"test@example.com","kind":"job","message":"VPS smoke test."}'
```

PowerShell (JSON в одинарных кавычках):

```powershell
curl.exe -s -X POST "https://API_DOMAIN/api/applications" `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","contact":"test@example.com","kind":"job","message":"VPS smoke test."}'
```

### Модерация отзыва

Создайте отзыв (`kind` по схеме API для reviews), затем одобрите по id:

bash:

```bash
curl -s -X POST "https://API_DOMAIN/api/reviews" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","text":"Great work on the portfolio.","rating":5}'

curl -s -X PATCH "https://API_DOMAIN/api/reviews/1/approve" \
  -H "X-Admin-Key: ADMIN_KEY"
```

PowerShell:

```powershell
curl.exe -s -X POST "https://API_DOMAIN/api/reviews" `
  -H "Content-Type: application/json" `
  -d '{"name":"Test","text":"Great work on the portfolio.","rating":5}'

curl.exe -s -X PATCH "https://API_DOMAIN/api/reviews/1/approve" `
  -H "X-Admin-Key: ADMIN_KEY"
```

Список заявок (admin):

```bash
curl -s -H "X-Admin-Key: ADMIN_KEY" "https://API_DOMAIN/api/applications"
```

## Обновление

```bash
cd Portfolio
git pull
cd deploy
docker compose --env-file .env up -d --build
```

Данные SQLite в именованном томе `portfolio-data` при пересборке сохраняются.

## Подключение фронта (GitHub Pages)

1. GitHub → репозиторий → **Settings** → **Secrets and variables** → **Actions** → вкладка **Variables**.
2. Создайте variable `VITE_API_BASE` = `https://API_DOMAIN` (без завершающего `/`, тот же хост, что в Caddy).
3. Перезапустите workflow деплоя фронта (Actions → нужный workflow → Re-run, либо push в `main`).

Почему нужен **HTTPS** на API: страница на `https://valeru19.github.io` — браузер блокирует mixed content (HTTPS-страница → HTTP API).

Почему **CORS**: браузер шлёт запросы с origin GitHub Pages; бэкенд должен отдавать `Access-Control-Allow-Origin` для `https://valeru19.github.io` (без пути `/Portfolio`). Это задаётся `CORS_ORIGINS` в `backend/.env`.

## Если домена нет

Для автоматического HTTPS у Caddy нужен домен или поддомен с A-записью на VPS. Бесплатный вариант — завести домен/поддомен у DNS-сервиса (или freemium DNS) и указать A на IP сервера; конкретные сервисы и SLA здесь не гарантируются. Пока записи нет, публичный API с нормальным сертификатом не поднять — отложите деплой до появления DNS.

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
2. Скопируйте выбранный файл бэкапа в том, например:
   `docker compose -f deploy/docker-compose.yml run --rm -v "$(pwd)/backups/portfolio-YYYYMMDD-HHMMSS.db:/restore.db:ro" api python -c "import shutil; shutil.copy('/restore.db', '/app/data/portfolio.db')"`
   Либо найдите том `portfolio-data` на хосте и замените `portfolio.db` копией из `backups/`.
3. Запустите снова: `docker compose -f deploy/docker-compose.yml start api`
4. Проверьте health и список заявок с `X-Admin-Key`.

Добавьте `deploy/backups/` в локальный ignore при необходимости — бэкапы с данными не коммитьте.
