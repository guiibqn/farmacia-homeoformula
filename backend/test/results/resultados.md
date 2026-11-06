# Resultados da experimentação - Busca fonética (PCG Entrega 2)

Gerado em: 2026-11-06T23:30:11.926Z

| Modo | Recall | Precision | F1 | Acerto no topo | Grupo controle | Falso + LASA | Tempo médio (ms) | P95 (ms) |
|---|---|---|---|---|---|---|---|---|
| exata | 0.571 | 0.550 | 0.561 | 57.1% | 100.0% | 0 | 4.89 | 6.40 |
| fonetica | 0.794 | 0.794 | 0.794 | 79.4% | 100.0% | 0 | 3.25 | 3.90 |
| hibrida | 1.000 | 0.917 | 0.957 | 98.4% | 100.0% | 1 | 3.68 | 5.30 |

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