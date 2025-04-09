
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FunctionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

export const FunctionCard: React.FC<FunctionCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
}) => (
  <Card className="w-full shadow-sm transition-all hover:shadow-md border border-border/50 animate-in fade-in-50 slide-in-from-bottom-5">
    <CardHeader>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent>{children}</CardContent>
  </Card>
);
