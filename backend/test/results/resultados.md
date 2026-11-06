# Resultados da experimentação - Busca fonética (PCG Entrega 2)

Gerado em: 2026-11-06T23:37:19.416Z

| Modo | Recall | Precision | F1 | Acerto no topo | Grupo controle | Falso + LASA | Tempo médio (ms) | P95 (ms) |
|---|---|---|---|---|---|---|---|---|
| exata | 0.571 | 0.550 | 0.561 | 57.1% | 100.0% | 0 | 4.76 | 5.57 |
| fonetica | 0.794 | 0.794 | 0.794 | 79.4% | 100.0% | 0 | 3.20 | 4.15 |
| hibrida | 1.000 | 0.917 | 0.957 | 100.0% | 100.0% | 0 | 3.58 | 5.56 |

## Recall por categoria de erro

| Categoria | Recall exata | Recall fonetica | Recall hibrida |
|---|---|---|---|
| Controle | 1.000 | 1.000 | 1.000 |
| Vogal átona | 0.000 | 1.000 | 1.000 |
| Parcial | 1.000 | 0.000 | 1.000 |
| Omissão | 0.000 | 0.600 | 1.000 |
| Transposição | 0.000 | 0.750 | 1.000 |
| Teclado | 0.000 | 0.200 | 1.000 |
| Duplicação | 0.000 | 1.000 | 1.000 |
| Fonética | 0.000 | 1.000 | 1.000 |