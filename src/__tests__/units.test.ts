import assert from 'assert';
import { 
  normalizeText, 
  mapUiStatusToDb, 
  mapDbStatusToUi,
  extractPatrimonioNumber,
  generatePatrimonioCode,
  formatCurrencyBRL,
  parseCurrencyBRL
} from '../utils/helpers';

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

  // Test 4: Patrimonio generation and extraction
  console.log('\nTestando: extractPatrimonioNumber e generatePatrimonioCode...');
  assert.strictEqual(extractPatrimonioNumber('MAR-001'), 1);
  assert.strictEqual(extractPatrimonioNumber('MAR-012'), 12);
  assert.strictEqual(extractPatrimonioNumber('MAR-999'), 999);
  assert.strictEqual(extractPatrimonioNumber('MAR-invalid'), null);
  assert.strictEqual(extractPatrimonioNumber(null), null);
  
  assert.strictEqual(generatePatrimonioCode(1), 'MAR-001');
  assert.strictEqual(generatePatrimonioCode(12), 'MAR-012');
  assert.strictEqual(generatePatrimonioCode(105), 'MAR-105');

  // Test simulation of max regex sequence logic
  const existingCodes = ['MAR-001', 'MAR-003', 'MAR-002'];
  const numbers = existingCodes.map(code => extractPatrimonioNumber(code)).filter((n): n is number => n !== null);
  const maxNum = Math.max(...numbers);
  const nextCode = generatePatrimonioCode(maxNum + 1);
  assert.strictEqual(nextCode, 'MAR-004');
  console.log('✓ extractPatrimonioNumber e generatePatrimonioCode passados!');

  // Test 5: BRL Currency formatting and parsing
  console.log('\nTestando: formatCurrencyBRL e parseCurrencyBRL...');
  assert.strictEqual(formatCurrencyBRL(''), '');
  assert.strictEqual(formatCurrencyBRL(null), '');
  assert.strictEqual(formatCurrencyBRL(150), 'R$ 1,50'); // non-breaking space
  assert.strictEqual(formatCurrencyBRL('15000'), 'R$ 150,00');
  assert.strictEqual(formatCurrencyBRL('12345678'), 'R$ 123.456,78');

  assert.strictEqual(parseCurrencyBRL(''), null);
  assert.strictEqual(parseCurrencyBRL(null), null);
  assert.strictEqual(parseCurrencyBRL('R$ 150,00'), 150.00);
  assert.strictEqual(parseCurrencyBRL('R$ 1.234,56'), 1234.56);
  assert.strictEqual(parseCurrencyBRL('123.456,78'), 123456.78);
  console.log('✓ formatCurrencyBRL e parseCurrencyBRL passados!');

  console.log('\n🎉 TODOS OS TESTES PASSARAM COM SUCESSO! 🎉');
  process.exit(0);
} catch (err) {
  console.error('\n❌ UM OU MAIS TESTES FALHARAM! ❌');
  console.error(err);
  process.exit(1);
}
