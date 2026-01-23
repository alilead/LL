import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Paperclip, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Label } from '@/components/ui/Label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import emailAPI from '../../services/emailAPI';

interface EmailComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  replyTo?: {
    to: string;
    subject: string;
    messageId: string;
  };
  forward?: {
    from: string;
    subject: string;
    body: string;
  };
}

export default function EmailComposeModal({
  isOpen,
  onClose,
  accountId,
  replyTo,
  forward,
}: EmailComposeModalProps) {
  const [to, setTo] = useState(replyTo?.to || '');
  const [cc, setCc] = useState('');
  const [bcc, setBcc] = useState('');
  const [subject, setSubject] = useState(
    replyTo ? `Re: ${replyTo.subject}` : forward ? `Fwd: ${forward.subject}` : ''
  );
  const [body, setBody] = useState(
    forward ? `\n\n---------- Forwarded message ----------\nFrom: ${forward.from}\nSubject: ${forward.subject}\n\n${forward.body}` : ''
  );
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const sendEmailMutation = useMutation({
    mutationFn: emailAPI.sendEmail,
    onSuccess: () => {
      toast({
        title: 'Email sent successfully',
        description: 'Your email has been sent.',
      });
      queryClient.invalidateQueries({ queryKey: ['emails', accountId] });
      handleClose();
    },
    onError: (error) => {
      toast({
        title: 'Failed to send email',
        description: error instanceof Error ? error.message : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleClose = () => {
    setTo('');
    setCc('');
    setBcc('');
    setSubject('');
    setBody('');
    setAttachments([]);
    onClose();
  };

  const handleSend = () => {
    if (!to.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter at least one recipient.',
        variant: 'destructive',
      });
      return;
    }

    if (!subject.trim()) {
      toast({
        title: 'Validation error',
        description: 'Please enter a subject.',
        variant: 'destructive',
      });
      return;
    }

    const emailData = {
      to,
      cc,
      bcc,
      subject,
      body,
      account_id: parseInt(accountId),
      attachments: attachments.length > 0 ? attachments : undefined
    };

    sendEmailMutation.mutate(emailData);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <CardTitle>Compose Email</CardTitle>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden p-0">
          <ScrollArea className="h-full">
            <div className="p-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  placeholder="recipient@example.com"
                />
              </div>

              <div className="flex gap-2">
                {!showCc && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setShowCc(true)}
                  >
                    CC
                  </Button>
                )}
                {!showBcc && (
                  <Button
                    type="button"
                    variant="link"
                    size="sm"
                    onClick={() => setShowBcc(true)}
                  >
                    BCC
                  </Button>
                )}
              </div>

              {showCc && (
                <div className="space-y-2">
                  <Label htmlFor="cc">CC</Label>
                  <Input
                    id="cc"
                    value={cc}
                    onChange={(e) => setCc(e.target.value)}
                    placeholder="cc@example.com"
                  />
                </div>
              )}

              {showBcc && (
                <div className="space-y-2">
                  <Label htmlFor="bcc">BCC</Label>
                  <Input
                    id="bcc"
                    value={bcc}
                    onChange={(e) => setBcc(e.target.value)}
                    placeholder="bcc@example.com"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Enter subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Type your message here..."
                  className="min-h-[200px]"
                />
              </div>

              {attachments.length > 0 && (
                <div className="space-y-2">
                  <Label>Attachments</Label>
                  <div className="space-y-2">
                    {attachments.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded"
                      >
                        <span className="text-sm text-gray-600">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeAttachment(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <div className="flex items-center justify-between p-4 border-t">
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              multiple
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="h-4 w-4 mr-2" />
              Attach
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSend}
              disabled={sendEmailMutation.isPending}
            >
              {sendEmailMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}