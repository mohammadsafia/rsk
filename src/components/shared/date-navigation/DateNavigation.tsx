'use client';

import { Button, IconButton } from '@components/ui';
import { useAppTranslation, useDate } from '@hooks/shared';

import { ArrowLeft, ArrowRight } from 'lucide-react';

type DateNavigationProps = {
  handlePrevious: () => void;
  handleNext: () => void;
  onSetDate: (date: string) => void;
  date: string;
};

function DateNavigation({ handlePrevious, handleNext, onSetDate, date }: DateNavigationProps) {
  const { t } = useAppTranslation('common');
  const { toDate, constants } = useDate();

  return (
    <div data-slot="date-navigation" className="flex items-center gap-2">
      <IconButton variant="outline" aria-label={t('previous')} onClick={handlePrevious}>
        <ArrowLeft aria-hidden="true" className="rtl:-scale-x-100" />
      </IconButton>

      <IconButton variant="outline" aria-label={t('next')} onClick={handleNext}>
        <ArrowRight aria-hidden="true" className="rtl:-scale-x-100" />
      </IconButton>

      <Button variant="outline" onClick={() => onSetDate(toDate(undefined, constants.DateFormats.ISO_DATE))}>
        {t('calendar.today')}
      </Button>

      <span className="text-fg text-md font-medium lg:text-lg">
        {toDate(date, constants.DateFormats.FULL_WEEKDAY_SHORT_MONTH_DAY_YEAR)}
      </span>
    </div>
  );
}

export default DateNavigation;
