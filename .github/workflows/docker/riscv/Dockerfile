FROM --platform=linux/riscv64 node:22-bookworm-slim

# install git to do clone
# and then cleanup cache to save space
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*

# clone and yarn build fork
WORKDIR /opt/electron-builder
RUN git clone --branch electron-builder@25.1.8-riscv https://github.com/riscv-forks/electron-builder.git . \
    && yarn install --production=false \
    && yarn build \
    && yarn link # make result a global cli

# setup project
WORKDIR /project
COPY package.json yarn.lock ./
RUN yarn install --immutable
COPY . .

# config envs
ENV ELECTRON_MIRROR="https://github.com/riscv-forks/electron-riscv-releases/releases/download/" \
    ELECTRON_CUSTOM_DIR='v${version}' \
    ELECTRON_CUSTOM_FILENAME='electron-v${version}-linux-riscv64.zip'

# now use electron-builder
ENTRYPOINT ["electron-builder"]
CMD ["--linux", "appimage", "--riscv64"]
