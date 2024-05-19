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

// Middleware para adicionar usuário a todas as respostas
app.use((req, res, next) => {
  res.locals.user = req.session.UserID ? { UserID: req.session.UserID } : null;
  next();
});

app.get("/login", (req, res) => {
  res.render("login"); // Garanta que existe um arquivo login.ejs no diretório de views
});
// Rota para exibir a página de registro
app.get("/register", (req, res) => {
  res.render("register");
});

// Rota para exibir a página de registro de livros
app.get("/publish-book", (req, res) => {
  if (!req.session || !req.session.UserID) {
    return res.redirect("/login"); // Redireciona para login se não estiver logado
  }

  res.render("register_book"); // Certifique-se de ter um arquivo register_book.ejs
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

app.get("/book-details/:bookID", (req, res) => {
  if (!req.session.UserID) {
    res.redirect("/login");
    return;
  }

  const bookID = req.params.bookID;
  const userID = req.session.UserID;

  // Primeiro busca os detalhes do livro requisitado
  connection.query(
    "SELECT * FROM Books WHERE BookID = ?",
    [bookID],
    (err, results) => {
      if (err || results.length === 0) {
        res.status(500).send("Erro ao buscar detalhes do livro");
        return;
      }

      const book = results[0];

      // Depois busca todos os livros do usuário para a seleção de troca
      connection.query(
        "SELECT * FROM Books WHERE OwnerID = ?",
        [userID],
        (err, userBooks) => {
          if (err) {
            res.status(500).send("Erro ao buscar seus livros");
            return;
          }

          // Renderiza a página de detalhes do livro com os livros do usuário para troca
          res.render("book-details", { book, userBooks });
        }
      );
    }
  );
});

app.post("/trade-book", (req, res) => {
  if (!req.session || !req.session.UserID) {
    return res.status(401).send("Usuário não autenticado");
  }

  const { requestedBookID, offeredBookID } = req.body;
  const buyerID = req.session.UserID;

  console.log("Requested Book ID:", requestedBookID);
  console.log("Offered Book ID:", offeredBookID); // Verificar se o ID está chegando corretamente
  console.log("User ID:", buyerID);

  if (!offeredBookID) {
    return res.status(400).send("Livro oferecido não foi selecionado");
  }

  // Verificar se o livro oferecido para troca pertence ao usuário logado
  connection.query(
    "SELECT * FROM Books WHERE BookID = ? AND OwnerID = ?",
    [offeredBookID, buyerID],
    (err, offeredBooks) => {
      if (err) {
        console.error("Erro ao verificar o livro para troca:", err);
        return res.status(500).send("Erro ao processar a troca");
      }
      if (offeredBooks.length === 0) {
        return res.status(400).send("Livro para troca não pertence ao usuário");
      }

      // Verificar se o livro solicitado existe
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
            TradeBookID: offeredBookID, // Garanta que este campo está sendo setado corretamente
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

app.get("/profile", (req, res) => {
  const userID = req.session.UserID;
  if (!userID) {
    return res.redirect("/login");
  }

  const userInfoQuery = "SELECT * FROM Users WHERE UserID = ?";
  const booksQuery = "SELECT * FROM Books WHERE OwnerID = ?";
  const transactionsQuery = `SELECT t.*, b.Title AS BookTitle
                             FROM Transactions t
                             JOIN Books b ON t.BookID = b.BookID
                             WHERE t.BuyerID = ? OR t.SellerID = ?`;

  connection.query(userInfoQuery, [userID], (err, userResults) => {
    if (err) {
      console.error("Erro ao buscar informações do usuário:", err);
      return res.status(500).send("Erro ao buscar informações do usuário.");
    }
    const user = userResults[0];

    connection.query(booksQuery, [userID], (err, booksResults) => {
      if (err) {
        console.error("Erro ao buscar livros do usuário:", err);
        return res.status(500).send("Erro ao buscar livros do usuário.");
      }

      connection.query(
        transactionsQuery,
        [userID, userID],
        (err, transactionsResults) => {
          if (err) {
            console.error("Erro ao buscar transações:", err);
            return res.status(500).send("Erro ao buscar transações.");
          }
          console.log(transactionsResults); // Verificar os dados retornados

          res.render("profile", {
            user,
            books: booksResults,
            transactions: transactionsResults,
          });
        }
      );
    });
  });
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

app.post("/register-book", (req, res) => {
  const {
    title,
    author,
    publisher,
    publicationYear,
    genre,
    synopsis,
    condition, // Certifique-se de que o nome do campo corresponde ao 'name' do select no formulário
    coverImageURL,
  } = req.body;

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
    BookCondition: condition, // Este campo deve corresponder ao nome da coluna no banco de dados
    CoverImageURL: coverImageURL,
    OwnerID: ownerID,
  };

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

app.get("/trade-details/:transactionID", (req, res) => {
  const transactionID = req.params.transactionID;

  connection.query(
    `SELECT Transactions.*, 
              b1.Title as RequestedBookTitle, b1.Author as RequestedBookAuthor, b1.CoverImageURL as RequestedBookImage, b1.BookCondition as RequestedBookCondition, b1.Publisher as RequestedBookPublisher, b1.Genre as RequestedBookGenre,
              b2.Title as OfferedBookTitle, b2.Author as OfferedBookAuthor, b2.CoverImageURL as OfferedBookImage, b2.BookCondition as OfferedBookCondition, b2.Publisher as OfferedBookPublisher, b2.Genre as OfferedBookGenre
       FROM Transactions 
       JOIN Books as b1 ON Transactions.BookID = b1.BookID 
       JOIN Books as b2 ON Transactions.TradeBookID = b2.BookID 
       WHERE TransactionID = ?`,
    [transactionID],
    (err, results) => {
      if (err) {
        console.error("Erro ao buscar detalhes da troca:", err);
        return res.status(500).send("Erro ao buscar detalhes da troca.");
      }
      if (results.length > 0) {
        res.render("trade-details", {
          transaction: results[0],
        });
      } else {
        res.send("Transação não encontrada.");
      }
    }
  );
});

app.post("/respond-to-trade/:transactionID", (req, res) => {
  const { transactionID } = req.params;
  const response = req.body.response; // 'accept' ou 'reject'
  const newStatus = response === "accept" ? "Completed" : "Canceled";

  connection.query(
    "UPDATE Transactions SET TransactionStatus = ? WHERE TransactionID = ?",
    [newStatus, transactionID],
    (err, result) => {
      if (err) {
        console.error("Erro ao atualizar o status da troca:", err);
        return res.status(500).send("Erro ao processar a troca");
      }
      res.redirect("/profile"); // Redirecione conforme necessário
    }
  );
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor Node.js em execução em http://localhost:${port}`);
});
