import { config } from '@/config';
import { useServerTimer } from '@/hooks/useServerTime';
import { globalStore } from '@/state/stores/global-store';
import { KmTimeCountdown } from '@kokimoki/shared';
import * as React from 'react';
import ReactMarkdown from 'react-markdown';
import { useSnapshot } from 'valtio';

export const RoundCountdownView: React.FC = () => {
	const { countdownStartTime, currentRound } = useSnapshot(globalStore.proxy);
	const serverTime = useServerTimer(100);

	const countdownDuration = 3000; // 3 seconds
	const elapsed = serverTime - countdownStartTime;
	const remaining = Math.max(0, countdownDuration - elapsed);

	return (
		<div className="flex w-full max-w-2xl flex-col items-center space-y-6 text-center">
			<div className="prose prose-lg border-primary-200 bg-surface max-w-none rounded-lg border p-6 shadow-md">
				<h2 className="text-primary-600 mb-4 text-4xl font-bold">
					{config.currentRoundLabel} {currentRound + 1}
				</h2>
				<ReactMarkdown>{config.nextRoundCountdownMd}</ReactMarkdown>
			</div>

			<div className="border-primary-200 bg-surface flex h-48 w-48 items-center justify-center rounded-full border-4 shadow-xl">
				<div className="text-primary-600 text-6xl font-bold">
					<KmTimeCountdown ms={remaining} display="s" />
				</div>
			</div>

			<div className="text-text-secondary text-sm">
				Get ready to merge bubbles!
			</div>
		</div>
	);
};
