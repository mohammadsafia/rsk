import { Button } from '@components/ui';
import { useDate } from '@hooks/shared';

import { ArrowLeft, ArrowRight } from 'lucide-react';

type DateNavigationProps = {
  handlePrevious: () => void;
  handleNext: () => void;
  onSetDate: (date: string) => void;
  date: string;
};

function DateNavigation({ handlePrevious, handleNext, onSetDate, date }: DateNavigationProps) {
  const { toDate, constants } = useDate();

  return (
    <div className="flex items-center space-x-2">
      <Button onClick={handlePrevious} variant="outline" className="md:h-9 md:w-9 md:py-2" size="icon">
        <ArrowLeft size={16} />
      </Button>

      <Button onClick={handleNext} variant="outline" className="md:h-9 md:w-9 md:py-2" size="icon">
        <ArrowRight size={16} />
      </Button>

      <Button
        className="md:h-9 md:px-4 md:py-2"
        size="sm"
        onClick={() => onSetDate(toDate(undefined, constants.DateFormats.ISO_DATE))}
        variant="outline"
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
