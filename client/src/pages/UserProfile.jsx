import React, { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { UserProfileLayout } from '../components/UserProfile';

const UserProfile = () => {
    const [searchParams] = useSearchParams();
    const tab = searchParams.get('tab');

    return (
        <>
            {/* user-profile-layout */}
            <UserProfileLayout initialTab={tab} />
            {/* user-profile-layout END */}
        </>
    );
};

export default UserProfile;