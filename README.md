# bookswap

BookSwap um projeto criado para o projeto interdisciplinar de ADS da UNIPE e também em conjunto com o da disciplina de aplicações WEB.

O sistema de troca de livros BookSwap Online é uma plataforma online que facilita a troca de livros entre usuários registrados. O objetivo principal do sistema é promover o compartilhamento de conhecimento e a leitura, permitindo que os usuários publiquem livros que desejam trocar e proponham trocas com outros usuários. O sistema oferece uma série de funcionalidades para gerenciar perfis de usuários, livros publicados, propostas de troca e recomendações de leitura.

# Colaboradores

- 1. Leon Denis Silvestre de Lucena
- 2. Adson Wiklif Gomes
- 3. Almir de Almeida Menezes Neto
- 4. Samuel Victor da Silva Carvalho

# Tecnologias utilizados

- JavaScript
- Node.js
- HTML
- CSS
- MySQL
- EJS
- BOOTSTRAP
- Express.js

# Criar banco de dados

Certifique-se que tenha o MySQL baixado.
OBS: Nesse passo utilizamos o MySQL Workbench

- 1.  **Executar bookswap.sql:** Pegar o arquivo na raiz bookwap.sql e realizar todas as querys dele para criar o banco de dados necessario, lembrando que nele possui varias querys, devem ser executadas uma a uma em ordem

- 2.  **Ajuste Server.JS:** Ajustar em server.js na linha 12 o nome do seu host, user e password.

# Passos para executar o projeto

Primeiramente deve se certificar de ter o Node.JS instalado (https://nodejs.org/en)

- 1.  **Inicialização do projeto Node.js:** Execute o seguinte comando no terminal dentro do diretório do projeto para instalar todos os node modulos do `package.json`:
      > npm install

- 2.  **Checar Instalação dos pacotes necessários:** Execute o comando abaixo para checar se foi tudo instalado:
      > ls node_modules

- 3.  **Execução do servidor Node.js:** Para executar o servidor Node.js, basta executar o seguinte comando no terminal dentro do diretório do projeto, ele irá rodar o serve.js:
      > node start
