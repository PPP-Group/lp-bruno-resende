/* Estado da seção de artes: redutor puro, sem React.
   ----------------------------------------------------------------------------
   Mora fora do hook para poder ser conferido sem montar componente. O `quadro`
   viaja dentro das ações que dependem dele porque o limite do arraste muda com
   o formato, e um redutor não deve ir buscar dado em lugar nenhum. */

import { limites, prender, prenderNo, ZOOM_MIN, ZOOM_MAX } from './desenharArte.js'

export const TETO_ARQUIVO = 25 * 1024 * 1024
export const TETO_ARESTA = 4096

export const estadoInicial = (formato) => ({
  formato,
  moldura: 0,
  foto: null,
  zoom: 1,
  deslocamento: { x: 0, y: 0 },
  erro: null,
  carregando: false,
})

const PARTIDA = { zoom: 1, deslocamento: { x: 0, y: 0 } }

export function reduzirArte(estado, acao) {
  switch (acao.tipo) {
    /* A foto sobrevive à troca de formato: quem acabou de montar a foto de
       perfil quase sempre quer o story da mesma foto. */
    case 'formato':
      return { ...estado, ...PARTIDA, formato: acao.formato, moldura: 0, erro: null }

    case 'moldura':
      return { ...estado, moldura: acao.indice }

    case 'carregando':
      return { ...estado, carregando: true, erro: null }

    case 'foto':
      return { ...estado, ...PARTIDA, foto: acao.foto, carregando: false, erro: null }

    case 'erro':
      return { ...estado, erro: acao.mensagem, carregando: false }

    /* Prender de novo depois de mexer no zoom não é zelo: ao diminuir, o limite
       encolhe, e o deslocamento de antes passaria a mostrar vazio atrás. */
    case 'zoom': {
      const zoom = prenderNo(acao.zoom, ZOOM_MIN, ZOOM_MAX)
      return {
        ...estado,
        zoom,
        deslocamento: prender(estado.deslocamento, limites(estado.foto, acao.quadro, zoom)),
      }
    }

    case 'arrastar': {
      const bruto = {
        x: estado.deslocamento.x + acao.dx,
        y: estado.deslocamento.y + acao.dy,
      }
      return {
        ...estado,
        deslocamento: prender(bruto, limites(estado.foto, acao.quadro, estado.zoom)),
      }
    }

    case 'redefinir':
      return { ...estado, ...PARTIDA }

    default:
      return estado
  }
}
