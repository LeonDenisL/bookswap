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

app.get("/login", (req, res) => {
  res.render("login"); // Garanta que existe um arquivo login.ejs no diretório de views
});

// Middleware para analisar corpos de requisição
app.use(bodyParser.urlencoded({ extended: false }));

// Middleware para servir arquivos estáticos
app.use(express.static(path.join(__dirname, "public")));

// Configurar o mecanismo de visualização para EJS
app.set("view engine", "ejs");

// Rota para a página inicial
app.get("/", (req, res) => {
  connection.query(
    "SELECT * FROM Books ORDER BY BookID DESC LIMIT 5",
    (err, newBooks) => {
      if (err) {
        console.error("Erro ao obter novos livros:", err);
        res.status(500).send("Erro ao carregar a página");
        return;
      }
      let recommendedBooksQuery = "SELECT * FROM Books ORDER BY RAND() LIMIT 5";
      if (req.session && req.session.UserID) {
        const userID = req.session.UserID;
        recommendedBooksQuery = `SELECT * FROM Books WHERE Genre IN (SELECT FavoriteGenre FROM Users WHERE UserID = ${userID}) ORDER BY BookID DESC LIMIT 5`;
      }

      connection.query(recommendedBooksQuery, (err, recommendedBooks) => {
        if (err) {
          console.error("Erro ao obter livros recomendados:", err);
          res.status(500).send("Erro ao carregar a página");
          return;
        }
        connection.query(
          "SELECT * FROM Books ORDER BY BookID DESC LIMIT 5",
          (err, carouselBooks) => {
            if (err) {
              console.error("Erro ao obter livros para o carrossel:", err);
              res.status(500).send("Erro ao carregar a página");
              return;
            }
            // Aqui você passa o objeto 'user' se o usuário estiver logado
            res.render("home", {
              newBooks,
              recommendedBooks,
              carouselBooks,
              user: req.session.UserID ? { UserID: req.session.UserID } : null,
            });
          }
        );
      });
    }
  );
});

// Rota para visualizar detalhes do livro
app.get("/book-details/:bookID", (req, res) => {
  if (!req.session.UserID) {
    res.redirect("/login");
    return;
  }

  const bookID = req.params.bookID;
  connection.query(
    "SELECT * FROM Books WHERE BookID = ?",
    [bookID],
    (err, results) => {
      if (err || results.length === 0) {
        res.status(500).send("Erro ao buscar detalhes do livro");
        return;
      }

      const book = results[0];
      connection.query(
        "SELECT * FROM Books WHERE OwnerID = ?",
        [req.session.UserID],
        (err, userBooks) => {
          if (err) {
            res.status(500).send("Erro ao buscar seus livros");
            return;
          }
          res.render("book-details", { book, userBooks });
        }
      );
    }
  );
});

// Rota para lidar com a proposta de troca de livros
app.post("/trade-book", (req, res) => {
  if (!req.session || !req.session.UserID) {
    return res.status(401).send("Usuário não autenticado");
  }

  const { tradeBookID, requestedBookID } = req.body;
  const buyerID = req.session.UserID;

  // Verificar se o livro oferecido para troca pertence ao usuário logado
  connection.query(
    "SELECT * FROM Books WHERE BookID = ? AND OwnerID = ?",
    [tradeBookID, buyerID],
    (err, tradeBooks) => {
      if (err) {
        console.error("Erro ao verificar o livro para troca:", err);
        return res.status(500).send("Erro ao processar a troca");
      }
      if (tradeBooks.length === 0) {
        return res.status(400).send("Livro para troca não pertence ao usuário");
      }

      // Verificar se o livro solicitado existe e obter o OwnerID para definir como SellerID
      connection.query(
        "SELECT * FROM Books WHERE BookID = ?",
        [requestedBookID],
        (err, requestedBooks) => {
          if (err) {
            console.error("Erro ao verificar o livro solicitado:", err);
            return res.status(500).send("Erro ao processar a troca");
          }
          if (requestedBooks.length === 0) {
            return res.status(400).send("Livro solicitado não encontrado");
          }

          const sellerID = requestedBooks[0].OwnerID;

          // Criar uma nova transação com status 'Pending'
          const newTransaction = {
            BuyerID: buyerID,
            SellerID: sellerID,
            BookID: requestedBookID,
            TransactionDateTime: new Date(),
            TransactionType: "Trade",
            TransactionStatus: "Pending",
          };

          // Inserir a transação no banco de dados
          connection.query(
            "INSERT INTO Transactions SET ?",
            newTransaction,
            (err, result) => {
              if (err) {
                console.error("Erro ao registrar a troca:", err);
                return res.status(500).send("Erro ao registrar a troca");
              }
              res.send("Proposta de troca enviada com sucesso!");
            }
          );
        }
      );
    }
  );
});

//Rota para perfil
app.get("/profile", (req, res) => {
  if (!req.session.UserID) {
    return res.redirect("/login");
  }

  const userID = req.session.UserID;
  connection.query(
    "SELECT * FROM Users WHERE UserID = ?",
    [userID],
    (err, userResults) => {
      if (err) {
        return res.status(500).send("Erro ao buscar informações do usuário.");
      }
      const user = userResults[0];

      // Buscar livros publicados pelo usuário
      connection.query(
        "SELECT * FROM Books WHERE OwnerID = ?",
        [userID],
        (err, booksResults) => {
          if (err) {
            return res.status(500).send("Erro ao buscar livros do usuário.");
          }

          // Buscar transações de troca
          connection.query(
            "SELECT * FROM Transactions WHERE BuyerID = ? OR SellerID = ?",
            [userID, userID],
            (err, transactionsResults) => {
              if (err) {
                return res.status(500).send("Erro ao buscar transações.");
              }

              // Renderizar a página de perfil
              res.render("profile", {
                user,
                books: booksResults,
                transactions: transactionsResults,
              });
            }
          );
        }
      );
    }
  );
});

app.post("/update-profile-picture", (req, res) => {
  if (!req.session || !req.session.UserID) {
    return res.status(401).send("Usuário não autenticado.");
  }

  const userID = req.session.UserID;
  const profilePictureURL = req.body.profilePictureURL; // O link para a foto de perfil enviado pelo usuário

  // Atualizar a URL da foto de perfil no banco de dados
  connection.query(
    "UPDATE Users SET ProfilePictureURL = ? WHERE UserID = ?",
    [profilePictureURL, userID],
    (err, results) => {
      if (err) {
        console.error("Erro ao atualizar a foto de perfil:", err);
        return res.status(500).send("Erro ao atualizar a foto de perfil.");
      }
      res.redirect("/profile"); // Redireciona de volta para o perfil
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
        res.status(500).send("Erro ao processar a solicitação");
        return;
      }

      // Verificar se o usuário foi encontrado
      if (results.length > 0) {
        // Armazenar UserID na sessão
        req.session.UserID = results[0].UserID;
        res.redirect("/"); // Redireciona para a página inicial após login bem-sucedido
      } else {
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
    res.status(401).send("Usuário não autenticado");
    return;
  }

  const ownerID = req.session.UserID;

  const newBook = {
    Title: title,
    Author: author,
    Publisher: publisher,
    PublicationYear: publicationYear,
    Genre: genre,
    Synopsis: synopsis,
    BookCondition: bookCondition,
    CoverImageURL: coverImageURL,
    OwnerID: ownerID,
  };

  // Inserir novo livro no banco de dados
  connection.query("INSERT INTO Books SET ?", newBook, (err, result) => {
    if (err) {
      console.error("Erro ao inserir livro:", err);
      res.status(500).send("Erro ao cadastrar livro");
      return;
    }
    res.redirect("/"); // Redireciona para a página inicial após o registro bem-sucedido do livro
  });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect("/"); // Direciona para a home se houver erro ao deslogar
    }
    res.clearCookie("connect.sid"); // Limpar o cookie da sessão
    res.redirect("/login");
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor Node.js em execução em http://localhost:${port}`);
});
