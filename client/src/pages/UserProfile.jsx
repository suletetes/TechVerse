import React from 'react';
import { useParams } from 'react-router-dom';
import { UserProfileLayout } from '../components/UserProfile';

const UserProfile = () => {
    const { tab } = useParams();

    return (
        <>
            {/* user-profile-layout */}
            <UserProfileLayout initialTab={tab} />
            {/* user-profile-layout END */}
        </>
    );
};

export default UserProfile;