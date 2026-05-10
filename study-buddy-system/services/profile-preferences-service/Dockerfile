FROM node:22

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

RUN npx prisma generate

ENV PORT=4005

EXPOSE 4005

CMD ["node", "src/index.js"]
