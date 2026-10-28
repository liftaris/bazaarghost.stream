"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ConfirmAction } from "@/components/auth/confirm-action";

/** One sign-in method in a list. The last remaining method shows why it can't be removed. */
export function CredentialRow({
  first,
  icon,
  title,
  detail,
  removable,
  fresh,
  verb,
  confirmTitle,
  confirmDescription,
  onRemove,
}: {
  first: boolean;
  icon: React.ReactNode;
  title: string;
  detail: string;
  removable: boolean;
  fresh: boolean;
  verb: string;
  confirmTitle: string;
  confirmDescription: string;
  onRemove: () => Promise<void>;
}) {
  return (
    <li>
      {!first && <Separator />}
      <div className="flex items-center gap-3 py-3">
        {icon}
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{title}</p>
          <p className="text-xs text-muted-foreground">{detail}</p>
        </div>
        {removable ? (
          <ConfirmAction
            trigger={
              <Button variant="outline" size="sm" disabled={!fresh}>
                {verb}
              </Button>
            }
            title={confirmTitle}
            description={confirmDescription}
            action={verb}
            onConfirm={onRemove}
          />
        ) : (
          <Badge variant="secondary">Only sign in method</Badge>
        )}
      </div>
    </li>
  );
}
