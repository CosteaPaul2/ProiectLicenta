"use client";

import { Card, CardBody, Button, Avatar, Dropdown, DropdownTrigger, DropdownMenu, DropdownItem } from "@heroui/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface UserCardComponentProps {
    email: string;
}

export default function UserCardComponent({ email }: UserCardComponentProps) {
    const username = email.split('@')[0];
    const router = useRouter();
    const [isSigningOut, setIsSigningOut] = useState(false);
    
    const handleSignOut = async () => {
        setIsSigningOut(true);
        try {
            const response = await fetch('/api/auth/signout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            
            if (response.ok) {
                router.push('/login');
                router.refresh();
            } else {
                console.error("Sign out failed");
            }
        } catch (error) {
            console.error("Sign out error:", error);
        } finally {
            setIsSigningOut(false);
        }
    };
    
    return (
        <Dropdown placement="bottom-end">
            <DropdownTrigger>
                <Card 
                    isPressable 
                    className="bg-default-50 dark:bg-default-100 hover:bg-default-100 dark:hover:bg-default-200 transition-colors cursor-pointer"
                >
                    <CardBody className="p-3">
                        <div className="flex items-center gap-3">
                            <Avatar
                                src=""
                                name={username}
                                size="sm"
                                classNames={{
                                    base: "bg-gradient-to-br from-primary-500 to-secondary-500",
                                    name: "text-white font-semibold"
                                }}
                            />
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-default-900 dark:text-default-100">
                                    {username}
                                </span>
                                <span className="text-xs text-default-500 dark:text-default-400">
                                    {email}
                                </span>
                            </div>
                            <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-success-500 rounded-full"></div>
                                <span className="text-xs text-success-600 dark:text-success-400">Online</span>
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </DropdownTrigger>
            <DropdownMenu 
                aria-label="User Actions"
                className="w-64"
                itemClasses={{
                    base: "gap-3"
                }}
            >
                <DropdownItem
                    key="profile"
                    className="h-14 gap-2"
                    textValue="Profile"
                >
                    <div className="flex items-center gap-3">
                        <Avatar
                            src=""
                            name={username}
                            size="sm"
                            classNames={{
                                base: "bg-gradient-to-br from-primary-500 to-secondary-500",
                                name: "text-white font-semibold"
                            }}
                        />
                        <div className="flex flex-col">
                            <span className="font-semibold text-default-900 dark:text-default-100">
                                {username}
                            </span>
                            <span className="text-xs text-default-500 dark:text-default-400">
                                {email}
                            </span>
                        </div>
                    </div>
                </DropdownItem>
                <DropdownItem
                    key="settings"
                    startContent="⚙️"
                    className="text-default-700 dark:text-default-300"
                >
                    Account Settings
                </DropdownItem>
                <DropdownItem
                    key="preferences"
                    startContent="🎨"
                    className="text-default-700 dark:text-default-300"
                >
                    Preferences
                </DropdownItem>
                <DropdownItem
                    key="help"
                    startContent="❓"
                    className="text-default-700 dark:text-default-300"
                >
                    Help & Support
                </DropdownItem>
                <DropdownItem
                    key="logout"
                    color="danger"
                    startContent="🚪"
                    onPress={handleSignOut}
                    className="text-danger"
                >
                    {isSigningOut ? "Signing out..." : "Sign Out"}
                </DropdownItem>
            </DropdownMenu>
        </Dropdown>
    );
}
