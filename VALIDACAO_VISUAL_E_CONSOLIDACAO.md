# Validação visual e consolidação — Ritmo PWA

Data da revisão: 13/09/2026

Aplicativo publicado: <https://romulorod1.github.io/ritmo-pwa/>

## Resultado

A PWA foi revisada em navegador real, com foco na navegação móvel, nos fluxos de treino e na acessibilidade do conteúdo por rolagem. A revisão encontrou expansão horizontal na aba **Evolução** e risco de conteúdo inacessível em telas e modais extensos. As duas situações foram corrigidas e validadas antes da publicação.

## Correções aplicadas

- A aba Evolução não permite mais que a lista horizontal de exercícios expanda a largura da página. A lista passa a rolar somente dentro do próprio seletor.
- As sete sessões da aba Treinos se ajustam à largura disponível, inclusive em 320 px.
- Modais extensos têm área de conteúdo com rolagem própria, com cabeçalho e ações preservados.
- O modo treino usa uma área interna rolável para que resumo, condicionamento e artes marciais permaneçam acessíveis em telas curtas.
- Elementos de página e cartões passaram a respeitar a largura disponível, evitando estouro horizontal.

## Telas e fluxos revisados

- **Hoje:** agenda do dia, refeições, peso, iniciar treino e registro manual.
- **Treinos:** agenda semanal, detalhes da sessão, edição de sessão e exercícios.
- **Evolução:** peso, progresso de carga, carga semanal, antropometria e histórico.
- **Ajustes:** metas, plano alimentar, edição de refeição, backup, restauração e instruções de instalação.
- **Modo treino:** musculação com carga, repetições, RIR e pausa; rounds com iniciar, pausar, retomar, pular e descansar; resumo final.
- **Registro manual:** séries, condicionamento, rounds, sparring e foco técnico de artes marciais.

## Verificações executadas

- Revisão visual em 390 px, 320 px e 1280 px.
- Sem rolagem horizontal, erros de página ou conteúdo inacessível por rolagem nos estados revisados.
- `npm run check`: lint, 11 testes unitários e build PWA concluídos com sucesso.
- `npm run test:e2e`: 4 fluxos concluídos com sucesso: persistência, modo treino, backup/restauração e uso offline.

## Publicação

O repositório é público e o GitHub Pages publica automaticamente cada atualização enviada para a branch `main`. Os dados do aplicativo continuam locais ao navegador; use o backup JSON antes de trocar de aparelho ou limpar os dados do navegador.
