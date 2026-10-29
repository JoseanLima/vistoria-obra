'use strict';

// ---------- Configuração ----------
const CHAVE_STORAGE = 'vistoria-obra:inspecoes';
const MAX_FOTOS = 3;
// As fotos são reduzidas antes de salvar, porque o localStorage
// só comporta cerca de 5 MB por site.
const LADO_MAXIMO_FOTO = 800; // pixels
const QUALIDADE_JPEG = 0.6;   // 0 a 1

const CLASSE_POR_SITUACAO = {
  'Conforme': 'ok',
  'Não conforme': 'nok',
  'Observação': 'obs',
};

// ---------- Elementos da página ----------
const form = document.getElementById('form-inspecao');
const campoLocal = document.getElementById('local');
const campoItem = document.getElementById('item');
const campoSituacao = document.getElementById('situacao');
const campoObservacoes = document.getElementById('observacoes');
const campoFotos = document.getElementById('fotos');
const areaPrevia = document.getElementById('previa-fotos');
const areaMensagem = document.getElementById('mensagem');
const listaInspecoes = document.getElementById('lista-inspecoes');
const contador = document.getElementById('contador');

// Fotos (em data URL) da inspeção que está sendo preenchida
let fotosSelecionadas = [];

// ---------- Armazenamento ----------
function carregarInspecoes() {
  try {
    const texto = localStorage.getItem(CHAVE_STORAGE);
    return texto ? JSON.parse(texto) : [];
  } catch {
    return []; // dado corrompido ou storage bloqueado: começa vazio
  }
}

// Lança erro se o armazenamento estiver cheio; quem chama trata.
function salvarInspecoes(inspecoes) {
  localStorage.setItem(CHAVE_STORAGE, JSON.stringify(inspecoes));
}

// ---------- Mensagens ----------
function mostrarMensagem(texto, tipo) {
  areaMensagem.textContent = texto;
  areaMensagem.className = 'mensagem ' + tipo;
}

// ---------- Fotos ----------
// Desenha a imagem num canvas menor e devolve um JPEG comprimido.
function comprimirFoto(arquivo) {
  return new Promise((resolve, reject) => {
    const endereco = URL.createObjectURL(arquivo);
    const imagem = new Image();

    imagem.onload = () => {
      const maiorLado = Math.max(imagem.naturalWidth, imagem.naturalHeight);
      const escala = Math.min(1, LADO_MAXIMO_FOTO / maiorLado);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(imagem.naturalWidth * escala);
      canvas.height = Math.round(imagem.naturalHeight * escala);
      canvas.getContext('2d').drawImage(imagem, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(endereco);
      resolve(canvas.toDataURL('image/jpeg', QUALIDADE_JPEG));
    };

    imagem.onerror = () => {
      URL.revokeObjectURL(endereco);
      reject(new Error('Arquivo de imagem inválido'));
    };

    imagem.src = endereco;
  });
}

function criarImagem(src, textoAlternativo) {
  const img = document.createElement('img');
  img.src = src;
  img.alt = textoAlternativo;
  img.loading = 'lazy';
  return img;
}

function renderizarPrevia() {
  areaPrevia.replaceChildren();

  fotosSelecionadas.forEach((foto, indice) => {
    const figura = document.createElement('figure');
    figura.append(criarImagem(foto, `Foto ${indice + 1} selecionada`));

    const botaoRemover = document.createElement('button');
    botaoRemover.type = 'button';
    botaoRemover.className = 'botao-remover-foto';
    botaoRemover.textContent = '×';
    botaoRemover.setAttribute('aria-label', `Remover foto ${indice + 1}`);
    botaoRemover.addEventListener('click', () => {
      fotosSelecionadas.splice(indice, 1);
      renderizarPrevia();
    });

    figura.append(botaoRemover);
    areaPrevia.append(figura);
  });
}

async function aoEscolherFotos() {
  const arquivos = Array.from(campoFotos.files);
  campoFotos.value = ''; // limpa o campo para permitir tirar outra foto em seguida

  const imagens = arquivos.filter((arquivo) => arquivo.type.startsWith('image/'));
  const vagas = MAX_FOTOS - fotosSelecionadas.length;

  if (imagens.length < arquivos.length) {
    mostrarMensagem('Só são aceitos arquivos de imagem.', 'erro');
  }
  if (imagens.length > vagas) {
    mostrarMensagem(`Limite de ${MAX_FOTOS} fotos por inspeção. As excedentes foram ignoradas.`, 'erro');
  }

  for (const arquivo of imagens.slice(0, Math.max(vagas, 0))) {
    try {
      fotosSelecionadas.push(await comprimirFoto(arquivo));
    } catch {
      mostrarMensagem(`Não foi possível abrir a imagem "${arquivo.name}".`, 'erro');
    }
  }

  renderizarPrevia();
}

// ---------- Lista de inspeções ----------
function formatarData(dataIso) {
  return new Date(dataIso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
}

function criarParagrafo(rotulo, valor) {
  const p = document.createElement('p');
  const negrito = document.createElement('strong');
  negrito.textContent = rotulo + ': ';
  p.append(negrito, document.createTextNode(valor));
  return p;
}

function criarCartaoInspecao(inspecao) {
  const itemLista = document.createElement('li');
  const artigo = document.createElement('article');
  artigo.className = 'inspecao';

  const titulo = document.createElement('h3');
  titulo.textContent = inspecao.local;

  const selo = document.createElement('span');
  selo.className = 'selo ' + (CLASSE_POR_SITUACAO[inspecao.situacao] || 'obs');
  selo.textContent = inspecao.situacao;

  const data = document.createElement('time');
  data.dateTime = inspecao.data;
  data.textContent = formatarData(inspecao.data);

  artigo.append(titulo, selo, data);

  if (inspecao.item) artigo.append(criarParagrafo('Item', inspecao.item));
  if (inspecao.observacoes) artigo.append(criarParagrafo('Observações', inspecao.observacoes));

  if (inspecao.fotos.length > 0) {
    const galeria = document.createElement('div');
    galeria.className = 'fotos-inspecao';
    inspecao.fotos.forEach((foto, indice) => {
      galeria.append(criarImagem(foto, `Foto ${indice + 1} da inspeção em ${inspecao.local}`));
    });
    artigo.append(galeria);
  }

  const botaoExcluir = document.createElement('button');
  botaoExcluir.type = 'button';
  botaoExcluir.className = 'botao-excluir';
  botaoExcluir.textContent = 'Excluir';
  botaoExcluir.addEventListener('click', () => excluirInspecao(inspecao.id));
  artigo.append(botaoExcluir);

  itemLista.append(artigo);
  return itemLista;
}

function renderizarLista() {
  const inspecoes = carregarInspecoes();
  listaInspecoes.replaceChildren();
  contador.textContent = `(${inspecoes.length})`;

  if (inspecoes.length === 0) {
    const vazio = document.createElement('li');
    vazio.className = 'vazio';
    vazio.textContent = 'Nenhuma inspeção registrada ainda.';
    listaInspecoes.append(vazio);
    return;
  }

  inspecoes.forEach((inspecao) => listaInspecoes.append(criarCartaoInspecao(inspecao)));
}

function excluirInspecao(id) {
  if (!confirm('Excluir esta inspeção?')) return;
  const restantes = carregarInspecoes().filter((inspecao) => inspecao.id !== id);
  salvarInspecoes(restantes);
  renderizarLista();
  mostrarMensagem('Inspeção excluída.', 'sucesso');
}

// ---------- Salvar ----------
function limparFormulario() {
  form.reset();
  fotosSelecionadas = [];
  renderizarPrevia();
}

function aoSalvar(evento) {
  evento.preventDefault(); // impede o recarregamento da página

  const local = campoLocal.value.trim();
  if (local === '') {
    mostrarMensagem('Informe o local da inspeção antes de salvar.', 'erro');
    campoLocal.focus();
    return;
  }

  const novaInspecao = {
    id: String(Date.now()),
    data: new Date().toISOString(),
    local,
    item: campoItem.value.trim(),
    situacao: campoSituacao.value,
    observacoes: campoObservacoes.value.trim(),
    fotos: [...fotosSelecionadas],
  };

  const inspecoes = carregarInspecoes();
  inspecoes.unshift(novaInspecao); // mais recente primeiro

  try {
    salvarInspecoes(inspecoes);
  } catch {
    mostrarMensagem('Armazenamento do navegador cheio. Exclua inspeções antigas ou use menos fotos.', 'erro');
    return;
  }

  limparFormulario();
  renderizarLista();
  mostrarMensagem('Inspeção salva!', 'sucesso');
}

// ---------- Início ----------
campoFotos.addEventListener('change', aoEscolherFotos);
form.addEventListener('submit', aoSalvar);
renderizarLista();
