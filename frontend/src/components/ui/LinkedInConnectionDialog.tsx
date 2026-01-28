import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";
import { ExternalLink, MessageCircle, User, Copy, CheckCircle2, Sparkles, Target, Zap } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LinkedInConnectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  leadName?: string;
  connectionUrl?: string;
  message?: string;
  isLoading?: boolean;
}

export function LinkedInConnectionDialog({
  isOpen,
  onClose,
  onConfirm,
  leadName,
  connectionUrl,
  message,
  isLoading = false
}: LinkedInConnectionDialogProps) {
  const [messageCopied, setMessageCopied] = React.useState(false);
  const [customMessage, setCustomMessage] = React.useState(message || '');

  // Update custom message when prop changes
  React.useEffect(() => {
    setCustomMessage(message || '');
  }, [message]);

  const handleCopyMessage = async () => {
    const messageToTopy = customMessage || message;
    if (messageToTopy) {
      try {
        await navigator.clipboard.writeText(messageToTopy);
        setMessageCopied(true);
        toast.success('Message copied to clipboard');
        setTimeout(() => setMessageCopied(false), 2000);
      } catch (error) {
        toast.error('Failed to copy message');
      }
    }
  };

  const handleOpenLinkedIn = () => {
    onConfirm();
    onClose();
  };

  const handleClose = () => {
    setCustomMessage(message || '');
    setMessageCopied(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] p-0 overflow-hidden">
        {/* Header with LinkedIn branding */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 text-white">
          <DialogHeader className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white/20 rounded-md flex items-center justify-center">
                <ExternalLink className="w-4 h-4" />
              </div>
              <DialogTitle className="text-xl font-semibold text-white">
                LinkedIn Connection
              </DialogTitle>
            </div>
            <DialogDescription className="text-blue-100">
              Send a personalized connection request
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          {/* Lead info */}
          {leadName && (
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">Connecting with</p>
                <p className="text-sm text-gray-600">{leadName}</p>
              </div>
              <Badge variant="secondary" className="ml-auto">
                Lead
              </Badge>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-600" />
              How it works
            </h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">1</span>
                </div>
                <p>We'll open LinkedIn in a new tab</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">2</span>
                </div>
                <p>Click "Connect" on their LinkedIn profile</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-xs font-medium text-blue-600">3</span>
                </div>
                <p>Paste your personalized message and send</p>
              </div>
            </div>
          </div>

          {/* Message composition */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-blue-600" />
                Your connection message
              </h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyMessage}
                className="h-8 px-2 text-xs"
                disabled={!customMessage.trim()}
              >
                {messageCopied ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 mr-1 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
            
            <Textarea
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder="Write a personalized message to increase your connection success rate..."
              className="min-h-[100px] border-gray-200 focus:border-blue-500"
              maxLength={300}
            />
            
            <div className="flex items-center justify-between text-xs text-gray-500">
              <p>💡 Personalized messages have 3x higher acceptance rates</p>
              <span className={cn(
                "font-mono",
                customMessage.length > 250 ? "text-amber-600" : "text-gray-400",
                customMessage.length >= 300 ? "text-red-600" : ""
              )}>
                {customMessage.length}/300
              </span>
            </div>
          </div>

          {/* Benefits */}
          <div className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
            <p className="text-sm font-medium text-green-800 mb-1 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              Why this approach works better
            </p>
            <ul className="text-xs text-green-700 space-y-1">
              <li className="flex items-center gap-1">
                <Zap className="w-3 h-3" />
                Native LinkedIn interface = higher success rates
              </li>
              <li className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                You can customize the message before sending
              </li>
              <li className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                No API limitations or permission issues
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 bg-gray-50 border-t">
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Cancel
            </Button>
            <Button
              onClick={handleOpenLinkedIn}
              disabled={isLoading || !connectionUrl}
              className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Loading...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <ExternalLink className="w-4 h-4" />
                  Open LinkedIn
                </div>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 