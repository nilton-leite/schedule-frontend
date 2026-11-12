# ---------- build ----------
# Node 16: o react-scripts 4 (Create React App) não compila em Node 17+ sem ajustes.
# Este Node só existe no estágio de build; a imagem final é só o Nginx com arquivos estáticos.
FROM node:16.20.2-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# --legacy-peer-deps: o react-bootstrap4-form-validation declara peer de uma versão antiga do React.
# É assim que as dependências sempre foram instaladas neste projeto.
RUN npm ci --no-audit --no-fund --legacy-peer-deps

COPY . .
# API no mesmo domínio (o Nginx da VPS encaminha /api para a API).
ENV REACT_APP_API_URL=/api/ \
    GENERATE_SOURCEMAP=false
RUN npm run build


# ---------- produção ----------
FROM nginx:1.27.3-alpine
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
