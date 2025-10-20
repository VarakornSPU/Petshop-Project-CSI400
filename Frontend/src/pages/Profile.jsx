import React from 'react';
import '../style/ProfilePage.css'; // เชื่อม CSS

function ProfilePage() {
    return (
        <div className="profile-page">
            <div className="profile-card">
                <div className="profile-image"></div>
                <h2 className="profile-name">ชื่อผู้ใช้: สมชาย ใจดี</h2>
                <p className="profile-email">อีเมล: somchai@example.com</p>
                <button className="edit-button">แก้ไขข้อมูล</button>
            </div>
        </div>
    );
}

export default ProfilePage;