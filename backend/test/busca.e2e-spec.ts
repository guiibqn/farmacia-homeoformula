import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { readFileSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { AppModule } from '../src/app.module';

interface Consulta {
  termo_digitado: string;
  categoria_erro: string;
  gabarito: number[];
}

interface ItemCatalogo {
  id: number;
  nome: string;
  principio_ativo: string;
}

interface ParLasa {
  par: [string, string];
  fonte: string;
}

interface ResultadoConsulta {
  termo: string;
  categoria: string;
  idsRetornados: number[];
  tempoMs: number;
  precision: number;
  recall: number;
  acertoNoTopo: boolean;
  isControle: boolean;
  falsoPositivoLasa: boolean;
}

interface MetricasAgregadas {
  modo: string;
  totalConsultas: number;
  precisionMedia: number;
  recallMedio: number;
  f1: number;
  pctAcertoNoTopo: number;
  pctGrupoControleOk: number;
  falsosPositivosLasa: number;
  tempoMedioMs: number;
  tempoP95Ms: number;
  porCategoria: Record<string, { recallMedio: number; pctAcertoNoTopo: number; total: number }>;
}

const MODOS = ['exata', 'fonetica', 'hibrida'] as const;
type Modo = (typeof MODOS)[number];

describe('Busca de medicamentos - avaliação de qualidade (PCG Entrega 2)', () => {
  let app: INestApplication;
  let consultas: Consulta[];
  let catalogo: ItemCatalogo[];
  let paresLasa: ParLasa[];
  const catalogoPorId = new Map<number, ItemCatalogo>();
  const resultadosPorModo: Record<Modo, MetricasAgregadas> = {} as Record<Modo, MetricasAgregadas>;
  const detalhesPorModo: Record<Modo, ResultadoConsulta[]> = {} as Record<Modo, ResultadoConsulta[]>;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleFixture.createNestApplication();
    await app.init();

    consultas = JSON.parse(readFileSync(join(__dirname, 'data', 'consultas.json'), 'utf-8'));
    catalogo = JSON.parse(readFileSync(join(__dirname, 'data', 'catalogo.json'), 'utf-8'));
    paresLasa = JSON.parse(readFileSync(join(__dirname, 'data', 'lasa-pairs.json'), 'utf-8'));
    catalogo.forEach((item) => catalogoPorId.set(item.id, item));
  }, 30000);

  afterAll(async () => {
    await app.close();
  });

  function acharParLasa(principioAtivo: string): ParLasa | undefined {
    return paresLasa.find((p) => p.par.includes(principioAtivo));
  }

  async function executarConsulta(termo: string, modo: Modo) {
    const inicio = process.hrtime.bigint();
    const resposta = await request(app.getHttpServer())
      .get('/medicamentos/busca')
      .query({ termo, modo });
    const fim = process.hrtime.bigint();
    const tempoMs = Number(fim - inicio) / 1_000_000;
    const ids: number[] = (resposta.body ?? []).map((item: { id: number }) => item.id);
    return { ids, tempoMs };
  }

  function percentil95(valores: number[]): number {
    const ordenado = [...valores].sort((a, b) => a - b);
    const indice = Math.min(ordenado.length - 1, Math.ceil(0.95 * ordenado.length) - 1);
    return ordenado[Math.max(0, indice)];
  }

  for (const modo of MODOS) {
    describe(`Modo de busca: ${modo}`, () => {
      it('executa o conjunto de consultas e calcula as métricas de qualidade', async () => {
        const detalhes: ResultadoConsulta[] = [];

        for (const consulta of consultas) {
          const { ids, tempoMs } = await executarConsulta(consulta.termo_digitado, modo);
          const gabaritoSet = new Set(consulta.gabarito);
          const intersecao = ids.filter((id) => gabaritoSet.has(id));
          const precision = ids.length > 0 ? intersecao.length / ids.length : 0;
          const recall = intersecao.length / consulta.gabarito.length;
          const acertoNoTopo = ids.length > 0 && gabaritoSet.has(ids[0]);
          const isControle = consulta.categoria_erro === 'Controle';

          // A Tabela 2 define o critério para qualquer consulta (não só o grupo de
          // controle): o primeiro resultado não pode ser um medicamento de nome
          // semelhante diferente do pretendido.
          let falsoPositivoLasa = false;
          if (ids.length > 0) {
            const ingredienteAlvo = catalogoPorId.get(consulta.gabarito[0])?.principio_ativo;
            const ingredienteRetornado = catalogoPorId.get(ids[0])?.principio_ativo;
            if (ingredienteAlvo && ingredienteRetornado && ingredienteAlvo !== ingredienteRetornado) {
              const par = acharParLasa(ingredienteAlvo);
              if (par && par.par.includes(ingredienteRetornado)) {
                falsoPositivoLasa = true;
              }
            }
          }

          detalhes.push({
            termo: consulta.termo_digitado,
            categoria: consulta.categoria_erro,
            idsRetornados: ids,
            tempoMs,
            precision,
            recall,
            acertoNoTopo,
            isControle,
            falsoPositivoLasa,
          });
        }

        const precisionMedia = media(detalhes.map((d) => d.precision));
        const recallMedio = media(detalhes.map((d) => d.recall));
        const f1 =
          precisionMedia + recallMedio === 0
            ? 0
            : (2 * precisionMedia * recallMedio) / (precisionMedia + recallMedio);
        const pctAcertoNoTopo = (detalhes.filter((d) => d.acertoNoTopo).length / detalhes.length) * 100;
        const controle = detalhes.filter((d) => d.isControle);
        const pctGrupoControleOk =
          (controle.filter((d) => d.acertoNoTopo).length / controle.length) * 100;
        const falsosPositivosLasa = detalhes.filter((d) => d.falsoPositivoLasa).length;
        const tempos = detalhes.map((d) => d.tempoMs);

        const categorias = [...new Set(detalhes.map((d) => d.categoria))];
        const porCategoria: MetricasAgregadas['porCategoria'] = {};
        for (const categoria of categorias) {
          const doGrupo = detalhes.filter((d) => d.categoria === categoria);
          porCategoria[categoria] = {
            recallMedio: media(doGrupo.map((d) => d.recall)),
            pctAcertoNoTopo: (doGrupo.filter((d) => d.acertoNoTopo).length / doGrupo.length) * 100,
            total: doGrupo.length,
          };
        }

        resultadosPorModo[modo] = {
          modo,
          totalConsultas: detalhes.length,
          precisionMedia,
          recallMedio,
          f1,
          pctAcertoNoTopo,
          pctGrupoControleOk,
          falsosPositivosLasa,
          tempoMedioMs: media(tempos),
          tempoP95Ms: percentil95(tempos),
          porCategoria,
        };
        detalhesPorModo[modo] = detalhes;

        expect(detalhes.length).toBe(consultas.length);
      }, 60000);
    });
  }

  describe('Critérios de aceitação da inovação (Tabela 2, abordagem híbrida)', () => {
    it('recall >= 0,90', () => {
      expect(resultadosPorModo.hibrida.recallMedio).toBeGreaterThanOrEqual(0.9);
    });

    it('precision >= 0,80', () => {
      expect(resultadosPorModo.hibrida.precisionMedia).toBeGreaterThanOrEqual(0.8);
    });

    it('acerto no topo >= 85%', () => {
      expect(resultadosPorModo.hibrida.pctAcertoNoTopo).toBeGreaterThanOrEqual(85);
    });

    it('zero falsos positivos LASA', () => {
      expect(resultadosPorModo.hibrida.falsosPositivosLasa).toBe(0);
    });

    it('grupo de controle 100% correto', () => {
      expect(resultadosPorModo.hibrida.pctGrupoControleOk).toBe(100);
    });

    it('tempo de resposta médio até 200ms', () => {
      expect(resultadosPorModo.hibrida.tempoMedioMs).toBeLessThanOrEqual(200);
    });
  });

  it('gera o relatório consolidado em test/results/', () => {
    const diretorio = join(__dirname, 'results');
    mkdirSync(diretorio, { recursive: true });

    const relatorio = {
      geradoEm: new Date().toISOString(),
      resumo: MODOS.map((m) => resultadosPorModo[m]),
      detalhes: detalhesPorModo,
    };
    writeFileSync(join(diretorio, 'resultados.json'), JSON.stringify(relatorio, null, 2));

    const linhas: string[] = [];
    linhas.push('# Resultados da experimentação - Busca fonética (PCG Entrega 2)');
    linhas.push('');
    linhas.push(`Gerado em: ${relatorio.geradoEm}`);
    linhas.push('');
    linhas.push('| Modo | Recall | Precision | F1 | Acerto no topo | Grupo controle | Falso + LASA | Tempo médio (ms) | P95 (ms) |');
    linhas.push('|---|---|---|---|---|---|---|---|---|');
    for (const m of MODOS) {
      const r = resultadosPorModo[m];
      linhas.push(
        `| ${m} | ${r.recallMedio.toFixed(3)} | ${r.precisionMedia.toFixed(3)} | ${r.f1.toFixed(3)} | ${r.pctAcertoNoTopo.toFixed(1)}% | ${r.pctGrupoControleOk.toFixed(1)}% | ${r.falsosPositivosLasa} | ${r.tempoMedioMs.toFixed(2)} | ${r.tempoP95Ms.toFixed(2)} |`,
      );
    }
    linhas.push('');
    linhas.push('## Recall por categoria de erro');
    linhas.push('');
    const categorias = Object.keys(resultadosPorModo.hibrida.porCategoria);
    linhas.push(`| Categoria | ${MODOS.map((m) => `Recall ${m}`).join(' | ')} |`);
    linhas.push(`|---|${MODOS.map(() => '---').join('|')}|`);
    for (const categoria of categorias) {
      const valores = MODOS.map((m) => resultadosPorModo[m].porCategoria[categoria]?.recallMedio.toFixed(3) ?? '-');
      linhas.push(`| ${categoria} | ${valores.join(' | ')} |`);
    }
    writeFileSync(join(diretorio, 'resultados.md'), linhas.join('\n'));

    // eslint-disable-next-line no-console
    console.log(linhas.join('\n'));

    expect(true).toBe(true);
  });
});

function media(valores: number[]): number {
  if (valores.length === 0) return 0;
  return valores.reduce((a, b) => a + b, 0) / valores.length;
}
