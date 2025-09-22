#!/bin/bash

# SSL証明書生成スクリプト

# 1. 自己署名証明書（開発・テスト用）
generate_self_signed() {
    echo "🔐 自己署名証明書を生成中..."

    # 秘密鍵生成
    openssl genrsa -out ltrack.key 2048

    # CSR生成
    openssl req -new -key ltrack.key -out ltrack.csr -subj "/C=JP/ST=Tokyo/L=Tokyo/O=L-TRACK/OU=Development/CN=localhost"

    # 自己署名証明書生成
    openssl x509 -req -days 365 -in ltrack.csr -signkey ltrack.key -out ltrack.crt

    echo "✅ 自己署名証明書生成完了"
    echo "📄 証明書: ltrack.crt"
    echo "🔑 秘密鍵: ltrack.key"
}

# 2. Let's Encrypt証明書（本番用）
generate_letsencrypt() {
    echo "🌐 Let's Encrypt証明書を生成中..."
    echo "⚠️  注意: ドメインが正しく設定されている必要があります"

    read -p "ドメイン名を入力してください: " DOMAIN
    read -p "メールアドレスを入力してください: " EMAIL

    # Certbot実行
    certbot certonly --standalone \
        --agree-tos \
        --email $EMAIL \
        -d $DOMAIN

    # 証明書コピー
    cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ltrack.crt
    cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ltrack.key

    echo "✅ Let's Encrypt証明書生成完了"
}

# 3. 証明書配置
setup_certificates() {
    echo "📁 証明書を配置中..."

    # 証明書ディレクトリ作成
    mkdir -p certs private

    # 証明書移動
    mv ltrack.crt certs/
    mv ltrack.key private/

    # 権限設定
    chmod 644 certs/ltrack.crt
    chmod 600 private/ltrack.key

    echo "✅ 証明書配置完了"
}

# メイン実行
echo "🚀 L-TRACK® SSL証明書セットアップ"
echo ""
echo "1) 自己署名証明書（開発・テスト用）"
echo "2) Let's Encrypt証明書（本番用）"
echo ""
read -p "選択してください [1-2]: " choice

case $choice in
    1)
        generate_self_signed
        setup_certificates
        ;;
    2)
        generate_letsencrypt
        setup_certificates
        ;;
    *)
        echo "❌ 無効な選択です"
        exit 1
        ;;
esac

echo ""
echo "🎉 SSL証明書セットアップ完了！"
echo "📂 証明書: ssl/certs/ltrack.crt"
echo "🔐 秘密鍵: ssl/private/ltrack.key"