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

- 1.  **Inicialização do projeto Node.js:** Execute o seguinte comando no terminal dentro do diretório do projeto para instalar todos os node modulos do `package.json`:
      > npm install


- 2.  **Checar Instalação dos pacotes necessários:** Execute o comando abaixo para checar se foi tudo instalado:
      > ls node_modules

- 3.  **Execução do servidor Node.js:** Para executar o servidor Node.js, basta executar o seguinte comando no terminal dentro do diretório do projeto, ele irá rodar o serve.js:
      > node start

# Criar banco de dados

Certifique-se que tenha o MySQL baixado
OBS: Nesse passo utilizamos o MySQL Workbench 


- 1.  **Executar bookswap.sql:** Pegar o arquivo na raiz bookwap.sql e realizar todas as querys dele para criar o banco de dados necessario, lembrando que nele possui varias querys, devem ser executadas uma a uma em ordem

- 2.  **Ajuste Server.JS:** Ajustar em server.js na linha 12 o nome do seu host, user e password. 

