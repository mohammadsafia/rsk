import { UserHandler } from '@api/handlers';
import { useDataTableQuery } from '@hooks/shared';

export const useUsersQuery = () => {
  const query = useDataTableQuery({
    queryKey: [UserHandler.list.queryKey],
    queryFn: UserHandler.list.request,
  });

  return {
    ...query,
  };
};
