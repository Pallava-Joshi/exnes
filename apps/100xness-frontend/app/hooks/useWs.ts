import { useEffect, useState, useRef } from "react"

export const useWs = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const wsRef = useRef<WebSocket | null>(null);
    
    useEffect(() => {
        const connect = () => {
            try {
                const ws = new WebSocket("ws://localhost:8080");
                wsRef.current = ws;
                
                ws.onopen = () => {
                    setIsConnected(true);
                    console.log('WebSocket connected');
                };
                
                ws.onmessage = (event) => {
                    setMessages((prev) => [event.data, ...prev.slice(0, 99)]); // Keep last 100 messages
                };
                
                ws.onclose = () => {
                    setIsConnected(false);
                    console.log('WebSocket disconnected, attempting to reconnect...');
                    setTimeout(connect, 3000);
                };
                
                ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                    setIsConnected(false);
                };
                
            } catch (error) {
                console.error('Failed to connect to WebSocket:', error);
                setIsConnected(false);
                setTimeout(connect, 3000);
            }
        };

        connect();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
            }
        };
    }, []);

    return { messages, isConnected };
}