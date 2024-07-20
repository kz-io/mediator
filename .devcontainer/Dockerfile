FROM ubuntu:20.04

WORKDIR /home/

COPY . .

RUN bash ./setup.sh

RUN echo 'export DENO_INSTALL="/root/.deno"' >> "$HOME/.zshrc"
RUN echo '\n' >> "$HOME/.zshrc"
RUN echo 'export PATH=$DENO_INSTALL/bin:$PATH' >> "$HOME/.zshrc"
RUN sudo ln -s /root/.deno/bin/deno /usr/bin