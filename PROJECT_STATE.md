# Estado do projeto Ritmo

Última atualização: 13/09/2026

## Objetivo

PWA pessoal mobile-first para acompanhar treino, alimentação e evolução corporal até a
reavaliação de 30/10/2026. Funciona offline após a primeira abertura, sem backend e sem
enviar dados do usuário para serviços externos.

## Decisões

- React + TypeScript + Vite.
- IndexedDB via `idb`.
- Service worker via `vite-plugin-pwa`.
- Quatro áreas: Hoje, Treinos, Evolução e Ajustes.
- Dados pessoais e registros permanecem no navegador; backup/restauração em JSON.
- Sem login, analytics, telemetria, fontes externas ou notificações push.
- Alarmes de treino continuam no Google Calendar e não fazem parte da PWA.
- O projeto usa caminhos relativos para poder ser retomado quando o Google Drive estiver
  montado com outra letra de unidade.
- Dependências e artefatos de build devem ficar em uma cópia local de trabalho: a unidade
  montada do Google Drive não lida de forma confiável com a grande quantidade de arquivos
  em `node_modules`.

## Progresso

- [x] Demanda e contexto inventariados.
- [x] Requisitos e conflitos identificados.
- [x] Scaffold React/TypeScript/Vite criado.
- [x] Dependências mínimas instaladas.
- [x] Modelo de domínio, dados iniciais e IndexedDB.
- [x] Interface e fluxos diários.
- [x] Edição de plano, backup e restauração.
- [x] Manifesto, ícones e service worker.
- [x] Testes, build e auditoria offline.
- [x] Versionamento e backup remoto no GitHub privado.
- [x] Modo de treino com séries individuais, pausas e rounds cronometrados.
- [x] Histórico de carga por exercício e resumo semanal de volume.
- [x] Registro de condicionamento e artes marciais durante o treino.

## Validação em 13/09/2026

- `npm run check`: lint, 11 testes unitários e build de produção concluídos.
- `npm run test:e2e`: 4 cenários concluídos no Edge: persistência local, backup/restauração,
  funcionamento offline e execução de rounds com pausa cronometrada.
- Corrigida uma competição entre a gravação de refeições e a edição do peso na tela Hoje.
- A suíte e2e agora usa a data inicial do plano de forma determinística.
- O modo de treino guarda cada série, oferece contagem de trabalho e descanso, sinal sonoro,
  vibração quando disponível e tentativa de manter a tela ativa.

## Próximo passo

Revisar a experiência em treinos reais e escolher a forma de distribuição para instalação:
GitHub Pages público, hospedagem com acesso restrito ou pacote Android.
