# Vistoria de Obra

<img width="1917" height="935" alt="image" src="https://github.com/user-attachments/assets/1a8497f6-7b30-4f9d-b278-abb5ec97b006" />

Aplicação web simples para registrar **inspeções de campo em obra**, no estilo de um formulário (como Google Forms/Jotform, mas bem mais enxuto). Pensada para usar no celular durante as visitas: o usuário preenche o local, o item inspecionado, a situação e as observações, e anexa até 3 fotos, tiradas na hora com a câmera ou enviadas da galeria.

Atividade da disciplina Desenvolvimento de Sistemas Web (EECP0036), UFMA, 2026.2.
**Trilha C (sem API):** toda a lógica fica no JavaScript e os dados no `localStorage` do navegador.

## O que o app faz
- Cadastra uma inspeção com local, item, situação (Conforme / Não conforme / Observação) e observações.
- Permite tirar fotos pela câmera do celular ou fazer upload de imagens (até 3 por inspeção).
- Reduz o tamanho das fotos antes de salvar, para caber no armazenamento do navegador.
- Lista as inspeções registradas, da mais recente para a mais antiga, com data, hora e fotos.
- Exclui inspeções.

## O que o app não faz
- Login ou múltiplos usuários.
- Sincronização entre aparelhos ou envio para servidor (os dados ficam só no navegador usado).
- Geração de relatório em PDF.

## Como rodar
1. Baixe ou clone este repositório.
2. Abra a pasta no VS Code e use a extensão **Live Server**, ou, no terminal da pasta:
   ```
   python -m http.server 8000
   ```
3. Acesse `http://127.0.0.1:5500/index.html`.

Para testar a câmera no celular, a página precisa estar em HTTPS (por exemplo, publicada no GitHub Pages). Em `http://` pela rede local o navegador do celular ainda permite escolher imagens da galeria.

## Estrutura
| Arquivo | Conteúdo |
|---|---|
| `index.html` | Estrutura da página (header, main, form com labels ligados aos campos) |
| `style.css` | Estilos responsivos, pensados primeiro para celular |
| `app.js` | Leitura do formulário, compressão das fotos, localStorage e montagem da lista |

## Cuidados de segurança e robustez
- Todo texto digitado entra na página com `textContent` (nunca `innerHTML`).
- Local vazio exibe uma mensagem e não salva.
- Arquivos que não são imagem são ignorados com aviso.
- Se o `localStorage` encher (limite de cerca de 5 MB), o app avisa em vez de quebrar.
- Não há chaves de API (trilha C).

## Aba Rede (Network)

![Aba Rede](<Screenshot 2026-10-28 234332.png>)

O print mostra a requisição que carregou a página: método **GET**, URL `http://localhost:8000/` e status **200 (OK)**. Como o app é da trilha C, não há chamadas a APIs externas; depois do carregamento, salvar ou excluir inspeções não gera nenhuma requisição, porque os dados são gravados direto no `localStorage` do navegador.

## Uso de IA
- **Ferramenta:** Claude (Anthropic).
- **O que foi pedido:** ajuda para criar o app a partir da ideia de um formulário de inspeção de obra com fotos (estrutura HTML, CSS responsivo, lógica em JavaScript e este README).
- **O que eu alterei:** defini a ideia do app a partir da minha rotina de inspeções em obra (campos de local, item, situação e fotos), revisei o código, testei no navegador (cadastro, fotos, campo vazio e exclusão), publiquei no GitHub e capturei a aba Rede.
