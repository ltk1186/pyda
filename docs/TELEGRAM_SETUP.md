# Telegram Admin Notifications

1. BotFather에서 Pyda 관리자 알림용 bot을 만든다.
2. BotFather가 발급한 bot token을 확보한다.
3. 알림을 받을 Telegram 계정에서 새 bot에 먼저 메시지를 보낸다.
4. Telegram Bot API의 update 조회 등으로 관리자 chat ID를 확인한다.
5. 서버 환경변수를 설정한다.

```text
TELEGRAM_BOT_TOKEN=
TELEGRAM_ADMIN_CHAT_ID=
APP_BASE_URL=
```

`APP_BASE_URL`은 예를 들어 `https://pyda.io` 같은 absolute `http` 또는
`https` URL이어야 한다.

설정 후 테스트 광고 요청 1건을 생성해 관리자 요청 상세 링크와 요청 내용이
Telegram에 도착하는지 확인한다.
