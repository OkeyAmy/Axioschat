
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FunctionCardProps {
  title: string;
  description: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
}

export const FunctionCard: React.FC<FunctionCardProps> = ({
  title,
  description,
  icon: Icon,
  children,
  className,
  contentClassName,
}) => (
  <Card className={cn("w-full shadow-sm transition-all hover:shadow-md border border-border/50 animate-in fade-in-50 slide-in-from-bottom-5", className)}>
    <CardHeader>
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
      </div>
      <CardDescription>{description}</CardDescription>
    </CardHeader>
    <CardContent className={cn("", contentClassName)}>{children}</CardContent>
  </Card>
);
