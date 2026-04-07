-- ============================================================
-- EvCore — Azure SQL Database Schema
-- Target: Azure SQL Database (Standard tier, S2+)
-- Designed to replace Zustand localStorage persistence
-- ============================================================

-- Libraries
CREATE TABLE libraries (
  id              NVARCHAR(50)   NOT NULL PRIMARY KEY,
  name            NVARCHAR(255)  NOT NULL,
  inn_name        NVARCHAR(255)  NOT NULL DEFAULT '',
  indications     NVARCHAR(MAX)  NOT NULL DEFAULT '[]',  -- JSON array of strings
  description     NVARCHAR(MAX)  NOT NULL DEFAULT '',
  dossier_enabled BIT            NOT NULL DEFAULT 0,
  created_at      DATETIME2      NOT NULL DEFAULT GETUTCDATE(),
  updated_at      DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- Library column definitions
-- learned_examples: JSON array of {aiValue,userValue,reason,abstractSnippet} objects.
-- Each time a user corrects a cell and provides a rationale, a new entry is appended
-- here AND the rationale is also appended to ai_prompt so future AI calls benefit.
CREATE TABLE library_columns (
  id                NVARCHAR(50)   NOT NULL PRIMARY KEY,
  library_id        NVARCHAR(50)   NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  name              NVARCHAR(255)  NOT NULL,
  description       NVARCHAR(MAX)  NOT NULL DEFAULT '',
  type              NVARCHAR(20)   NOT NULL CHECK (type IN ('text','select','date','number')),
  predefined_values NVARCHAR(MAX)  NOT NULL DEFAULT '[]',  -- JSON array of strings
  is_filter         BIT            NOT NULL DEFAULT 0,
  ai_prompt         NVARCHAR(MAX)  NOT NULL DEFAULT '',    -- grows as corrections are made
  learned_examples  NVARCHAR(MAX)  NOT NULL DEFAULT '[]',  -- JSON array of LearnedExample
  order_index       INT            NOT NULL DEFAULT 0,
  is_default        BIT            NOT NULL DEFAULT 0,
  hidden            BIT            NOT NULL DEFAULT 0,
  width             INT            NULL
);

-- Articles
CREATE TABLE articles (
  id               NVARCHAR(50)   NOT NULL PRIMARY KEY,
  library_id       NVARCHAR(50)   NOT NULL REFERENCES libraries(id) ON DELETE CASCADE,
  article_number   INT            NOT NULL,
  pmid             NVARCHAR(50)   NOT NULL DEFAULT '',
  title            NVARCHAR(MAX)  NOT NULL DEFAULT '',
  authors          NVARCHAR(MAX)  NOT NULL DEFAULT '',
  journal          NVARCHAR(255)  NOT NULL DEFAULT '',
  publication_date NVARCHAR(20)   NOT NULL DEFAULT '',
  publication_link NVARCHAR(1000) NOT NULL DEFAULT '',
  pdf_data         NVARCHAR(MAX)  NULL,   -- base64 data URL (consider Azure Blob Storage for large PDFs)
  abstract         NVARCHAR(MAX)  NULL,
  created_at       DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- Dynamic column values per article
-- One row per (article, column) pair
CREATE TABLE article_column_values (
  id             NVARCHAR(50)  NOT NULL PRIMARY KEY,
  article_id     NVARCHAR(50)  NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  column_id      NVARCHAR(50)  NOT NULL REFERENCES library_columns(id),
  value          NVARCHAR(MAX) NULL,
  ai_confidence  FLOAT         NULL,
  ai_reasoning   NVARCHAR(MAX) NULL,
  source_snippet NVARCHAR(MAX) NULL,
  CONSTRAINT uq_article_column UNIQUE (article_id, column_id)
);

-- Dossier sections mapping per article
CREATE TABLE article_dossier_sections (
  id         NVARCHAR(50)  NOT NULL PRIMARY KEY,
  article_id NVARCHAR(50)  NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  section    NVARCHAR(50)  NOT NULL,
  CONSTRAINT uq_article_section UNIQUE (article_id, section)
);

-- Users (replaces Zustand auth store)
CREATE TABLE users (
  id         NVARCHAR(50)   NOT NULL PRIMARY KEY,
  email      NVARCHAR(255)  NOT NULL UNIQUE,
  name       NVARCHAR(255)  NOT NULL,
  role       NVARCHAR(20)   NOT NULL CHECK (role IN ('admin','researcher','viewer')),
  created_at DATETIME2      NOT NULL DEFAULT GETUTCDATE()
);

-- Passwords stored as bcrypt hashes (NEVER plaintext)
CREATE TABLE user_credentials (
  user_id       NVARCHAR(50)  NOT NULL PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  password_hash NVARCHAR(255) NOT NULL,
  updated_at    DATETIME2     NOT NULL DEFAULT GETUTCDATE()
);

-- ============================================================
-- Indexes for common query patterns
-- ============================================================
CREATE INDEX ix_articles_library    ON articles(library_id);
CREATE INDEX ix_acv_article         ON article_column_values(article_id);
CREATE INDEX ix_acv_column          ON article_column_values(column_id);
CREATE INDEX ix_columns_library     ON library_columns(library_id, order_index);

-- ============================================================
-- Notes for Azure deployment
-- ============================================================
-- 1. Create Azure SQL Database via Azure Portal or az CLI:
--    az sql db create --resource-group evcore-rg --server evcore-sql
--                     --name evcore-db --service-objective S2
--
-- 2. Connection string (add to Azure App Service environment variables):
--    DATABASE_URL="sqlserver://evcore-sql.database.windows.net:1433;database=evcore-db;user=...;password=...;encrypt=true"
--
-- 3. Use Prisma with the SQL Server adapter:
--    npm install prisma @prisma/client
--    prisma/schema.prisma datasource: provider = "sqlserver"
--
-- 4. For PDF storage, move pdf_data from the articles table to Azure Blob Storage
--    and store only the blob URL in articles.pdf_blob_url (NVARCHAR(1000)).
--
-- 5. Authentication: replace plaintext passwords with bcrypt hashes.
--    npm install bcryptjs
