-- Criar banco
create DATABASE bookswap;

-- Tabela de Usuários
CREATE TABLE Users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Name VARCHAR(100),
    Email VARCHAR(100) UNIQUE,
    Password VARCHAR(255),
    Address VARCHAR(255),
    ContactInfo VARCHAR(100),
    FavoriteGenre VARCHAR(100) 
);

-- Tabela de Livros
CREATE TABLE Books (
    BookID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255),
    Author VARCHAR(100),
    Publisher VARCHAR(100),
    PublicationYear INT,
    Genre VARCHAR(100),
    Synopsis TEXT,
    BookCondition ENUM('New', 'Degraded', 'Like New', 'Good', 'Acceptable'), -- Enum para condição do livro
    CoverImageURL VARCHAR(255),
    OwnerID INT,
    FOREIGN KEY (OwnerID) REFERENCES Users(UserID)
);

-- Tabela de Transações
CREATE TABLE Transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    BuyerID INT,
    SellerID INT,
    BookID INT,
    TransactionDateTime DATETIME,
    TransactionType ENUM('Sale', 'Trade'), -- Enum para tipo de transação
    TransactionStatus ENUM('Pending', 'Completed', 'Canceled'), -- Enum para status da transação
    FOREIGN KEY (BuyerID) REFERENCES Users(UserID),
    FOREIGN KEY (SellerID) REFERENCES Users(UserID),
    FOREIGN KEY (BookID) REFERENCES Books(BookID)
);

-- Tabela de Avaliações
CREATE TABLE Reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    ReviewerID INT,
    BookID INT,
    Comment TEXT,
    Rating INT, -- Pode ser um número inteiro de 1 a 5 para classificação em estrelas
    ReviewDateTime DATETIME,
    FOREIGN KEY (ReviewerID) REFERENCES Users(UserID),
    FOREIGN KEY (BookID) REFERENCES Books(BookID)
);

-- Tabela de Categorias
CREATE TABLE Categories (
    CategoryID INT AUTO_INCREMENT PRIMARY KEY,
    CategoryName VARCHAR(100),
    CategoryDescription TEXT
);

ALTER TABLE Users ADD COLUMN ProfilePictureURL VARCHAR(255) DEFAULT 'https://static.vecteezy.com/ti/vetor-gratis/p1/14554760-foto-negativa-do-perfil-do-homem-silhueta-anonima-cabeca-humana-empresario-trabalhador-apoio-ilustracaoial-vetor.jpg';

