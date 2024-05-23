# bookswap

BookSwap um projeto criado para disciplina de aplicações WEB e para o projeto final de ADS

# Tecnologias utilizados

- JavaScript
- Node.js
- HTML
- CSS
- MySQL
- EJS
- BOOTSTRAP

# Passos para executar o servidor

Primeiramente deve se certificar de ter o Node.JS instalado (https://nodejs.org/en)

- 1.  **Inicialização do projeto Node.js:** Execute o seguinte comando no terminal dentro do diretório do projeto para iniciar um novo projeto Node.js e criar um arquivo `package.json`:
      > npm init -y

- 2.  **Instalação dos pacotes necessários:** Instale os pacotes necessários (Express, body-parser e mysql2) utilizando o seguinte comando:
      > npm install express body-parser mysql2 ejs express-session helmet slick-carousel

- 3.  **Execução do servidor Node.js:** Para executar o servidor Node.js, basta executar o seguinte comando no terminal dentro do diretório do projeto:
      > node server.js

# Criar banco de dados

Certifique-se que tenha o MySQL baixado

- 1.  **Executar bookswap.sql:** Pegar o arquivo na raiz bookwap.sql e realizar todas as querys dele para criar o banco de dados necessario:

- 2.  **Ajuste Server.JS:** Ajustar em server.js na linha 12 o nome do seu host, user, password e database
