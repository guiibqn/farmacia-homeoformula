// Teste de desempenho (k6) da busca de medicamentos - PCG Entrega 2.
//
// Executado via Docker (binário k6 não instalado no host):
//
//   docker run --rm --network host -e BASE_URL=http://localhost:3000 \
//     -v "$(pwd)/test/perf/busca-perf.js:/script.js:ro" grafana/k6 run /script.js
//
// Resultado (20 VUs, 30s, modo híbrido, 2026-11-06): p(95)=6.5ms, 5691
// requisições, 0% de falha. Ver test/results/k6-resultados.txt para a saída
// completa.
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
