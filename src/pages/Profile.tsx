import { useAuthenticator } from '@aws-amplify/ui-react';

export default function Profile() {
  const { user } = useAuthenticator();

  return (
    <div>
      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">Account details.</p>
      <p>Email: {user?.signInDetails?.loginId}</p>
    </div>
  );
}
