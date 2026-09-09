# Gerador de artes de apoio, projeto

Seção nova na landing page: a pessoa envia a própria foto, escolhe uma moldura
da campanha e baixa a arte pronta para foto de perfil ou para story.

A funcionalidade já existe no site antigo (`drbrunoresende.com.br`), num plugin
WordPress chamado `dr-bruno-gerador-artes`. Este documento descreve o porte
dela para este projeto: mesma função, mesmas molduras, escrita na linguagem
deste repositório e corrigindo três defeitos do original.

Data: 09/09/2026.

## 1. O que o original faz

Vale registrar, porque o porte é medido contra isto. O plugin antigo:

- oferece dois formatos, `profile` (2048 × 2048) e `story` (1080 × 1920);
- monta uma grade de miniaturas, uma por moldura, e a primeira já vem marcada;
- recebe a foto por `<input type="file">` e desenha em *cover* (a foto cobre o
  quadro inteiro, a sobra é cortada), centralizada;
- permite arrastar (ponteiro e toque), pinçar, girar a roda do mouse e mexer
  num controle deslizante de zoom, preso entre 1× e 3×;
- prende o deslocamento na borda da foto: nunca aparece vazio atrás;
- desenha a moldura por cima;
- exporta com `canvas.toBlob('image/png')` no tamanho nativo da moldura;
- compartilha por `navigator.share` quando o navegador aceita arquivos, e cai
  para download quando não aceita.

## 2. O que muda, e por quê

Três defeitos do original entram na conta como correção, não como recurso novo.

**Orientação EXIF.** O original carrega a foto com `FileReader` seguido de
`new Image()`. Esse caminho ignora o campo de orientação do EXIF, então foto
tirada de iPhone na vertical entra deitada. Aqui a foto entra por
`createImageBitmap(file, { imageOrientation: 'from-image' })`.

**`alert()`.** O original interrompe a pessoa com `alert()` em dois pontos
(baixar sem foto, compartilhar sem foto) e num terceiro quando o navegador não
tem `navigator.share`. Aqui vira mensagem inline na própria seção.

**Teclado.** A grade do original é uma lista de `<button>` sem semântica de
escolha, e o reposicionamento só responde a mouse e toque. Aqui a grade é um
`radiogroup` e o enquadramento responde a teclado.

Uma quarta mudança é de desempenho, não de defeito. O original mantém dois
canvases de 2048 × 2048 vivos ao mesmo tempo — cerca de 17 MB de bitmap cada,
33 MB somados — e redesenha os dois a cada evento de arraste. Aqui o canvas de
trabalho
tem o tamanho em que está sendo exibido, e o tamanho nativo só é montado no
instante da exportação.

## 3. Arquivos

```
src/components/arte/Arte.jsx        seção, cabeçalho, abas, os três cartões
src/components/arte/Enquadrar.jsx   cartão 1, canvas de trabalho, gestos, zoom
src/components/arte/Molduras.jsx    cartão 2, a grade
src/components/arte/Resultado.jsx   cartão 3, prévia, baixar, compartilhar
src/lib/desenharArte.js             geometria e composição, puras, sem DOM
src/lib/arteEstado.js               estado inicial e redutor, puros, sem React
src/lib/useArte.js                  cola com React: carga de imagem e redesenho
src/styles/arte.css
scripts/molduras.mjs                baixa, recodifica, emite o manifesto
public/assets/molduras/perfil/      overlays 2048 × 2048
public/assets/molduras/story/       overlays 1080 × 1920
public/assets/molduras/mini/        miniaturas, 320px na maior aresta
```

Os três cartões da referência já são três responsabilidades distintas e nenhum
deles conversa com o outro: os três leem do mesmo hook. É o que justifica a
divisão em quatro componentes em vez de um só.

`desenharArte.js` e `arteEstado.js` não importam React nem tocam em DOM. Recebem
números, devolvem números. São a parte que precisa estar certa, e a parte que dá
para conferir sem montar nada — o que sustenta a estratégia de teste da seção 13.
`useArte.js` fica sendo só a cola: `useReducer`, efeitos e cache de imagem.

## 4. Estado

```js
{
  formato: 'perfil' | 'story',
  moldura: 0,                      // índice dentro do formato corrente
  foto: null,                      // ou { bitmap, largura, altura }
  zoom: 1,                         // preso entre 1 e 3
  deslocamento: { x: 0, y: 0 },    // FRAÇÃO da largura e da altura do quadro
  erro: null,
  carregando: false,
}
```

A foto guarda as medidas ao lado do bitmap porque a geometria da seção 5 é toda
aritmética: nenhuma daquelas funções precisa de um bitmap, só de largura e
altura. Assim elas rodam em `node --test` sem navegador nenhum.

O deslocamento em fração é o que sustenta o resto do desenho. O original guarda
em pixels do canvas de edição e corrige com um fator na hora de exportar; isso
funciona, mas amarra o estado ao tamanho do canvas. Em fração, o mesmo estado
desenha idêntico a 700px na tela e a 2048px no arquivo, e o canvas de trabalho
fica livre para ter o tamanho que a tela pedir.

Trocar de formato zera `moldura`, `zoom` e `deslocamento`, e **preserva** a
foto: quem montou a foto de perfil quase sempre quer o story da mesma foto.
O original também preserva.

## 5. A matemática

Em `desenharArte.js`, todas puras:

```js
escalaBase(foto, quadro)      // cover: max(quadro.largura / foto.largura,
                              //             quadro.altura  / foto.altura)
limites(foto, quadro, zoom)   // { x, y }, o quanto dá para arrastar, em fração
prender(deslocamento, lim)    // clamp nos dois eixos
compor(ctx, cena)             // desenha foto e moldura no ctx, no tamanho dele
```

`compor` lê a largura e a altura do próprio contexto e escala tudo a partir
delas. É o que permite usar a mesma função para a prévia pequena, para o canvas
de trabalho e para o arquivo final.

Desenho da foto, dentro de um canvas de largura `L` e altura `A`:

```
s = max(L / foto.largura, A / foto.altura) * zoom
l = foto.largura * s
a = foto.altura  * s
x = (L - l) / 2 + deslocamento.x * L
y = (A - a) / 2 + deslocamento.y * A
```

E o limite, no mesmo referencial:

```
lim.x = max(0, (l - L) / 2) / L
lim.y = max(0, (a - A) / 2) / A
```

Com `zoom = 1` e uma foto de proporção igual à do quadro, `lim` é zero nos dois
eixos e não há o que arrastar. É o comportamento correto e é o mesmo do
original.

## 6. Desenho na tela

O canvas de trabalho é dimensionado assim:

```
largura = min(larguraExibida * min(devicePixelRatio, 2), quadro.largura)
```

O teto em `devicePixelRatio` de 2 evita montar um canvas de 3× em celular topo
de linha sem ganho visível. O teto no tamanho do quadro evita desenhar acima da
resolução da moldura.

O redesenho é coalescido em `requestAnimationFrame`: vários eventos de arraste
no mesmo quadro produzem um desenho só.

A prévia do cartão 3 é um segundo canvas, pequeno, alimentado pelo mesmo
`compor`. Custa pouco porque é pequeno.

A exportação monta um `OffscreenCanvas` (ou um `<canvas>` solto, onde não
houver) no tamanho nativo da moldura, chama `compor` uma vez e resolve
`toBlob(blob => …, 'image/png')`.

Nome do arquivo, igual ao do original:
`foto-perfil-dr-bruno-resende-4400.png` e `story-dr-bruno-resende-4400.png`.

## 7. As molduras

Dezoito, tiradas do site antigo, que é onde elas estão exportadas, nomeadas e
já separadas por formato:

| Formato | Quantidade | Tamanho     | Origem |
| ------- | ---------- | ----------- | ------ |
| perfil  | 8          | 2048 × 2048 | `…/plugins/dr-bruno-gerador-artes/assets/images/profile/perfil-NN.png` |
| story   | 10         | 1080 × 1920 | `…/plugins/dr-bruno-gerador-artes/assets/images/story/story-NN.png` |

A pasta `CAMPANHA 2026 / REDES SOCIAIS / MOLDURAS` no Drive da campanha tem 13
arquivos, com nomes de pasta de trabalho (`04 a.png`, `5a.png`, `07 (1).png`) e
sem separação por formato. Fica como fonte de consulta se faltar alguma moldura
depois; não é a fonte deste porte.

### Peso

Os 18 PNGs somam **29,6 MB**, com `perfil-07.png` sozinho em 6,3 MB. Isso não
entra numa landing page.

`scripts/molduras.mjs` baixa os originais e recodifica em WebP com alfa,
gravando duas saídas por moldura: o overlay em tamanho nativo e uma miniatura
de 320px para a grade. A compressão é uma escada: `lossless`, e daí
`quality` 92, 88, 84, 80, 75, 70, parando na primeira que couber no teto do
arquivo. Cada moldura fica assim na melhor qualidade que o orçamento permite,
em vez de todas caírem para o pior caso de uma delas.

O degrau mais fundo existe por causa de uma moldura só, `perfil-07`, que tem
6,1 MB de PNG por causa do grão fino no azul de fundo — exatamente o que o WebP
com perda descarta barato. Conferido a 1:1 contra o original: nem a letra branca
nem o número mudam. As molduras de cor chapada param em lossless ou q92 e nunca
descem a escada.

**Orçamento: 4 MB para os 36 arquivos**, com teto de 200 KB por overlay e 20 KB
por miniatura. Os dezoito overlays no teto dão 3,6 MB e as dezoito miniaturas
0,36 MB, o que fecha em 3,96 MB — o orçamento é apertado de propósito, para que
o teto por arquivo não possa ser cumprido dezoito vezes e ainda assim estourar
o total.

O script imprime o tamanho de cada arquivo antes e depois, e esses números vão
para o relato da implementação. Se o orçamento não for atingido, isso é dito,
não é arredondado.

`sharp` entra como `devDependency`. Não vai para o bundle: o script roda na
mão, uma vez, como `shots.mjs` e `provar.mjs`.

### Carga

A grade carrega só as miniaturas, com `loading="lazy"`. O overlay em tamanho
cheio é buscado quando a moldura é escolhida e guardado num `Map` que vive com
o componente. Enquanto ele não chegou, a prévia mostra a foto sem moldura e o
botão de baixar fica desabilitado.

## 8. Conteúdo

Nenhuma string visível dentro de componente, como manda o cabeçalho de
`src/data/candidato.js`. A seção acrescenta:

```js
arte: {
  rotulo: 'Participe',
  titulo: 'Leve a campanha na sua foto.',
  chamada:
    'Escolha uma moldura, ajuste o enquadramento e baixe a arte pronta para o ' +
    'seu perfil ou para o seu story. Leva menos de um minuto, e a sua foto não ' +
    'sai do seu aparelho.',
  passos: ['Ajuste sua foto', 'Escolha a moldura', 'Sua arte'],
  formatos: [
    {
      id: 'perfil',
      rotulo: 'Foto do perfil',
      largura: 2048,
      altura: 2048,
      arquivo: 'foto-perfil-dr-bruno-resende-4400.png',
      molduras: [
        { id: 'perfil-01', rotulo: 'Moldura 1' },
        // … 8 no total
      ],
    },
    { id: 'story', rotulo: 'Story', largura: 1080, altura: 1920, /* … 10 */ },
  ],
}
```

Os caminhos dos arquivos são derivados do `id` e do formato
(`/assets/molduras/perfil/perfil-01.webp`,
`/assets/molduras/mini/perfil-01.webp`), não repetidos no dado.

Em `secoes`, entre `conquistas` e `contato`:

```js
{ id: 'arte', rotulo: 'Sua arte' }
```

## 9. Posição na página

Em `App.jsx`, **depois** da faixa corrida das leis:

```
Conquistas → FaixaCorrida(leis) → Arte → Contato
```

A faixa das leis é o fecho de Conquistas: ela repete em movimento o que a seção
acabou de provar. Separá-la de Conquistas para encaixar a seção nova no meio
quebraria essa ligação.

As regras `.faixa + .secao` e `.secao:has(+ .faixa)` de `base.css` já cuidam do
respiro reduzido nas duas juntas; nada a acrescentar.

## 10. Visual

Fundo `--color-papel` (`#f6f7f9`). Conquistas é escura e Contato é branco puro;
o papel no meio faz o degrau e evita dois brancos colados.

- **Abas** de formato usam `.btn` do próprio sistema: ativa `.btn--primario`
  (rosa cheio), inativa `.btn--secundario` (vazada). É o que a referência
  desenha e é o que o site já tem.
- **Números dos passos** em Clash Display, branco sobre quadrado rosa. Mesmo
  papel do `.numero` de Conquistas: rosa marca o ponto onde o cuidado toca.
- **Cartões** são `.cartao`, sem variante nova.
- **Xadrez de transparência** em `repeating-conic-gradient` sobre
  `--color-papel-fundo`. Não é imagem.
- **Grade** em `repeat(auto-fill, minmax(88px, 1fr))`. Selecionada: anel rosa de
  2px e selo circular rosa com o check.
- Entrada pelo `useRevelar`, mesmo vetor diagonal do resto da página.

Em telas estreitas os três cartões empilham na ordem 1, 2, 3. O
`.faixa-conteudo` já resolve a largura.

## 11. Erros e limites

| Situação | Resposta |
| -------- | -------- |
| arquivo não é imagem | mensagem inline, estado anterior preservado |
| arquivo acima de 25 MB | mensagem inline dizendo o limite |
| decodificação falha | mensagem inline |
| moldura não carrega | prévia sem moldura, botão de baixar desabilitado, mensagem |
| baixar ou compartilhar sem foto | botões desabilitados; não há como chegar ao erro |
| `navigator.share` ausente ou recusado | baixa direto, com uma linha explicando |

Foto com mais de 4096px na maior aresta é reduzida a 4096 antes de virar
`ImageBitmap`. Uma foto de 50 MP monta um bitmap de cerca de 200 MB e derruba a
aba no celular. No zoom máximo sobre um recorte extremo isso custa um fio de
nitidez: é troca deliberada.

Nenhum `alert()`. Toda mensagem sai num `[role="status"]` com
`aria-live="polite"`.

## 12. Acessibilidade

- Abas: `role="tablist"`, cada botão `role="tab"` com `aria-selected` e
  `aria-controls`; setas esquerda e direita circulam.
- Grade: `role="radiogroup"` rotulado, cada item `role="radio"` com
  `aria-checked` e tabindex itinerante; setas circulam.
- Canvas de trabalho: `tabindex="0"`, `role="img"`, `aria-label` descrevendo o
  estado, `aria-describedby` apontando para as instruções em `.so-leitor`.
  Setas movem 2% do quadro, Shift e seta movem 10%, `+` e `-` mexem no zoom,
  Home redefine.
- Zoom também num `<input type="range">` rotulado, como no original.
- `<input type="file">` real, escondido com `.so-leitor`, acionado por um
  `<label>` estilizado como `.btn`.
- Alvos de toque nunca abaixo de 44px, que é o que `.btn` já garante.

## 13. Verificação

Este repositório prova comportamento com `scripts/provar.mjs`, em Puppeteer
sobre o Chrome instalado, e não tem test runner. O porte segue essa convenção em
vez de acrescentar um.

A geometria e o redutor, por serem puros, ganham testes de unidade em
`node --test`, que vem embutido no Node e não é dependência nova. Ficam em
`src/lib/*.teste.js` e rodam em menos de um segundo, sem navegador.

Acrescentar a `provar.mjs`:

1. gerar um PNG de teste em tempo de execução, em `os.tmpdir()`, com dimensões
   propositalmente diferentes das do quadro (para exercitar o cover) — nada
   binário entra no repositório;
2. subir esse arquivo pelo `<input type="file">`;
3. conferir que o canvas de trabalho deixou de estar em branco;
4. escolher outra moldura e conferir que o desenho mudou;
5. trocar para story e conferir que a foto continua carregada;
6. disparar a exportação e conferir que o blob resultante é PNG e mede
   2048 × 2048 no perfil e 1080 × 1920 no story;
7. conferir que a seção não tem alvo de toque abaixo de 44px em 360px de
   largura.

As provas que já existem cobrem o resto: nenhum erro de console e nenhuma
rolagem lateral de 360 a 1920 pixels.

`scripts/shots.mjs` passa a capturar a seção nova junto com as outras.

## 14. Fora de escopo

- Recorte livre, rotação, filtros, texto sobreposto. A referência não tem nada
  disso e a campanha não pediu.
- Envio ao servidor, galeria de artes feitas, contagem de uso. Tudo acontece no
  navegador e nada sai dele.
- Molduras administráveis por painel. A lista mora em `candidato.js`, como todo
  o resto do conteúdo deste site.
