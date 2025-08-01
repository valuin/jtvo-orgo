"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { MessageCircle, HardHat } from 'lucide-react';
import Image from 'next/image';

interface OrgoStreamProps {
  events: any[];
  initialScreenshot: string | null;
  finalScreenshot: string | null;
  className?: string;
}

const getEventIcon = (type: string) => {
    switch (type) {
        case 'text':
            return <MessageCircle className="w-5 h-5 text-blue-500" />;
        case 'error':
             return <HardHat className="w-5 h-5 text-red-500" />;
        default:
            return null;
    }
};

const getEventTitle = (type: string) => {
    switch (type) {
        case 'text':
            return "AI Agent's Output";
        case 'error':
            return "Error";
        default:
            return "Event";
    }
}

export function OrgoStream({ events, initialScreenshot, finalScreenshot, className }: OrgoStreamProps) {
  return (
    <div className={cn("w-full space-y-4", className)}>
        {initialScreenshot && (
             <Card>
                <CardHeader className="bg-muted/50 p-3">
                    <CardTitle className="text-sm font-medium">Initial Page View</CardTitle>
                </CardHeader>
                <CardContent className="p-0 aspect-[16/10] bg-muted">
                	<Image
                		src={`data:image/jpeg;base64,${initialScreenshot}`}
                		alt="Initial screenshot from target URL"
                		width={1280}
                		height={800}
                		className="w-full h-full object-cover"
                	/>
                </CardContent>
            </Card>
        )}
        {events.filter(event => event.type === 'text' || event.type === 'error').map((event, index) => {
             const isError = event.type === 'error';
             return (
                <Card key={index} className={cn("overflow-hidden", { 'border-red-500 bg-red-50 text-red-900': isError })}>
                    <CardHeader className="flex flex-row items-center space-x-3 bg-muted/50 p-3">
                        {getEventIcon(event.type)}
                        <CardTitle className="text-sm font-medium">{getEventTitle(event.type)}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 text-sm">
                        {isError ? (
                           <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(event.data, null, 2)}</pre>
                        ) : typeof event.data === 'string' ? (
                            <p>{event.data}</p>
                        ) : (
                            <pre className="whitespace-pre-wrap font-mono text-xs">{JSON.stringify(event.data, null, 2)}</pre>
                        )}
                    </CardContent>
                </Card>
             )
        })}
        {finalScreenshot && (
             <Card>
                <CardHeader className="bg-muted/50 p-3">
                    <CardTitle className="text-sm font-medium">Final Screenshot</CardTitle>
                </CardHeader>
                <CardContent className="p-0 aspect-[16/10] bg-muted">
                	<Image
                		src={`data:image/jpeg;base64,${finalScreenshot}`}
                		alt="Final Screenshot from Orgo session"
                		width={1280}
                		height={800}
                		className="w-full h-full object-cover"
                	/>
                </CardContent>
            </Card>
        )}
    </div>
  );
}