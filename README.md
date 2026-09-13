# Ritmo

PWA pessoal, mobile-first e offline para acompanhar treino, alimentação e evolução corporal.
Os dados de uso ficam no IndexedDB do navegador e podem ser exportados ou restaurados em JSON.

## Desenvolvimento

Use uma cópia local de trabalho, em vez da unidade montada do Google Drive: a sincronização do
Drive não lida bem com os muitos arquivos de `node_modules`.

```bash
npm ci
npm run dev
```

Verificação completa:

```bash
npm run check
npm run test:e2e
```

## Publicação

O workflow em `.github/workflows/deploy-pages.yml` valida o projeto e gera a PWA após cada envio
para a branch `main`. A publicação de `dist` no GitHub Pages só ocorre quando o workflow é iniciado
manualmente.

O GitHub Pages disponibiliza o site publicamente. Antes de ativá-lo, confirme que os dados
incluídos no plano inicial podem ser expostos; os registros criados durante o uso permanecem no
aparelho e não são enviados pelo app.

## Instalação

Após a publicação, abra a URL do app em um navegador compatível:

- Android: use **Instalar app** ou **Adicionar à tela inicial** no menu do Chrome ou Edge.
- iPhone/iPad: no Safari, use **Compartilhar** e depois **Adicionar à Tela de Início**.

A primeira abertura precisa de internet. Depois que o service worker for instalado, o app funciona
offline.
