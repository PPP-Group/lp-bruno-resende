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

Estas oito coisas dependem da campanha. Nenhuma delas quebra a página hoje, ela
funciona e comunica o estado real, mas todas precisam entrar antes do ar.

| O que falta | Onde entra | O que acontece hoje |
|---|---|---|
| **WhatsApp oficial** | `contato.whatsapp` | O botão flutuante não aparece; o menu leva ao formulário; o formulário avisa que o canal está sendo configurado |
| **CNPJ da campanha** | `identidade.cnpj` | O rodapé mostra *a informar* em itálico |
| **Disclaimer eleitoral** | `rodape.disclaimer` | Está com uma redação genérica, **substituir pela do jurídico eleitoral** |
| **Texto de LGPD** | `contato.consentimento` | Idem: redação provisória, ver `consentimentoNota` |
| **URLs de Facebook, YouTube e TikTok** | `contato.redes[].href` | Redes sem `href` não aparecem; só o Instagram está no ar |
| **8 a 12 fotos da galeria** | `sobre.galeria[].src` | Cada vaga desenha um espaço reservado com a legenda já escrita |
| **3 links de vídeo** | `sobre.videos[].href` | Os cartões aparecem marcados como *Em breve* |
| **Depoimentos aprovados** | `sobre.apoios` | Lista vazia: o bloco não é renderizado. Só publicar com autorização de uso de nome, imagem e foto |

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

**O herói é o cartaz oficial da campanha**, a peça da página 11 do PDF
*Apres Bruno Resende* (a de fundo azul com o selo grande no centro), e não uma
remontagem dela em HTML. A arte já traz nome, cargo, número, slogan, selo, o
mapa do Estado com fotos de agenda dentro e a fita rosa.

O que a página acrescenta é o que papel não faz:

- o **selo gira** pousado exatamente sobre o selo impresso;
- a **faixa corre na diagonal** montada na borda de baixo;
- os **botões** ficam logo abaixo.

Duas coisas para saber antes de mexer nisso:

**As coordenadas do selo estão em `hero.css`** e foram medidas na arte original
de 4500 × 2292 px: anel externo de 625px de diâmetro, centro em (2384, 1082).
Daí saem `--selo-x`, `--selo-y` e `--selo-d`, com valores diferentes para o
recorte de celular. Trocar a arte obriga a refazer as quatro medidas, senão o
selo que gira sai de cima do impresso e aparece borda dupla.

**A faixa do herói inclina para o outro lado** das demais faixas do site. Com a
inclinação padrão ela entrava 16px por cima da assinatura com o 4400, que fica
no canto inferior direito da peça. Invertida, o lado direito desce e passa
livre.

**O CNPJ foi apagado da arte.** As peças de aplicação do manual trazem um CNPJ
fictício de exemplo (`12.345.678/0001-90`) no canto superior direito. Ele foi
removido na geração do JPG, reconstruindo o degradê e transplantando o grão de
uma faixa limpa da própria arte. O CNPJ real entra no rodapé, por
`identidade.cnpj`.

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
| `hero-cartaz.jpg` | O cartaz do herói, sem o CNPJ fictício |
| `hero-cartaz-movel.jpg` | O mesmo cartaz, cortado na altura do selo para o celular |
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

Variáveis: `URL_ALVO` (padrão `http://localhost:5181`), `CHROME_PATH`.
