// Teste de desempenho (k6) da busca de medicamentos - PCG Entrega 2.
//
// Não executado neste ambiente (binário k6 indisponível); os números de tempo
// de resposta reportados na Entrega 2 vêm da suíte de qualidade (Jest +
// Supertest), que mede cada requisição sequencialmente contra a aplicação em
// execução. Este script fica no projeto para a etapa de desempenho sob carga
// prevista em 2.4.2, a ser executada quando k6 estiver disponível no ambiente
// de CI/local:
//
//   k6 run test/perf/busca-perf.js
//
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const MODO = __ENV.MODO || 'hibrida';

const TERMOS = [
  'Ibuprofeno',
  'Iboprofeno',
  'Amoxilina',
  'Paraectamol',
  'Dipitona',
  'Omeprasol',
  'Setoconazol',
  'Assiclovir',
  'Nimessulida',
  'Escitalo',
];

export const options = {
  vus: 20,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<200'],
  },
};

export default function () {
  const termo = TERMOS[Math.floor(Math.random() * TERMOS.length)];
  const resposta = http.get(
    `${BASE_URL}/medicamentos/busca?termo=${encodeURIComponent(termo)}&modo=${MODO}`,
  );
  check(resposta, {
    'status 200': (r) => r.status === 200,
  });
  sleep(0.1);
}
