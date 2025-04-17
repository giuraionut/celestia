import UserPageSkeleton from '@/app/components/skeletons/UserPageSkeleton';
import React from 'react';

const UserPageCommentsLoading = () => {
  return <UserPageSkeleton type={'comments'} />;
};

export default UserPageCommentsLoading;
