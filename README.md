# Dr. Bruno Resende 4400, landing page

Página única de campanha para deputado federal pelo Espírito Santo, 2026.
Conteúdo do *Briefing de Conteúdo para Landing Page*, versão 2.0 (07/08/2026).
Identidade visual do manual *Apres Bruno Resende* e do arquivo *Logo e Slogan*.

```bash
npm install
npm run dev # desenvolvimento
npm run build # gera dist/
npm run preview # confere o build
```

---

## Pendências antes de publicar

Estas sete coisas dependem da campanha. Nenhuma delas quebra a página hoje, ela
funciona e comunica o estado real, mas todas precisam entrar antes do ar.

| O que falta | Onde entra | O que acontece hoje |
|---|---|---|
| **WhatsApp oficial** | `contato.whatsapp` | O botão flutuante não aparece; o menu leva ao formulário; o formulário avisa que o canal está sendo configurado |
| **Disclaimer eleitoral** | `rodape.disclaimer` | Está com uma redação genérica, **substituir pela do jurídico eleitoral** |
| **Texto de LGPD** | `contato.consentimento` | Idem: redação provisória, ver `consentimentoNota` |
| **URLs de Facebook, YouTube e TikTok** | `contato.redes[].href` | Redes sem `href` não aparecem; só o Instagram está no ar |
| **8 a 12 fotos da galeria** | `sobre.galeria[].src` | Cada vaga desenha um espaço reservado com a legenda já escrita |
| **3 links de vídeo** | `sobre.videos[].href` | Os cartões aparecem marcados como *Em breve* |
| **Depoimentos aprovados** | `sobre.apoios` | Lista vazia: o bloco não é renderizado. Só publicar com autorização de uso de nome, imagem e foto |

### Confira o CNPJ antes de publicar

`identidade.cnpj` está preenchido com `12.345.678/0001-90`, valor informado
para entrar no rodapé. Vale registrar: é o **mesmo número de exemplo** que
aparece nas peças de aplicação do manual de identidade (o que tinha sido
apagado da arte do herói, ver seção abaixo). Se for mesmo o CNPJ real da
campanha, ótimo, siga em frente. Se for o número de exemplo do manual copiado
por engano, troque antes do ar: um CNPJ de campanha errado no rodapé é uma
exigência legal descumprida, não só um dado desatualizado.

### Números a validar

O briefing marca como pendente de validação a planilha final de destinações do
mandato. Enquanto ela não for conferida, estes quatro números estão no ar sob
ressalva, e a nota abaixo do mapa diz isso ao leitor:

`R$ 3 mi` · `42 municípios` · `90 destinações` · `45% em saúde e PCD`

Ficam em `conquistas.numeros` e em `conquistas.municipios`.

### Afirmações que o briefing proíbe

Não usar sem documentação específica: *"o deputado que mais investiu na saúde"*,
*"mais de 40 leis"*, *"quase 8 mil famílias atendidas"*, *"maior produção
legislativa da área"*.

Sobre o Hospital do Câncer, a redação é **"idealizou e viabiliza"** ou
*"principal articulador"*. A obra está **em construção**, nunca dizer que foi
entregue ou inaugurada. O texto no código já respeita isso; se for reescrever,
mantenha.

---

## Onde mexer

**Todo texto visível está em `src/data/candidato.js`.** Nenhuma string de tela
mora dentro de componente. Para trocar uma frase, troque lá.

**Toda cor vem de `src/styles/tokens.css`**, e todas as oito são as do manual de
identidade. Não invente tom novo: derive com `color-mix` a partir das que já
existem.

```
Azuis #1B1464 noite #143E7A mar #0C4FAF royal #0071BC vivo
Rosas #E8558E rosa #E07C9C suave #FC81B4 neon
Base #F2F2F2 branco
```

Tipografia: **Clash Display** (títulos, número, slogan) e **Epilogue** (leitura),
as duas do manual. Clash Display é servida de `public/fonts/`; Epilogue vem do
pacote `@fontsource-variable/epilogue`.

### A ordem dos imports em `global.css` é regra

`base.css` (peças compartilhadas) vem **antes** dos arquivos de seção, porque
`.nav__cta { display: none }` e `.btn { display: inline-flex }` têm a mesma
especificidade: quem vier depois vence. Com a ordem invertida, o botão do menu
reaparece no celular e vaza para fora da tela. Não reordene sem testar em 390px.

---

## Peças que não são óbvias

**O mapa do cuidado** (`src/components/conquistas/MapaCuidado.jsx`) posiciona
cada município pela coordenada geográfica real dentro da silhueta do manual, que
é cartograficamente fiel (proporção 0,617 contra 0,616 do Estado real). A
conversão está comentada no código. **Se a silhueta for trocada por outra, as
posições param de valer.**

**A urna** (`src/components/urna/Urna.jsx`) só mostra o candidato para o número
certo; qualquer outro dá VOTO NULO. Isso não é rigor à toa: mostrar nome e foto
para quatro dígitos quaisquer seria enganoso e destruiria o objetivo da peça, que
é fixar o 4400. O contraste entre acertar e errar é o que faz decorar. A tela
também **não reproduz a urna oficial** da Justiça Eleitoral, e a legenda diz isso.

**O herói é o cartaz oficial da campanha**, a peça da página 10 do PDF
*Apres Bruno Resende* (fundo azul, selo grande no canto inferior direito, mapa
do Estado com fotos de agenda dentro), e não uma remontagem dela em HTML. A
arte já traz nome, cargo, número, slogan, selo e fita rosa. Ela entra inteira,
de fora a fora, sem recorte nem redução: a mesma imagem de 4500 × 2292 px serve
o celular e o desktop, só a largura do contêiner muda.

O que a página acrescenta é o que papel não faz:

- o **selo gira** pousado exatamente sobre o selo impresso;
- a **faixa corre na diagonal** montada na borda de baixo;
- os **botões** ficam logo abaixo.

Três coisas para saber antes de mexer nisso:

**As coordenadas do selo estão em `hero.css`** e foram medidas na arte final
(4500 × 2292 px): anel externo de 514px de diâmetro, centro em (4011, 1822).
Daí saem `--selo-x`, `--selo-y` e `--selo-d`, em porcentagem, então valem em
qualquer largura de tela sem precisar de um segundo jogo de números para o
celular. Trocar a arte obriga a refazer as três medidas, senão o selo que gira
sai de cima do impresso e aparece borda dupla.

**O espaço entre o menu e a imagem vem de `--nav-altura`**, uma variável que
`Nav.jsx` mede com `ResizeObserver` e publica em `<html>`. Antes, esse espaço
era um valor fixo maior que a barra de menu, e sobrava uma faixa da cor de
fundo entre os dois. Medir a altura real elimina esse hiato em qualquer
combinação de logotipo, fonte carregada ou não, e largura de tela.

**O fundo desfocado do menu, ao descer a página, mora num wrapper `.nav__barra`
dentro do `<header class="nav">`, e não no `<header>` em si.** Isso não é
capricho: `backdrop-filter` (e `transform`, `filter`, `will-change` para
qualquer um desses) faz o elemento que o recebe virar o container de posição
de todo filho `position: fixed`. A gaveta do menu mobile é um desses filhos.
Com o filtro no `<header>`, a gaveta passava a se posicionar dentro da caixa de
~75px da barra em vez da tela inteira, e só a tira de cima aparecia ao abrir o
menu depois de rolar a página, um bug que só aparece com a página rolada, o
que engana quem testa sempre a partir do topo. Se o menu voltar a ganhar
`backdrop-filter`, `transform` ou `will-change` diretamente no `<header>`, esse
bug volta.

**O CNPJ foi apagado da arte, e entra por texto no rodapé.** As peças de
aplicação do manual trazem um CNPJ de exemplo (`12.345.678/0001-90`) no canto
superior direito da imagem. Ele foi removido na geração do JPG, reconstruindo o
degradê e transplantando o grão de uma faixa limpa da própria arte, porque
CNPJ não é decoração: melhor um único lugar de verdade (`identidade.cnpj`, que
o rodapé lê) do que o mesmo dado pintado dentro de uma imagem. Ao trocar essa
arte por uma nova exportação do PDF, confira esse canto antes de publicar: uma
render direto da página, sem passar por essa limpeza, traz o CNPJ de exemplo
de volta. Ver a nota sobre o valor atual de `identidade.cnpj` no início deste
documento.

**O botão "Voltar ao topo" do rodapé é uma âncora comum**, `<a href="#inicio">`,
sem `onClick` nem lógica própria. `lib/rolagem.js` já intercepta todo clique em
`a[href^="#"]` da página para rolar suave com Lenis; o botão só precisa apontar
para o id certo e herda esse comportamento, o mesmo que os links do menu usam.

**A barra de rolagem mostra só a pílula.** Trilho, canto e as setas de avançar
um passo (`::-webkit-scrollbar-button`) ficam todos transparentes ou ocultos;
só a alça, na cor de marca, aparece. `scripts/barra.mjs` prova isso lendo o CSS
publicado, porque captura de tela não mostra barra de rolagem no Chrome sem
cabeça (ele desenha sobreposta, sem ocupar espaço).

**A gaveta do menu mobile esconde com `visibility`, não com o atributo
`hidden`.** A primeira versão usava `hidden={!aberto}` no React, que vira
`display: none` assim que fecha. O problema é que abrir e fechar mudam
`hidden` e o resto do estado no mesmo commit: o painel ia de "nem existe" para
"aberto" num frame só, sem nenhum quadro intermediário para o
`transform: translateX(100%)` fazer transição a partir dele. A transição
estava escrita em CSS, só nunca tinha um ponto de partida visível para animar.

Trocar por `visibility` resolve os dois lados: continua tirando o painel do
foco e da leitura de tela quando fechado (como o `hidden` fazia), mas
`visibility` é uma propriedade que anima, então sempre existe um quadro
anterior visível de onde o deslizar pode partir. Ao abrir, `visibility` muda
para `visible` no mesmo instante (sem atraso), para o deslizar aparecer
inteiro; ao fechar, ela só sai do fluxo depois que a animação termina (atraso
de 0,4s), para o painel não sumir de repente no meio do gesto. Os links da
lista entram em cascata por cima disso, com `--atraso` calculado pela posição
de cada um em `Nav.jsx`. Se decidir voltar para `hidden`, essa cascata para de
animar do mesmo jeito.

---

## Ativos gerados a partir do manual

Extraídos em vetor dos PDFs originais, em `public/assets/`:

| Arquivo | O que é |
|---|---|
| `logo.svg` / `logo-claro.svg` | Lockup empilhado, para fundo claro e escuro |
| `logo-h.svg` / `logo-h-claro.svg` | Lockup deitado, é o que cabe na barra de menu |
| `selo.svg` | Selo circular *Bruno Cuida* |
| `es.svg` | Silhueta do Espírito Santo (usa `currentColor`) |
| `og.jpg` | Cartão de compartilhamento 1200×630 |
| `hero-pg10.jpg` | O cartaz do herói (página 10), sem o CNPJ fictício, de fora a fora |
| `bruno-retrato.jpg` · `bruno-sobre.jpg` · `bruno-rosto.jpg` | Recortes do pôster e do banner oficiais |

---

## Conferência

```bash
node scripts/provar.mjs # 19 provas de comportamento
node scripts/shots.mjs shots # capturas desktop e mobile
node scripts/barra.mjs # barra de rolagem na cor da campanha (após build)
```

`provar.mjs` cobre: a fonte de campanha carregada, ausência de rolagem lateral em
seis larguras, a regra do voto nulo, a sanfona das propostas, os municípios
caindo dentro do contorno do Estado, rótulo em todo alvo focável e em todo campo
de formulário, os contadores chegando ao valor final e o console limpo.

`barra.mjs` cobre as oito regras da barra de rolagem: largura, alça na cor de
marca e em rosa ao passar, e trilho, canto, track-piece e setas todos
invisíveis, no WebKit e no Firefox.

Variáveis: `URL_ALVO` (padrão `http://localhost:5181`), `CHROME_PATH`.
