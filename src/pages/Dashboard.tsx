import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Dashboard() {
  const { user } = useAuthenticator();
  const email = user?.signInDetails?.loginId ?? '';

  return (
    <div>
      <h1 className="page-title">Dashboard</h1>
      <p className="page-subtitle">Welcome, {email}.</p>
      <p>Forever Faded Booking — same features as forever-faded-platform, built for AWS Amplify Gen 2.</p>
    </div>
  );
}
