# 🆓 TAMAMEN ÜCRETSİZ WebRTC KURULUMU

## ✅ HEMEN ÇALIŞAN ÇÖZÜM: Jitsi Meet
**Kurulum Süresi: 0 dakika - Hiçbir şey yüklemeye gerek yok!**

✅ **Avantajlar:**
- Tamamen ücretsiz
- Hiç kod değişikliği gerekmez
- Hemen çalışır
- Kayıt özelliği var
- Ekran paylaşımı var
- Mobil uyumlu

❌ **Dezavantajlar:**
- Dış site kullanır (meet.jit.si)
- Tam control sizde değil

## 🛠️ İLERİ DÜZEY BEDAVA ÇÖZÜM: Kendi WebRTC Sisteminiz

### Adım 1: Socket.IO Kurulumu
```bash
# Backend için
cd backend
npm install socket.io

# Frontend için  
cd frontend
npm install socket.io-client
```

### Adım 2: Backend WebRTC Server (Express + Socket.IO)
```javascript
// backend/webrtc-server.js
const io = require('socket.io')(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join room for call
  socket.on('join-room', (roomId, userId) => {
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
  });

  // WebRTC signaling
  socket.on('offer', (offer, roomId) => {
    socket.to(roomId).emit('offer', offer, socket.id);
  });

  socket.on('answer', (answer, roomId) => {
    socket.to(roomId).emit('answer', answer, socket.id);
  });

  socket.on('ice-candidate', (candidate, roomId) => {
    socket.to(roomId).emit('ice-candidate', candidate, socket.id);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});
```

### Adım 3: Frontend WebRTC Component
```jsx
// components/WebRTCCall.jsx
import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export const WebRTCCall = ({ roomId, isVideo = true, onClose }) => {
  const [socket, setSocket] = useState(null);
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);

  const servers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' }, // Google STUN server (FREE)
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    initializeCall();
    return () => cleanup();
  }, []);

  const initializeCall = async () => {
    // Connect to socket
    const newSocket = io('http://localhost:8000');
    setSocket(newSocket);

    // Get user media
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: isVideo,
        audio: true
      });
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection(servers);
      peerConnectionRef.current = peerConnection;

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          newSocket.emit('ice-candidate', event.candidate, roomId);
        }
      };

      // Join room
      newSocket.emit('join-room', roomId, newSocket.id);

      // Socket event handlers
      newSocket.on('user-connected', async (userId) => {
        // Create offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        newSocket.emit('offer', offer, roomId);
      });

      newSocket.on('offer', async (offer, userId) => {
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        newSocket.emit('answer', answer, roomId);
      });

      newSocket.on('answer', async (answer, userId) => {
        await peerConnection.setRemoteDescription(answer);
      });

      newSocket.on('ice-candidate', (candidate, userId) => {
        peerConnection.addIceCandidate(candidate);
      });

    } catch (error) {
      console.error('Error accessing media devices:', error);
    }
  };

  const cleanup = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (socket) {
      socket.disconnect();
    }
  };

  const endCall = () => {
    cleanup();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">
            {isVideo ? 'Video Call' : 'Voice Call'}
          </h3>
          <button
            onClick={endCall}
            className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
          >
            End Call
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="mb-2">You</p>
            {isVideo && (
              <video
                ref={localVideoRef}
                autoPlay
                muted
                className="w-full rounded-lg bg-gray-900"
              />
            )}
            {!isVideo && (
              <div className="w-full h-40 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                Audio Only
              </div>
            )}
          </div>
          
          <div>
            <p className="mb-2">Remote</p>
            {isVideo && (
              <video
                ref={remoteVideoRef}
                autoPlay
                className="w-full rounded-lg bg-gray-900"
              />
            )}
            {!isVideo && (
              <div className="w-full h-40 bg-gray-900 rounded-lg flex items-center justify-center text-white">
                {remoteStream ? 'Connected' : 'Connecting...'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### Adım 4: Messages Sayfasına Entegrasyon
```jsx
// Messages/index.tsx içine ekle
import { WebRTCCall } from '../../components/WebRTCCall';

// State ekle
const [showWebRTCCall, setShowWebRTCCall] = useState(false);
const [callRoomId, setCallRoomId] = useState('');
const [isVideoCall, setIsVideoCall] = useState(false);

// Handle functions güncelle
const handleVoiceCall = () => {
  const roomId = `voice-${selectedContact.id}-${Date.now()}`;
  setCallRoomId(roomId);
  setIsVideoCall(false);
  setShowWebRTCCall(true);
};

const handleVideoCall = () => {
  const roomId = `video-${selectedContact.id}-${Date.now()}`;
  setCallRoomId(roomId);
  setIsVideoCall(true);
  setShowWebRTCCall(true);
};

// Component sonuna ekle
{showWebRTCCall && (
  <WebRTCCall
    roomId={callRoomId}
    isVideo={isVideoCall}
    onClose={() => setShowWebRTCCall(false)}
  />
)}
```

## 💰 **Maliyet Karşılaştırması:**

| Çözüm | Maliyet | Kurulum | Kalite | Control |
|-------|---------|---------|---------|---------|
| **Jitsi Meet** | 🆓 FREE | ⚡ Anında | 🌟 Mükemmel | ⭐⭐⭐ |
| **Kendi WebRTC** | 🆓 FREE | 🔧 2-3 saat | 🌟 Mükemmel | ⭐⭐⭐⭐⭐ |
| Daily.co | 💰 $0.50/user | ⚡ Kolay | 🌟 Mükemmel | ⭐⭐⭐⭐ |
| Agora.io | 💰 $1.99/1000 mins | ⚡ Kolay | 🌟 Mükemmel | ⭐⭐⭐⭐ |

## 🎯 **Öneri:**

1. **Hemen başlamak için**: Jitsi Meet (zaten aktif!)
2. **Gelecekte geliştirmek için**: Kendi WebRTC sistemi
3. **Enterprise için**: Paid service

**Şu anda Jitsi Meet çalışıyor, test edin! 🚀** 