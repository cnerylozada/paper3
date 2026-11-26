"use client";

import { User, Users } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SoloCollectionForm } from "./SoloCollectionForm";
import { TeamCollectionForm } from "./TeamCollectionForm";

// The student picks the kind of collection with a tab
export const UploadCollectionForm = () => {
  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>New collection</CardTitle>
        <CardDescription>
          Group your papers in a collection, on your own or with your squad
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="solo" className="gap-4">
          <TabsList className="w-full sm:w-fit">
            <TabsTrigger value="solo">
              <User />
              Solo
            </TabsTrigger>
            <TabsTrigger value="team">
              <Users />
              Team
            </TabsTrigger>
          </TabsList>
          <TabsContent value="solo" className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              A personal collection for the papers you write on your own. You
              are its only creator and the papers are yours alone.
            </p>
            <SoloCollectionForm />
          </TabsContent>
          <TabsContent value="team" className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              A shared collection for the papers your squad writes together.
              Every member is listed as a creator, and the squad approves what
              is published.
            </p>
            <TeamCollectionForm />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
