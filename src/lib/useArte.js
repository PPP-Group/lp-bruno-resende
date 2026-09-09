/* Onde moram os arquivos de moldura. Derivar aqui, e não guardar o caminho no
   dado, é o que permite renomear a pasta sem mexer em dezoito linhas. */
export const caminhoMoldura = (formato, id) => `/assets/molduras/${formato}/${id}.webp`
export const caminhoMini = (id) => `/assets/molduras/mini/${id}.webp`
