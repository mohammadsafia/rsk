import { useNavigate } from 'react-router-dom';

import { Avatar, DropdownMenu } from '@components/ui';
import { Conditional } from '@components/utils';
import { TooltipButton } from 'components/common';
import { Notifications } from 'components/layout/notifications';
import { AuthorizationWrapper } from 'components/permissions';

import { useAuth } from '@hooks/shared';
import { useAppointmentsLiveExcelUrlQuery } from 'hooks';

import { ROUTES_PATH } from '@routes';
import { AppPermissions } from 'app-constants';

import APP_CONFIGURATIONS from 'config/AppConfigurations';

import { ChevronDown, LogOut, Settings, User } from 'lucide-react';
import { ExcelSheetIcon } from 'assets/icons';

function DashboardHeader() {
  const navigate = useNavigate();

  const { currentUser, removeCurrentUser } = useAuth();

  const { exportAppointmentsToLiveExcel, isExporting } = useAppointmentsLiveExcelUrlQuery();

  const initials = currentUser?.name
    ? currentUser.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '';

  const handleNavigateToProfile = () => {
    if (!currentUser?.userId) return;
    navigate(`/${ROUTES_PATH.USERS.INDEX}/${ROUTES_PATH.USERS.PERSONAL_PROFILE}/${currentUser.userId}`);
  };

  return (
    <header className="bg-background sticky top-0 z-40 flex h-17.5 w-full shrink-0 items-center gap-6 px-6 py-3 shadow-[0px_0px_16px_0px_rgba(10,8,29,0.08)]">
      <div className="flex flex-1 items-center">
        <img
          src={APP_CONFIGURATIONS.VITE_APP_TENANT_LOGO_URL}
          alt={APP_CONFIGURATIONS.VITE_APP_TENANT_NAME}
          className="hidden h-8.5 w-auto md:block"
        />
      </div>

      <AuthorizationWrapper permissions={[AppPermissions.Notifications.Actions.ViewNotifications]}>
        <Notifications />
      </AuthorizationWrapper>

      <div className="flex h-5 items-center justify-center">
        <div className="bg-background h-full w-px" />
      </div>

      <TooltipButton
        permissions={[AppPermissions.UpcomingAppointmentDocumentManagement.Actions.ViewLiveExcelsheet]}
        title="Export Appointments To Live Excel"
        disabled={isExporting}
        onClick={exportAppointmentsToLiveExcel}
      >
        <ExcelSheetIcon />
      </TooltipButton>

      <DropdownMenu>
        <DropdownMenu.Trigger asChild>
          <button
            type="button"
            className="border-muted-200 bg-background flex h-12.5 items-center gap-3 overflow-hidden rounded-[10px] border px-3 py-1.5"
            aria-label="Open user menu"
          >
            <Avatar className="bg-primary-400 size-9 shrink-0 rounded-full">
              <Conditional.If condition={!!currentUser?.picture}>
                <Avatar.Image src={currentUser?.picture} alt="User avatar" />
              </Conditional.If>

              <Avatar.Fallback className="bg-primary-400 text-xs font-bold text-white">{initials}</Avatar.Fallback>
            </Avatar>

            <div className="hidden items-center gap-3 md:flex">
              <div className="flex flex-col items-start">
                <p className="text-primary-900 text-xs leading-[18px] font-medium whitespace-nowrap">{currentUser?.name}</p>

                <p className="text-primary-900 text-[10px] leading-4 whitespace-nowrap">{currentUser?.email}</p>
              </div>

              <ChevronDown className="text-primary-900 size-6 shrink-0" />
            </div>
          </button>
        </DropdownMenu.Trigger>

        <DropdownMenu.Content className="w-56" align="end" forceMount>
          <DropdownMenu.Label className="font-normal">
            <div className="flex flex-col gap-1">
              <p className="text-sm leading-none font-medium">{currentUser?.name}</p>

              <p className="text-muted text-xs leading-none">{currentUser?.email}</p>
            </div>
          </DropdownMenu.Label>

          <DropdownMenu.Separator />

          <DropdownMenu.Group>
            <DropdownMenu.Item onClick={handleNavigateToProfile}>
              <User className="mr-2 h-4 w-4" />
              My profile
            </DropdownMenu.Item>

            <DropdownMenu.Item>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </DropdownMenu.Item>
          </DropdownMenu.Group>

          <DropdownMenu.Separator />

          <DropdownMenu.Item onClick={removeCurrentUser}>
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu>
    </header>
  );
}

export default DashboardHeader;
