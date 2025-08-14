# Fusão de Perfis: Funk Mandela + Legacy

Data: 2025-08-13
Fontes:
- refs/out/funk_mandela.json (antes da fusão)
- refs/out/funk_mandela_legacy.json

Regras aplicadas:
- Média aritmética simples para cada métrica existente em ambos os perfis.
- Para métricas exclusivas do legacy (calor_target, brilho_target, clareza_target) foram carregadas diretamente (não havia no perfil atual).
- Soma de num_tracks (30 + 11 = 41).
- Bands: média de target_db e tol_db; quando valor era null em um lado, usado o outro lado.

Resultados principais (valor final):
- lufs_target: -9.5
- true_peak_target: -6.38
- dr_target: 7.15
- lra_target: 8.75
- stereo_target: 0.2 (null + 0.2 => 0.2)
- calor_target: -10.46
- brilho_target: -19.11
- clareza_target: 0.01

Bands (target_db / tol_db):
- sub: -15.5 / 2.39 (null+ -15.5)
- low_bass: 1.6 / 2.45 (15.3 + -12.1)/2
- upper_bass: -1.95 / 2.1 (10 + -13.9)/2
- low_mid: -0.6 / 2.85 (9.3 + -10.5)/2
- mid: -2.05 / 2.0 (4.8 + -8.9)/2
- high_mid: -8.1 / 3.05 (-3 + -13.2)/2
- brilho: -16.4 / 3.5 (-13.7 + -19.1)/2
- presenca: -24.55 / 3.5 (-23.6 + -25.5)/2

Observações:
- Campo version mantido em 1.0.
- Campo generated_at preservado do perfil mais recente.
- Removidas referências a funk_mandela_legacy em: genres.json, embedded-refs.js (perfil), audio-analyzer-integration.js (dataset principal). A opção visual do legacy permanece listada em audio-analyzer-integration.js apenas se necessária para compatibilidade (avaliar remoção completa em etapa futura).

Validação:
- Nenhum valor NaN ou null inesperado (apenas campos que podem ser null foram resolvidos).
- Estrutura JSON preservada para consumo.

Fim.
