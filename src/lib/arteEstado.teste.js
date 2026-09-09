import { test } from 'node:test'
import assert from 'node:assert/strict'

import { estadoInicial, reduzirArte } from './arteEstado.js'

const quadro = { largura: 2048, altura: 2048 }
const foto = { bitmap: null, largura: 4000, altura: 2000 }

const comFoto = () => ({ ...estadoInicial('perfil'), foto })

test('o estado inicial começa na primeira moldura, sem foto', () => {
  const e = estadoInicial('perfil')
  assert.equal(e.formato, 'perfil')
  assert.equal(e.moldura, 0)
  assert.equal(e.foto, null)
  assert.equal(e.zoom, 1)
  assert.deepEqual(e.deslocamento, { x: 0, y: 0 })
})

test('trocar de formato zera o enquadramento e PRESERVA a foto', () => {
  // Quem montou a foto de perfil quase sempre quer o story da mesma foto.
  const antes = { ...comFoto(), moldura: 5, zoom: 2.4, deslocamento: { x: 0.3, y: 0.1 } }
  const depois = reduzirArte(antes, { tipo: 'formato', formato: 'story' })

  assert.equal(depois.formato, 'story')
  assert.equal(depois.moldura, 0)
  assert.equal(depois.zoom, 1)
  assert.deepEqual(depois.deslocamento, { x: 0, y: 0 })
  assert.equal(depois.foto, foto)
})

test('trocar de moldura não mexe no enquadramento', () => {
  const antes = { ...comFoto(), zoom: 2, deslocamento: { x: 0.2, y: 0 } }
  const depois = reduzirArte(antes, { tipo: 'moldura', indice: 3 })

  assert.equal(depois.moldura, 3)
  assert.equal(depois.zoom, 2)
  assert.deepEqual(depois.deslocamento, { x: 0.2, y: 0 })
})

test('o zoom fica preso entre 1 e 3', () => {
  const e = comFoto()
  assert.equal(reduzirArte(e, { tipo: 'zoom', zoom: 9, quadro }).zoom, 3)
  assert.equal(reduzirArte(e, { tipo: 'zoom', zoom: 0.2, quadro }).zoom, 1)
})

test('diminuir o zoom traz o deslocamento de volta para dentro', () => {
  // Em zoom 3 dava para arrastar bem; ao voltar para 1 o limite encolhe e o
  // deslocamento antigo passaria a mostrar vazio atrás da foto.
  const largo = reduzirArte(
    { ...comFoto(), zoom: 3 },
    { tipo: 'arrastar', dx: 5, dy: 5, quadro },
  )
  assert.ok(largo.deslocamento.x > 0.5)

  const apertado = reduzirArte(largo, { tipo: 'zoom', zoom: 1, quadro })
  assert.equal(apertado.deslocamento.x, 0.5) // 4000x2000 em quadro quadrado
  assert.equal(apertado.deslocamento.y, 0)
})

test('arrastar soma e é preso na borda', () => {
  const um = reduzirArte(comFoto(), { tipo: 'arrastar', dx: 0.2, dy: 0.2, quadro })
  assert.equal(um.deslocamento.x, 0.2)
  assert.equal(um.deslocamento.y, 0) // não sobra nada na vertical

  const dois = reduzirArte(um, { tipo: 'arrastar', dx: 0.2, dy: 0, quadro })
  assert.equal(dois.deslocamento.x.toFixed(6), '0.400000')

  const tres = reduzirArte(dois, { tipo: 'arrastar', dx: 5, dy: 0, quadro })
  assert.equal(tres.deslocamento.x, 0.5)
})

test('sem foto, arrastar não faz nada', () => {
  const e = reduzirArte(estadoInicial('perfil'), { tipo: 'arrastar', dx: 1, dy: 1, quadro })
  assert.deepEqual(e.deslocamento, { x: 0, y: 0 })
})

test('carregar uma foto nova zera o enquadramento e limpa o erro', () => {
  const antes = { ...comFoto(), zoom: 2.5, deslocamento: { x: 0.3, y: 0 }, erro: 'tipo' }
  const outra = { bitmap: null, largura: 100, altura: 100 }
  const depois = reduzirArte(antes, { tipo: 'foto', foto: outra })

  assert.equal(depois.foto, outra)
  assert.equal(depois.zoom, 1)
  assert.deepEqual(depois.deslocamento, { x: 0, y: 0 })
  assert.equal(depois.erro, null)
  assert.equal(depois.carregando, false)
})

test('o erro não derruba a foto que já estava lá', () => {
  const depois = reduzirArte(comFoto(), { tipo: 'erro', mensagem: 'tamanho' })
  assert.equal(depois.erro, 'tamanho')
  assert.equal(depois.foto, foto)
  assert.equal(depois.carregando, false)
})

test('redefinir volta ao enquadramento de partida sem perder a foto', () => {
  const antes = { ...comFoto(), zoom: 2.2, deslocamento: { x: 0.4, y: 0.1 } }
  const depois = reduzirArte(antes, { tipo: 'redefinir' })

  assert.equal(depois.zoom, 1)
  assert.deepEqual(depois.deslocamento, { x: 0, y: 0 })
  assert.equal(depois.foto, foto)
})

test('ação desconhecida devolve o mesmo objeto', () => {
  const e = comFoto()
  assert.equal(reduzirArte(e, { tipo: 'nada' }), e)
})
