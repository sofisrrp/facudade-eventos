# Documento de visão — Eventos da Faculdade

## Problema e objetivo

O projeto centraliza a divulgação, a busca e a gestão de eventos acadêmicos. Alunos podem encontrar palestras, cursos e oficinas, acompanhar inscrições e guardar eventos favoritos. Organizadores podem publicar e administrar seus próprios eventos e consultar quem se inscreveu.

## Usuários

- **Aluno:** consulta eventos, pesquisa por título ou tipo, inscreve-se, cancela a própria inscrição e controla seus favoritos.
- **Organizador:** cria, edita e exclui eventos de sua autoria e consulta a lista de inscritos.

## Funcionalidades principais

1. Cadastro e login com perfis de aluno e organizador.
2. Listagem pública de eventos futuros, com busca por título ou categoria.
3. CRUD de eventos e de tipos de evento para organizadores.
4. Inscrição e cancelamento para alunos; visualização de participantes para o organizador dono do evento.
5. Favoritar e desfavoritar eventos.

## Histórias de usuário

- Como aluno, quero pesquisar os próximos eventos e me inscrever sem perder a página que estou consultando.
- Como organizador, quero cadastrar um evento e ver os alunos inscritos nele.

## Entidades e relações

O banco contém **Usuário**, **Tipo**, **Evento**, **Inscrição** e **Favorito**. Um tipo possui vários eventos (**1:N**), e cada evento pertence a um tipo. Um organizador pode cadastrar vários eventos (**1:N**), e cada evento tem um organizador. Alunos e eventos se relacionam por meio das tabelas de inscrição e de favoritos.

## AJAX

A busca atualiza a lista de eventos enquanto o aluno digita, sem recarregar a página. A inclusão e remoção de favoritos e a exclusão de eventos também enviam requisições `fetch`.

## Escopo técnico

Aplicação web em Node.js, Express e EJS, com persistência MySQL/MariaDB e modelos Sequelize. O schema existente em `banco.sql` é preservado.
