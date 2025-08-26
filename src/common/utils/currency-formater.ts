export const formatCurrency = (value: string, currency?: Currencies) => {
  const symbol = getSymbol(currency);
  if (symbol === '') return `${value}`;
  return rightAlignSpaced(currency)
    ? `${value ?? 0} ${symbol}`
    : `${symbol}${value ?? 0}`;
};

export const enum Currencies {
  Albania = 'ALL',
  Algeria = 'DZD',
  Argentina = 'ARS',
  Armenia = 'AMD',
  Australia = 'AUD',
  EU = 'EUR',
  Azerbaijan = 'AZN',
  Belarus = 'BYN',
  Brazil = 'BRL',
  Bangladesh = 'BDT',
  Canada = 'CAD',
  Chile = 'CLP',
  China = 'CNY',
  Croatia = 'HRK',
  CostaRica = 'CRC',
  Cuba = 'CUP',
  CzechRepublic = 'CZK',
  Denmark = 'DKK',
  Georgia = 'GEL',
  HongKong = 'HKD',
  Hungary = 'HUF',
  Iceland = 'ISK',
  India = 'INR',
  Indonesia = 'IDR',
  Iran = 'IRT',
  Israel = 'ILS',
  Japan = 'JPY',
  Kazakhstan = 'KZT',
  SouthKorea = 'KRW',
  Kyrgyzstan = 'KGS',
  Malaysia = 'MYR',
  Mexico = 'MXN',
  Morocco = 'MAD',
  NewZealand = 'NZD',
  Nigeria = 'NGN',
  Norway = 'NOK',
  Nepal = 'NPR',
  Vietnam = 'VND',
  Pakistan = 'PKR',
  Philippines = 'PHP',
  Poland = 'PLN',
  Qatar = 'QAR',
  Romania = 'RON',
  Russia = 'RUB',
  SaudiArabia = 'SAR',
  Serbia = 'RSD',
  Singapore = 'SGD',
  SouthAfrica = 'ZAR',
  Sweden = 'SEK',
  Switzerland = 'CHF',
  Taiwan = 'TWD',
  Thailand = 'THB',
  Turkey = 'TRY',
  Ukraine = 'UAH',
  UnitedArabEmirates = 'AED',
  UnitedKingdom = 'GBP',
  UnitedStates = 'USD',
}

export const CurrencySymbol = {
  [Currencies.Albania]: 'L',
  [Currencies.Algeria]: 'د.ج',
  [Currencies.Argentina]: '$',
  [Currencies.Armenia]: '֏',
  [Currencies.Australia]: '$',
  [Currencies.EU]: '€',
  [Currencies.Azerbaijan]: '₼',
  [Currencies.Belarus]: 'Br',
  [Currencies.Brazil]: 'R$',
  [Currencies.Bangladesh]: '৳',
  [Currencies.Canada]: '$',
  [Currencies.Chile]: '$',
  [Currencies.China]: '¥',
  [Currencies.Croatia]: 'kn',
  [Currencies.CostaRica]: '₡',
  [Currencies.Cuba]: '$',
  [Currencies.CzechRepublic]: 'Kč',
  [Currencies.Denmark]: 'kr',
  [Currencies.Georgia]: '₾',
  [Currencies.HongKong]: '$',
  [Currencies.Hungary]: 'Ft',
  [Currencies.Iceland]: 'kr',
  [Currencies.India]: '₹',
  [Currencies.Indonesia]: 'Rp',
  [Currencies.Iran]: 'تومان',
  [Currencies.Israel]: '₪',
  [Currencies.Japan]: '¥',
  [Currencies.Kazakhstan]: '₸',
  [Currencies.SouthKorea]: '₩',
  [Currencies.Kyrgyzstan]: 'с',
  [Currencies.Malaysia]: 'RM',
  [Currencies.Mexico]: '$',
  [Currencies.Morocco]: 'د.م.',
  [Currencies.NewZealand]: '$',
  [Currencies.Nigeria]: '₦',
  [Currencies.Norway]: 'kr',
  [Currencies.Nepal]: 'रू',
  [Currencies.Vietnam]: '₫',
  [Currencies.Pakistan]: '₨',
  [Currencies.Philippines]: '₱',
  [Currencies.Poland]: 'zł',
  [Currencies.Qatar]: 'ر.ق',
  [Currencies.Romania]: 'lei',
  [Currencies.Russia]: '₽',
  [Currencies.SaudiArabia]: '﷼‎',
  [Currencies.Serbia]: 'дин',
  [Currencies.Singapore]: '$',
  [Currencies.SouthAfrica]: 'R',
  [Currencies.Sweden]: 'kr',
  [Currencies.Switzerland]: 'Fr.',
  [Currencies.Taiwan]: '$',
  [Currencies.Thailand]: '฿',
  [Currencies.Turkey]: '₺',
  [Currencies.Ukraine]: '₴',
  [Currencies.UnitedArabEmirates]: 'د.إ',
  [Currencies.UnitedKingdom]: '£',
  [Currencies.UnitedStates]: '$',
};

export const rightAlignSpaced = (currency?: Currencies) => {
  switch (currency) {
    case Currencies.Argentina:
    case Currencies.Australia:
    case Currencies.Canada:
    case Currencies.Chile:
    case Currencies.Cuba:
    case Currencies.HongKong:
    case Currencies.Mexico:
    case Currencies.NewZealand:
    case Currencies.Singapore:
    case Currencies.Taiwan:
    case Currencies.UnitedStates:
      return false;
    default:
      return true;
  }
};

export const getSymbol = (currency?: Currencies) => {
  if (currency === undefined) return '';
  else return CurrencySymbol[currency.trim() as Currencies] ?? '';
};
