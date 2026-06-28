#!/usr/bin/env bash
# PackTrack 배포 스크립트 (Linux)
# 사용법: ./deploy.sh
# .env에 APP_URL, PORT, DB_PATH 설정

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

APP_NAME="${APP_NAME:-packtrack}"
NODE_MIN_MAJOR=18

log()  { printf '\033[1;34m[deploy]\033[0m %s\n' "$*"; }
warn() { printf '\033[1;33m[deploy]\033[0m %s\n' "$*"; }
err()  { printf '\033[1;31m[deploy]\033[0m %s\n' "$*" >&2; }

require_cmd() {
  if ! command -v "$1" &>/dev/null; then
    err "필수 명령어 없음: $1"
    exit 1
  fi
}

node_major() {
  node -e 'process.stdout.write(String(process.versions.node.split(".")[0]))'
}

load_env() {
  if [[ -f .env ]]; then
    log ".env 로드"
    set -a
    # shellcheck disable=SC1091
    source .env
    set +a
  else
    warn ".env 없음 — .env.example을 참고해 생성하세요"
  fi
  PORT="${PORT:-3000}"
  DB_PATH="${DB_PATH:-./data/packtrack.db}"
}

ensure_node() {
  require_cmd node
  require_cmd npm
  local major
  major="$(node_major)"
  if [[ "$major" -lt "$NODE_MIN_MAJOR" ]]; then
    err "Node.js ${NODE_MIN_MAJOR}+ 필요 (현재: $(node -v))"
    exit 1
  fi
  log "Node $(node -v) / npm $(npm -v)"
}

ensure_pm2() {
  if command -v pm2 &>/dev/null; then
    PM2=(pm2)
    log "PM2 $(pm2 -v)"
    return
  fi
  warn "PM2 없음 — 전역 설치 시도"
  if npm install -g pm2; then
    PM2=(pm2)
    log "PM2 설치 완료"
    return
  fi
  warn "전역 설치 실패 — npx pm2 사용"
  PM2=(npx --yes pm2)
}

install_deps() {
  log "의존성 설치"
  if [[ -f package-lock.json ]]; then
    npm ci
  else
    npm install
  fi
}

build_app() {
  log "프로덕션 빌드"
  if [[ -n "${APP_URL:-}" ]]; then
    export VITE_APP_URL="$APP_URL"
    log "VITE_APP_URL=${VITE_APP_URL}"
  else
    warn "APP_URL 미설정 — 초대 링크에 현재 접속 URL이 사용됩니다"
  fi
  npm run build
  if [[ ! -d dist ]] || [[ ! -f dist/index.html ]]; then
    err "빌드 실패: dist/index.html 없음"
    exit 1
  fi
  log "빌드 완료 ($(du -sh dist | cut -f1))"
}

ensure_data_dir() {
  local db_dir
  db_dir="$(dirname "$DB_PATH")"
  if [[ ! -d "$db_dir" ]]; then
    mkdir -p "$db_dir"
    log "DB 디렉터리 생성: $db_dir"
  fi
}

register_pm2() {
  log "PM2 등록: ${APP_NAME} → 0.0.0.0:${PORT}"

  if "${PM2[@]}" describe "$APP_NAME" &>/dev/null; then
    log "기존 프로세스 중지 및 삭제"
    "${PM2[@]}" delete "$APP_NAME" || true
  fi

  PORT="$PORT" DB_PATH="$DB_PATH" APP_URL="${APP_URL:-}" \
    "${PM2[@]}" start server/index.js \
    --name "$APP_NAME" \
    --cwd "$SCRIPT_DIR"

  "${PM2[@]}" save

  log "PM2 상태"
  "${PM2[@]}" status "$APP_NAME"
}

print_access_urls() {
  local ip
  ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  echo ""
  log "배포 완료"
  if [[ -n "${APP_URL:-}" ]]; then
    echo "  APP_URL: ${APP_URL}"
  fi
  echo "  로컬:   http://127.0.0.1:${PORT}"
  if [[ -n "$ip" ]]; then
    echo "  네트워크: http://${ip}:${PORT}"
  fi
  echo ""
  echo "  PM2 명령:"
  echo "    ${PM2[*]} logs ${APP_NAME}"
  echo "    ${PM2[*]} restart ${APP_NAME}"
  echo "    ${PM2[*]} stop ${APP_NAME}"
  echo ""
  warn "재부팅 후 자동 시작: sudo ${PM2[*]} startup && ${PM2[*]} save"
  warn "아이폰 카메라/PWA는 HTTPS가 필요할 수 있습니다 (nginx + SSL 권장)"
}

main() {
  load_env
  log "PackTrack 배포 시작 (APP_NAME=${APP_NAME}, PORT=${PORT})"
  ensure_node
  ensure_pm2
  install_deps
  ensure_data_dir
  build_app
  register_pm2
  print_access_urls
}

main "$@"