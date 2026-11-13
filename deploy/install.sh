#!/usr/bin/env bash
# Установка сайта проекта на свой сервер (VDS с Ubuntu или Debian).
#
# Запуск на сервере от root (одной командой):
#   curl -fsSL https://raw.githubusercontent.com/Kirill898990/xydem/main/deploy/install.sh | bash
#
# Что делает скрипт:
#   1. ставит веб-сервер nginx, git и certbot;
#   2. скачивает сайт из GitHub в /var/www/<домен>;
#   3. настраивает nginx: сайт, игра и APK для Android;
#   4. получает бесплатный HTTPS-сертификат Let's Encrypt (если домен уже указывает на сервер);
#   5. включает автообновление: каждые 5 минут сайт забирает свежую версию из GitHub.
#
# Необязательные параметры (пишутся перед bash):
#   DOMAIN=zamanagro.ru   — домен сайта
#   EMAIL=почта           — почта для писем Let's Encrypt о продлении сертификата
#   SKIP_SSL=1            — не получать сертификат (например, пока DNS ещё не обновился)
# Скрипт можно запускать повторно: он ничего не сломает и просто обновит настройки.
set -euo pipefail

DOMAIN="${DOMAIN:-zamanagro.ru}"
EMAIL="${EMAIL:-}"
REPO="${REPO:-https://github.com/Kirill898990/xydem.git}"
BRANCH="${BRANCH:-main}"
WEBROOT="/var/www/$DOMAIN"
SITE_CONF="/etc/nginx/sites-available/$DOMAIN"
CRON_FILE="/etc/cron.d/${DOMAIN//./-}-update"

say()  { printf '\n\033[1;32m==> %s\033[0m\n' "$*"; }
warn() { printf '\n\033[1;33m!!! %s\033[0m\n' "$*"; }
die()  { printf '\n\033[1;31mОшибка: %s\033[0m\n' "$*" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "запустите скрипт от root (или через sudo)."
command -v apt-get >/dev/null 2>&1 || die "скрипт рассчитан на Ubuntu или Debian."

reload_nginx() {
  nginx -t
  if command -v systemctl >/dev/null 2>&1 && systemctl is-system-running >/dev/null 2>&1 || [ -d /run/systemd/system ]; then
    systemctl enable --now nginx >/dev/null 2>&1 || true
    systemctl reload nginx
  elif pgrep -x nginx >/dev/null 2>&1; then
    nginx -s reload
  else
    nginx
  fi
}

say "1/5 Устанавливаю nginx, git и certbot"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get install -y -q nginx git certbot python3-certbot-nginx cron curl ca-certificates

say "2/5 Скачиваю сайт из GitHub в $WEBROOT"
if [ -d "$WEBROOT/.git" ]; then
  git -C "$WEBROOT" fetch -q --depth 1 origin "$BRANCH"
  git -C "$WEBROOT" reset -q --hard "origin/$BRANCH"
else
  rm -rf "$WEBROOT"
  git clone -q --depth 1 --branch "$BRANCH" "$REPO" "$WEBROOT"
fi
[ -f "$WEBROOT/index.html" ] || die "в репозитории не найден index.html."

say "3/5 Настраиваю nginx для $DOMAIN"
cat > "$SITE_CONF" <<EOF
# Сайт проекта «Руккола в эко-боксах». Файл создан скриптом deploy/install.sh.
server {
    listen 80;
    listen [::]:80;
    server_name $DOMAIN www.$DOMAIN;

    root $WEBROOT;
    index index.html;
    charset utf-8;

    # Служебные папки и файлы репозитория наружу не отдаём
    location ~ ^/(android|deploy|project)(/|\$) { return 404; }
    location ~ /\.(?!well-known/) { return 404; }
    location ~ \.(md|sh|kts|gradle|properties)\$ { return 404; }

    # Игра для Android: файл скачивается, а не открывается как текст
    location = /gidro-ogorod.apk {
        types { }
        default_type application/vnd.android.package-archive;
        add_header Content-Disposition 'attachment; filename="gidro-ogorod.apk"';
        add_header Cache-Control "no-cache";
    }

    location ~ \.html\$ {
        add_header Cache-Control "no-cache";
    }

    location / {
        try_files \$uri \$uri/ =404;
    }

    gzip on;
    gzip_types text/css application/javascript application/json image/svg+xml;
}
EOF
ln -sf "$SITE_CONF" "/etc/nginx/sites-enabled/$DOMAIN"
rm -f /etc/nginx/sites-enabled/default
if command -v ufw >/dev/null 2>&1 && ufw status 2>/dev/null | grep -q "Status: active"; then
  ufw allow 'Nginx Full' >/dev/null
fi
reload_nginx

say "4/5 HTTPS-сертификат"
if [ -n "${SKIP_SSL:-}" ]; then
  warn "Пропускаю сертификат (SKIP_SSL=1). Сайт пока работает по http://$DOMAIN"
else
  domains=(-d "$DOMAIN")
  if getent ahosts "www.$DOMAIN" >/dev/null 2>&1; then domains+=(-d "www.$DOMAIN"); fi
  mail=(--register-unsafely-without-email)
  [ -n "$EMAIL" ] && mail=(-m "$EMAIL")
  if ! getent ahosts "$DOMAIN" >/dev/null 2>&1; then
    warn "Домен $DOMAIN пока не указывает ни на какой адрес. Добавьте A-запись с IP этого сервера и запустите скрипт ещё раз."
  elif certbot --nginx "${domains[@]}" "${mail[@]}" --non-interactive --agree-tos --redirect --keep-until-expiring; then
    say "Сертификат получен, сайт работает по https://$DOMAIN"
  else
    warn "Не удалось получить сертификат. Чаще всего домен ещё не указывает на этот сервер:
    проверьте A-запись $DOMAIN (и www.$DOMAIN) — там должен быть IP этого сервера.
    DNS обновляется от 15 минут до суток. Потом просто запустите скрипт ещё раз."
  fi
fi

say "5/5 Включаю автообновление из GitHub (каждые 5 минут)"
cat > "$CRON_FILE" <<EOF
# Забираем свежую версию сайта из GitHub. Файл создан скриптом deploy/install.sh.
*/5 * * * * root git -C $WEBROOT fetch -q --depth 1 origin $BRANCH && git -C $WEBROOT reset -q --hard origin/$BRANCH
EOF
chmod 644 "$CRON_FILE"
if command -v systemctl >/dev/null 2>&1 && [ -d /run/systemd/system ]; then
  systemctl enable --now cron >/dev/null 2>&1 || true
fi

say "Готово!"
printf '  Сайт:          http://%s  (после получения сертификата — https://%s)\n' "$DOMAIN" "$DOMAIN"
printf '  Игра:          /game/\n'
printf '  APK:           /gidro-ogorod.apk\n'
printf '  Файлы сайта:   %s\n' "$WEBROOT"
printf '  IP сервера:    %s\n' "$(hostname -I 2>/dev/null | awk '{print $1}')"
