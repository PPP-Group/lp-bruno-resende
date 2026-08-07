/* Ícones de traço, todos no mesmo grid de 24 e na mesma espessura.
   O vocabulário é clínico de propósito: são desenhados como sinais de
   prontuário, não como pictogramas genéricos de app. */

const trilhas = {
  /* Casa com cruz: a saúde chegando onde a pessoa mora. */
  saude: (
    <>
      <path d="M3.5 10.5 12 4l8.5 6.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z" />
      <path d="M12 10.5v5M9.5 13h5" />
    </>
  ),
  /* Fita da luta contra o câncer. */
  oncologia: (
    <>
      <path d="M9 21.5 12 14l3 7.5" />
      <path d="M12 14c-3.2-2-4.6-4.4-4.6-6.8A4.4 4.4 0 0 1 12 2.8a4.4 4.4 0 0 1 4.6 4.4c0 2.4-1.4 4.8-4.6 6.8z" />
      <path d="M10.3 10.6 15 16.2" />
    </>
  ),
  /* Folha e sulco: a lavoura. */
  agro: (
    <>
      <path d="M4 20.5c0-6.5 4.2-11 12-11.5-.4 7.6-4.8 11.5-12 11.5z" />
      <path d="M4 20.5C7 16 10.5 13.4 15 12" />
      <path d="M18.5 3.5c1.6 1.6 2 3.6 1.3 5.2-1.7 .5-3.6 0-5.2-1.6" />
    </>
  ),
  /* Barras em progressão: crescimento com base. */
  desenvolvimento: (
    <>
      <path d="M3.5 20.5h17" />
      <path d="M7 20.5v-5M12 20.5v-9M17 20.5v-13" />
    </>
  ),
  /* Escudo com marca de conferido: dinheiro público auditado. */
  seguranca: (
    <>
      <path d="M12 2.8 4.8 5.8v6c0 4.4 3 8.3 7.2 9.5 4.2-1.2 7.2-5.1 7.2-9.5v-6z" />
      <path d="m8.9 11.9 2.2 2.3 4-4.4" />
    </>
  ),
  /* Marcador de mapa. */
  local: (
    <>
      <path d="M12 21.5s7-5.7 7-11a7 7 0 1 0-14 0c0 5.3 7 11 7 11z" />
      <circle cx="12" cy="10.5" r="2.6" />
    </>
  ),
  /* Documento carimbado: a lei publicada. */
  lei: (
    <>
      <path d="M6 2.8h7.5L19 8.3V21a.7.7 0 0 1-.7.7H6a.7.7 0 0 1-.7-.7V3.5A.7.7 0 0 1 6 2.8z" />
      <path d="M13.2 3v5.2H18.8" />
      <path d="M8.6 13.5h6.8M8.6 17h4.4" />
    </>
  ),
  seta: <path d="M4.5 12h15M13.5 6l6 6-6 6" />,
  mais: <path d="M12 5.5v13M5.5 12h13" />,
  menos: <path d="M5.5 12h13" />,
  fechar: <path d="m6 6 12 12M18 6 6 18" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  checar: <path d="m5 12.5 4.6 4.5L19 6.8" />,
  tocar: (
    <>
      <path d="M9 11.5V6.2a1.7 1.7 0 0 1 3.4 0v9" />
      <path d="M12.4 12.4a1.6 1.6 0 0 1 3.2 0v.9M15.6 13.6a1.6 1.6 0 0 1 3.2 0v3.1a4.6 4.6 0 0 1-4.6 4.6h-2a4.4 4.4 0 0 1-3.4-1.6l-3-3.6a1.6 1.6 0 0 1 2.3-2.2L9 15.6" />
    </>
  ),
}

export function Icone({ nome, tamanho = 24, className = '',...resto }) {
  const trilha = trilhas[nome]
  if (!trilha) return null

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...resto}
    >
      {trilha}
    </svg>
  )
}

/* Marcas das redes sociais: preenchidas, porque é assim que cada plataforma
   distribui a sua, um traço "harmonizado" só deixa o ícone irreconhecível. */
const marcas = {
  /* Desenhada em três peças (moldura, lente e ponto) em vez de um traçado só.
     Traçado longo de Instagram vem cheio de números colados no formato
     compacto, e qualquer normalização de espaços em branco no arquivo o
     corrompe sem aviso. Aqui todo número está separado por espaço. */
  Instagram: (
    <>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M7.6 2 h8.8 a5.6 5.6 0 0 1 5.6 5.6 v8.8 a5.6 5.6 0 0 1 -5.6 5.6 h-8.8 a5.6 5.6 0 0 1 -5.6 -5.6 v-8.8 a5.6 5.6 0 0 1 5.6 -5.6 z m0 1.95 a3.65 3.65 0 0 0 -3.65 3.65 v8.8 a3.65 3.65 0 0 0 3.65 3.65 h8.8 a3.65 3.65 0 0 0 3.65 -3.65 v-8.8 a3.65 3.65 0 0 0 -3.65 -3.65 z"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 6.9 a5.1 5.1 0 1 1 0 10.2 a5.1 5.1 0 0 1 0 -10.2 z m0 1.95 a3.15 3.15 0 1 0 0 6.3 a3.15 3.15 0 0 0 0 -6.3 z"
      />
      <circle cx="17.45" cy="6.55" r="1.25" />
    </>
  ),
  Facebook: (
    <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.54V9.85c0-2.52 1.49-3.91 3.77-3.91 1.1 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.89h2.78l-.45 2.91h-2.33V22c4.78-.76 8.44-4.92 8.44-9.94z" />
  ),
  YouTube: (
    <path d="M21.58 7.19a2.51 2.51 0 0 0-1.77-1.78C18.25 5 12 5 12 5s-6.25 0-7.81.41a2.51 2.51 0 0 0-1.77 1.78A26.2 26.2 0 0 0 2 12a26.2 26.2 0 0 0.42 4.81 2.51 2.51 0 0 0 1.77 1.78C5.75 19 12 19 12 19s6.25 0 7.81-.41a2.51 2.51 0 0 0 1.77-1.78A26.2 26.2 0 0 0 22 12a26.2 26.2 0 0 0-.42-4.81zM9.99 15.02V8.98L15.2 12z" />
  ),
  TikTok: (
    <path d="M16.6 2h-3.1v13.2a2.6 2.6 0 1 1-2.2-2.57v-3.1a5.7 5.7 0 1 0 5.3 5.68V8.9a6.6 6.6 0 0 0 3.9 1.27V7.06A3.65 3.65 0 0 1 16.6 3.4z" />
  ),
  WhatsApp: (
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07a8.1 8.1 0 0 1-2.38-1.47 9 9 0 0 1-1.65-2.05c-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.03 1-1.03 2.45s1.06 2.84 1.2 3.04c.15.2 2.08 3.18 5.04 4.46.7.3 1.25.48 1.68.62.7.22 1.35.19 1.86.12.57-.09 1.75-.72 2-1.41.24-.7.24-1.29.17-1.41-.07-.13-.27-.2-.56-.35zM12.05 21.4h-.02a9.4 9.4 0 0 1-4.78-1.3l-.35-.2-3.55.92.95-3.46-.23-.36a9.34 9.34 0 0 1-1.43-4.98 9.4 9.4 0 1 1 9.41 9.38zM20.5 3.5A11.8 11.8 0 0 0 12.04 0C5.5 0.18 5.32.17 11.86c0 2.09.55 4.13 1.59 5.93L.07 24l6.35-1.66a11.9 11.9 0 0 0 5.62 1.43h.01c6.54 0 11.86-5.32 11.87-11.86a11.8 11.8 0 0 0-3.42-8.4z" />
  ),
}

export function Marca({ nome, tamanho = 20,...resto }) {
  const trilha = marcas[nome]
  if (!trilha) return null

  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...resto}
    >
      {trilha}
    </svg>
  )
}
