FROM mcr.microsoft.com/playwright:v1.58.2-noble

RUN npm install -g netlify-cli@latest \
    && apt-get update \
    && apt-get install -y jq \
    && rm -rf /var/lib/apt/lists/*
