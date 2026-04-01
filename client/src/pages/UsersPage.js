/**
 * pages/UsersPage.jsx
 * User management page — lists all users with search, sort,
 * pagination, role badge, and delete confirmation.
 * Shows only to Admin / Provider roles.
 */

import React, { useEffect, useState, useCallback } from "react";
import { getAllUsersApi, deleteUserApi } from "@/api/user.api";
import useApi from "@/hooks/useApi";
import usePagination from "@/hooks/usePagination";
import useDebounce   from "@/hooks/useDebounce";
import { formatDate, timeAgo } from "@/utils/formatters";
import { USER_ROLES } from "@/constants";

import Card          from "@/components/ui/Card";
import Table         from "@/components/ui/Table";
import Pagination    from "@/components/ui/Pagination";
import SearchBar     from "@/components/ui/SearchBar";
import Badge         from "@/components/ui/Badge";
import Avatar        from "@/components/ui/Avatar";
import Tooltip       from "@/components/ui/Tooltip";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import EmptyState    from "@/components/ui/EmptyState";
import Skeleton      from "@/components/ui/Skeleton";
import Button        from "@/components/Button";
import { Icon }      from "@/components/icons/IconCollection";

// Role → badge color map
const ROLE_COLOR = {
  [USER_ROLES.ADMIN]:    "purple",
  [USER_ROLES.PROVIDER]: "indigo",
  [USER_ROLES.CUSTOMER]: "gray",
};

const UsersPage = () => {
  const [search,      setSearch]      = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const debouncedSearch = useDebounce(search, 350);

  const {
    execute: fetchUsers,
    data: usersData,
    isLoading,
  } = useApi(getAllUsersApi);

  const { execute: deleteUser, isLoading: isDeleting } = useApi(deleteUserApi);

  const pagination = usePagination({
    total:        usersData?.meta?.total ?? 0,
    initialLimit: 10,
  });

  // Fetch whenever page, limit, or search changes
  const load = useCallback(() => {
    fetchUsers({
      page:   pagination.page,
      limit:  pagination.limit,
      search: debouncedSearch || undefined,
    });
  }, [fetchUsers, pagination.page, pagination.limit, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteUser(deleteTarget._id);
      setDeleteTarget(null);
      load();
    } catch { /* error shown by useApi */ }
  };

  // Table column definitions
  const columns = [
    {
      key:    "name",
      header: "User",
      sortable: true,
      render: (_, row) => (
        <div className="flex items-center gap-3">
          <Avatar name={row.name} src={row.avatar} size="sm" />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">{row.name}</p>
            <p className="text-xs text-gray-400 truncate">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key:    "role",
      header: "Role",
      sortable: true,
      render: (v) => (
        <Badge color={ROLE_COLOR[v] ?? "gray"} dot className="capitalize">
          {v}
        </Badge>
      ),
    },
    {
      key:    "isActive",
      header: "Status",
      render: (v) => (
        <Badge color={v ? "green" : "red"} dot>{v ? "Active" : "Inactive"}</Badge>
      ),
    },
    {
      key:    "createdAt",
      header: "Joined",
      sortable: true,
      render: (v) => (
        <Tooltip content={formatDate(v, "long")} placement="top">
          <span className="text-sm text-gray-500">{timeAgo(v)}</span>
        </Tooltip>
      ),
    },
    {
      key:    "_actions",
      header: "",
      align:  "right",
      render: (_, row) => (
        <div className="flex items-center justify-end gap-2">
          <Tooltip content="Delete user" placement="top">
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(row); }}
              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
              aria-label={`Delete ${row.name}`}
            >
              <Icon name="trash" size={15} />
            </button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const users = usersData?.data?.users ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500 mt-1">
            {usersData?.meta?.total ?? "—"} total accounts
          </p>
        </div>
        <Button leftIcon={<Icon name="plus" size={15} />}>
          Invite user
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by name or email…"
          className="w-full sm:w-72"
        />
      </div>

      {/* Table card */}
      <Card noPadding>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton.UserRow key={i} />
            ))}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            icon={<Icon name="users" size={40} />}
            title={search ? "No users match your search" : "No users yet"}
            description={search ? "Try different keywords." : "Users will appear here once they sign up."}
            action={search ? (
              <Button variant="secondary" size="sm" onClick={() => setSearch("")}>
                Clear search
              </Button>
            ) : null}
          />
        ) : (
          <>
            <Table
              columns={columns}
              data={users}
              keyField="_id"
              striped
            />
            <div className="px-4 border-t border-gray-50">
              <Pagination {...pagination} />
            </div>
          </>
        )}
      </Card>

      {/* Delete confirmation */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Delete user?"
        description={`This will permanently deactivate "${deleteTarget?.name}". They won't be able to log in.`}
        confirmLabel="Delete user"
        variant="danger"
      />
    </div>
  );
};

export default UsersPage;