# Node.js 18を使用
FROM node:18-alpine

# 作業ディレクトリを設定
WORKDIR /app

# package.jsonとpackage-lock.jsonをコピー
COPY package*.json ./
COPY prisma ./prisma/

# 依存関係をインストール
RUN npm ci --only=production

# Prisma Clientを生成
RUN npx prisma generate

# アプリケーションのソースコードをコピー
COPY . .

# TypeScriptをビルド
RUN npm run build

# ポート3002を開放
EXPOSE 3002

# アプリケーションを起動
CMD ["npm", "run", "start:prod"]
