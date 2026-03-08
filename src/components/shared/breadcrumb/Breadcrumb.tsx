import { type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Conditional } from '@components/utils';

import { cn } from '@utils';
import { ROUTES_PATH } from '@routes';

import { ChevronRight } from 'lucide-react';

export type BreadcrumbLink = {
  title: string;
  href?: string;
};

export type BreadcrumbProps = {
  links: BreadcrumbLink[];
  separator?: ReactNode;
  className?: string;
  withRoot?: boolean;
};

const Breadcrumb = ({ className, links, separator, withRoot = true }: BreadcrumbProps) => {
  if (links.length === 0 && !withRoot) return null;

  const finalLinks = withRoot
    ? [{ title: 'Dashboard', href: ROUTES_PATH.HOME.INDEX }, ...links.filter((link) => link.href !== ROUTES_PATH.HOME.INDEX)]
    : links;

  return (
    <div className={cn('', className)}>
      <nav aria-label="breadcrumb">
        <ol className="flex">
          {finalLinks.map(({ title, href }, idx) => {
            const isLastItem = idx === finalLinks.length - 1;

            return (
              <li key={`${title}-${idx}`} className="text-muted-400 text-xs leading-none">
                <Conditional.If condition={(!!href || href === ROUTES_PATH.HOME.INDEX) && !isLastItem}>
                  <Link
                    className="hover:text-primary transition-colors"
                    to={href === ROUTES_PATH.HOME.INDEX || href === ROUTES_PATH.ROOT.INDEX ? href : `/${href}`}
                  >
                    {title}
                  </Link>
                </Conditional.If>

                <Conditional.If condition={!href && href !== ROUTES_PATH.HOME.INDEX}>
                  <span>{title}</span>
                </Conditional.If>

                <Conditional.If condition={!isLastItem}>
                  <span className="mx-1 *:inline-block!">{separator ?? <ChevronRight size={14} />}</span>
                </Conditional.If>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};

export default Breadcrumb;
