/**
 * Centralized Callback Data Parser
 * Устраняет дублирование паттерна: data.replace('prefix_', '')
 */

interface CallbackParseResult<T = string> {
  value: T;
  isValid: boolean;
  error?: string;
}

export class CallbackParser {
  /**
   * Парсит callback_data формата "prefix_value"
   * @param data - callback_query.data
   * @param prefix - ожидаемый префикс
   * @returns объект с значением и флагом валидности
   */
  static parse<T = string>(
    data: string,
    prefix: string,
    transform?: (value: string) => T
  ): CallbackParseResult<T> {
    if (!data || !data.startsWith(`${prefix}_`)) {
      return {
        value: null as any,
        isValid: false,
        error: `Expected prefix "${prefix}_", got "${data}"`
      };
    }

    const rawValue = data.replace(`${prefix}_`, '');

    try {
      const transformed = transform ? transform(rawValue) : (rawValue as T);
      return {
        value: transformed,
        isValid: true
      };
    } catch (error) {
      return {
        value: null as any,
        isValid: false,
        error: `Failed to transform value: ${error}`
      };
    }
  }

  /**
   * Парсит как число
   */
  static parseNumber(data: string, prefix: string): CallbackParseResult<number> {
    return this.parse(data, prefix, (value) => {
      const num = parseInt(value, 10);
      if (isNaN(num)) {
        throw new Error(`Not a number: ${value}`);
      }
      return num;
    });
  }

  /**
   * Парсит как boolean
   */
  static parseBoolean(data: string, prefix: string): CallbackParseResult<boolean> {
    return this.parse(data, prefix, (value) => {
      if (value === 'true') return true;
      if (value === 'false') return false;
      throw new Error(`Not a boolean: ${value}`);
    });
  }

  /**
   * Парсит как enum
   */
  static parseEnum<T extends string>(
    data: string,
    prefix: string,
    allowedValues: T[]
  ): CallbackParseResult<T> {
    return this.parse(data, prefix, (value) => {
      if (!allowedValues.includes(value as T)) {
        throw new Error(`Value "${value}" not in allowed values: ${allowedValues.join(', ')}`);
      }
      return value as T;
    });
  }

  /**
   * Создает callback_data
   */
  static create(prefix: string, value: string | number): string {
    return `${prefix}_${value}`;
  }
}
