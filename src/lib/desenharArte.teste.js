import { test } from 'node:test'
import assert from 'node:assert/strict'

import { escalaBase, limites, prender, enquadrar, prenderNo } from './desenharArte.js'

const quadrado = { largura: 2048, altura: 2048 }
const story = { largura: 1080, altura: 1920 }

test('prenderNo mantém dentro da faixa', () => {
  assert.equal(prenderNo(5, 1, 3), 3)
  assert.equal(prenderNo(0, 1, 3), 1)
  assert.equal(prenderNo(2, 1, 3), 2)
})

test('escalaBase cobre o quadro pelo lado mais apertado', () => {
  // Foto deitada num quadro quadrado: quem manda é a altura.
  assert.equal(escalaBase({ largura: 4000, altura: 2000 }, quadrado), 2048 / 2000)
  // Foto em pé num quadro quadrado: quem manda é a largura.
  assert.equal(escalaBase({ largura: 2000, altura: 4000 }, quadrado), 2048 / 2000)
})

test('foto na mesma proporção do quadro, em zoom 1, não tem para onde ir', () => {
  const lim = limites({ largura: 1000, altura: 1000 }, quadrado, 1)
  assert.deepEqual(lim, { x: 0, y: 0 })
})

test('foto deitada sobra na horizontal e só na horizontal', () => {
  // 4000x2000 num quadro 2048x2048: escala 1,024, a foto vira 4096x2048.
  // Sobra 2048 na largura, metade para cada lado: meia largura de quadro.
  const lim = limites({ largura: 4000, altura: 2000 }, quadrado, 1)
  assert.equal(lim.x, 0.5)
  assert.equal(lim.y, 0)
})

test('o limite cresce com o zoom', () => {
  const um = limites({ largura: 1000, altura: 1000 }, quadrado, 1)
  const tres = limites({ largura: 1000, altura: 1000 }, quadrado, 3)
  assert.equal(um.x, 0)
  assert.equal(tres.x, 1) // (3-1)/2 = 1 largura de quadro para cada lado
  assert.equal(tres.y, 1)
})

test('o limite em fração não depende do tamanho do alvo', () => {
  // É a invariante que sustenta desenhar a 700px e exportar a 2048px.
  const foto = { largura: 3000, altura: 2000 }
  const grande = limites(foto, quadrado, 1.7)
  const pequeno = limites(foto, { largura: 512, altura: 512 }, 1.7)
  assert.equal(grande.x.toFixed(10), pequeno.x.toFixed(10))
  assert.equal(grande.y.toFixed(10), pequeno.y.toFixed(10))
})

test('sem foto não há limite', () => {
  assert.deepEqual(limites(null, quadrado, 2), { x: 0, y: 0 })
})

test('prender corta o deslocamento nos dois eixos', () => {
  const lim = { x: 0.5, y: 0.2 }
  assert.deepEqual(prender({ x: 9, y: -9 }, lim), { x: 0.5, y: -0.2 })
  assert.deepEqual(prender({ x: 0.1, y: 0.1 }, lim), { x: 0.1, y: 0.1 })
})

test('enquadrar centraliza quando o deslocamento é zero', () => {
  const cx = enquadrar({ largura: 4000, altura: 2000 }, quadrado, 1, { x: 0, y: 0 })
  assert.equal(cx.largura, 4096)
  assert.equal(cx.altura, 2048)
  assert.equal(cx.x, -1024) // (2048 - 4096) / 2
  assert.equal(cx.y, 0)
})

test('enquadrar aplica o deslocamento em fração do alvo', () => {
  const cx = enquadrar({ largura: 4000, altura: 2000 }, quadrado, 1, { x: 0.25, y: 0 })
  assert.equal(cx.x, -1024 + 0.25 * 2048)
})

test('a mesma cena desenha proporcionalmente igual em qualquer tamanho', () => {
  const foto = { largura: 3000, altura: 2000 }
  const desl = { x: 0.1, y: -0.05 }
  const grande = enquadrar(foto, story, 1.4, desl)
  const pequeno = enquadrar(foto, { largura: 270, altura: 480 }, 1.4, desl)
  const razao = 1080 / 270
  assert.equal((grande.x / pequeno.x).toFixed(6), String(razao.toFixed(6)))
  assert.equal((grande.largura / pequeno.largura).toFixed(6), String(razao.toFixed(6)))
})
