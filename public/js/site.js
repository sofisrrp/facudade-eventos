
// JavaScript que roda NO NAVEGADOR.
// Mostra eventos, faz buscas, inscrições, exclusões e favoritos.
const lista = document.querySelector("#lista");
const busca = document.querySelector("#busca");
const filtroFavoritos = document.querySelector("#filtro-favoritos");

let mostrarFavoritos = false;

const meuId = Number(document.body.dataset.usuarioId) || null;
const perfil = document.body.dataset.perfil;

// Formata a data
const dataBR = (d) => d.split("-").reverse().join("/");

// Cria um elemento com texto
function criar(tag, texto, classe) {
  const el = document.createElement(tag);
  el.textContent = texto;
  if (classe) el.className = classe;
  return el;
}

// Cria um formulário POST
function formPost(acao, texto, classeBotao = "") {
  const f = document.createElement("form");
  f.method = "POST";
  f.action = acao;

  const token = document.querySelector('meta[name="csrf-token"]')?.content;
  const campoToken = document.createElement("input");

  campoToken.type = "hidden";
  campoToken.name = "_csrf";
  campoToken.value = token || "";

  f.append(campoToken);
  f.append(criar("button", texto, classeBotao));

  return f;
}

// Cria o botão de favorito
function botaoFavorito(evento) {
  const favorito = Boolean(evento.favorito);

  const botao = criar(
    "button",
   favorito ? "★" : "☆",
    "botao-favorito"
  );

  botao.type = "button";
  botao.title = favorito ? "Remover dos favoritos" : "Adicionar aos favoritos";
  botao.setAttribute("aria-label", botao.title);
  if (mostrarFavoritos) {
  carregar();
}

  botao.addEventListener("click", async () => {
    await alternarFavorito(evento.id, botao);
  });

  return botao;
}

// Adiciona ou remove um evento dos favoritos
async function alternarFavorito(eventoId, botao) {
  const token =
    document.querySelector('meta[name="csrf-token"]')?.content || "";

 const estavaFavoritado = botao.textContent === "★";

  botao.disabled = true;

  try {
    const resp = await fetch(
      `/api/eventos/${eventoId}/favorito`,
      {
        method: estavaFavoritado ? "DELETE" : "POST",
        headers: {
          "X-CSRF-Token": token
        }
      }
    );

    const resultado = await resp.json();

    if (!resp.ok) {
      alert(resultado.erro || "Não foi possível atualizar o favorito.");
      return;
    }

   botao.textContent = resultado.favorito ? "★" : "☆";
    botao.title = resultado.favorito
      ? "Remover dos favoritos"
      : "Adicionar aos favoritos";
    botao.setAttribute("aria-label", botao.title);

  } catch (erro) {
    console.error("Erro ao atualizar favorito:", erro);
    alert("Não foi possível atualizar o favorito.");
  } finally {
    botao.disabled = false;
  }
}

// Monta o card de UM evento
function montarCard(e) {
  const card = criar("article", "", "card");

  card.append(
    criar("span", e.tipo, "tag"),
    criar("h3", e.titulo),
    criar("p", `${dataBR(e.data_evento)} · ${e.local || "Local a definir"}`),
    criar("p", e.descricao || "")
  );

  // Informações do evento
  const informacoes = criar("div", "", "informacoes-evento");

  informacoes.append(
    criar("small", `Organizador: ${e.organizador}`)
  );

  if (perfil === "organizador") {
    informacoes.append(
      criar("small", `Inscritos: ${e.total_inscritos || 0}`)
    );
  }

  card.append(informacoes);

  // Botões de ação
  const acoes = criar("div", "", "linha");

  if (!meuId) {
    const entrar = criar("a", "Entre para se inscrever");
    entrar.href = "/login";
    acoes.append(entrar);

  } else if (perfil === "aluno") {
    // ALUNO: botão de favorito
    acoes.append(botaoFavorito(e));

    if (e.inscrito) {
      acoes.append(criar("strong", "✓ Você está inscrito"));
      acoes.append(
        formPost(`/eventos/${e.id}/cancelar`, "Cancelar inscrição", "link perigo")
      );
    } else {
      acoes.append(
        formPost(`/eventos/${e.id}/inscrever`, "Inscrever-se")
      );
    }

  } else if (perfil === "organizador" && Number(e.usuario_id) === meuId) {
    const editar = criar("a", "Editar");
    editar.href = `/eventos/${e.id}/editar`;

    const inscritos = criar("a", "Ver inscritos");
    inscritos.href = `/eventos/${e.id}/inscritos`;

    const excluir = criar("button", "Excluir", "link perigo");
    excluir.addEventListener("click", () => excluirEvento(e.id));

    acoes.append(editar, inscritos, excluir);
  }

  card.append(acoes);

  return card;
}

// BUSCAR eventos

async function carregar() {
  try {
    const resp = await fetch(
      "/api/eventos?busca=" + encodeURIComponent(busca.value)
    );

    if (!resp.ok) {
      lista.textContent = "Erro ao carregar";
      return;
    }

    let eventos = await resp.json();

    // Se o filtro estiver ativo, mostra somente os favoritos
    if (mostrarFavoritos) {
      eventos = eventos.filter(evento => Boolean(evento.favorito));
    }

    if (eventos.length === 0) {
      lista.textContent = mostrarFavoritos
        ? "Você ainda não tem eventos favoritos."
        : "Nenhum evento encontrado.";
      return;
    }

    lista.replaceChildren(...eventos.map(montarCard));

  } catch (erro) {
    console.error("Erro ao carregar eventos:", erro);
    lista.textContent = "Não foi possível carregar os eventos.";
  }
}


// EXCLUIR evento
async function excluirEvento(id) {
  if (!confirm("Excluir este evento?")) return;

  const token =
    document.querySelector('meta[name="csrf-token"]')?.content || "";

  const resp = await fetch("/api/eventos/" + id, {
    method: "DELETE",
    headers: { "X-CSRF-Token": token }
  });

  if (resp.status === 204) {
    carregar();
  } else {
    alert("Não foi possível excluir");
  }
}

// Busca enquanto digita
let espera;

busca.addEventListener("input", () => {
  clearTimeout(espera);
  espera = setTimeout(carregar, 300);
});

// Ativa ou desativa o filtro de favoritos
if (filtroFavoritos) {
  filtroFavoritos.addEventListener("click", () => {
    mostrarFavoritos = !mostrarFavoritos;

    const icone = filtroFavoritos.querySelector(".icone-favoritos");

    icone.textContent = mostrarFavoritos ? "★" : "☆";

    filtroFavoritos.setAttribute(
      "aria-pressed",
      String(mostrarFavoritos)
    );

    carregar();
  });
}

// Carrega os eventos ao abrir a página
carregar();
