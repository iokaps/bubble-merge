import { kmClient } from '@/services/km-client';
import { useEffect, useRef, useState } from 'react';

export function useServerTimer(ms = 250) {
	const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
	const rafRef = useRef<number | null>(null);
	const [serverTime, setServerTime] = useState(() =>
		kmClient.serverTimestamp()
	);
	const lastUpdateRef = useRef<number>(Date.now());

	useEffect(() => {
		// Use requestAnimationFrame for active tabs and setInterval as backup
		const updateTime = () => {
			const now = Date.now();
			if (now - lastUpdateRef.current >= ms) {
				setServerTime(kmClient.serverTimestamp());
				lastUpdateRef.current = now;
			}
			rafRef.current = requestAnimationFrame(updateTime);
		};

		// Start RAF loop
		rafRef.current = requestAnimationFrame(updateTime);

		// Backup interval for when tab is inactive
		intervalRef.current = setInterval(() => {
			setServerTime(kmClient.serverTimestamp());
			lastUpdateRef.current = Date.now();
		}, ms);

		return () => {
			if (rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = null;
			}
			if (intervalRef.current) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		};
	}, [ms]);

	return serverTime;
}
