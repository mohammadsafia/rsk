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
    <div className="flex items-center space-x-2">
      <IconButton variant="outline" aria-label={t('previous')} onClick={handlePrevious}>
        <ArrowLeft size={16} />
      </IconButton>

      <IconButton variant="outline" aria-label={t('next')} onClick={handleNext}>
        <ArrowRight size={16} />
      </IconButton>

      <Button
        variant="outline"
        size="sm"
        className="md:h-9 md:px-4 md:py-2"

        onClick={() => onSetDate(toDate(undefined, constants.DateFormats.ISO_DATE))}
      >
        Today
      </Button>

      <span className="md:text-md text-xs font-medium lg:text-lg xl:text-xl">
        {toDate(date, constants.DateFormats.FULL_WEEKDAY_SHORT_MONTH_DAY_YEAR)}
      </span>
    </div>
  );
}

export default DateNavigation;
