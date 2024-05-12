const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql2");
const session = require("express-session");
const ejs = require("ejs");
const path = require("path");

const app = express();
const port = 3000;

// Configuração da conexão com o banco de dados
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "03091997",
  database: "bookswap",
});

// Configuração da sessão
app.use(
  session({
    secret: "secreto",
    resave: false,
    saveUninitialized: true,
  })
);

// Conectar ao banco de dados
connection.connect((err) => {
  if (err) {
    console.error("Erro ao conectar ao banco de dados:", err);
    return;
  }
  console.log("Conexão ao banco de dados estabelecida com sucesso");
});

// Middleware para analisar corpos de requisição
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configurar o mecanismo de visualização para EJS
app.set("view engine", "ejs");

// Rota para a página inicial
app.get("/", (req, res) => {
  // Lógica para obter os últimos livros cadastrados
  connection.query(
    "SELECT * FROM Books ORDER BY BookID DESC LIMIT 5",
    (err, newBooks) => {
      if (err) {
        console.error("Erro ao obter novos livros:", err);
        res.status(500).send("Erro ao carregar a página");
        return;
      }

      // Lógica para obter os livros recomendados
      let recommendedBooksQuery = "";
      if (req.session && req.session.UserID) {
        // Se o usuário estiver autenticado, obtenha os livros do gênero favorito do usuário
        const userID = req.session.UserID;
        recommendedBooksQuery = `SELECT * FROM Books WHERE Genre IN (SELECT FavoriteGenre FROM Users WHERE UserID = ${userID}) ORDER BY BookID DESC LIMIT 5`;
      } else {
        // Caso contrário, obtenha livros aleatórios
        recommendedBooksQuery = "SELECT * FROM Books ORDER BY RAND() LIMIT 5";
      }

      connection.query(recommendedBooksQuery, (err, recommendedBooks) => {
        if (err) {
          console.error("Erro ao obter livros recomendados:", err);
          res.status(500).send("Erro ao carregar a página");
          return;
        }

        // Lógica para obter os últimos 5 livros para o carrossel
        connection.query(
          "SELECT * FROM Books ORDER BY BookID DESC LIMIT 5",
          (err, carouselBooks) => {
            if (err) {
              console.error("Erro ao obter livros para o carrossel:", err);
              res.status(500).send("Erro ao carregar a página");
              return;
            }

            // Renderizar a página home com os dados obtidos
            res.render("home", { newBooks, recommendedBooks, carouselBooks });
          }
        );
      });
    }
  );
});

// Rota para lidar com o cadastro de usuários
app.post("/register", (req, res) => {
  const { name, email, password, address, contactInfo, favoriteGenre } =
    req.body;

  const newUser = {
    Name: name,
    Email: email,
    Password: password,
    Address: address,
    ContactInfo: contactInfo,
    FavoriteGenre: favoriteGenre,
  };

  // Inserir novo usuário no banco de dados
  connection.query("INSERT INTO Users SET ?", newUser, (err, result) => {
    if (err) {
      console.error("Erro ao inserir usuário:", err);
      res.status(500).send("Erro ao cadastrar usuário");
      return;
    }
    console.log("Novo usuário cadastrado com sucesso");
    res.status(200).send("Usuário cadastrado com sucesso");
  });
});

// Rota para lidar com o login de usuários
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  // Consultar o banco de dados para verificar as credenciais do usuário
  connection.query(
    "SELECT * FROM Users WHERE Email = ? AND Password = ?",
    [email, password],
    (err, results) => {
      if (err) {
        console.error("Erro ao consultar o banco de dados:", err);
        res.status(500).send("Erro ao processar a solicitação");
        return;
      }

      // Verificar se o usuário foi encontrado
      if (results.length > 0) {
        // Armazenar UserID na sessão
        req.session.UserID = results[0].UserID;
        // Usuário autenticado com sucesso
        res.status(200).send("Login bem-sucedido");
      } else {
        // Credenciais inválidas
        res.status(401).send("Credenciais inválidas");
      }
    }
  );
});

// Rota para lidar com o registro de livros
app.post("/register-book", (req, res) => {
  const {
    title,
    author,
    publisher,
    publicationYear,
    genre,
    synopsis,
    bookCondition,
    coverImageURL,
  } = req.body;

  // Verificar se o usuário está autenticado
  if (!req.session || !req.session.UserID) {
    return res.status(401).send("Usuário não autenticado");
  }

  const ownerID = req.session.UserID;

  const newBook = {
    Title: title,
    Author: author,
    Publisher: publisher,
    PublicationYear: publicationYear,
    Genre: genre,
    Synopsis: synopsis,
    BookCondition: bookCondition, // Corrigido para BookCondition
    CoverImageURL: coverImageURL,
    OwnerID: ownerID, // Usar o UserID do usuário logado como ownerID
  };

  // Inserir novo livro no banco de dados
  connection.query("INSERT INTO Books SET ?", newBook, (err, result) => {
    if (err) {
      console.error("Erro ao inserir livro:", err);
      res.status(500).send("Erro ao cadastrar livro");
      return;
    }
    console.log("Novo livro cadastrado com sucesso");
    res.status(200).send("Livro cadastrado com sucesso");
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor Node.js em execução em http://localhost:${port}`);
});
