export function onlyDigits(value: string) {
  return value.replace(/\D/g, '');
}

export function formatCpfCnpj(value?: string | null) {
  if (!value) {
    return '';
  }

  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  return digits
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

export function formatCurrencyDisplay(value?: number | string | null) {
  if (value === null || value === undefined || value === '') {
    return 'R$ 0,00';
  }

  const normalized = typeof value === 'number' ? value : parseCurrencyLikeValue(String(value));

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(normalized) ? normalized : 0);
}

export function formatCurrencyEditValue(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const parts = parseCurrencyParts(String(value));
  if (!parts) {
    return '';
  }

  return parts.hasDecimalSeparator ? `${parts.integerDigits},${parts.decimalDigits}` : parts.integerDigits;
}

export function sanitizeCurrencyEditInput(value?: string | null) {
  if (!value) {
    return '';
  }

  const parts = parseCurrencyParts(value);
  if (!parts) {
    return '';
  }

  if (parts.hasDecimalSeparator) {
    return `${parts.integerDigits},${parts.decimalDigits}`;
  }

  return parts.integerDigits;
}

export function getCurrencyFieldDisplay(value?: string | null) {
  const normalized = normalizeCurrencyForSubmit(value);
  if (!normalized) {
    return '';
  }

  return formatCurrencyDisplay(Number(normalized));
}

export function formatCurrencyInput(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  return getCurrencyFieldDisplay(formatCurrencyEditValue(value));
}

export function normalizeCurrencyForSubmit(value?: string | null) {
  if (!value) {
    return '';
  }

  const parts = parseCurrencyParts(value);
  if (!parts) {
    return '';
  }

  const integerPart = String(Number(parts.integerDigits || '0'));
  const decimalPart = parts.hasDecimalSeparator ? parts.decimalDigits.padEnd(2, '0') : '00';
  return `${integerPart}.${decimalPart}`;
}

export function formatDecimalInput(value?: string | number | null) {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  const cleaned = String(value).replace(/[^\d,.-]/g, '').replace('.', ',');
  return cleaned;
}

function parseCurrencyLikeValue(value: string) {
  const normalized = normalizeCurrencyForSubmit(value);
  if (!normalized) {
    return 0;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseCurrencyParts(value: string) {
  const cleaned = value.trim().replace(/[^\d,.-]/g, '');
  if (!cleaned) {
    return null;
  }

  const commaMatches = [...cleaned.matchAll(/,/g)];
  const dotMatches = [...cleaned.matchAll(/\./g)];
  const lastCommaIndex = commaMatches.length ? commaMatches[commaMatches.length - 1].index ?? -1 : -1;
  const lastDotIndex = dotMatches.length ? dotMatches[dotMatches.length - 1].index ?? -1 : -1;
  const separatorIndex = Math.max(lastCommaIndex, lastDotIndex);
  const hasAnySeparator = separatorIndex >= 0;
  const trailingDigits = hasAnySeparator ? onlyDigits(cleaned.slice(separatorIndex + 1)) : '';
  const endsWithSeparator = /[,.]$/.test(cleaned);
  const hasDecimalSeparator = hasAnySeparator && (trailingDigits.length <= 2 || endsWithSeparator);
  const integerSource = hasDecimalSeparator ? cleaned.slice(0, separatorIndex) : cleaned;
  const decimalSource = hasDecimalSeparator ? cleaned.slice(separatorIndex + 1) : '';
  const integerDigits = onlyDigits(integerSource) || '0';
  const decimalDigits = onlyDigits(decimalSource).slice(0, 2);

  return {
    hasDecimalSeparator,
    integerDigits,
    decimalDigits,
  };
}
