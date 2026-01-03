import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { addBreadcrumb } from '@/utils/monitoring';

interface NetworkContextType {
    isConnected: boolean | null;
    isInternetReachable: boolean | null;
    type: string | null;
}

const NetworkContext = createContext<NetworkContextType>({
    isConnected: true,
    isInternetReachable: true,
    type: null,
});

export const useNetwork = () => useContext(NetworkContext);

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [networkState, setNetworkState] = useState<NetworkContextType>({
        isConnected: true,
        isInternetReachable: true,
        type: null,
    });

    // Use ref to track previous state for comparison without causing re-renders
    const prevStateRef = useRef<NetworkContextType>(networkState);

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const newState = {
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            };

            // Only update if state actually changed to avoid re-renders
            if (
                newState.isConnected !== prevStateRef.current.isConnected ||
                newState.isInternetReachable !== prevStateRef.current.isInternetReachable
            ) {
                prevStateRef.current = newState;
                setNetworkState(newState);
                addBreadcrumb('network', `Network state changed: ${newState.isConnected ? 'Online' : 'Offline'}`);
            }
        });

        return () => {
            unsubscribe();
        };
    }, []); // Empty dependency array - effect runs once on mount

    return (
        <NetworkContext.Provider value={networkState}>
            {children}
        </NetworkContext.Provider>
    );
};
