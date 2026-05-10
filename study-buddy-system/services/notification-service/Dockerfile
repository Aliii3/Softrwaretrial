# Use Node image
FROM node:22

# Set working directory
WORKDIR /app

# Copy package files first (for caching)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy rest of project
COPY . .

RUN npx prisma generate

ENV PORT=4003

EXPOSE 4003

#CMD ["sh", "-c", "npx prisma migrate deploy && node src/index.js"]
CMD ["node", "src/index.js"]