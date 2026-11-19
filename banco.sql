-- =========================================================
-- EVENTOS DA FACULDADE - CRIACAO DO BANCO DE DADOS
--
-- 5 tabelas:
-- usuarios
-- tipos
-- eventos
-- inscricoes
-- favoritos
--
-- Relacionamentos:
-- tipos 1 ---- N eventos
-- usuarios 1 ---- N eventos
-- usuarios N ---- N eventos (inscricoes)
-- usuarios N ---- N eventos (favoritos)
-- =========================================================
SET
  NAMES utf8mb4;

-- ATENCAO:
-- Apaga o banco antigo e todos os seus dados.
-- Use somente se quiser comecar do zero.
DROP DATABASE IF EXISTS eventos_db;

CREATE DATABASE eventos_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE eventos_db;

-- =========================================================
-- TABELA 1: USUARIOS
-- Guarda os alunos e organizadores que fazem login.
-- =========================================================
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  perfil ENUM('aluno', 'organizador') NOT NULL DEFAULT 'aluno',
  id_institucional VARCHAR(80) NULL UNIQUE,
  senha_hash VARCHAR(100) NOT NULL
);

-- =========================================================
-- TABELA 2: TIPOS
-- Guarda as categorias dos eventos.
-- =========================================================
CREATE TABLE tipos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(50) NOT NULL UNIQUE
);

-- =========================================================
-- TABELA 3: EVENTOS
-- Guarda os eventos cadastrados pelos organizadores.
-- =========================================================
CREATE TABLE eventos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  titulo VARCHAR(150) NOT NULL,
  descricao TEXT,
  data_evento DATE NOT NULL,
  local VARCHAR(100),
  tipo_id INT NOT NULL,
  usuario_id INT NOT NULL,
  CONSTRAINT fk_eventos_tipo FOREIGN KEY (tipo_id) REFERENCES tipos(id),
  CONSTRAINT fk_eventos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- =========================================================
-- TABELA 4: INSCRICOES
-- Guarda os alunos inscritos nos eventos.
-- Impede inscrição duplicada no mesmo evento.
-- =========================================================
CREATE TABLE inscricoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  usuario_id INT NOT NULL,
  data_inscricao DATETIME DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_inscricoes_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_inscricoes_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uk_usuario_evento UNIQUE (usuario_id, evento_id)
);

-- =========================================================
-- TABELA 5: FAVORITOS
-- Guarda os eventos favoritados pelos alunos.
-- Impede favoritar o mesmo evento duas vezes.
-- =========================================================
CREATE TABLE favoritos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  evento_id INT NOT NULL,
  usuario_id INT NOT NULL,
  CONSTRAINT fk_favoritos_evento FOREIGN KEY (evento_id) REFERENCES eventos(id) ON DELETE CASCADE,
  CONSTRAINT fk_favoritos_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  CONSTRAINT uk_usuario_favorito UNIQUE (usuario_id, evento_id)
);

-- =========================================================
-- USUARIOS DE TESTE
-- Contas para desenvolvimento local.
-- Senha de demonstração local: Eventos!26
-- =========================================================
INSERT INTO
  usuarios (
    nome,
    email,
    perfil,
    id_institucional,
    senha_hash
  )
VALUES
  (
    'Usuário Teste',
    'teste@faculdade.com',
    'aluno',
    NULL,
    '$2b$10$UdkzrTFKecAihk2CU/Jdq.y2HEoKXCqe49aBvY4jauVxVrTBmBOOm'
  ),
  (
    'Organizador 1',
    'organizador1@faculdade.com',
    'organizador',
    'FAC-ORG-001',
    '$2b$10$UdkzrTFKecAihk2CU/Jdq.y2HEoKXCqe49aBvY4jauVxVrTBmBOOm'
  ),
  (
    'Organizador 2',
    'organizador2@faculdade.com',
    'organizador',
    'FAC-ORG-002',
    '$2b$10$UdkzrTFKecAihk2CU/Jdq.y2HEoKXCqe49aBvY4jauVxVrTBmBOOm'
  );

-- =========================================================
-- TIPOS DE EVENTOS
-- =========================================================
INSERT INTO
  tipos (nome)
VALUES
  ('Palestra'),
  ('Curso'),
  ('Oficina');

-- =========================================================
-- EVENTOS DE EXEMPLO
-- =========================================================
INSERT INTO
  eventos (
    titulo,
    descricao,
    data_evento,
    local,
    tipo_id,
    usuario_id
  )
VALUES
  (
    'Carreira em Tecnologia',
    'Bate-papo com profissionais da área.',
    '2026-12-02',
    'Auditório',
    1,
    2
  ),
  (
    'Introdução ao Node.js',
    'Curso básico de 8 horas.',
    '2026-12-05',
    'Laboratório 3',
    2,
    2
  ),
  (
    'Oficina de Git e GitHub',
    'Prática de commits e branches.',
    '2026-12-09',
    'Laboratório 1',
    3,
    3
  ),
  (
    'Segurança da Informação',
    'Boas práticas para o dia a dia.',
    '2026-12-12',
    'Auditório',
    1,
    3
  );

-- =========================================================
-- CONFERENCIA DOS EVENTOS
-- Mostra o tipo, o organizador e o total de inscritos.
-- =========================================================
SELECT
  e.id,
  e.titulo,
  t.nome AS tipo,
  u.nome AS organizador,
  e.data_evento,
  e.local,
  (
    SELECT
      COUNT(*)
    FROM
      inscricoes i
    WHERE
      i.evento_id = e.id
  ) AS total_inscritos
FROM
  eventos e
  JOIN tipos t ON t.id = e.tipo_id
  JOIN usuarios u ON u.id = e.usuario_id;

-- =========================================================
-- CONFERENCIA DAS TABELAS
-- =========================================================
SHOW TABLES;
