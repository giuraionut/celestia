import { ExtendedCommunity, User } from '@prisma/client';
import { Avatar, AvatarImage, AvatarFallback } from '@radix-ui/react-avatar';
import UserHoverCard from '../shared/UserHoverCard';
import CommunityMemberOptions from './CommunityMemberOptions';

type CommunityMemberRowProps = {
  member: User;
  community: ExtendedCommunity;
  isAuthor: boolean;
  isManager: boolean;
  isMemberTheAuthor: boolean;
  isMemberAManager: boolean;
  isSelf: boolean;
};

export default function CommunityMemberRow({
  member,
  community,
  isAuthor,
  isManager,
  isMemberTheAuthor,
  isMemberAManager,
  isSelf,
}: CommunityMemberRowProps) {
  const canManageRoles = isAuthor && !isSelf;

  const canBanMember =
    !isSelf &&
    !isMemberTheAuthor &&
    (isAuthor || (isManager && !isMemberAManager));

  const isMemberBanned =
    community.bannedUsers?.some(
      (bannedMember) => bannedMember.userId === member.id
    ) || false;

  const showManageButton = canManageRoles || canBanMember;

  return (
    <div className='flex items-center justify-between gap-4 p-4 hover:bg-muted/50 rounded-lg'>
      <div className='flex items-center gap-3 flex-grow'>
        <Avatar className='h-9 w-9'>
          <AvatarImage
            src={member.image || ''}
            alt={member.name || 'User'}
            className='rounded-full'
          />
          <AvatarFallback>
            {member.name ? member.name.charAt(0).toUpperCase() : '?'}
          </AvatarFallback>
        </Avatar>
        <UserHoverCard user={member} />
        {isMemberTheAuthor && (
          <span className='text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full'>
            Author
          </span>
        )}
        {isMemberAManager && !isMemberTheAuthor && (
          <span className='text-xs font-semibold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full'>
            Manager
          </span>
        )}
      </div>

      {showManageButton && (
        <CommunityMemberOptions
          community={community}
          member={member}
          canBanMember={canBanMember}
          canManageRoles={canManageRoles}
          isMemberAManager={isMemberAManager}
          isMemberBanned={isMemberBanned}
        />
      )}
      {isSelf && (
        <span className='text-xs text-muted-foreground italic mr-2'>You</span>
      )}
    </div>
  );
}
