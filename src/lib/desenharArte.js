/* ============================================================================
   GEOMETRIA DA ARTE
   ----------------------------------------------------------------------------
   Sem React, sem DOM: números entram, números saem. É a parte que precisa estar
   certa, e é a parte que dá para conferir sem montar nada.

   A decisão que amarra o módulo inteiro: o deslocamento da foto é guardado em
   FRAÇÃO do quadro, não em pixels. Com isso a mesma cena desenha idêntica na
   prévia de 240px, no canvas de trabalho de 700px e no arquivo de 2048px, e o
   canvas de trabalho fica livre para ter o tamanho que a tela pedir.
   ========================================================================== */

export const ZOOM_MIN = 1
export const ZOOM_MAX = 3

export const prenderNo = (valor, min, max) => Math.max(min, Math.min(max, valor))

/* Cover: a foto cobre o quadro inteiro e a sobra é cortada. Nunca aparece vazio
   atrás, que é o que o eleitor esperaria de um app de rede social. */
export function escalaBase(foto, quadro) {
  return Math.max(quadro.largura / foto.largura, quadro.altura / foto.altura)
}

/* O quanto dá para arrastar em cada eixo, em fração do quadro. Zero quer dizer
   que a foto não sobra daquele lado, então não há o que mover. */
export function limites(foto, quadro, zoom) {
  if (!foto) return { x: 0, y: 0 }

  const escala = escalaBase(foto, quadro) * zoom
  const largura = foto.largura * escala
  const altura = foto.altura * escala

  return {
    x: Math.max(0, (largura - quadro.largura) / 2) / quadro.largura,
    y: Math.max(0, (altura - quadro.altura) / 2) / quadro.altura,
  }
}

export function prender(deslocamento, lim) {
  return {
    x: prenderNo(deslocamento.x, -lim.x, lim.x),
    y: prenderNo(deslocamento.y, -lim.y, lim.y),
  }
}

/* Onde a foto vai ser desenhada dentro de `alvo`, em unidades de `alvo`. */
export function enquadrar(foto, alvo, zoom, deslocamento) {
  const escala = escalaBase(foto, alvo) * zoom
  const largura = foto.largura * escala
  const altura = foto.altura * escala

  return {
    x: (alvo.largura - largura) / 2 + deslocamento.x * alvo.largura,
    y: (alvo.altura - altura) / 2 + deslocamento.y * alvo.altura,
    largura,
    altura,
  }
}

/* Desenha a cena no contexto, no tamanho que o contexto tiver. A moldura vem
   por cima e é esticada para o canvas inteiro: ela sempre tem a proporção do
   quadro, então não há distorção. */
export function compor(ctx, { foto, moldura, zoom, deslocamento }) {
  const alvo = { largura: ctx.canvas.width, altura: ctx.canvas.height }
  ctx.clearRect(0, 0, alvo.largura, alvo.altura)

  if (foto) {
    const caixa = enquadrar(foto, alvo, zoom, deslocamento)
    ctx.imageSmoothingEnabled = true
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(foto.bitmap, caixa.x, caixa.y, caixa.largura, caixa.altura)
  }

  if (moldura) ctx.drawImage(moldura, 0, 0, alvo.largura, alvo.altura)
}
