import React, { createContext, useContext, useEffect, useState } from 'react';
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

    useEffect(() => {
        const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
            const newState = {
                isConnected: state.isConnected,
                isInternetReachable: state.isInternetReachable,
                type: state.type,
            };

            // Only update if state actually changed to avoid re-renders
            if (
                newState.isConnected !== networkState.isConnected ||
                newState.isInternetReachable !== networkState.isInternetReachable
            ) {
                setNetworkState(newState);
                addBreadcrumb('network', `Network state changed: ${newState.isConnected ? 'Online' : 'Offline'}`);
            }
        });

        return () => {
            unsubscribe();
        };
    }, [networkState]);

    return (
        <NetworkContext.Provider value={networkState}>
            {children}
        </NetworkContext.Provider>
    );
};
