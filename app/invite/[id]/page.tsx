'use client';
import { useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GetStarted from '@/app/get-started/page';

export default function InvitePage() {
  const [invite, setInvite] = useState(null);
  const [inviterName, setInviterName] = useState('');
  const pathname = usePathname();

  useEffect(() => {
    const fetchInvite = async () => {
      if (typeof window === 'undefined') return;

      const pathSegments = pathname.split('/');
      const idSegment = pathSegments[pathSegments.length - 1];
      const inviteId = parseInt(idSegment, 10);

      if (isNaN(inviteId)) {
        notFound();
        return;
      }

      const { data: inviteData, error: inviteError } = await supabase
        .from('invite_user')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (inviteError || !inviteData) {
        notFound();
        return;
      }

      setInvite(inviteData);

      const { data: inviterData } = await supabase
        .from('users')
        .select('email')
        .eq('id', inviteData.invited_user)
        .maybeSingle();

      setInviterName(inviterData?.email || '');
    };

    fetchInvite();
  }, [pathname]);

  if (!invite) {
    return <div className="text-center py-8">Loading...</div>;
  }

  return (
    <div className="max-w-md mx-auto py-8">
      <h1 className="text-2xl font-bold mb-4">You're Invited!</h1>
      <div className="flex items-center mb-4">
        <p className="text-lg">
          You have been invited by{' '}
          <span className="font-semibold">{inviterName}</span>.
        </p>
      </div>
      <p className="mb-6">Please sign up or log in to continue.</p>
      <GetStarted initialEmail={invite.email} />
    </div>
  );
}
