import dictionary from '../locales/vi.json' with { type: 'json' };
import { translateCopy } from './localization.ts';
export function interfaceCopy(value: string, vietnamese: boolean): string {
  if (!vietnamese) return value;
  const translated = translateCopy(value, dictionary);
  if (translated !== value) return translated;
  const capacity = /^This content will not fit at level ([LMQH])\./.exec(value);
  if (capacity?.[1])
    return `Nội dung không vừa mức ${capacity[1]}. Giảm nội dung hoặc chọn mức sửa lỗi thấp hơn.`;
  const version =
    /^This content needs version (\d+) or larger at level ([LMQH])\./.exec(
      value,
    );
  if (version?.[1] && version[2])
    return `Nội dung cần phiên bản ${version[1]} trở lên ở mức ${version[2]}. Chọn Tự động hoặc phiên bản lớn hơn.`;
  return value;
}
