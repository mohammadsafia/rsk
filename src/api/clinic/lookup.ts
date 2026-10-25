const MOCK_USERS = Array.from({ length: 30 }, (_, i) => ({
  id: `user-${i + 1}`,
  name: `User ${i + 1}`,
}));

function getUsers() {
  return Promise.resolve({
    data: MOCK_USERS,
    pagination: { page: 1, pageSize: 30, total: MOCK_USERS.length, totalPages: 1 },
  });
}

export const LookupHandler = {
  users: {
    queryKey: 'lookup/users',
    request: getUsers,
  },
} as const;
