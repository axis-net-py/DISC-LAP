export class PhoneValidationError extends Error {
  constructor(code, message) {
    super(message);
    this.name = 'PhoneValidationError';
    this.code = code;
  }
}

const fail = (code, message) => {
  throw new PhoneValidationError(code, message);
};

function cleanInput(input) {
  if (typeof input !== 'string' || !input.trim()) {
    fail('PHONE_REQUIRED', 'Informe um número de WhatsApp.');
  }
  if (/[A-Za-zÀ-ÿ]/u.test(input)) {
    fail('PHONE_INVALID_CHARACTERS', 'O telefone contém caracteres inválidos.');
  }
  const digits = input.replace(/\D/g, '');
  if (!digits) fail('PHONE_REQUIRED', 'Informe um número de WhatsApp.');
  return digits;
}

function normalizeBrazil(digits) {
  if (digits.startsWith('595')) {
    fail('PHONE_COUNTRY_MISMATCH', 'O número informado pertence ao Paraguai.');
  }

  const national = digits.startsWith('55') && [12, 13].includes(digits.length)
    ? digits.slice(2)
    : digits;

  if (![10, 11].includes(national.length)) {
    fail('PHONE_INVALID_LENGTH', 'Informe DDD e telefone brasileiro com 10 ou 11 dígitos.');
  }

  const areaCode = Number(national.slice(0, 2));
  if (areaCode < 11 || areaCode > 99 || national[2] === '0' || national[2] === '1') {
    fail('PHONE_INVALID_FORMAT', 'Informe um DDD e telefone brasileiro válidos.');
  }
  return national;
}

function normalizeParaguay(digits) {
  if (digits.startsWith('55') && digits.length >= 12) {
    fail('PHONE_COUNTRY_MISMATCH', 'O número informado pertence ao Brasil.');
  }

  let national = digits.startsWith('595') && digits.length === 12
    ? digits.slice(3)
    : digits;
  if (national.length === 10 && national.startsWith('0')) national = national.slice(1);

  if (national.length !== 9 || !national.startsWith('9')) {
    fail('PHONE_INVALID_FORMAT', 'Informe um celular paraguaio com 9 dígitos, iniciado por 9.');
  }
  return national;
}

export function normalizePhone(input, country) {
  if (!['BR', 'PY'].includes(country)) {
    fail('COUNTRY_INVALID', 'Selecione Brasil ou Paraguai.');
  }
  const inputDigits = cleanInput(input);
  const national = country === 'BR'
    ? normalizeBrazil(inputDigits)
    : normalizeParaguay(inputDigits);
  const countryCode = country === 'BR' ? '55' : '595';
  const digits = `${countryCode}${national}`;
  return { e164: `+${digits}`, digits, national, country };
}
