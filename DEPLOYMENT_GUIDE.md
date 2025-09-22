# 🚀 L-TRACK® Production Deployment Guide

## 📦 完全本番環境構成

本番環境では以下のコンポーネントがDockerコンテナとして稼働します：

- **Frontend**: React App + Nginx (ポート80)
- **Backend**: Node.js + Express (内部ポート3001)
- **Database**: PostgreSQL 15 (内部ポート5432)
- **Cache**: Redis 7 (内部ポート6379)
- **Reverse Proxy**: Nginx (ポート80/443、SSL終端)

## 🔧 事前準備

### 1. 必要なツール
```bash
# Docker & Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# OpenSSL (SSL証明書用)
# macOS: brew install openssl
# Ubuntu: apt-get install openssl
```

### 2. ドメイン設定
- DNS設定でドメインをサーバーIPに向ける
- `nginx.conf`内の`your-domain.com`を実際のドメインに変更

## 🔐 SSL証明書設定

### 開発・テスト環境（自己署名証明書）
```bash
cd ssl
./generate-ssl.sh
# 選択: 1 (自己署名証明書)
```

### 本番環境（Let's Encrypt）
```bash
cd ssl
./generate-ssl.sh
# 選択: 2 (Let's Encrypt)
# ドメイン名とメールアドレスを入力
```

## 🚀 本番デプロイ手順

### 1. 環境変数設定
```bash
# 本番用環境変数を設定
cp backend/.env.production backend/.env
# 必要に応じて.envファイルを編集
```

### 2. SSL証明書配置
```bash
# 証明書が正しく配置されているか確認
ls -la ssl/certs/ltrack.crt
ls -la ssl/private/ltrack.key
```

### 3. Docker Compose起動
```bash
# 本番環境全体起動
docker compose -f docker-compose.production.yml up -d --build
```

### 4. 動作確認
```bash
# ヘルスチェック
curl https://your-domain.com/health

# フロントエンド確認
curl https://your-domain.com

# API確認（要認証）
curl https://your-domain.com/api/ai/overview
```

## 📊 ログとモニタリング

### コンテナログ確認
```bash
# 全コンテナ状態確認
docker compose -f docker-compose.production.yml ps

# 個別ログ確認
docker compose -f docker-compose.production.yml logs backend
docker compose -f docker-compose.production.yml logs frontend
docker compose -f docker-compose.production.yml logs nginx
```

### ヘルスチェック
- Backend: 30秒間隔でヘルスチェック実行
- Database: 接続状態確認
- Redis: キャッシュ動作確認

## 🔄 アップデート手順

### コードアップデート
```bash
# 1. 新しいコードをプル
git pull origin main

# 2. コンテナ再ビルド・再起動
docker compose -f docker-compose.production.yml up -d --build

# 3. 不要なイメージ削除
docker image prune -f
```

### データベースマイグレーション
```bash
# マイグレーション実行
docker compose -f docker-compose.production.yml exec backend npm run db:migrate:prod
```

## 🛡️ セキュリティ設定

### 設定済みセキュリティ機能
- ✅ HTTPS強制リダイレクト
- ✅ HSTS (Strict-Transport-Security)
- ✅ X-Frame-Options
- ✅ X-Content-Type-Options
- ✅ Referrer-Policy
- ✅ JWT認証保護
- ✅ Rate Limiting
- ✅ CORS設定

### 追加推奨設定
- Firewall設定（80, 443ポートのみ公開）
- 定期自動バックアップ
- ログ監視・アラート設定
- SSL証明書自動更新

## 📂 ファイル構成

```
ltrack-complete/
├── docker-compose.production.yml  # 本番用Docker Compose
├── nginx.conf                     # メインNginx設定
├── ssl/
│   ├── generate-ssl.sh           # SSL証明書生成
│   ├── certs/ltrack.crt          # SSL証明書
│   └── private/ltrack.key        # SSL秘密鍵
├── backend/
│   ├── Dockerfile                # バックエンドDockerfile
│   ├── .env.production           # 本番環境変数
│   └── healthcheck.js            # ヘルスチェック
└── frontend/
    ├── Dockerfile                # フロントエンドDockerfile
    └── nginx.frontend.conf       # フロントエンド用Nginx設定
```

## 🆘 トラブルシューティング

### よくある問題

1. **SSL証明書エラー**
   ```bash
   # 証明書確認
   openssl x509 -in ssl/certs/ltrack.crt -text -noout
   ```

2. **データベース接続エラー**
   ```bash
   # PostgreSQL接続確認
   docker compose -f docker-compose.production.yml exec postgres psql -U ltrack_user -d ltrack_production
   ```

3. **ポート競合**
   ```bash
   # ポート使用状況確認
   netstat -tulpn | grep :80
   netstat -tulpn | grep :443
   ```

## 📞 サポート

- 設定ファイル: `PRODUCTION_SETUP.md`
- Docker設定: `docker-compose.production.yml`
- SSL設定: `ssl/generate-ssl.sh`

完全な本番環境でL-TRACK®をお楽しみください！