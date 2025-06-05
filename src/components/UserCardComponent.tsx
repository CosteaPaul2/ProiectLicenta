import type { CardProps } from "@heroui/react";
import React from "react";
import { Button, Card, Image, CardBody } from "@heroui/react";

interface UserCardProps extends CardProps {
  email: string;
}

export default function UserCard({ email, ...props }: UserCardProps) {
  return (
    <Card className="w-full max-w-[420px]" {...props}>
      <CardBody className="flex flex-row items-center p-4">
        <Image
          removeWrapper
          alt={`${email} avatar`}
          className="h-16 w-16 flex-none rounded-full object-cover object-center"
          src="https://nextuipro.nyc3.cdn.digitaloceanspaces.com/components-images/hero-card-complete.jpeg"
        />
        <div className="pl-4">
          <h3 className="text-large font-semibold">Signed in as</h3>
          <p className="text-default-400">{email}</p>
        </div>
      </CardBody>
    </Card>
  );
}
