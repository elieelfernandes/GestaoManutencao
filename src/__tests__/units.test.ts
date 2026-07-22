import assert from 'assert';
import { normalizeText, mapUiStatusToDb, mapDbStatusToUi } from '../utils/helpers';

console.log('=== MARILUX CMMS - EXECUTANDO TESTES UNITÁRIOS ===\n');

try {
  // Test 1: normalizeText
  console.log('Testando: normalizeText...');
  assert.strictEqual(normalizeText('Cícero'), 'cicero');
  assert.strictEqual(normalizeText('Cicero'), 'cicero');
  assert.strictEqual(normalizeText('  Administrativo  '), 'administrativo');
  assert.strictEqual(normalizeText('Admnistrativo'), 'admnistrativo');
  assert.strictEqual(normalizeText('Mecânica / Elétrica'), 'mecanica / eletrica');
  assert.strictEqual(normalizeText(''), '');
  assert.strictEqual(normalizeText(null as any), '');
  assert.strictEqual(normalizeText(undefined as any), '');
  console.log('✓ normalizeText passou!');

  // Test 2: mapUiStatusToDb
  console.log('\nTestando: mapUiStatusToDb...');
  assert.strictEqual(mapUiStatusToDb('Concluído'), 'CONCLUIDO');
  assert.strictEqual(mapUiStatusToDb('CONCLUIDO'), 'CONCLUIDO');
  assert.strictEqual(mapUiStatusToDb('Em andamento'), 'EM_ANDAMENTO');
  assert.strictEqual(mapUiStatusToDb('EM_ANDAMENTO'), 'EM_ANDAMENTO');
  assert.strictEqual(mapUiStatusToDb('Não iniciado'), 'NAO_INICIADO');
  assert.strictEqual(mapUiStatusToDb(''), 'NAO_INICIADO');
  assert.strictEqual(mapUiStatusToDb(null as any), 'NAO_INICIADO');
  console.log('✓ mapUiStatusToDb passou!');

  // Test 3: mapDbStatusToUi
  console.log('\nTestando: mapDbStatusToUi...');
  assert.strictEqual(mapDbStatusToUi('CONCLUIDO'), 'Concluído');
  assert.strictEqual(mapDbStatusToUi('Concluído'), 'Concluído');
  assert.strictEqual(mapDbStatusToUi('EM_ANDAMENTO'), 'Em andamento');
  assert.strictEqual(mapDbStatusToUi('Em andamento'), 'Em andamento');
  assert.strictEqual(mapDbStatusToUi('NAO_INICIADO'), 'Não iniciado');
  assert.strictEqual(mapDbStatusToUi('ATRASADO'), 'Atrasado');
  assert.strictEqual(mapDbStatusToUi(''), 'Não iniciado');
  assert.strictEqual(mapDbStatusToUi(null as any), 'Não iniciado');
  console.log('✓ mapDbStatusToUi passou!');

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 🎉');
  process.exit(0);
} catch (err) {
  console.error('\n❌ UM OU MAIS TESTES FALHARAM! ❌');
  console.error(err);
  process.exit(1);
}
