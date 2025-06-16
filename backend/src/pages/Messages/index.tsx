import { useState } from 'react';
import { Search, Send } from 'lucide-react';

interface Message {
  id: number;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export function MessagesPage() {
  const [searchText, setSearchText] = useState('');
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [messageText, setMessageText] = useState('');

  // Mock data
  const contacts = [
    { id: 1, name: 'John Doe', lastMessage: 'Hey, about that deal...', time: '10:30 AM', unread: 2 },
    { id: 2, name: 'Jane Smith', lastMessage: 'The meeting is confirmed', time: 'Yesterday', unread: 0 },
    { id: 3, name: 'Mike Johnson', lastMessage: 'Please review the proposal', time: 'Yesterday', unread: 1 },
  ];

  const messages: Message[] = [
    { id: 1, sender: 'John Doe', content: 'Hey, about that deal...', timestamp: '10:30 AM', isRead: false },
    { id: 2, sender: 'You', content: 'Yes, I was just looking at it', timestamp: '10:31 AM', isRead: true },
    { id: 3, sender: 'John Doe', content: 'Great! When can we discuss?', timestamp: '10:32 AM', isRead: false },
  ];

  const handleSendMessage = () => {
    if (messageText.trim()) {
      // Handle sending message
      setMessageText('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)]">
      {/* Contacts Sidebar */}
      <div className="w-1/4 border-r border-gray-200 bg-white">
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search messages..."
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-8rem)]">
          {contacts.map((contact) => (
            <div
              key={contact.id}
              onClick={() => setSelectedContact(contact.name)}
              className={`p-4 hover:bg-gray-50 cursor-pointer ${
                selectedContact === contact.name ? 'bg-gray-50' : ''
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-medium">{contact.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{contact.lastMessage}</p>
                </div>
                <div className="text-xs text-gray-500">
                  <div>{contact.time}</div>
                  {contact.unread > 0 && (
                    <div className="bg-blue-500 text-white rounded-full px-2 py-1 mt-1 text-center">
                      {contact.unread}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {selectedContact ? (
          <>
            {/* Message Header */}
            <div className="p-4 bg-white border-b border-gray-200">
              <h2 className="font-medium">{selectedContact}</h2>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.sender === 'You' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 ${
                      message.sender === 'You'
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-900'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 ${
                      message.sender === 'You' ? 'text-blue-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Message Input */}
            <div className="p-4 bg-white border-t border-gray-200">
              <div className="flex space-x-4">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  className="border border-gray-300 text-gray-700 p-2 rounded-lg hover:bg-gray-50"
                >
                  <Send className="h-5 w-5" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            Select a contact to start messaging
          </div>
        )}
      </div>
    </div>
  );
}
