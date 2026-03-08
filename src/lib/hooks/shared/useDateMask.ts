import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { type DateFormat, useDate } from '@hooks/shared';

// Helper to keep stable references to useDate functions
const useDateFunctionsRef = (): React.MutableRefObject<ReturnType<typeof useDate>> => {
  const dateUtils = useDate();
  const ref = useRef(dateUtils);
  ref.current = dateUtils;
  return ref;
};

export const DATE_INPUT_FORMATS = {
  US_SLASH: 'MM/dd/yyyy',
  US_DASH: 'MM-dd-yyyy',
  EU_SLASH: 'dd/MM/yyyy',
  EU_DASH: 'dd-MM-yyyy',
} as const;

export type DateInputFormat = (typeof DATE_INPUT_FORMATS)[keyof typeof DATE_INPUT_FORMATS];

type UseDateMaskOptions = {
  dateFormat?: DateInputFormat;
  onChange?: (date: Date | undefined) => void;
};

type UseDateRangeMaskOptions = {
  dateFormat?: DateInputFormat;
  onChange?: (range: { from?: Date; to?: Date } | undefined) => void;
};

type UseDateMaskReturn = {
  inputValue: string;
  setInputValue: (value: string) => void;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  setFromDate: (date: Date | undefined) => void;
  parsedDate: Date | undefined;
  isValidInput: boolean;
  placeholder: string;
};

type DatePart = 'first' | 'second' | 'year';

const getSeparator = (dateFormat: DateInputFormat): string => {
  return dateFormat.includes('/') ? '/' : '-';
};

const getFormatOrder = (dateFormat: DateInputFormat): 'MDY' | 'DMY' => {
  return dateFormat.startsWith('MM') ? 'MDY' : 'DMY';
};

const applyMask = (value: string, dateFormat: DateInputFormat): string => {
  const separator = getSeparator(dateFormat);
  const digitsOnly = value.replace(/\D/g, '');

  let result = '';

  for (let i = 0; i < digitsOnly.length && i < 8; i++) {
    if (i === 2 || i === 4) {
      result += separator;
    }
    result += digitsOnly[i];
  }

  return result;
};

const getPlaceholder = (dateFormat: DateInputFormat): string => {
  const separator = getSeparator(dateFormat);
  const order = getFormatOrder(dateFormat);

  if (order === 'MDY') {
    return `MM${separator}DD${separator}YYYY`;
  }
  return `DD${separator}MM${separator}YYYY`;
};

const getDatePartFromCursor = (cursorPos: number): DatePart => {
  if (cursorPos <= 2) return 'first';
  if (cursorPos <= 5) return 'second';
  return 'year';
};

const getDatePartSelectionRange = (part: DatePart): [number, number] => {
  switch (part) {
    case 'first':
      return [0, 2];
    case 'second':
      return [3, 5];
    case 'year':
      return [6, 10];
  }
};

export const useDateMask = (options: UseDateMaskOptions = {}): UseDateMaskReturn => {
  const { dateFormat = DATE_INPUT_FORMATS.US_SLASH, onChange } = options;

  const dateUtilsRef = useDateFunctionsRef();

  const [inputValue, setInputValueInternal] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingSelectionRef = useRef<[number, number] | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const separator = useMemo(() => getSeparator(dateFormat), [dateFormat]);
  const placeholder = useMemo(() => getPlaceholder(dateFormat), [dateFormat]);
  const formatOrder = useMemo(() => getFormatOrder(dateFormat), [dateFormat]);

  const parseDateString = useCallback(
    (value: string): Date | undefined => {
      if (!value) return undefined;
      return dateUtilsRef.current.parseDate(value, dateFormat as DateFormat);
    },
    [dateFormat, dateUtilsRef],
  );

  const parsedDate = useMemo(() => {
    return parseDateString(inputValue);
  }, [inputValue, parseDateString]);

  const isValidInput = useMemo(() => {
    if (!inputValue) return true;
    return parsedDate !== undefined;
  }, [inputValue, parsedDate]);

  useEffect(() => {
    if (pendingSelectionRef.current && inputRef.current) {
      const [start, end] = pendingSelectionRef.current;
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start, end);
        }
        pendingSelectionRef.current = null;
      });
    }
  }, [inputValue]);

  const setInputValue = useCallback((value: string) => {
    setInputValueInternal(value);
  }, []);

  const setFromDate = useCallback(
    (date: Date | undefined) => {
      const formatted = dateUtilsRef.current.formatNullableDate(date, dateFormat as DateFormat, '');
      setInputValueInternal(formatted);
    },
    [dateFormat, dateUtilsRef],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const maskedValue = applyMask(rawValue, dateFormat);

      inputRef.current = e.target;
      setInputValueInternal(maskedValue);

      const parsed = dateUtilsRef.current.parseDate(maskedValue, dateFormat as DateFormat);
      onChangeRef.current?.(parsed);
    },
    [dateFormat, dateUtilsRef],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      inputRef.current = target;
      const cursorPos = target.selectionStart || 0;

      if (e.key === 'Enter') {
        e.preventDefault();
        target.blur();
        return;
      }

      if (e.key === 'Backspace') {
        if (cursorPos > 0 && inputValue[cursorPos - 1] === separator) {
          e.preventDefault();
          const newValue = inputValue.slice(0, cursorPos - 2) + inputValue.slice(cursorPos);
          const maskedValue = applyMask(newValue, dateFormat);

          pendingSelectionRef.current = [cursorPos - 2, cursorPos - 2];
          setInputValueInternal(maskedValue);

          const parsed = dateUtilsRef.current.parseDate(maskedValue, dateFormat as DateFormat);
          onChangeRef.current?.(parsed);
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        // Only allow arrow key adjustment if we have a complete valid date
        if (!parsedDate) {
          return;
        }

        const part = getDatePartFromCursor(cursorPos);
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';

        const { addDuration, subtractDuration, constants } = dateUtilsRef.current;
        const durationFn = direction === 'up' ? addDuration : subtractDuration;

        let newDate: Date;

        if (part === 'year') {
          newDate = new Date(durationFn(parsedDate, 1, constants.UnitOfTime.YEAR));
        } else if (formatOrder === 'MDY') {
          if (part === 'first') {
            newDate = new Date(durationFn(parsedDate, 1, constants.UnitOfTime.MONTH));
          } else {
            newDate = new Date(durationFn(parsedDate, 1, constants.UnitOfTime.DAY));
          }
        } else {
          if (part === 'first') {
            newDate = new Date(durationFn(parsedDate, 1, constants.UnitOfTime.DAY));
          } else {
            newDate = new Date(durationFn(parsedDate, 1, constants.UnitOfTime.MONTH));
          }
        }

        if (newDate.getFullYear() >= 1900 && newDate.getFullYear() <= 2100) {
          const newValue = dateUtilsRef.current.formatNullableDate(newDate, dateFormat as DateFormat, '');
          const [selStart, selEnd] = getDatePartSelectionRange(part);

          pendingSelectionRef.current = [selStart, selEnd];
          setInputValueInternal(newValue);
          onChangeRef.current?.(newDate);
        }
      }
    },
    [inputValue, separator, dateFormat, parsedDate, formatOrder, dateUtilsRef],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');
      const maskedValue = applyMask(pastedText, dateFormat);

      setInputValueInternal(maskedValue);

      const parsed = dateUtilsRef.current.parseDate(maskedValue, dateFormat as DateFormat);
      onChangeRef.current?.(parsed);
    },
    [dateFormat, dateUtilsRef],
  );

  const handleBlur = useCallback(() => {
    if (inputValue && !parsedDate) {
      setInputValueInternal('');
      onChangeRef.current?.(undefined);
    }
  }, [inputValue, parsedDate]);

  return {
    inputValue,
    setInputValue,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleBlur,
    setFromDate,
    parsedDate,
    isValidInput,
    placeholder,
  };
};

export const useDateRangeMask = (options: UseDateRangeMaskOptions = {}) => {
  const { dateFormat = DATE_INPUT_FORMATS.US_SLASH, onChange } = options;

  const dateUtilsRef = useDateFunctionsRef();

  const [inputValue, setInputValueInternal] = useState<string>('');
  const inputRef = useRef<HTMLInputElement | null>(null);
  const pendingSelectionRef = useRef<[number, number] | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const separator = useMemo(() => getSeparator(dateFormat), [dateFormat]);
  const placeholder = useMemo(() => {
    const singlePlaceholder = getPlaceholder(dateFormat);
    return `${singlePlaceholder} - ${singlePlaceholder}`;
  }, [dateFormat]);
  const formatOrder = useMemo(() => getFormatOrder(dateFormat), [dateFormat]);

  const RANGE_SEPARATOR = ' - ';
  const SINGLE_DATE_LENGTH = 10;

  const parsedRange = useMemo(() => {
    if (!inputValue) return { from: undefined, to: undefined };

    const parts = inputValue.split(RANGE_SEPARATOR);
    const fromStr = parts[0]?.trim() || '';
    const toStr = parts[1]?.trim() || '';

    return {
      from: dateUtilsRef.current.parseDate(fromStr, dateFormat as DateFormat),
      to: dateUtilsRef.current.parseDate(toStr, dateFormat as DateFormat),
    };
  }, [inputValue, dateFormat, dateUtilsRef]);

  const isValidInput = useMemo(() => {
    if (!inputValue) return true;

    const parts = inputValue.split(RANGE_SEPARATOR);
    const fromStr = parts[0]?.trim() || '';
    const toStr = parts[1]?.trim() || '';

    const fromValid = !fromStr || fromStr.length < SINGLE_DATE_LENGTH || parsedRange.from !== undefined;
    const toValid = !toStr || toStr.length < SINGLE_DATE_LENGTH || parsedRange.to !== undefined;

    return fromValid && toValid;
  }, [inputValue, parsedRange]);

  useEffect(() => {
    if (pendingSelectionRef.current && inputRef.current) {
      const [start, end] = pendingSelectionRef.current;
      requestAnimationFrame(() => {
        if (inputRef.current) {
          inputRef.current.setSelectionRange(start, end);
        }
        pendingSelectionRef.current = null;
      });
    }
  }, [inputValue]);

  const setFromDateRange = useCallback(
    (range: { from?: Date; to?: Date } | undefined) => {
      if (!range) {
        setInputValueInternal('');
        return;
      }

      const fromStr = dateUtilsRef.current.formatNullableDate(range.from, dateFormat as DateFormat, '');
      const toStr = dateUtilsRef.current.formatNullableDate(range.to, dateFormat as DateFormat, '');

      if (fromStr && toStr) {
        setInputValueInternal(`${fromStr}${RANGE_SEPARATOR}${toStr}`);
      } else if (fromStr) {
        setInputValueInternal(fromStr);
      } else if (toStr) {
        setInputValueInternal(`${RANGE_SEPARATOR}${toStr}`);
      } else {
        setInputValueInternal('');
      }
    },
    [dateFormat, dateUtilsRef],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      inputRef.current = e.target;

      const rangeSepIndex = rawValue.indexOf(' - ');
      const altRangeSepIndex = rawValue.search(/\s+-\s+/);
      const sepIndex = rangeSepIndex !== -1 ? rangeSepIndex : altRangeSepIndex;

      let fromPart: string;
      let toPart: string;
      let hasSeparator: boolean;

      if (sepIndex !== -1) {
        fromPart = rawValue.slice(0, sepIndex);

        toPart = rawValue.slice(sepIndex).replace(/^\s*-\s*/, '');
        hasSeparator = true;
      } else {
        fromPart = rawValue;
        toPart = '';
        hasSeparator = false;
      }

      const maskedFrom = applyMask(fromPart, dateFormat);
      const maskedTo = applyMask(toPart, dateFormat);

      let result = maskedFrom;

      if (hasSeparator) {
        result = `${maskedFrom}${RANGE_SEPARATOR}${maskedTo}`;
      } else if (maskedFrom.length === SINGLE_DATE_LENGTH) {
        const digitsAfterComplete = fromPart.slice(SINGLE_DATE_LENGTH).replace(/\D/g, '');
        if (digitsAfterComplete.length > 0) {
          const maskedExtra = applyMask(digitsAfterComplete, dateFormat);
          result = `${maskedFrom}${RANGE_SEPARATOR}${maskedExtra}`;
        }
      }

      setInputValueInternal(result);

      const fromDate = dateUtilsRef.current.parseDate(maskedFrom, dateFormat as DateFormat);
      const toDate = dateUtilsRef.current.parseDate(maskedTo, dateFormat as DateFormat);

      onChangeRef.current?.({ from: fromDate, to: toDate });
    },
    [dateFormat, dateUtilsRef],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const target = e.target as HTMLInputElement;
      inputRef.current = target;
      const cursorPos = target.selectionStart || 0;

      if (e.key === 'Enter') {
        e.preventDefault();
        target.blur();
        return;
      }

      if (e.key === 'Backspace') {
        if (cursorPos > 0 && inputValue[cursorPos - 1] === separator) {
          e.preventDefault();
          const newValue = inputValue.slice(0, cursorPos - 2) + inputValue.slice(cursorPos);
          pendingSelectionRef.current = [cursorPos - 2, cursorPos - 2];
          setInputValueInternal(newValue);
        }

        const separatorIndex = inputValue.indexOf(RANGE_SEPARATOR);
        if (separatorIndex !== -1 && cursorPos > separatorIndex && cursorPos <= separatorIndex + RANGE_SEPARATOR.length) {
          e.preventDefault();
          const newValue = inputValue.slice(0, separatorIndex);
          pendingSelectionRef.current = [separatorIndex, separatorIndex];
          setInputValueInternal(newValue);
        }
        return;
      }

      if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();

        const rangeSeparatorIndex = inputValue.indexOf(RANGE_SEPARATOR);
        const toDateStartIndex = rangeSeparatorIndex !== -1 ? rangeSeparatorIndex + RANGE_SEPARATOR.length : -1;
        const isInToDate = toDateStartIndex !== -1 && cursorPos >= toDateStartIndex;

        const localCursorPos = isInToDate ? cursorPos - toDateStartIndex : cursorPos;
        const part = getDatePartFromCursor(localCursorPos);
        const direction = e.key === 'ArrowUp' ? 'up' : 'down';

        const { addDuration, subtractDuration, constants } = dateUtilsRef.current;
        const durationFn = direction === 'up' ? addDuration : subtractDuration;

        const calculateNewDate = (currentDate: Date): Date => {
          if (part === 'year') {
            return new Date(durationFn(currentDate, 1, constants.UnitOfTime.YEAR));
          }

          if (formatOrder === 'MDY') {
            if (part === 'first') {
              return new Date(durationFn(currentDate, 1, constants.UnitOfTime.MONTH));
            }
            return new Date(durationFn(currentDate, 1, constants.UnitOfTime.DAY));
          }

          if (part === 'first') {
            return new Date(durationFn(currentDate, 1, constants.UnitOfTime.DAY));
          }
          return new Date(durationFn(currentDate, 1, constants.UnitOfTime.MONTH));
        };

        if (isInToDate) {
          // Only allow adjustment if we have a valid to date
          if (!parsedRange.to) {
            return;
          }

          const newDate = calculateNewDate(parsedRange.to);

          if (newDate.getFullYear() >= 1900 && newDate.getFullYear() <= 2100) {
            const fromStr = inputValue.slice(0, rangeSeparatorIndex);
            const newToStr = dateUtilsRef.current.formatNullableDate(newDate, dateFormat as DateFormat, '');
            const newValue = `${fromStr}${RANGE_SEPARATOR}${newToStr}`;

            const [selStart, selEnd] = getDatePartSelectionRange(part);
            pendingSelectionRef.current = [toDateStartIndex + selStart, toDateStartIndex + selEnd];
            setInputValueInternal(newValue);
            onChangeRef.current?.({ from: parsedRange.from, to: newDate });
          }
        } else {
          // Only allow adjustment if we have a valid from date
          if (!parsedRange.from) {
            return;
          }

          const newDate = calculateNewDate(parsedRange.from);

          if (newDate.getFullYear() >= 1900 && newDate.getFullYear() <= 2100) {
            const newFromStr = dateUtilsRef.current.formatNullableDate(newDate, dateFormat as DateFormat, '');
            let newValue = newFromStr;

            if (rangeSeparatorIndex !== -1) {
              const toStr = inputValue.slice(toDateStartIndex);
              newValue = `${newFromStr}${RANGE_SEPARATOR}${toStr}`;
            }

            const [selStart, selEnd] = getDatePartSelectionRange(part);
            pendingSelectionRef.current = [selStart, selEnd];
            setInputValueInternal(newValue);
            onChangeRef.current?.({ from: newDate, to: parsedRange.to });
          }
        }
      }
    },
    [inputValue, separator, dateFormat, parsedRange, formatOrder, dateUtilsRef],
  );

  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pastedText = e.clipboardData.getData('text');

      const parts = pastedText.split(/\s*[-–—]\s*/);

      if (parts.length >= 2) {
        const maskedFrom = applyMask(parts[0], dateFormat);
        const maskedTo = applyMask(parts[1], dateFormat);
        setInputValueInternal(`${maskedFrom}${RANGE_SEPARATOR}${maskedTo}`);
      } else {
        const maskedValue = applyMask(pastedText, dateFormat);
        setInputValueInternal(maskedValue);
      }
    },
    [dateFormat],
  );

  const handleBlur = useCallback(() => {
    const parts = inputValue.split(RANGE_SEPARATOR);
    const fromStr = parts[0]?.trim() || '';
    const toStr = parts[1]?.trim() || '';

    const fromValid = !fromStr || dateUtilsRef.current.parseDate(fromStr, dateFormat as DateFormat) !== undefined;
    const toValid = !toStr || dateUtilsRef.current.parseDate(toStr, dateFormat as DateFormat) !== undefined;

    if (fromStr && !fromValid) {
      if (toStr && toValid) {
        setInputValueInternal(`${RANGE_SEPARATOR}${toStr}`);
      } else {
        setInputValueInternal('');
      }
    } else if (toStr && !toValid) {
      setInputValueInternal(fromStr);
    }
  }, [inputValue, dateFormat, dateUtilsRef]);

  return {
    inputValue,
    setInputValue: setInputValueInternal,
    handleChange,
    handleKeyDown,
    handlePaste,
    handleBlur,
    setFromDateRange,
    parsedRange,
    isValidInput,
    placeholder,
  };
};
