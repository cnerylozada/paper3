import { CopyAddress } from "@/components/CopyAddress";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { CollectionDetail } from "@/server/collections";

// The authors of a collection: the creator first, and a badge on the viewer
export const MemberList = ({
  userId,
  memberList,
  isTeam,
}: {
  userId: string;
  memberList: CollectionDetail["memberList"];
  isTeam: boolean;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-base">Members</CardTitle>
      <CardAction>
        <Badge variant="secondary">{memberList.length}</Badge>
      </CardAction>
      <CardDescription>
        {isTeam
          ? `Fixed when the collection was created. Only the creator can publish versions, and every sale will be split equally (1/${memberList.length} each).`
          : "Solo collection: you are the only author and receive every sale."}
      </CardDescription>
    </CardHeader>
    <CardContent>
      <ul className="flex flex-col rounded-lg border">
        {memberList.map((member, index) => (
          <li key={member.userId}>
            {index > 0 && <Separator />}
            <div className="flex items-center gap-3 p-3">
              <span
                aria-hidden
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase"
              >
                {member.walletAddress.slice(0, 2)}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <CopyAddress value={member.walletAddress} />
                <div className="flex flex-wrap items-center gap-1.5">
                  {member.isCreator && (
                    <Badge className="bg-primary/10 text-primary">
                      Creator
                    </Badge>
                  )}
                  {member.userId === userId && <Badge>You</Badge>}
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </CardContent>
  </Card>
);
